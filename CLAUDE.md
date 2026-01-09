# GAMA ERP - Project Context for Claude Code

## Overview
Internal ERP system for PT. Gama Intisamudera (Indonesian heavy-haul logistics company).
10-module system: Operations, Finance, HR, HSE, Equipment, Customs, Agency, Engineering, Procurement, AI Dashboard.

## Current Status ✅
```
Performance: 95-97/100 Lighthouse (was 40/100)
TypeScript: 0 errors
ESLint: 0 errors, 515 warnings (unused vars)
Build: Passes successfully
```

## Current Phase: Feature Completion (Phase 2)

### BLOCKING Issues (Fix First)
1. **No User Management Page** - Can't assign roles to users
2. **Missing Roles** - Need 'agency' and 'customs'
3. **Disbursement Module Incomplete** - BKK not done
4. **Finance Dashboard Mock Data** - Needs real queries

### Team Onboarding Plan
- Phase 1 (Now): Feri (finance_manager), Rania (hr)
- Phase 2 (Feb): Operations, Marketing, HSE
- Phase 3 (Mar): Agency, Customs

## Tech Stack
- Next.js 15 (App Router)
- TypeScript (strict)
- Supabase (PostgreSQL + Auth)
- TailwindCSS
- Vercel hosting

## RBAC Roles

### Current (13)
```
owner, director, sysadmin
marketing_manager, finance_manager, operations_manager
administration, finance, marketing, ops, engineer, hr, hse
```

### To Add (2)
```
agency  - Agency division only
customs - Customs division only
```

**RULE:** ops roles CANNOT see revenue/profit.

## Key Directories
```
app/(main)/           - Protected routes
app/(main)/dashboard/ - Role dashboards
app/(main)/settings/  - Settings (needs /users page!)
lib/permissions.ts    - RBAC definitions
types/permissions.ts  - Role types
middleware.ts         - Route protection
```

## Commands
```bash
npm run dev              # Dev server
npm run build            # Production build
ANALYZE=true npm run build  # Bundle analysis
```

## Performance Optimizations Done
- ✅ Bundle: 526KB → 159KB
- ✅ Reports: All 15 SSR (instant load)
- ✅ Middleware: JWT-based (no DB query)
- ✅ Tables: Virtualized
- ✅ Dashboard: Cached (5-min TTL)

## Do NOT
- ❌ console.log (use lib/utils/logger.ts)
- ❌ Query DB in middleware
- ❌ Show revenue to ops roles
- ❌ Disable TypeScript
- ❌ Static import ExcelJS

## Kiro Prompt Format
```
GOAL: [Objective]

CONTEXT: [Background]

STEPS:
1. File: [path] - Change: [what]
2. File: [path] - Change: [what]

SUCCESS CRITERIA:
✓ [Outcome 1]
✓ [Outcome 2]

TESTING:
1. [Verify step]
```