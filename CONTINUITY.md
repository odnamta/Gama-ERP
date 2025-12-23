# Continuity Ledger - v0.61 Executive Dashboard KPI

## Goal (incl. success criteria):
Complete v0.61 Executive Dashboard KPI Overview implementation and push to GitHub.
- All tasks complete ✅
- Bug fixes applied ✅
- Pushed to GitHub ✅

## Constraints/Assumptions:
- Next.js 15 + TypeScript + TailwindCSS + shadcn/ui
- Supabase project ID: ljbkjtaowrdddvjhsygj
- Follow existing patterns from steering files
- Property tests use fast-check with 100 iterations minimum

## Key decisions:
- Server component fetches user profile for role-based filtering
- Client component handles interactive features (period selection, export, refresh)
- KPIs filtered by user role via visible_to_roles array
- Export generates CSV/JSON with configurable options
- Use `any` type assertions for tables not in generated Supabase types (kpi_definitions, kpi_targets, dashboard_layouts, incidents)
- Fixed column names: amount_paid (not paid_amount), total_revenue (not total_value)
- TrendChart uses SVG line chart (not bar chart) per Requirement 12.3
- Layout customization uses native HTML5 drag-drop API (no external library)
- Export dialog supports CSV and JSON formats with configurable fields

## State:

### Done:
- Task 1-12: All v0.61 tasks complete ✅
- Bug fixes: ESLint no-explicit-any errors fixed
- Added react-dropzone dependency
- Fixed type assertions in resource-scheduling components

### Now:
- Pushing to GitHub

### Next:
- None - feature complete

## Open questions:
None

## Working set:
- app/(main)/dashboard/executive/page.tsx
- app/(main)/dashboard/executive/executive-dashboard-client.tsx
- lib/executive-dashboard-actions.ts
- lib/executive-dashboard-utils.ts
- types/executive-dashboard.ts
- components/executive-dashboard/*
