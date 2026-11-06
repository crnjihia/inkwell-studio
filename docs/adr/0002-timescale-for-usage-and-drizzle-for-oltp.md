# ADR 0002: PostgreSQL with Drizzle ORM and TimescaleDB for Usage Analytics

## Status
Accepted

## Context
Inkwell Studio generates high-frequency analytical events whenever an AI streaming completion finishes. Each event records user ID, workspace ID, dynamic model ID, input/output tokens, and dual-currency costs (`KES` and `USD`). Relational queries require relational integrity across workspaces, prompts, documents, and historical versions, while analytical queries require rolling daily rollups without scanning millions of rows.

## Decision
We adopted a dual-purpose database architecture using **PostgreSQL with TimescaleDB**:

1. **Drizzle ORM for Relational OLTP**:
   - Manages strict relational schemas: `users`, `workspaces`, `workspace_members`, `documents`, `document_versions`, `prompts`, `prompt_versions`, and `publications`.
   - Offers lightweight zero-overhead SQL generation with full TypeScript type inference.

2. **TimescaleDB Hypertables for Usage Telemetry (`usage_events`)**:
   - The `usage_events` table is partitioned by the `time` dimension into automatic time-series chunks.
   - A Timescale continuous aggregate (`daily_workspace_usage`) pre-calculates daily input/output token sums and KES expenditures.
   - Dashboard telemetry queries (`GET /api/usage`) execute in sub-millisecond response times regardless of event volume.

## Consequences
- **Positive**: Strict relational constraints prevent orphaned versions or publications, while Timescale hypertables eliminate expensive table scans when aggregating monthly spend against budget thresholds.
- **Portability**: Standard PostgreSQL clients (Neon, Supabase, local Timescale container) work out-of-the-box. When TimescaleDB extensions are unavailable, queries gracefully fall back to relational `GROUP BY` rollups.

