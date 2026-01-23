# Requirements Document

## Introduction

This feature converts the Operations Manager dashboard (`app/(main)/dashboard/operations-manager/page.tsx`) from hardcoded mock data to real Supabase database queries. The current implementation displays static placeholder values (e.g., "8 Active Jobs", "87% Team Utilization") that need to be replaced with live data.

**CRITICAL BUSINESS RULE**: Operations Manager role CANNOT see revenue, profit, or invoice totals. This is a deliberate business rule to prevent expense inflation.

## Current State Analysis

The existing dashboard page shows:
- Hardcoded "8" for Active Jobs, "3" for Pending Handover
- Static "87%" Team Utilization, "78%" Asset Utilization
- Mock equipment counts "24 / 32"
- Placeholder KPIs (94% On-Time, 98.5 Safety Score, etc.)

Existing utilities that can be leveraged:
- `lib/ops-dashboard-utils.ts` - Has `getOpsKPIs()`, `getActiveJobs()`, `getWeeklyStats()` functions
- `lib/ops-dashboard-enhanced-utils.ts` - Has `getEnhancedOpsSummary()`, `getOperationsJobList()`, `getCostSummary()`
- `lib/dashboard-cache.ts` - Provides `getOrFetch()` caching pattern with 5-minute TTL

## Glossary

- **Dashboard**: The Operations Manager's main view at `/dashboard/operations-manager`
- **Operations_Manager_Data_Service**: New server-side service (`lib/operations-manager-dashboard-utils.ts`) that fetches and caches dashboard metrics
- **Cache_Service**: The dashboard caching utility (`lib/dashboard-cache.ts`) providing 5-minute TTL caching
- **Job_Order**: A work order for logistics operations - statuses: active, completed, submitted_to_finance, invoiced, closed
- **BKK_Record**: Bukti Kas Keluar - Cash disbursement record with workflow_status for tracking actual costs
- **Asset**: Company equipment (trucks, trailers, etc.) tracked in the `assets` table with status field
- **Asset_Assignment**: Junction table linking assets to job_orders via `asset_assignments`
- **Budget_Utilization**: Percentage of budgeted costs spent (final_cost / amount * 100)
- **Equipment_Utilization**: Percentage of assets currently assigned to active jobs
- **MTD**: Month-to-date, referring to data from the start of the current month

## Database Schema Reference

### Primary Tables
- **job_orders**: id, jo_number, customer_id, project_id, description, amount (budget), status, final_cost, completed_at, updated_at, workflow_status
- **bkk_records**: id, bkk_number, job_order_id, vendor_id, amount, currency, description, workflow_status, is_active, created_at
- **assets**: id, asset_code, asset_name, description, category_id, status, assigned_to_employee_id, assigned_to_job_id, registration_expiry_date, kir_expiry_date, insurance_expiry_date, purchase_price, book_value
- **asset_assignments**: id, asset_id, job_order_id, project_id, employee_id, assigned_from, assigned_to, km_used, hours_used
- **employees**: id, user_id, employee_code, full_name, department_id, position_id, status, join_date, base_salary

### Junction/Supporting Tables
- **job_equipment_usage**: id, job_order_id, asset_id, assignment_id, usage_start, usage_end, depreciation_cost, fuel_cost, maintenance_cost, operator_cost, total_cost
- **customers**: id, name, code, entity_type, is_active
- **proforma_job_orders**: id, pjo_number, project_id, status, commodity, pol, pod, approved_at, converted_to_jo

### Tables NEVER Queried (Revenue Data - FORBIDDEN)
- **invoices**: Contains revenue data
- job_orders columns: final_revenue, net_profit, net_margin, total_invoiced, invoiceable_amount
- Any invoice-related amounts

## Requirements

### Requirement 1: Job Order Metrics

**User Story:** As an Operations Manager, I want to see real-time job order metrics, so that I can track operational workload and job progress.

#### Acceptance Criteria

1. WHEN the dashboard loads, THE Operations_Manager_Data_Service SHALL query job_orders and return the count WHERE status = 'active'
2. WHEN the dashboard loads, THE Operations_Manager_Data_Service SHALL return the count of jobs WHERE status = 'completed' (pending handover to finance)
3. WHEN the dashboard loads, THE Operations_Manager_Data_Service SHALL return the count of jobs completed this month (completed_at in current month)
4. WHEN the dashboard loads, THE Operations_Manager_Data_Service SHALL return counts grouped by status (active, completed, submitted_to_finance, invoiced, closed)

### Requirement 2: Cost Tracking (NO Revenue)

**User Story:** As an Operations Manager, I want to see cost metrics for active jobs, so that I can monitor budget utilization without seeing revenue data.

#### Acceptance Criteria

1. THE Operations_Manager_Data_Service SHALL NEVER query final_revenue, net_profit, net_margin, or invoice amounts
2. WHEN the dashboard loads, THE Operations_Manager_Data_Service SHALL calculate total budgeted costs as SUM(amount) from job_orders WHERE status = 'active'
3. WHEN the dashboard loads, THE Operations_Manager_Data_Service SHALL calculate total actual costs as SUM(final_cost) from job_orders WHERE status = 'active'
4. WHEN the dashboard loads, THE Operations_Manager_Data_Service SHALL calculate budget utilization as (SUM(final_cost) / SUM(amount)) * 100 for active jobs
5. WHEN the dashboard loads, THE Operations_Manager_Data_Service SHALL return the count of jobs WHERE final_cost > amount (over-budget jobs)

### Requirement 3: Equipment/Asset Metrics

**User Story:** As an Operations Manager, I want to see equipment status, so that I can manage equipment allocation and maintenance.

#### Acceptance Criteria

1. WHEN the dashboard loads, THE Operations_Manager_Data_Service SHALL return total asset count and count WHERE assigned_to_job_id IS NOT NULL (assigned)
2. WHEN the dashboard loads, THE Operations_Manager_Data_Service SHALL calculate equipment utilization rate as (assigned assets / total assets) * 100
3. WHEN the dashboard loads, THE Operations_Manager_Data_Service SHALL return the count of assets WHERE registration_expiry_date, kir_expiry_date, OR insurance_expiry_date <= current_date + 7 days
4. WHEN the dashboard loads, THE Operations_Manager_Data_Service SHALL return asset counts grouped by status

### Requirement 4: Team/Manpower Metrics

**User Story:** As an Operations Manager, I want to see team utilization, so that I can manage staff assignments effectively.

#### Acceptance Criteria

1. WHEN the dashboard loads, THE Operations_Manager_Data_Service SHALL return total active employees count WHERE status = 'active'
2. WHEN the dashboard loads, THE Operations_Manager_Data_Service SHALL return count of employees currently assigned to active jobs via asset_assignments (employee_id linked)
3. WHEN the dashboard loads, THE Operations_Manager_Data_Service SHALL calculate team utilization rate as (assigned employees / total active employees) * 100

### Requirement 5: Recent Activity Lists

**User Story:** As an Operations Manager, I want to see recent operational activity, so that I can stay informed of latest changes.

#### Acceptance Criteria

1. WHEN the dashboard loads, THE Operations_Manager_Data_Service SHALL return the 5 most recently updated job_orders with id, jo_number, description, status, updated_at, joined with customers for customer name
2. WHEN the dashboard loads, THE Operations_Manager_Data_Service SHALL return the 5 most recent bkk_records with id, bkk_number, description, amount, created_at WHERE is_active = true
3. THE Dashboard SHALL NOT display any invoice or revenue-related activity

### Requirement 6: Data Caching

**User Story:** As an Operations Manager, I want the dashboard to load quickly, so that I can access information without delays.

#### Acceptance Criteria

1. THE Operations_Manager_Data_Service SHALL use the Cache_Service from `lib/dashboard-cache.ts` with a 5-minute TTL for all metrics
2. WHEN cached data exists and is not expired, THE Operations_Manager_Data_Service SHALL return cached data without querying the database
3. WHEN cached data is expired or missing, THE Operations_Manager_Data_Service SHALL fetch fresh data and update the cache
4. THE Dashboard SHALL load within 2 seconds under normal conditions

### Requirement 7: Dashboard Integration

**User Story:** As an Operations Manager, I want the dashboard page to display real data, so that I can make informed operational decisions.

#### Acceptance Criteria

1. WHEN the dashboard page renders, THE Dashboard SHALL call the Operations_Manager_Data_Service to fetch metrics
2. THE Dashboard SHALL replace all mock/placeholder values with real data from the service
3. THE Dashboard SHALL display currency values in IDR format with thousands separators using existing format utilities
4. THE Dashboard SHALL maintain the existing visual design and layout while updating data sources
5. THE Dashboard SHALL NOT display any revenue, profit, or invoice total metrics
