# ADR 0003: Yjs and Cloudflare Durable Objects for Real-Time Collaboration

## Status
Accepted

## Context
Multi-user co-authoring in rich-text documents requires Conflict-free Replicated Data Types (CRDTs) to ensure convergence across concurrent edits without data loss. Traditional centralized WebSocket clusters (such as Socket.io or Elixir clusters) incur significant hosting overhead and latency spikes across intercontinental hops to East Africa.

## Decision
We engineered real-time collaboration using **Yjs bound to TipTap (`y-prosemirror`)** coupled with **Cloudflare Durable Objects (`DocumentRoom`)**:

1. **Edge-Hosted Rooms**:
   - Each document ID maps deterministically to a unique Durable Object instance (`idFromName(documentId)`).
   - Clients connect directly via WebSocket to the edge room.
   - The Durable Object acts as a relay for Yjs binary updates and awareness states (user cursor coordinates, user names, and presence colors).

2. **Snapshot Persistence & Fault Tolerance**:
   - Incremental document edits are applied directly to the in-memory `Y.Doc`.
   - The consolidated binary state is persisted to the Durable Object's local transactional storage (`this.state.storage.put("yjs_snapshot", ...)`).
   - A throttled timer flushes snapshots to origin PostgreSQL every 10 seconds or when the room is emptied.

## Consequences
- **Positive**: Zero centralized WebSocket server management. Mathematical CRDT convergence guarantees two concurrent typers never overwrite each other. Local offline edits queue and merge cleanly once reconnected.
- **Trade-off**: Durable Objects require Cloudflare Workers Paid plan in live production; during local development, Miniflare emulates DO transactional storage and WebSockets locally.

