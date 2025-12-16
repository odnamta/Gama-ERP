# Implementation Plan

## Phase 2A: Revenue Reports

- [x] 1. Implement Revenue by Customer Report
  - [x] 1.1 Create revenue-customer-utils.ts with aggregation functions
    - Implement `aggregateRevenueByCustomer()` to sum JO revenue per customer
    - Implement `calculatePercentageOfTotal()` for distribution
    - Implement `sortByRevenueDescending()` for default sorting
    - Implement `filterZeroRevenue()` to exclude zero-revenue customers
    - _Requirements: 1.1, 1.2, 1.3, 1.4_
  - [x] 1.2 Write property tests for revenue customer utils
    - **Property 1: Revenue aggregation per customer**
    - **Property 5: Percentage calculations sum to 100**
    - **Property 6: Sorting by amount descending**
    - **Property 7: Zero-value filtering**
    - **Validates: Requirements 1.1, 1.2, 1.3, 1.4**
  - [x] 1.3 Create Revenue by Customer report page
    - Create `/app/(main)/reports/revenue-by-customer/page.tsx`
    - Integrate ReportFilters, ReportTable, ReportSummary components
    - Add customer name click navigation to customer detail
    - _Requirements: 1.1, 1.2, 1.5_

- [x] 2. Implement Revenue by Project Report
  - [x] 2.1 Create revenue-project-utils.ts with aggregation and margin functions
    - Implement `aggregateRevenueByProject()` to sum JO revenue/cost per project
    - Implement `calculateProfitMargin()` with zero-revenue handling
    - _Requirements: 2.1, 2.2, 2.3, 2.4_
  - [x] 2.2 Write property tests for revenue project utils
    - **Property 2: Revenue aggregation per project**
    - **Property 3: Profit margin calculation**
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.4**
  - [x] 2.3 Create Revenue by Project report page
    - Create `/app/(main)/reports/revenue-by-project/page.tsx`
    - Display project name, customer, revenue, cost, margin
    - Add project name click navigation
    - _Requirements: 2.1, 2.2, 2.5_

- [x] 3. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Phase 2B: Operational Reports

- [x] 4. Implement Cost Analysis Report
  - [x] 4.1 Create cost-analysis-utils.ts with category aggregation
    - Implement `aggregateCostsByCategory()` to sum costs per category
    - Implement `calculateAveragePerJO()` for category averages
    - Implement `calculatePeriodComparison()` for period-over-period change
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_
  - [x] 4.2 Write property tests for cost analysis utils
    - **Property 4: Cost aggregation per category**
    - **Property 5: Percentage calculations sum to 100**
    - **Property 6: Sorting by amount descending**
    - **Property 7: Zero-value filtering**
    - **Property 21: Period comparison calculation**
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**
  - [x] 4.3 Create Cost Analysis report page
    - Create `/app/(main)/reports/cost-analysis/page.tsx`
    - Display category breakdown with comparison toggle
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [ ] 5. Implement JO Summary Report
  - [x] 5.1 Create jo-summary-utils.ts with summary functions
    - Implement `getJOSummaryData()` to fetch and transform JO data
    - Implement `calculateSummaryTotals()` for aggregates
    - Implement `filterByStatus()` for status filtering
    - _Requirements: 4.1, 4.2, 4.3, 4.4_
  - [x] 5.2 Write property tests for JO summary utils
    - **Property 8: JO summary aggregation**
    - **Property 9: JO status filtering**
    - **Validates: Requirements 4.1, 4.2, 4.3, 4.4**
  - [x] 5.3 Create JO Summary report page
    - Create `/app/(main)/reports/jo-summary/page.tsx`
    - Add status filter dropdown
    - Add JO number click navigation
    - _Requirements: 4.1, 4.2, 4.3, 4.5_

- [ ] 6. Implement On-Time Delivery Report
  - [x] 6.1 Create on-time-delivery-utils.ts with delivery metrics
    - Implement `classifyDelivery()` to determine on-time vs late
    - Implement `calculateDelayDays()` for late deliveries
    - Implement `calculateOnTimeMetrics()` for summary stats
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_
  - [x] 6.2 Write property tests for on-time delivery utils
    - **Property 10: On-time delivery classification**
    - **Property 11: On-time percentage calculation**
    - **Validates: Requirements 5.2, 5.3, 5.4**
  - [x] 6.3 Create On-Time Delivery report page
    - Create `/app/(main)/reports/on-time-delivery/page.tsx`
    - Display metrics summary and detail table
    - _Requirements: 5.1, 5.2_

- [x] 7. Implement Vendor Performance Report
  - [x] 7.1 Create vendor-performance-utils.ts with vendor aggregation
    - Implement `aggregateVendorData()` to sum spend per vendor
    - Implement `calculateVendorOnTimeRate()` with null handling
    - Implement `sortVendors()` for multi-column sorting
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_
  - [x] 7.2 Write property tests for vendor performance utils
    - **Property 12: Vendor performance aggregation**
    - **Property 13: Vendor on-time rate calculation**
    - **Validates: Requirements 6.1, 6.2, 6.3, 6.4**
  - [x] 7.3 Create Vendor Performance report page
    - Create `/app/(main)/reports/vendor-performance/page.tsx`
    - Add sortable columns
    - _Requirements: 6.1, 6.2, 6.5_

- [x] 8. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Phase 2C: Finance Reports

- [x] 9. Implement Customer Payment History Report
  - [x] 9.1 Create payment-history-utils.ts with payment aggregation
    - Implement `aggregatePaymentsByCustomer()` for customer totals
    - Implement `calculateAverageDaysToPay()` with null handling
    - Implement `identifySlowPayers()` for 45-day threshold
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_
  - [x] 9.2 Write property tests for payment history utils
    - **Property 14: Customer payment aggregation**
    - **Property 15: Average days to pay calculation**
    - **Property 16: Slow payer threshold**
    - **Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5**
  - [x] 9.3 Create Customer Payment History report page
    - Create `/app/(main)/reports/customer-payment-history/page.tsx`
    - Highlight slow payers with warning indicator
    - _Requirements: 7.1, 7.2, 7.5_

- [x] 10. Implement Outstanding Invoices Report
  - [x] 10.1 Create outstanding-invoices-utils.ts with invoice functions
    - Implement `getOutstandingInvoices()` to fetch unpaid invoices
    - Implement `calculateDaysOutstanding()` for aging
    - Implement `groupByAgingBucket()` for bucket breakdown
    - Implement `filterByCustomer()` for customer filtering
    - _Requirements: 8.1, 8.2, 8.3, 8.4_
  - [x] 10.2 Write property tests for outstanding invoices utils
    - **Property 17: Outstanding invoices listing**
    - **Property 18: Outstanding invoices customer filtering**
    - **Validates: Requirements 8.1, 8.2, 8.4**
  - [x] 10.3 Create Outstanding Invoices report page
    - Create `/app/(main)/reports/outstanding-invoices/page.tsx`
    - Add customer filter dropdown
    - Add invoice number click navigation
    - _Requirements: 8.1, 8.2, 8.4, 8.5_

- [x] 11. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Phase 2D: Sales Reports

- [x] 12. Implement Sales Pipeline Report
  - [x] 12.1 Create sales-pipeline-utils.ts with pipeline functions
    - Implement `groupPJOsByStatus()` for status grouping
    - Implement `calculateWeightedValue()` with stage probabilities
    - Implement `calculatePipelineTrend()` for period comparison
    - Define STAGE_PROBABILITIES constant
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_
  - [x] 12.2 Write property tests for sales pipeline utils
    - **Property 19: Sales pipeline grouping**
    - **Property 20: Weighted pipeline value calculation**
    - **Property 21: Period comparison calculation**
    - **Validates: Requirements 9.1, 9.2, 9.3, 9.4, 9.5**
  - [x] 12.3 Create Sales Pipeline report page
    - Create `/app/(main)/reports/sales-pipeline/page.tsx`
    - Display pipeline summary with weighted values
    - _Requirements: 9.1, 9.2, 9.3, 9.5_

- [x] 13. Implement Customer Acquisition Report
  - [x] 13.1 Create customer-acquisition-utils.ts with acquisition functions
    - Implement `getNewCustomers()` to filter by creation date
    - Implement `calculateAcquisitionMetrics()` for summary stats
    - Implement `calculateAcquisitionTrend()` for period comparison
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_
  - [x] 13.2 Write property tests for customer acquisition utils
    - **Property 22: Customer acquisition filtering**
    - **Property 21: Period comparison calculation**
    - **Validates: Requirements 10.1, 10.4**
  - [x] 13.3 Create Customer Acquisition report page
    - Create `/app/(main)/reports/customer-acquisition/page.tsx`
    - Display new customers with first project info
    - _Requirements: 10.1, 10.2, 10.5_

- [x] 14. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Phase 2E: Export & Charts

- [-] 15. Implement Export Functionality
  - [x] 15.1 Install export dependencies
    - Install @react-pdf/renderer for PDF generation
    - Install xlsx for Excel generation
    - _Requirements: 11.1_
  - [x] 15.2 Create export-utils.ts with export functions
    - Implement `generatePDFReport()` with metadata
    - Implement `generateExcelReport()` with metadata
    - Implement `formatExportData()` for data transformation
    - _Requirements: 11.2, 11.3, 11.4_
  - [x] 15.3 Write property tests for export utils
    - **Property 23: Export file metadata**
    - **Validates: Requirements 11.2, 11.3, 11.4**
  - [x] 15.4 Create ExportButtons component
    - Create `/components/reports/export/ExportButtons.tsx`
    - Add PDF and Excel download buttons
    - Handle export errors with retry
    - _Requirements: 11.1, 11.5_
  - [ ] 15.5 Integrate export buttons into all report pages
    - Add ExportButtons to all 10 new report pages
    - _Requirements: 11.1_

- [-] 16. Implement Chart Components
  - [x] 16.1 Install Recharts library
    - Install recharts package
    - _Requirements: 12.1_
  - [x] 16.2 Create chart components
    - Create `/components/reports/charts/PieChart.tsx` for revenue distribution
    - Create `/components/reports/charts/BarChart.tsx` for cost categories
    - Create `/components/reports/charts/FunnelChart.tsx` for pipeline
    - Create `/components/reports/charts/LineChart.tsx` for trends
    - Add tooltip support for all charts
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_
  - [x] 16.3 Integrate charts into report pages
    - Add PieChart to Revenue by Customer page
    - Add BarChart to Cost Analysis page
    - Add FunnelChart to Sales Pipeline page
    - Add LineChart to trend sections
    - _Requirements: 12.1, 12.2, 12.3, 12.4_

- [x] 17. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Phase 2F: Permissions & Integration

- [-] 18. Update Report Permissions
  - [x] 18.1 Update report-permissions.ts for Phase 2 reports
    - Add Phase 2 report configurations to REPORTS array
    - Define role access: finance (payment, outstanding), ops (jo, delivery, vendor, cost), sales (revenue-customer, pipeline, acquisition)
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5_
  - [x] 18.2 Write property tests for Phase 2 permissions
    - **Property 24: Role-based report access (Phase 2)**
    - **Validates: Requirements 13.1, 13.2, 13.3, 13.4, 13.5**
  - [x] 18.3 Update Report Index page
    - Add Phase 2 report cards to `/app/(main)/reports/page.tsx`
    - Group new reports under appropriate categories
    - _Requirements: 13.1_

- [x] 19. Update types/reports.ts
  - Add all Phase 2 TypeScript interfaces
  - Export new types for use across components
  - _Requirements: All_

- [x] 20. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
