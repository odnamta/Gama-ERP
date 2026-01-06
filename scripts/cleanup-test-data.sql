-- Gama ERP: Complete Database Cleanup Script
-- WARNING: This will delete ALL data from all tables
-- ✅ EXECUTED SUCCESSFULLY

-- Method: TRUNCATE with CASCADE (safer and more efficient)
-- Disable foreign key checks temporarily
SET session_replication_role = replica;

-- Truncate all tables (this deletes all data and resets sequences automatically)
TRUNCATE TABLE 
  drawing_revisions,
  drawing_transmittals,
  drawings,
  drawing_categories,
  technical_assessments,
  journey_management_plans,
  route_surveys,
  invoices,
  job_orders,
  pjo_cost_items,
  pjo_revenue_items,
  proforma_job_orders,
  pursuit_costs,
  quotation_cost_items,
  quotation_revenue_items,
  quotations,
  projects,
  customers
RESTART IDENTITY CASCADE;

-- Re-enable foreign key checks
SET session_replication_role = DEFAULT;

-- 3. Verify complete cleanup - all should show 0 records
SELECT 'customers' as table_name, COUNT(*) as remaining_records FROM customers
UNION ALL
SELECT 'projects', COUNT(*) FROM projects
UNION ALL
SELECT 'quotations', COUNT(*) FROM quotations
UNION ALL
SELECT 'quotation_revenue_items', COUNT(*) FROM quotation_revenue_items
UNION ALL
SELECT 'quotation_cost_items', COUNT(*) FROM quotation_cost_items
UNION ALL
SELECT 'pursuit_costs', COUNT(*) FROM pursuit_costs
UNION ALL
SELECT 'proforma_job_orders', COUNT(*) FROM proforma_job_orders
UNION ALL
SELECT 'pjo_revenue_items', COUNT(*) FROM pjo_revenue_items
UNION ALL
SELECT 'pjo_cost_items', COUNT(*) FROM pjo_cost_items
UNION ALL
SELECT 'job_orders', COUNT(*) FROM job_orders
UNION ALL
SELECT 'invoices', COUNT(*) FROM invoices
UNION ALL
SELECT 'route_surveys', COUNT(*) FROM route_surveys
UNION ALL
SELECT 'journey_management_plans', COUNT(*) FROM journey_management_plans
UNION ALL
SELECT 'technical_assessments', COUNT(*) FROM technical_assessments
UNION ALL
SELECT 'drawing_categories', COUNT(*) FROM drawing_categories
UNION ALL
SELECT 'drawings', COUNT(*) FROM drawings
UNION ALL
SELECT 'drawing_revisions', COUNT(*) FROM drawing_revisions
UNION ALL
SELECT 'drawing_transmittals', COUNT(*) FROM drawing_transmittals;