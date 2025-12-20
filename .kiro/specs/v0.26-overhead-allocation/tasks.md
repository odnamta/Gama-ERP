# Implementation Plan: Overhead Allocation

## Overview

This implementation plan covers the Overhead Allocation feature (v0.26) for Gama ERP. The feature enables allocation of overhead costs to job orders for accurate net profitability calculation. Implementation follows a database-first approach, then utilities, server actions, and finally UI components.

## Tasks

- [x] 1. Database Schema Setup
  - [x] 1.1 Create overhead_categories table with default data
    - Create table with id, category_code, category_name, description, allocation_method, default_rate, is_active, display_order, created_at
    - Insert 8 default categories (office_rent, utilities, admin_salary, insurance, depreciation, marketing, professional, miscellaneous)
    - _Requirements: 6.1, 6.7_
  - [x] 1.2 Create overhead_actuals table
    - Create table with id, category_id, period_year, period_month, actual_amount, notes, created_by, created_at
    - Add unique constraint on (category_id, period_year, period_month)
    - Add foreign key to overhead_categories
    - _Requirements: 6.2, 6.5_
  - [x] 1.3 Create job_overhead_allocations table
    - Create table with id, jo_id, category_id, allocation_method, allocation_rate, base_amount, allocated_amount, period_year, period_month, notes, created_at
    - Add unique constraint on (jo_id, category_id)
    - Add foreign keys to job_orders and overhead_categories
    - Add index on jo_id
    - _Requirements: 6.3, 6.6_
  - [x] 1.4 Add columns to job_orders table
    - Add total_overhead DECIMAL(15,2) DEFAULT 0
    - Add net_profit DECIMAL(15,2) DEFAULT 0
    - Add net_margin DECIMAL(5,2) DEFAULT 0
    - _Requirements: 6.4_

- [x] 2. TypeScript Types and Utility Functions
  - [x] 2.1 Create overhead types
    - Create types/overhead.ts with OverheadCategory, OverheadActual, JobOverheadAllocation, AllocationMethod, JobProfitability interfaces
    - _Requirements: 2.1, 2.2_
  - [x] 2.2 Implement overhead utility functions
    - Create lib/overhead-utils.ts
    - Implement calculateOverheadAllocation(revenue, categories)
    - Implement calculateGrossProfit(revenue, directCosts)
    - Implement calculateNetProfit(grossProfit, totalOverhead)
    - Implement calculateMargin(profit, revenue)
    - Implement sumOverheadRates(categories)
    - Implement validateAllocationRate(rate, method)
    - _Requirements: 2.2, 3.1, 3.2, 3.5, 3.6_
  - [x] 2.3 Write property tests for overhead utilities
    - **Property 3: Revenue Percentage Allocation Formula**
    - **Property 5: Profitability Calculation Consistency**
    - **Validates: Requirements 2.2, 3.1, 3.2, 3.5, 3.6**
  - [x] 2.4 Write property test for total overhead rate
    - **Property 1: Total Overhead Rate Calculation**
    - **Validates: Requirements 1.4**

- [x] 3. Checkpoint - Verify utilities and types
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Overhead Category Server Actions
  - [x] 4.1 Create overhead category actions
    - Create app/(main)/finance/settings/overhead/actions.ts
    - Implement getOverheadCategories()
    - Implement updateOverheadCategoryRate(categoryId, rate)
    - Implement toggleOverheadCategoryActive(categoryId, isActive)
    - Implement createOverheadCategory(data)
    - Implement getTotalOverheadRate()
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_
  - [x] 4.2 Write property test for category rate update
    - **Property 7: Category Rate Update Persistence**
    - **Validates: Requirements 1.2**
  - [x] 4.3 Write property test for unique category code
    - **Property 8: Unique Category Code Constraint**
    - **Validates: Requirements 1.6**

- [x] 5. Job Overhead Allocation Server Actions
  - [x] 5.1 Create job overhead allocation actions
    - Create app/(main)/job-orders/overhead-actions.ts
    - Implement allocateJobOverhead(joId)
    - Implement getJobOverheadBreakdown(joId)
    - Implement recalculateJobOverhead(joId)
    - Implement batchRecalculateOverhead(year, month)
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 4.1, 4.2_
  - [x] 5.2 Write property test for active category inclusion
    - **Property 2: Active Category Inclusion in Allocation**
    - **Validates: Requirements 1.3, 2.1**
  - [x] 5.3 Write property test for allocation idempotence
    - **Property 4: Allocation Idempotence**
    - **Validates: Requirements 2.5**
  - [x] 5.4 Write property test for total overhead sum
    - **Property 6: Total Overhead Sum Consistency**
    - **Validates: Requirements 2.6, 3.4**
  - [x] 5.5 Write property test for batch recalculation
    - **Property 10: Batch Recalculation Coverage**
    - **Validates: Requirements 4.1, 4.2**

- [x] 6. Checkpoint - Verify server actions
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Overhead Settings UI Components
  - [x] 7.1 Create overhead category table component
    - Create components/overhead/overhead-category-table.tsx
    - Display categories with method, rate, active status
    - Implement inline rate editing with input field
    - Implement active toggle with switch
    - _Requirements: 1.1, 1.2, 1.3_
  - [x] 7.2 Create overhead example calculation component
    - Create components/overhead/overhead-example-calc.tsx
    - Show sample calculation with Rp 100,000,000 revenue
    - Display gross profit, overhead breakdown, net profit
    - _Requirements: 5.2_
  - [x] 7.3 Create overhead settings form component
    - Create components/overhead/overhead-settings-form.tsx
    - Combine category table and example calculation
    - Display total overhead rate
    - Handle save operations
    - _Requirements: 5.3_

- [x] 8. Overhead Settings Page
  - [x] 8.1 Create overhead settings page
    - Create app/(main)/finance/settings/overhead/page.tsx
    - Fetch categories and total rate
    - Render OverheadSettingsForm
    - Add permission check for finance/manager roles
    - _Requirements: 5.1, 5.4_
  - [x] 8.2 Add navigation to overhead settings
    - Add link in finance settings menu
    - _Requirements: 5.1_

- [x] 9. Job Order Profitability UI Components
  - [x] 9.1 Create overhead breakdown component
    - Create components/job-orders/overhead-breakdown.tsx
    - Display each category with rate and allocated amount
    - Show total overhead
    - _Requirements: 3.3, 3.4_
  - [x] 9.2 Create profitability section component
    - Create components/job-orders/profitability-section.tsx
    - Display revenue, direct costs, gross profit, gross margin
    - Include overhead breakdown
    - Display net profit, net margin
    - Add "Recalculate Overhead" button
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_
  - [x] 9.3 Integrate profitability section into job order detail
    - Update components/job-orders/jo-detail-view.tsx
    - Add ProfitabilitySection below existing content
    - Fetch overhead breakdown on load
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

- [x] 10. Checkpoint - Verify UI components
  - Ensure all tests pass, ask the user if questions arise.

- [x] 11. Integration and Wiring
  - [x] 11.1 Trigger overhead allocation on JO status change
    - Update job order actions to call allocateJobOverhead when JO is created or updated
    - _Requirements: 2.1_
  - [x] 11.2 Add batch recalculation UI
    - Add button in overhead settings to trigger batch recalculation
    - Show period selector (year/month)
    - Display count of jobs recalculated
    - _Requirements: 4.1, 4.2, 4.3_
  - [x] 11.3 Write property test for unique allocation constraint
    - **Property 9: Unique Allocation Constraint**
    - **Validates: Requirements 6.6**

- [x] 12. Final Checkpoint - Complete feature verification
  - All 59 tests pass (26 action tests + 33 utility tests)
  - Overhead settings page ready for end-to-end verification
  - Job order profitability display integrated into jo-detail-view

## Notes

- All tasks including property tests are required for comprehensive coverage
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- Database migrations should be applied via Supabase MCP
