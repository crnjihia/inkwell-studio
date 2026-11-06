# Changelog

All notable changes to **Inkwell Studio** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.1.0] - 2026-11-06

### Initial Production-Grade Release

Inkwell Studio is an AI content workspace purpose-built for East African creators, technical journalists, and regional innovators.

### Added

- **Monorepo Foundation (Phase 0)**:
  - Turborepo orchestration with npm workspaces (`apps/web`, `apps/edge`, `packages/db`).
  - GitHub Actions CI pipeline (`prettier`, `tsc`, `vitest`).
- **Data Layer & TimescaleDB Hypertables (Phase 1)**:
  - Drizzle ORM schema modeling users, workspaces, documents, prompt templates, and public posts.
  - TimescaleDB hypertable partitioning for token consumption, model latencies, and dual-currency costs.
- **Anthropic Streaming Engine (Phase 2)**:
  - Server-Sent Events (SSE) streaming proxy targeting Claude 3.5 Sonnet.
  - Built-in Swahili (`sw-KE`) and English (`en-KE`) domain prompts with zero-credential offline mock support.
- **Collaborative TipTap Editor (Phase 3)**:
  - Real-time ProseMirror/TipTap editor with floating AI generation bars.
  - Non-destructive diff view with token insertion and inline accept/reject controls.
- **Prompt Version Control Studio (Phase 4)**:
  - SemVer version numbering, visual line-by-line diff viewer, and non-destructive rollbacks.
  - Side-by-side prompt output comparator across model revisions.
- **Real-Time CRDT Convergence (Phase 5)**:
  - Multi-user co-authoring backed by Cloudflare Durable Objects (`DocumentRoom`).
  - Remote cursor awareness, real-time presence indicators, and periodic state flushes.
- **Edge Layer & Security (Phase 6)**:
  - Cloudflare Worker running Hono with token bucket rate limiting (60 RPM).
  - Clerk RS256 JWT validation and synthetic developer identity fallbacks.
- **Sub-Second Static Publishing (Phase 7)**:
  - One-click static publication pipeline with dynamic Open Graph image tags and JSON-LD metadata.
  - Sub-second Cloudflare cache purge mechanism (`<1000ms SLA`).
- **Dual-Currency Accounting & Safeguards (Phases 8 & 9)**:
  - TimescaleDB rollup analytics tracking KES (Kenyan Shillings) alongside USD.
  - Automated budget threshold crossing alerts (80%, 100%) with hard spend stops.
  - Regional PII redactor scrubbing Safaricom/Airtel phone numbers and M-Pesa receipts.
  - Prompt injection heuristics and zero-leakage error logging.
- **Design System & Final Polishing (Phase 10)**:
  - Minimalist Linear-inspired dark mode palette (`zinc-950`).
  - Global bilingual synchronization across all client routes.
  - 37 passing unit and integration tests across 9 Vitest suites.
- **Packaging & Deployment Automation**:
  - GitHub Container Registry (GHCR) multi-stage Dockerfile and automated workflow.
  - GitHub Releases workflow packaging schemas and edge worker artifacts.
  - GitHub Deployments workflow targeting Cloudflare Workers and web application.
