# Continuity Ledger

## Goal
Create spec v0.63: AI Insights - Natural Language Queries feature for Gama ERP. This enables executives to ask questions in plain English and get instant answers from the database.

## Constraints/Assumptions
- Next.js 15 with App Router, TypeScript, TailwindCSS + shadcn/ui
- Supabase backend (PostgreSQL + Auth)
- Must integrate with existing executive dashboard
- SQL generation must be safe (read-only, no sensitive tables)
- Template-based matching for common queries + AI fallback

## Key Decisions
- Feature name: ai-insights-natural-language
- Route: /dashboard/executive/ai
- Response types: text, table, chart, number, error
- Safety: Block write operations, sensitive tables, rate limiting

## State
- Done: All 14 tasks completed - database schema, types, utils, actions, UI components, page route, navigation
- Now: Pushing to GitHub
- Next: Complete

## Open Questions
- (none yet)

## Working Set
- .kiro/specs/v0.63-ai-insights-natural-language/requirements.md
- .kiro/specs/v0.63-ai-insights-natural-language/design.md
- .kiro/specs/v0.63-ai-insights-natural-language/tasks.md

---

# Previous Ledger - v0.62 Financial Analytics

## Goal (incl. success criteria):
Complete v0.62 Financial Analytics implementation and push to GitHub.
- All tasks complete ✅
- All property tests passing (32/32) ✅
- Build successful ✅
- Bug fixes applied ✅
- Pushed to GitHub ✅
- Navigation integration complete ✅

## Constraints/Assumptions:
- Next.js 15 + TypeScript + TailwindCSS + shadcn/ui
- Supabase project ID: ljbkjtaowrdddvjhsygj
- Follow existing patterns from v0.61 Executive Dashboard
- Property tests use fast-check with 100 iterations minimum
- Currency format: Indonesian Rupiah (IDR)
- Date format: DD/MM/YYYY

## Key decisions:
- Database tables: budget_items, monthly_actuals, cash_flow_transactions, cash_flow_forecast
- Views: customer_profitability, job_type_profitability, monthly_pl_summary
- Server component fetches data, client component handles interactivity
- Charts use Recharts library (AreaChart, BarChart, PieChart)
- Export supports CSV and JSON formats
- Navigation added under Dashboard with children
- Used `(supabase as any)` for tables not in generated types
- Financial Analytics accessible to: owner, admin, manager, finance roles

## State:

### Done:
- Task 1.1-1.5: Database schema (tables, views, RLS)
- Task 2.1-2.5: TypeScript types and utility functions
- Task 4.1-4.9: Server actions with property tests
- Task 6.1-6.5: Data display components
- Task 7.1-7.4: Chart components
- Task 8.1-8.8: Page layout and integration
- Task 10.1-10.3: Export functionality
- Task 11.1: Navigation integration with role-based access
- Task 12: Final checkpoint - VERIFIED ✅
  - All 32 property tests passing
  - All TypeScript files compile without errors
  - Build successful
  - All acceptance criteria met

### Now:
- Feature complete

### Next:
- None - v0.62 Financial Analytics fully implemented

## Open questions:
None

## Working set:
- types/financial-analytics.ts
- lib/financial-analytics-utils.ts
- lib/financial-analytics-actions.ts
- lib/navigation.ts
- components/financial-analytics/*
- app/(main)/dashboard/executive/finance/page.tsx
- __tests__/financial-analytics-*.property.test.ts
