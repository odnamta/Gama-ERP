-- Migration: Database Functions for Performance Optimization
-- Task 1.5: Create database functions migration
-- Requirements: 3.3, 4.1, 4.2, 4.3

-- ============================================================================
-- DATABASE FUNCTIONS
-- Optimized functions for dashboard stats and materialized view refresh
-- ============================================================================

-- get_dashboard_stats: Returns aggregated dashboard metrics in a single call
-- Requirement 4.1: Returns active_jobs, revenue_mtd, profit_mtd, pending_invoices, ar_outstanding
-- Requirement 4.2: Calculates revenue_mtd and profit_mtd from completed jobs in current month
-- Requirement 4.3: Calculates pending_invoices and ar_outstanding from invoices with status sent, partial, or overdue
CREATE OR REPLACE FUNCTION get_dashboard_stats()
RETURNS TABLE (
    active_jobs BIGINT,
    revenue_mtd NUMERIC,
    profit_mtd NUMERIC,
    pending_invoices BIGINT,
    ar_outstanding NUMERIC
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        -- Active jobs count
        (SELECT COUNT(*) FROM job_orders WHERE status = 'active')::BIGINT AS active_jobs,
        
        -- Revenue MTD (from completed jobs this month)
        COALESCE((
            SELECT SUM(final_revenue) 
            FROM job_orders 
            WHERE status IN ('completed', 'invoiced', 'closed')
            AND completed_at >= DATE_TRUNC('month', CURRENT_DATE)
        ), 0)::NUMERIC AS revenue_mtd,
        
        -- Profit MTD (from completed jobs this month)
        COALESCE((
            SELECT SUM(final_revenue - final_cost) 
            FROM job_orders 
            WHERE status IN ('completed', 'invoiced', 'closed')
            AND completed_at >= DATE_TRUNC('month', CURRENT_DATE)
        ), 0)::NUMERIC AS profit_mtd,
        
        -- Pending invoices count
        (SELECT COUNT(*) FROM invoices WHERE status IN ('sent', 'partial', 'overdue'))::BIGINT AS pending_invoices,
        
        -- AR outstanding (unpaid invoice amounts)
        COALESCE((
            SELECT SUM(total_amount - COALESCE(amount_paid, 0)) 
            FROM invoices 
            WHERE status IN ('sent', 'partial', 'overdue')
        ), 0)::NUMERIC AS ar_outstanding;
END;
$$;

-- refresh_materialized_views: Refreshes all materialized views concurrently
-- Requirement 3.3: Refreshes all materialized views concurrently without blocking read queries
CREATE OR REPLACE FUNCTION refresh_materialized_views()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Refresh concurrently to avoid blocking read queries
    -- Note: CONCURRENTLY requires unique index on the materialized view
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_monthly_revenue;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_customer_summary;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_dashboard_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION refresh_materialized_views() TO authenticated;
