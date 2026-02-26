# GIS-ERP Post-Competition Hardening Roadmap

> Generated: February 26, 2026 | Audit of v0.10.x codebase
> Competition deadline: March 12, 2026

## Current Scale
- 376K lines of code, 1,695 files
- 299 database tables, 141 server action files, 760 components
- 14 employees, 2 customers live in production
- Supabase project: ljbkjtaowrdddvjhsygj

## Audit Summary

### Critical Findings
| Finding | Count | Severity |
|---------|-------|----------|
| Type safety bypasses (`as any`, `as unknown`, `@ts-ignore`) | 2,179 | CRITICAL |
| `.select('*')` over-fetching queries | 484 | HIGH |
| PostgREST filter injection via `.or()` string interpolation | 35 files | HIGH |
| Server action files scattered in 3 locations | 141 files | MEDIUM |
| Rate limiter exists (655 lines) but unused | 0 calls | HIGH |
| Flat files in lib/ (no subdirectory structure) | 188 files | MEDIUM |
| Empty/generic error catch blocks | 141+ files | MEDIUM |
| Estimated dead/unused components | 50-100 | LOW |

### What's Working Well
- Component organization (by feature domain) is solid
- Auth system (RLS + role-based) is properly implemented
- Infrastructure (Synology, Mac Mini, monitoring, Telegram alerts) is ahead of software
- Dashboard caching (5-min TTL) works correctly
- Centralized auth helpers (lib/auth-helpers.ts) -- new as of Feb 26

## Phase 0: Critical Security (Before March 12)
- [x] Sanitize search inputs in `.or()` / `.ilike()` -- 28 files (commit f395589)
- [x] Add CSRF origin validation to 3 POST API routes (commit f395589)
- [x] Wire existing rate limiter to 4 PDF generation endpoints (commit f395589)
- [x] Spot-check auth on top 20 server actions -- found & fixed payroll (critical gap, no auth)
- [x] Add auth checks to all 14 payroll action functions (owner/director/sysadmin/hr/finance_manager)
- [x] Add `.limit()` to remaining unbounded queries (feedback, job-failures, hse-data)
- [x] Add `console.error` to 40+ silent catch blocks across core business actions

**Estimated effort**: 13 hours

## Phase 1: Quick Wins (Done Feb 26)
- [x] `lib/auth-helpers.ts` -- centralized 3-step auth lookup (commit 80f2664)
- [x] Default `.limit(100)` on 7 unbounded list queries
- [x] Default `.limit(500)` on cached reference data
- [x] Dynamic import for ExcelJS (~200KB deferred)

## Phase 2: Foundation (March 13 -- April 2026)
- [ ] Centralized error handling: error classes, logging, classification
  - Create AppError base class with code, httpStatus, context
  - Replace 141+ generic catch blocks with typed error handling
  - Add error logging to external service (or at minimum console.error with context)
- [ ] Action file consolidation: 141 -> ~25 domain modules
  - Move to `lib/actions/{domain}/` structure
  - One entry point per domain (audit, jmp, training, etc.)
- [ ] Server-side cursor pagination utility
  - Create `PaginatedQuery<T>` helper
  - Apply to top 10 list views first
- [ ] PDF caching: generate -> store in `generated-documents` bucket -> serve cached
  - Check if cached version exists before regenerating
  - Invalidate on source data change

**Estimated effort**: 80 hours (3-4 sprints)

## Phase 3: Type Safety (May -- June 2026)
- [ ] Kill `as any` (965 instances) and `as unknown` (715 instances)
  - Create proper row-to-domain transformer functions
  - Fix Supabase query typing to use generated types correctly
  - Target: reduce from 2,179 -> <100
- [ ] Replace top 50 `.select('*')` with explicit column lists
  - Prioritize by traffic: dashboard, list views, search endpoints
- [ ] Add Zod schemas for ALL server action mutations
  - Create `lib/validators/` with domain-specific schemas
  - Enforce at action entry point, before any DB call
- [ ] Dead component audit and removal (50-100 estimated)

**Estimated effort**: 100 hours (3-4 sprints)

## Phase 4: Scale Readiness (Q3 2026)
- [ ] Redis/Vercel KV cache for reference data (customers, employees, categories)
- [ ] Database composite indexes for common filter combinations
- [ ] Storage lifecycle: auto-archive old generated docs to Synology DS1525+
- [ ] Signed URLs for document sharing (replace any public URLs)
- [ ] React.memo() on list item components
- [ ] Lazy-load report/chart components with next/dynamic

**Estimated effort**: 50 hours (2 sprints)

## Capacity Planning

| Metric | Safe (now) | Warning | Critical |
|--------|------------|---------|----------|
| List view rows | <500 | 1,000 | 2,000+ |
| Concurrent users | <100 | 500 | 1,000+ |
| Total DB records | <100K | 500K | 1M+ |
| Action files | <50 | 100 | 150+ (currently 141!) |
| Type bypasses | <100 | 500 | 1,000+ (currently 2,179!) |

## Infrastructure Available
- **Synology DS1525+**: Cold storage / PDF archive / backup destination
- **Mac Mini M4**: Self-hosted Supabase, monitoring, cron jobs, agents
- **Vercel**: Production deployment with CDN
- **Supabase Storage**: `documents`, `generated-documents`, `feedback` buckets
- **Monitoring**: Telegram alerts, cron watchdog, healthchecks, Nara agent

## Architecture Decisions

### Why NOT microservices (yet)
At 14 employees and 2 customers, the overhead of microservices (deployment, networking, debugging) exceeds the benefit. Monolith with clean domain boundaries (Phase 2) is the right call until:
- Team grows to 5+ developers
- Modules need independent scaling (e.g., PDF generation under heavy load)
- External integrations multiply (currently: n8n only)

### Why Supabase stays
- 299 tables with RLS policies already configured
- Self-hosted instance on Mac Mini for staging
- Edge Functions for shared business logic
- PostgREST API is sufficient for current scale
- Migration to raw Postgres would cost 200+ hours with zero user benefit

### PDF Strategy
Current: On-demand React PDF render per view/download.
Target: Generate once -> store in `generated-documents` -> serve from CDN.
Trigger regeneration only when source data changes.
