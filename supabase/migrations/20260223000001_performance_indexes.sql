-- Migration: Performance Indexes for Dashboard Queries
-- Date: 2026-02-23
-- Purpose: Add missing B-tree indexes on status columns used heavily in
--          dashboard queries across multiple modules.
--
-- Already existing (NOT recreated here):
--   idx_pjo_status                    ON proforma_job_orders(status)
--   idx_assets_status                 ON assets(status)
--   idx_assets_assigned_job           ON assets(assigned_to_job_id)
--   idx_route_surveys_status          ON route_surveys(status)
--   idx_jmp_status                    ON journey_management_plans(status)
--   idx_engineering_assessments_status ON engineering_assessments(status)
--   idx_quotations_status_active      ON quotations(status) WHERE is_active = true
--   idx_active_customers              ON customers(name)    WHERE is_active = true

-- ============================================================================
-- NEW INDEXES
-- ============================================================================

-- 1. job_orders(status) — used in 8+ dashboard queries (admin, ops, finance)
--    No status index existed on this table.
CREATE INDEX IF NOT EXISTS idx_job_orders_status
    ON job_orders (status);

-- 2. invoices(status) — used in admin dashboard, finance reports
--    Existing partial indexes filter by date or exclude cancelled/paid,
--    but no general status index for listing/filtering by status.
CREATE INDEX IF NOT EXISTS idx_invoices_status
    ON invoices (status);

-- 3. quotations(status) — used in marketing dashboard
--    Existing idx_quotations_status_active only covers is_active = true rows.
--    This general index covers all status-based queries regardless of is_active.
CREATE INDEX IF NOT EXISTS idx_quotations_status
    ON quotations (status);

-- 4. customers(is_active) — used in customer listings, dropdowns
--    Existing idx_active_customers indexes (name) WHERE is_active = true.
--    This partial index directly supports WHERE is_active = true filtering
--    without needing to scan the name column.
CREATE INDEX IF NOT EXISTS idx_customers_is_active
    ON customers (is_active)
    WHERE is_active = true;
