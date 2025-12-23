# Implementation Plan: Executive Dashboard - KPI Overview

## Overview

This implementation plan covers the Executive Dashboard - KPI Overview feature (v0.61). The plan follows an incremental approach: database schema first, then utility functions with property tests, followed by React components and pages.

## Tasks

- [x] 1. Set up database schema and types
  - [x] 1.1 Create database migration for KPI tables
    - Create kpi_definitions table with all columns
    - Create kpi_targets table with period support
    - Create kpi_snapshots table for historical tracking
    - Create dashboard_layouts table for user customization
    - Add indexes for performance
    - Insert default KPI definitions
    - _Requirements: 1.1, 1.2, 1.3, 1.6, 3.1, 14.1_

  - [x] 1.2 Create TypeScript types for executive dashboard
    - Define KPICategory, CalculationType, KPIUnit, TargetType types
    - Define KPIStatus and TrendDirection types
    - Define KPIDefinition, KPITarget, KPISnapshot interfaces
    - Define KPIValue interface for computed values
    - Define DashboardWidget and DashboardLayout interfaces
    - Define TrendDataPoint and FunnelStage interfaces
    - _Requirements: 1.1, 1.2, 1.3, 10.4_

- [x] 2. Implement core utility functions
  - [x] 2.1 Implement status evaluation functions
    - Create evaluateStatus() for higher_better target type
    - Create evaluateStatus() for lower_better target type
    - Create evaluateStatus() for target_range type
    - Handle edge case of zero target value
    - _Requirements: 1.4, 1.5, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8_

  - [x] 2.2 Write property tests for status evaluation
    - **Property 1: Status Evaluation for Higher-Better KPIs**
    - **Property 2: Status Evaluation for Lower-Better KPIs**
    - **Validates: Requirements 1.4, 1.5, 4.1-4.8**

  - [x] 2.3 Implement trend analysis functions
    - Create calculateChange() for value and percentage
    - Create determineTrend() for up/down/stable
    - Handle edge case of zero previous value
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

  - [x] 2.4 Write property tests for trend analysis
    - **Property 3: Trend Direction Determination**
    - **Property 4: Change Percentage Calculation**
    - **Validates: Requirements 5.1, 5.2, 5.4, 5.5, 5.6**

  - [x] 2.5 Implement period date range functions
    - Create getDateRangeForPeriod() for MTD, QTD, YTD
    - Create getDateRangeForPeriod() for custom range
    - Create validateDateRange() function
    - _Requirements: 2.2, 11.3_

  - [x] 2.6 Write property tests for date range functions
    - **Property 5: Period Date Range Calculation**
    - **Property 6: Date Range Validation**
    - **Validates: Requirements 2.2, 11.3**

- [x] 3. Checkpoint - Core utilities complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Implement KPI calculation and filtering
  - [x] 4.1 Implement KPI definition validation
    - Create validateKPIDefinition() function
    - Validate calculation_type enum values
    - Validate unit enum values
    - Validate target_type enum values
    - _Requirements: 1.2, 1.3_

  - [x] 4.2 Write property tests for KPI validation
    - **Property 14: KPI Definition Validation**
    - **Validates: Requirements 1.2, 1.3**

  - [x] 4.3 Implement role-based KPI filtering
    - Create filterKPIsByRole() function
    - Filter KPIs based on visible_to_roles array
    - _Requirements: 13.1_

  - [x] 4.4 Write property tests for role filtering
    - **Property 7: Role-Based KPI Filtering**
    - **Validates: Requirements 13.1**

  - [x] 4.5 Implement target management functions
    - Create validateTarget() function
    - Create getTargetForPeriod() with fallback to default
    - _Requirements: 3.2, 3.3, 3.4_

  - [x] 4.6 Write property tests for target management
    - **Property 11: Target Validation**
    - **Property 12: Target Fallback to Default**
    - **Validates: Requirements 3.2, 3.4**

- [x] 5. Implement dashboard layout management
  - [x] 5.1 Implement layout widget functions
    - Create addWidget() function
    - Create removeWidget() function
    - Create validateWidgetPosition() function
    - Create validateWidgetType() function
    - _Requirements: 10.1, 10.4, 10.5_

  - [x] 5.2 Write property tests for widget management
    - **Property 8: Layout Widget Management**
    - **Validates: Requirements 10.1, 10.4, 10.5**

  - [x] 5.3 Implement layout persistence functions
    - Create saveLayout() function
    - Create getLayout() function with fallback
    - Create getDefaultLayout() function
    - _Requirements: 10.2, 10.3_

  - [x] 5.4 Write property tests for layout persistence
    - **Property 9: Layout Persistence Round-Trip**
    - **Property 10: Default Layout Fallback**
    - **Validates: Requirements 10.2, 10.3**

- [x] 6. Implement snapshot management
  - [x] 6.1 Implement snapshot functions
    - Create createSnapshot() function
    - Create getSnapshots() function
    - Enforce uniqueness constraint
    - _Requirements: 14.1, 14.2, 14.3, 14.4_

  - [x] 6.2 Write property tests for snapshots
    - **Property 13: Snapshot Uniqueness**
    - **Validates: Requirements 14.4**

- [x] 7. Checkpoint - Utility functions complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Implement server actions
  - [x] 8.1 Create KPI calculation actions
    - Create getKPIValue() action
    - Create getAllKPIsForDashboard() action
    - Create getKPITrend() action
    - _Requirements: 2.1, 2.2, 2.4, 2.5_

  - [x] 8.2 Create target management actions
    - Create setKPITarget() action
    - Create getKPITargets() action
    - _Requirements: 3.1, 3.2, 3.3_

  - [x] 8.3 Create layout management actions
    - Create saveDashboardLayout() action
    - Create getDashboardLayout() action
    - Create resetDashboardLayout() action
    - _Requirements: 10.1, 10.2, 10.3_

  - [x] 8.4 Create sales funnel action
    - Create getSalesFunnelData() action
    - _Requirements: 7.5_

- [x] 9. Implement React components
  - [x] 9.1 Create KPI Card component
    - Display current value with formatting
    - Show target progress bar
    - Show trend indicator (up/down/stable)
    - Show status color coding
    - Support different sizes
    - _Requirements: 4.1-4.8, 5.4, 5.5, 5.6_

  - [x] 9.2 Create Period Selector component
    - Support MTD, QTD, YTD options
    - Support custom date range picker
    - Validate date range
    - _Requirements: 11.1, 11.3_

  - [x] 9.3 Create Trend Chart component
    - Display 12-month line chart
    - Support multiple data series
    - Show legend
    - _Requirements: 12.1, 12.2, 12.3, 12.4_

  - [x] 9.4 Create Sales Funnel component
    - Display funnel stages
    - Show count and value per stage
    - _Requirements: 7.5_

  - [x] 9.5 Create KPI Section component
    - Group KPI cards by category
    - Display section header
    - _Requirements: 6.1-6.6, 7.1-7.4, 8.1-8.4, 9.1-9.4_

- [x] 10. Implement Executive Dashboard page
  - [x] 10.1 Create executive dashboard page
    - Route: /dashboard/executive
    - Fetch KPIs based on user role
    - Display period selector in header
    - Display export button
    - _Requirements: 11.1, 11.4, 13.1, 15.1_

  - [x] 10.2 Implement Financial KPIs section
    - Display Revenue MTD, Profit MTD, Profit Margin, AR Outstanding
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

  - [x] 10.3 Implement Sales KPIs section
    - Display Pipeline Value, Quotations MTD, Win Rate, Avg Deal Size
    - Display Sales Funnel
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [x] 10.4 Implement Operations KPIs section
    - Display Active Jobs, Completed MTD, On-Time Delivery, Equipment Util
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

  - [x] 10.5 Implement HSE KPIs section
    - Display Days Without LTI, TRIR, Near Misses, Training Compliance
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

  - [x] 10.6 Implement Trends section
    - Display 12-month revenue and profit trend chart
    - _Requirements: 12.1, 12.2, 12.3, 12.4_

- [x] 11. Implement dashboard customization
  - [x] 11.1 Create layout customization UI
    - Add customize button
    - Enable drag-drop widget repositioning
    - Save layout on change
    - _Requirements: 10.1, 10.2, 10.5_

  - [x] 11.2 Implement export functionality
    - Create export button
    - Generate structured export data
    - _Requirements: 15.1, 15.2, 15.3_

- [x] 12. Final checkpoint
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- All property-based tests are required for comprehensive coverage
- Each task references specific requirements for traceability
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- The dashboard uses existing shadcn/ui components where possible
