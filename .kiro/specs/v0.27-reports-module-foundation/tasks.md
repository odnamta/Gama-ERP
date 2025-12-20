# Implementation Plan: Reports Module Foundation (v0.27)

## Overview

This implementation plan enhances the existing Reports Module with database-driven configuration, execution logging, and improved report management. The implementation builds upon the existing report infrastructure while adding centralized configuration storage and audit trails.

## Tasks

- [x] 1. Create database schema and seed data
  - [x] 1.1 Create report_configurations table migration
    - Create table with id, report_code, report_name, description, report_category, default_filters, columns, allowed_roles, is_active, display_order, href, icon, created_at, updated_at
    - Add unique constraint on report_code
    - Enable RLS with policy for authenticated users to read active reports
    - _Requirements: 1.1, 1.2, 1.3, 1.5_

  - [x] 1.2 Create report_executions table migration
    - Create table with id, report_code, parameters, executed_by, executed_at, export_format, export_url
    - Add indexes on report_code, executed_by, and executed_at
    - Enable RLS with policies for users to view own executions and insert own executions
    - _Requirements: 2.1, 2.4_

  - [x] 1.3 Seed default report configurations
    - Insert operations reports (job_summary, budget_variance, on_time_delivery, vendor_performance)
    - Insert finance reports (profit_loss, ar_aging, outstanding_invoices, cost_analysis, revenue_customer, revenue_project, payment_history)
    - Insert sales reports (pipeline, quotation_conversion, customer_acquisition)
    - Insert executive reports (kpi_dashboard)
    - _Requirements: 1.4_

- [x] 2. Create TypeScript types and utility functions
  - [x] 2.1 Extend types/reports.ts with new interfaces
    - Add ReportCategoryDB type
    - Add ReportConfigurationDB interface
    - Add ReportColumnConfig interface
    - Add ReportExecution interface
    - Add RecentReport interface
    - _Requirements: 1.1, 2.1_

  - [x] 2.2 Create lib/reports/report-config-utils.ts
    - Implement getReportConfigurations(role) function
    - Implement getReportByCode(code) function
    - Implement canAccessReportDB(role, reportCode) function
    - Implement getReportsByCategoryDB(role) function
    - Implement filterReportsBySearch(reports, query) function
    - _Requirements: 3.1, 3.4, 4.1_

  - [x] 2.3 Write property test for report search filtering
    - **Property 7: Report search filtering**
    - **Validates: Requirements 3.4**

  - [x] 2.4 Write property test for role-based visibility
    - **Property 2: Role-based report visibility**
    - **Validates: Requirements 3.1, 4.1**

- [x] 3. Create report execution logging service
  - [x] 3.1 Create lib/reports/report-execution-service.ts
    - Implement logReportExecution(reportCode, userId, parameters, exportFormat) function
    - Implement getRecentReports(userId, limit) function
    - Implement validateExportFormat(format) function
    - _Requirements: 2.2, 2.3, 3.5_

  - [x] 3.2 Write property test for export format validation
    - **Property 6: Export format validation**
    - **Validates: Requirements 2.3**

  - [x] 3.3 Write property test for execution logging
    - **Property 5: Report execution logging**
    - **Validates: Requirements 2.2**

- [x] 4. Checkpoint - Verify database and utilities
  - Ensure all migrations applied successfully
  - Ensure all tests pass, ask the user if questions arise

- [x] 5. Enhance AR Aging report utilities
  - [x] 5.1 Update lib/reports/ar-aging-utils.ts
    - Ensure calculateDaysOverdue handles as-of date parameter
    - Ensure assignAgingBucket covers all bucket ranges correctly
    - Add aggregateByCustomer function for customer-level grouping
    - Add validateAgingFilters function
    - _Requirements: 5.1, 5.2, 5.4, 5.6, 5.7, 5.8_

  - [x] 5.2 Write property test for aging bucket assignment
    - **Property 9: Aging bucket assignment**
    - **Validates: Requirements 5.2**

  - [x] 5.3 Write property test for days outstanding calculation
    - **Property 10: Days outstanding calculation**
    - **Validates: Requirements 5.7**

  - [x] 5.4 Write property test for AR aging summary consistency
    - **Property 11: AR aging summary consistency**
    - **Validates: Requirements 5.3**

  - [x] 5.5 Write property test for customer aging aggregation
    - **Property 12: Customer aging aggregation**
    - **Validates: Requirements 5.4**

  - [x] 5.6 Write property test for AR aging invoice filter
    - **Property 13: AR aging invoice filter**
    - **Validates: Requirements 5.8**

- [x] 6. Create Job Profitability report utilities
  - [x] 6.1 Create lib/reports/profitability-utils.ts
    - Implement calculateNetProfit(revenue, directCost, overhead) function
    - Implement calculateNetMargin(netProfit, revenue) function
    - Implement filterJobsByDateRange(jobs, dateFrom, dateTo) function
    - Implement filterJobsByCustomer(jobs, customerId) function
    - Implement filterJobsByMarginRange(jobs, minMargin, maxMargin) function
    - Implement calculateProfitabilitySummary(jobs) function
    - Implement sortJobsByMargin(jobs) function
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8_

  - [x] 6.2 Write property test for net profit calculation
    - **Property 15: Net profit calculation**
    - **Validates: Requirements 6.2**

  - [x] 6.3 Write property test for net margin calculation
    - **Property 16: Net margin calculation**
    - **Validates: Requirements 6.3**

  - [x] 6.4 Write property test for date range filter
    - **Property 17: Date range filter correctness**
    - **Validates: Requirements 6.4**

  - [x] 6.5 Write property test for margin range filter
    - **Property 18: Margin range filter correctness**
    - **Validates: Requirements 6.6**

  - [x] 6.6 Write property test for profitability summary consistency
    - **Property 19: Profitability summary consistency**
    - **Validates: Requirements 6.7**

  - [x] 6.7 Write property test for profitability default sort order
    - **Property 20: Profitability default sort order**
    - **Validates: Requirements 6.8**

- [x] 7. Checkpoint - Verify utility functions
  - Ensure all tests pass, ask the user if questions arise

- [x] 8. Create Reports Hub UI components
  - [x] 8.1 Create components/reports/ReportSearchInput.tsx
    - Implement search input with debounced onChange
    - Add clear button when search has value
    - Style with shadcn/ui Input component
    - _Requirements: 3.4_

  - [x] 8.2 Create components/reports/RecentReportsBar.tsx
    - Display up to 5 recently run reports as clickable chips
    - Fetch recent reports from report_executions
    - Show empty state when no recent reports
    - _Requirements: 3.5_

  - [x] 8.3 Update app/(main)/reports/page.tsx
    - Add ReportSearchInput component
    - Add RecentReportsBar component
    - Integrate with database-driven report configurations
    - Filter reports by search query
    - Group reports by category with correct ordering
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

  - [x] 8.4 Write property test for report category ordering
    - **Property 8: Report category ordering**
    - **Validates: Requirements 3.6**

- [x] 9. Implement role-based access control
  - [x] 9.1 Update lib/reports/report-permissions.ts
    - Add function to check access using database configurations
    - Maintain backward compatibility with existing REPORTS array
    - Add helper functions for category-specific role validation
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8_

  - [x] 9.2 Write property test for admin roles full access
    - **Property 3: Admin roles full access**
    - **Validates: Requirements 4.2, 4.3, 4.4**

  - [x] 9.3 Write property test for category-specific role restrictions
    - **Property 4: Category-specific role restrictions**
    - **Validates: Requirements 4.5, 4.6, 4.7**

- [x] 10. Implement report execution logging in report pages
  - [x] 10.1 Update app/(main)/reports/ar-aging/page.tsx
    - Add execution logging on report load
    - Add execution logging on export
    - _Requirements: 2.2, 7.4_

  - [x] 10.2 Update app/(main)/reports/profit-loss/page.tsx
    - Add execution logging on report load
    - Add execution logging on export
    - _Requirements: 2.2, 7.4_

  - [ ] 10.3 Write property test for export logging
    - **Property 21: Export logging**
    - **Validates: Requirements 7.4**

- [x] 11. Checkpoint - Verify UI and logging
  - Ensure all tests pass, ask the user if questions arise

- [x] 12. Create Job Profitability report page
  - [x] 12.1 Create app/(main)/reports/job-profitability/page.tsx
    - Implement filters section (date range, customer, margin range)
    - Implement summary cards (total jobs, revenue, cost, overhead, profit, avg margin)
    - Implement jobs table with all required columns
    - Add sorting by net margin descending
    - Add execution logging
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8_

  - [x] 12.2 Add job profitability report to configurations
    - Add report configuration to seed data
    - Update report-permissions.ts with new report
    - _Requirements: 1.4_

- [ ] 13. Implement export functionality enhancements
  - [ ] 13.1 Update lib/reports/export-utils.ts
    - Ensure PDF export includes report title, filters, timestamp
    - Ensure Excel export includes report title, filters, timestamp
    - Add export logging integration
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

  - [ ] 13.2 Add export buttons to AR Aging report
    - Add Export PDF button
    - Add Export Excel button
    - Wire up to export utilities with logging
    - _Requirements: 7.1, 7.2_

  - [ ] 13.3 Add export buttons to Job Profitability report
    - Add Export PDF button
    - Add Export Excel button
    - Wire up to export utilities with logging
    - _Requirements: 7.1, 7.2_

- [x] 14. Update navigation
  - [x] 14.1 Verify Reports menu item in sidebar
    - Ensure Reports link exists in main navigation
    - Ensure link navigates to /reports
    - Ensure visible to all authenticated users
    - _Requirements: 8.1, 8.2, 8.3_

- [x] 15. Final checkpoint - Full integration testing
  - All 90 v0.27 tests pass
  - Reports accessible by appropriate roles
  - Execution logging implemented
  - Job Profitability report created
  - Ask the user if questions arise

## Notes

- All tasks are required for comprehensive testing
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- The implementation builds on existing report infrastructure in `lib/reports/` and `components/reports/`
