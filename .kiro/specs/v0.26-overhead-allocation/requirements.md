# Requirements Document

## Introduction

This document defines the requirements for the Overhead Allocation feature (v0.26) in Gama ERP. The feature enables finance users to allocate overhead costs (office rent, utilities, admin salaries, insurance, depreciation, marketing, professional services) to job orders for accurate profitability calculation. Currently, job profit only considers direct costs; this feature adds overhead allocation to calculate true net profit and margin.

## Glossary

- **Overhead_Category**: A classification of indirect business costs (e.g., office rent, utilities, admin salaries) that are not directly tied to specific jobs but must be allocated for accurate profitability
- **Overhead_Allocation**: The process of distributing overhead costs to individual job orders based on a defined method
- **Allocation_Method**: The strategy used to distribute overhead costs: revenue_percentage (based on job revenue), fixed_per_job (flat amount per job), manual (user-specified), or none (not allocated)
- **Allocation_Rate**: The percentage or fixed amount used to calculate overhead allocation for a category
- **Gross_Profit**: Revenue minus direct costs (trucking, port charges, handling, etc.)
- **Net_Profit**: Gross profit minus allocated overhead costs
- **Net_Margin**: Net profit expressed as a percentage of revenue
- **Job_Order**: An active work order (JO) linked to a PJO that tracks actual revenue and costs
- **Direct_Costs**: Costs directly attributable to a specific job (trucking, fuel, labor, etc.)
- **Overhead_Actuals**: The actual monthly overhead expenses recorded for each category

## Requirements

### Requirement 1: Overhead Category Management

**User Story:** As a finance manager, I want to configure overhead categories and their allocation rates, so that I can control how overhead costs are distributed to jobs.

#### Acceptance Criteria

1. THE System SHALL display a list of all overhead categories with their allocation method, rate, and active status
2. WHEN a finance user edits an overhead category rate, THE System SHALL update the default_rate for that category
3. WHEN a finance user toggles a category's active status, THE System SHALL include or exclude that category from future allocations
4. THE System SHALL calculate and display the total overhead rate as the sum of all active revenue_percentage categories
5. WHEN a finance user adds a new overhead category, THE System SHALL create the category with the specified code, name, method, and rate
6. THE System SHALL prevent duplicate category codes when creating new categories

### Requirement 2: Overhead Allocation Calculation

**User Story:** As a finance manager, I want overhead costs automatically allocated to job orders based on configured rates, so that I can see true job profitability.

#### Acceptance Criteria

1. WHEN overhead is calculated for a job order, THE System SHALL allocate each active category based on its allocation method
2. WHEN the allocation method is revenue_percentage, THE System SHALL calculate allocated_amount as (job_revenue × allocation_rate / 100)
3. WHEN a job order has zero or null revenue, THE System SHALL return zero overhead allocation
4. THE System SHALL store each category's allocation as a separate record with jo_id, category_id, method, rate, base_amount, and allocated_amount
5. WHEN overhead is recalculated for a job, THE System SHALL delete existing allocations before creating new ones
6. THE System SHALL update the job order's total_overhead, net_profit, and net_margin after allocation

### Requirement 3: Job Profitability Display

**User Story:** As a finance user, I want to view a detailed profitability breakdown on job orders, so that I can understand gross and net profit with overhead allocation.

#### Acceptance Criteria

1. THE System SHALL display gross profit as (total_revenue - total_cost) on the job order detail view
2. THE System SHALL display gross margin as (gross_profit / total_revenue × 100) percentage
3. THE System SHALL display each overhead category allocation with its rate and allocated amount
4. THE System SHALL display total allocated overhead as the sum of all category allocations
5. THE System SHALL display net profit as (gross_profit - total_overhead)
6. THE System SHALL display net margin as (net_profit / total_revenue × 100) percentage
7. WHEN a user clicks "Recalculate Overhead", THE System SHALL recalculate and refresh the profitability display

### Requirement 4: Batch Overhead Recalculation

**User Story:** As a finance manager, I want to recalculate overhead for multiple jobs at once, so that I can update profitability after changing allocation rates.

#### Acceptance Criteria

1. WHEN a finance user triggers batch recalculation for a period, THE System SHALL recalculate overhead for all job orders in that period
2. THE System SHALL return the count of jobs recalculated after batch operation
3. WHEN overhead rates are changed, THE System SHALL provide an option to recalculate affected jobs

### Requirement 5: Overhead Settings Page

**User Story:** As a finance manager, I want a dedicated settings page for overhead configuration, so that I can manage all overhead-related settings in one place.

#### Acceptance Criteria

1. THE System SHALL provide a settings page at /finance/settings/overhead accessible to finance and manager roles
2. THE System SHALL display an example calculation showing how overhead affects a sample job's profitability
3. THE System SHALL allow inline editing of allocation rates with immediate save
4. IF a user without finance or manager role accesses the overhead settings, THEN THE System SHALL deny access and display an appropriate message

### Requirement 6: Database Schema

**User Story:** As a system administrator, I want the database properly structured for overhead allocation, so that data integrity is maintained.

#### Acceptance Criteria

1. THE System SHALL create an overhead_categories table with id, category_code, category_name, description, allocation_method, default_rate, is_active, display_order, and created_at columns
2. THE System SHALL create an overhead_actuals table with id, category_id, period_year, period_month, actual_amount, notes, created_by, and created_at columns
3. THE System SHALL create a job_overhead_allocations table with id, jo_id, category_id, allocation_method, allocation_rate, base_amount, allocated_amount, period_year, period_month, notes, and created_at columns
4. THE System SHALL add total_overhead, net_profit, and net_margin columns to the job_orders table
5. THE System SHALL enforce unique constraint on (category_id, period_year, period_month) in overhead_actuals
6. THE System SHALL enforce unique constraint on (jo_id, category_id) in job_overhead_allocations
7. THE System SHALL insert default overhead categories (office_rent, utilities, admin_salary, insurance, depreciation, marketing, professional, miscellaneous) on schema creation
