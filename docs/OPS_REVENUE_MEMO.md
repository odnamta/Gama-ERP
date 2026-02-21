# Ops Revenue Hiding — Full Scope Memo

> **Status:** Quick mask applied (Feb 2026). Full architectural fix planned post-competition.

## Business Rule
Operations staff (`ops` role) MUST NOT see revenue, profit, margin, or invoice totals.
This prevents ops from spending up to the profit line and eating margins.
`operations_manager` CAN see profit — they need it for oversight.

## What's Been Done (Quick Mask)
1. **JO Detail View** (`components/job-orders/jo-detail-view.tsx`)
   - Financials card, Profitability section, Invoice Terms, Revenue Breakdown — all wrapped with `{!isOps && (...)}`
   - `userRole` prop added, derived from `getUserProfile()` on the server page

2. **JO List Table** (`components/job-orders/jo-virtual-table.tsx`)
   - Revenue, Profit, Margin columns filtered out when `userRole === 'ops'`

3. **JO Pages** (`app/(main)/job-orders/page.tsx`, `app/(main)/job-orders/[id]/page.tsx`)
   - Both fetch `getUserProfile()` and pass `userRole` as prop

## What Still Needs Fixing (Post-Competition)

### Server Actions (data still returned, just hidden in UI)
- `getJobOrder()` in `app/(main)/job-orders/actions.ts` returns `final_revenue`, `final_cost` etc. to ALL roles
- `getJORevenueItems()` returns revenue line items to ALL roles
- `getJobProfitability()` returns profit data to ALL roles
- **Fix:** Add role check inside each server action. Return redacted data for ops.

### RLS Policies
- `job_orders` table SELECT policy does not filter revenue columns by role
- PostgreSQL RLS cannot do column-level filtering (only row-level)
- **Fix:** Create a `job_orders_ops_view` (SQL view) that excludes financial columns, or use column-level security via a wrapper function

### Other Pages That May Leak Revenue
- `/reports/financial` — should be blocked for ops entirely
- `/reports/budget-variance` — shows PJO estimated vs actual (currently accessible)
- `/dashboard/executive` — KPI cards may show revenue metrics
- Executive dashboard already filters KPIs by role, but verify `ops` is excluded from financial KPIs

### PJO Detail View
- `components/proforma-jo/pjo-detail-view.tsx` — shows estimated revenue items
- Ops should see cost items (their budget) but NOT revenue items

### Search Results
- Global search may return JO records with revenue in preview text
- Ensure search result cards don't show financial fields for ops

### Export/PDF
- PDF generation for JOs includes revenue breakdown
- If ops can trigger PDF export, revenue is exposed
- **Fix:** Generate ops-specific PDFs without revenue sections

## Architecture Recommendation
1. Create a `useUserRole()` hook or context provider that makes role available app-wide
2. Create server-side data filtering middleware: `filterForRole(data, role)` that strips sensitive fields
3. Prefer server-side filtering over client-side hiding — current approach is a UI mask only
4. Long-term: implement column-level security in Supabase using views or wrapper functions
