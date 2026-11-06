import * as Y from "yjs";

export interface UserPresence {
  userId: string;
  name: string;
  color: string;
  cursor?: {
    anchor: number;
    head: number;
  };
}

export class DurableObjectYjsProvider {
  public doc: Y.Doc;
  public documentId: string;
  public edgeUrl: string;
  public user: UserPresence;
  public isConnected: boolean;
  public activeUsers: UserPresence[];

  private ws: WebSocket | null;
  private onAwarenessChangeCallbacks: Set<(users: UserPresence[]) => void>;
  private isDestroyed: boolean;
  private reconnectAttempts: number;

  constructor(params: {
    doc: Y.Doc;
    documentId: string;
    edgeUrl: string;
    user: UserPresence;
  }) {
    this.doc = params.doc;
    this.documentId = params.documentId;
    this.edgeUrl = params.edgeUrl;
    this.user = params.user;
    this.isConnected = false;
    this.activeUsers = [this.user];
    this.ws = null;
    this.onAwarenessChangeCallbacks = new Set();
    this.isDestroyed = false;
    this.reconnectAttempts = 0;

    // Listen to local Yjs document changes and stream to WebSocket
    this.doc.on("update", (update: Uint8Array, origin: unknown) => {
      if (origin !== this && this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(
          JSON.stringify({
            type: "yjs_update",
            payload: Array.from(update),
          }),
        );
      }
    });

    this.connect();
  }

  private connect() {
    if (this.isDestroyed) return;

    try {
      // Convert http(s) to ws(s)
      const wsProtocol = this.edgeUrl.startsWith("https") ? "wss:" : "ws:";
      const edgeHost = this.edgeUrl.replace(/^https?:\/\//, "");
      const wsUrl = `${wsProtocol}//${edgeHost}/room/${this.documentId}?userId=${encodeURIComponent(
        this.user.userId,
      )}&name=${encodeURIComponent(this.user.name)}&color=${encodeURIComponent(this.user.color)}`;

      const socket = new WebSocket(wsUrl);
      this.ws = socket;

      socket.onopen = () => {
        this.isConnected = true;
        this.reconnectAttempts = 0;
      };

      socket.onmessage = (event: MessageEvent) => {
        try {
          const msg = JSON.parse(event.data);

          if (msg.type === "sync_step_1" || msg.type === "yjs_update") {
            if (Array.isArray(msg.payload)) {
              const update = new Uint8Array(msg.payload);
              // Apply remote update specifying this provider as origin to prevent echo
              Y.applyUpdate(this.doc, update, this);
            }
          } else if (
            msg.type === "awareness_update" &&
            Array.isArray(msg.users)
          ) {
            this.activeUsers = msg.users;
            this.notifyAwarenessChange();
          }
        } catch (err) {
          console.warn(
            "Failed to parse WebSocket message from DocumentRoom:",
            err,
          );
        }
      };

      socket.onclose = () => {
        this.isConnected = false;
        this.scheduleReconnect();
      };

      socket.onerror = () => {
        this.isConnected = false;
      };
    } catch (err) {
      console.warn(
        "Unable to establish WebSocket connection, falling back to local mode:",
        err,
      );
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.isDestroyed) return;
    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10_000);
    setTimeout(() => {
      this.connect();
    }, delay);
  }

  public updateCursor(cursor: { anchor: number; head: number }) {
    this.user.cursor = cursor;
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type: "cursor_awareness",
          cursor,
        }),
      );
    }
  }

  public onAwarenessChange(callback: (users: UserPresence[]) => void) {
    this.onAwarenessChangeCallbacks.add(callback);
    return () => {
      this.onAwarenessChangeCallbacks.delete(callback);
    };
  }

  private notifyAwarenessChange() {
    for (const cb of this.onAwarenessChangeCallbacks) {
      cb(this.activeUsers);
    }
  }

  public destroy() {
    this.isDestroyed = true;
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.onAwarenessChangeCallbacks.clear();
  }
}
