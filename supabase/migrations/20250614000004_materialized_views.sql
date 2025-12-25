-- Migration: Materialized Views for Performance Optimization
-- Task 1.4: Create materialized views migration
-- Requirements: 3.1, 3.2, 3.4, 3.5

-- ============================================================================
-- MATERIALIZED VIEWS
-- Pre-computed query results for fast reporting and dashboard queries
-- ============================================================================

-- Drop existing views if they exist (for clean recreation)
DROP MATERIALIZED VIEW IF EXISTS mv_monthly_revenue CASCADE;
DROP MATERIALIZED VIEW IF EXISTS mv_customer_summary CASCADE;

-- mv_monthly_revenue: Monthly revenue, cost, and profit aggregations by customer
-- Requirement 3.1: Contains monthly revenue, cost, and profit aggregations
-- Requirement 3.4: Includes data from the last 2 years for trend analysis
CREATE MATERIALIZED VIEW mv_monthly_revenue AS
SELECT 
    c.id AS customer_id,
    c.name AS customer_name,
    DATE_TRUNC('month', jo.completed_at) AS month,
    COUNT(jo.id) AS job_count,
    COALESCE(SUM(jo.final_revenue), 0) AS total_revenue,
    COALESCE(SUM(jo.final_cost), 0) AS total_cost,
    COALESCE(SUM(jo.final_revenue - jo.final_cost), 0) AS total_profit,
    CASE 
        WHEN SUM(jo.final_revenue) > 0 
        THEN ROUND((SUM(jo.final_revenue - jo.final_cost) / SUM(jo.final_revenue)) * 100, 2)
        ELSE 0 
    END AS profit_margin_pct
FROM customers c
LEFT JOIN job_orders jo ON jo.customer_id = c.id 
    AND jo.status IN ('completed', 'invoiced', 'closed')
    AND jo.completed_at >= NOW() - INTERVAL '2 years'
WHERE c.is_active = true
GROUP BY c.id, c.name, DATE_TRUNC('month', jo.completed_at)
ORDER BY c.name, month DESC;

-- Unique index for concurrent refresh
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_monthly_revenue_unique 
    ON mv_monthly_revenue (customer_id, month);

-- mv_customer_summary: Customer statistics for dashboard
-- Requirement 3.2: Contains total jobs, completed jobs, total revenue, outstanding AR
-- Requirement 3.5: Only includes active customers
CREATE MATERIALIZED VIEW mv_customer_summary AS
SELECT 
    c.id AS customer_id,
    c.name AS customer_name,
    c.email AS customer_email,
    COUNT(DISTINCT jo.id) AS total_jobs,
    COUNT(DISTINCT CASE WHEN jo.status IN ('completed', 'invoiced', 'closed') THEN jo.id END) AS completed_jobs,
    COALESCE(SUM(CASE WHEN jo.status IN ('completed', 'invoiced', 'closed') THEN jo.final_revenue ELSE 0 END), 0) AS total_revenue,
    COALESCE(SUM(CASE WHEN jo.status IN ('completed', 'invoiced', 'closed') THEN jo.final_cost ELSE 0 END), 0) AS total_cost,
    COALESCE(SUM(CASE WHEN jo.status IN ('completed', 'invoiced', 'closed') THEN jo.final_revenue - jo.final_cost ELSE 0 END), 0) AS total_profit,
    COALESCE((
        SELECT SUM(i.total_amount - COALESCE(i.amount_paid, 0))
        FROM invoices i 
        WHERE i.customer_id = c.id 
        AND i.status IN ('sent', 'partial', 'overdue')
    ), 0) AS outstanding_ar,
    MAX(jo.completed_at) AS last_job_date
FROM customers c
LEFT JOIN job_orders jo ON jo.customer_id = c.id
WHERE c.is_active = true
GROUP BY c.id, c.name, c.email
ORDER BY total_revenue DESC;

-- Unique index for concurrent refresh
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_customer_summary_unique 
    ON mv_customer_summary (customer_id);
