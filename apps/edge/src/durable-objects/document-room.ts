import type { Env, CollaboratorUser } from "../types.js";
import * as Y from "yjs";

export class DocumentRoom implements DurableObject {
  private state: DurableObjectState;
  private env: Env;
  private doc: Y.Doc;
  private sessions: Map<WebSocket, { user: CollaboratorUser }>;
  private isDirty: boolean;
  private lastFlushTime: number;

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;
    this.doc = new Y.Doc();
    this.sessions = new Map();
    this.isDirty = false;
    this.lastFlushTime = Date.now();

    // Hydrate state from Durable Object transactional storage on startup
    this.state.blockConcurrencyWhile(async () => {
      const storedSnapshot =
        await this.state.storage.get<Uint8Array>("yjs_snapshot");
      if (storedSnapshot) {
        Y.applyUpdate(this.doc, storedSnapshot);
      }
    });

    // When the local Yjs doc changes, broadcast update and flag storage dirty
    this.doc.on("update", (update: Uint8Array, origin: unknown) => {
      this.isDirty = true;
      // Broadcast to all connected WebSockets except origin sender
      this.broadcastUpdate(update, origin as WebSocket);
      this.schedulePeriodicFlush();
    });
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // 1. WebSocket Upgrade handling for Yjs sync room
    if (request.headers.get("Upgrade") === "websocket") {
      const pair = new WebSocketPair();
      const client = pair[0];
      const server = pair[1];

      // Extract collaborator identity from query params or headers
      const userId = url.searchParams.get("userId") || "user_anonymous";
      const userName = url.searchParams.get("name") || "Chris (Nairobi)";
      const userColor = url.searchParams.get("color") || "#4f46e5";

      const user: CollaboratorUser = {
        userId,
        name: decodeURIComponent(userName),
        color: userColor,
      };

      await this.handleSession(server, user);

      return new Response(null, {
        status: 101,
        webSocket: client,
      });
    }

    // 2. HTTP Endpoint to inspect or flush state manually
    if (url.pathname.endsWith("/flush")) {
      await this.persistSnapshotToDatabase();
      return new Response(
        JSON.stringify({ status: "flushed", timestamp: Date.now() }),
        {
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    if (url.pathname.endsWith("/state")) {
      return new Response(
        JSON.stringify({
          activeConnections: this.sessions.size,
          isDirty: this.isDirty,
          lastFlushTime: this.lastFlushTime,
        }),
        { headers: { "Content-Type": "application/json" } },
      );
    }

    return new Response("DocumentRoom Durable Object Active", { status: 200 });
  }

  private async handleSession(webSocket: WebSocket, user: CollaboratorUser) {
    webSocket.accept();
    this.sessions.set(webSocket, { user });

    // Send initial Yjs synchronization snapshot (Sync Step 1)
    const initialDocState = Y.encodeStateAsUpdate(this.doc);
    webSocket.send(
      JSON.stringify({
        type: "sync_step_1",
        payload: Array.from(initialDocState),
      }),
    );

    // Broadcast updated awareness list (active collaborators)
    this.broadcastAwareness();

    webSocket.addEventListener("message", async (event: MessageEvent) => {
      try {
        const message = JSON.parse(event.data as string);

        if (message.type === "yjs_update" && Array.isArray(message.payload)) {
          const update = new Uint8Array(message.payload);
          // Apply update with webSocket reference as origin to avoid echo
          Y.applyUpdate(this.doc, update, webSocket);
        } else if (message.type === "cursor_awareness") {
          const session = this.sessions.get(webSocket);
          if (session) {
            session.user.cursor = message.cursor;
            this.broadcastAwareness();
          }
        }
      } catch (err) {
        console.error(
          "Error processing WebSocket message in DocumentRoom:",
          err,
        );
      }
    });

    const closeHandler = () => {
      this.sessions.delete(webSocket);
      this.broadcastAwareness();
      if (this.sessions.size === 0 && this.isDirty) {
        this.persistSnapshotToDatabase();
      }
    };

    webSocket.addEventListener("close", closeHandler);
    webSocket.addEventListener("error", closeHandler);
  }

  private broadcastUpdate(update: Uint8Array, originSocket?: WebSocket) {
    const payload = JSON.stringify({
      type: "yjs_update",
      payload: Array.from(update),
    });

    for (const [socket] of this.sessions.entries()) {
      if (socket !== originSocket && socket.readyState === WebSocket.OPEN) {
        try {
          socket.send(payload);
        } catch {
          // Socket will be cleaned up on close event
        }
      }
    }
  }

  private broadcastAwareness() {
    const activeUsers = Array.from(this.sessions.values()).map((s) => s.user);
    const payload = JSON.stringify({
      type: "awareness_update",
      users: activeUsers,
    });

    for (const [socket] of this.sessions.entries()) {
      if (socket.readyState === WebSocket.OPEN) {
        try {
          socket.send(payload);
        } catch {
          // Handled on close
        }
      }
    }
  }

  private async schedulePeriodicFlush() {
    const now = Date.now();
    // Throttle database flushes to once every 10 seconds or when idle
    if (now - this.lastFlushTime > 10_000) {
      await this.persistSnapshotToDatabase();
    }
  }

  private async persistSnapshotToDatabase() {
    if (!this.isDirty) return;

    try {
      const consolidatedSnapshot = Y.encodeStateAsUpdate(this.doc);
      // Persist to Durable Object storage
      await this.state.storage.put("yjs_snapshot", consolidatedSnapshot);
      this.isDirty = false;
      this.lastFlushTime = Date.now();

      // If origin database URL or webhook configured, dispatch flush event
      if (this.env.ORIGIN_URL) {
        await fetch(`${this.env.ORIGIN_URL}/api/internal/flush-document`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            snapshot: Array.from(consolidatedSnapshot),
            timestamp: this.lastFlushTime,
          }),
        }).catch((err) =>
          console.warn("Background origin flush notification failed:", err),
        );
      }
    } catch (err) {
      console.error("Failed to persist snapshot in DocumentRoom:", err);
    }
  }
}
