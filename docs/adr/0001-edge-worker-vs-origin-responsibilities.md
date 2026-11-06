# ADR 0001: Partitioning Edge Worker vs Origin Server Responsibilities

## Status
Accepted

## Context
Inkwell Studio serves creators across East Africa who interact with real-time streaming AI, Google Docs-style collaborative editing, and static published reading routes. We require low-latency response times across regional network conditions while protecting API credentials and enforcing strict budget limits.

## Decision
We explicitly partitioned responsibilities between the **Cloudflare Edge Worker (`apps/edge`)** and the **Next.js 14 Origin Server (`apps/web`)**:

### 1. Edge Worker Responsibilities (`apps/edge`)
- **Global Ingress & Security Headers**: Injects HSTS, CSP, and framing protections before requests reach origin.
- **Clerk JWT Verification**: Validates authentication tokens at the edge network closest to the client. In development (`AUTH_MODE=dev`), injects synthetic Nairobi workspace credentials.
- **Token Bucket Rate Limiting**: Enforces per-IP and per-user limits to prevent denial-of-wallet attacks before hitting upstream compute.
- **Cache API for Published Content (`/p/:slug`)**: Serves static publications with `CF-Cache-Status: HIT` directly from edge memory and executes sub-second cache purges (`/api/cache/purge`).
- **Real-Time Collaboration (`DocumentRoom` Durable Object)**: Manages WebSocket connections for Yjs CRDT document synchronization and awareness presence cursors.

### 2. Origin Server Responsibilities (`apps/web`)
- **Anthropic AI Streaming (`/api/generate`)**: Origin securely holds the `ANTHROPIC_API_KEY` (never exposed to browser or edge workers). Streams SSE deltas directly to clients.
- **Prompt Version Control**: Handles transactional semver increments, audit logs, and instant rollback.
- **Relational OLTP & TimescaleDB Ingestion**: Manages Drizzle ORM queries and commits token usage events to Timescale hypertables.
- **Server Component Rendering**: Pre-renders SEO-optimized articles with JSON-LD structured data.

## Consequences
- **Positive**: Client requests for published content bypass origin entirely once cached. Collaboration sockets run on edge Durable Objects with minimal round-trip latency. Secret keys remain strictly centralized at origin.
- **Trade-off**: Requires running two local processes during development (Wrangler for edge and Next.js for web), which is unified via root Turborepo commands (`npm run dev`).

