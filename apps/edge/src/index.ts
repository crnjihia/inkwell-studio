import { Hono } from "hono";
import type { Env } from "./types.js";
export { DocumentRoom } from "./durable-objects/document-room.js";

const app = new Hono<{ Bindings: Env }>();

// Healthcheck
app.get("/health", (c) => {
  return c.json({
    status: "healthy",
    service: "inkwell-edge",
    environment: c.env.ENVIRONMENT || "development",
    timestamp: new Date().toISOString(),
  });
});

// Real-time Collaborative Document Room (WebSocket via Durable Object)
app.all("/room/:documentId", async (c) => {
  const documentId = c.req.param("documentId");
  if (!documentId) {
    return c.text("Document ID required", 400);
  }

  // Get Durable Object instance by document ID string
  const id = c.env.DOCUMENT_ROOM.idFromName(documentId);
  const roomObj = c.env.DOCUMENT_ROOM.get(id);

  // Forward the request (including WebSocket upgrade headers)
  return roomObj.fetch(c.req.raw);
});

export default app;
