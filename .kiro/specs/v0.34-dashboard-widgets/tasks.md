# Implementation Plan: Dashboard Widgets & Customization

## Overview

This implementation plan creates a reusable widget system for composable, customizable dashboards. The approach starts with database schema and types, then builds utility functions, followed by widget components, and finally integrates into the dashboard pages.

## Tasks

- [x] 1. Database Schema and Migrations
  - [x] 1.1 Create dashboard_widgets table with widget definitions
    - Create migration with widget_code, widget_name, widget_type, data_source, dimensions, allowed_roles
    - Add CHECK constraint for valid widget_type values
    - Add CHECK constraints for width (1-4) and height (1-3)
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_
  - [x] 1.2 Create user_widget_configs table
    - Create migration with user_id, widget_id, position, size, settings, is_visible
    - Add foreign key to user_profiles and dashboard_widgets
    - Add unique constraint on (user_id, widget_id)
    - _Requirements: 4.1_
  - [x] 1.3 Create default_widget_layouts table
    - Create migration with role, widget_id, position, size
    - Add unique constraint on (role, widget_id)
    - _Requirements: 3.1, 3.2_
  - [x] 1.4 Insert default widget definitions
    - Insert all 23 widgets from the catalog (finance, sales, engineering, ops, HR, executive)
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_
  - [x] 1.5 Insert default layouts for each role
    - Insert finance role default layout
    - Insert sales role default layout
    - Insert ops role default layout
    - Insert manager role default layout
    - Insert owner/admin role default layout
    - _Requirements: 3.1, 3.2_

- [x] 2. TypeScript Types and Interfaces
  - [x] 2.1 Create widget type definitions
    - Create types/widgets.ts with WidgetType, Widget, WidgetConfig, GridPosition interfaces
    - Add data structure interfaces for each widget type (StatCardData, ChartData, ListData, TableData, ProgressData)
    - _Requirements: 1.2, 1.3_
  - [x] 2.2 Write property test for widget type validation
    - **Property 1: Widget Definition Validity**
    - **Validates: Requirements 1.1, 1.3, 1.4**

- [x] 3. Widget Utility Functions
  - [x] 3.1 Create widget-utils.ts with core functions
    - Implement filterWidgetsByRole function
    - Implement calculateGridPositions function
    - Implement validateWidgetConfig function
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 7.4_
  - [x] 3.2 Write property test for role-based filtering
    - **Property 2: Role-Based Widget Filtering**
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.4**
  - [x] 3.3 Write property test for grid dimension constraints
    - **Property 9: Grid Dimension Constraints**
    - **Validates: Requirements 7.4**
  - [x] 3.4 Implement getUserWidgets function
    - Check for user-specific configs first
    - Fall back to default layout for role
    - Order by position_y then position_x
    - _Requirements: 3.1, 3.3, 4.2_
  - [x] 3.5 Write property test for default layout fallback
    - **Property 3: Default Layout Fallback**
    - **Validates: Requirements 3.1, 3.2, 3.3**
  - [x] 3.6 Implement saveWidgetLayout function
    - Delete existing user configs
    - Insert new configs atomically
    - _Requirements: 4.1, 4.3_
  - [x] 3.7 Write property test for configuration round-trip
    - **Property 5: Configuration Persistence Round-Trip**
    - **Validates: Requirements 4.3**
  - [x] 3.8 Implement resetWidgetLayout function
    - Delete all user configs for user
    - _Requirements: 4.5_
  - [x] 3.9 Write property test for layout reset
    - **Property 6: Layout Reset Restores Defaults**
    - **Validates: Requirements 4.5**

- [x] 4. Checkpoint - Core utilities complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Widget Data Fetchers
  - [x] 5.1 Create widget-data-fetchers.ts
    - Implement fetchWidgetData dispatcher function
    - Map widget_code to data fetcher functions
    - _Requirements: 6.1_
  - [x] 5.2 Implement finance widget data fetchers
    - getCashPosition, getARSummary, getAPSummary, getARAging, getRevenueTrend, getPendingBKK
    - _Requirements: 8.1_
  - [x] 5.3 Implement sales widget data fetchers
    - getPipelineSummary, getPipelineFunnel, getActiveQuotations, getWinRate
    - _Requirements: 8.2_
  - [x] 5.4 Implement engineering widget data fetchers
    - getEngWorkload, getPendingAssessments
    - _Requirements: 8.3_
  - [x] 5.5 Implement operations widget data fetchers
    - getActiveJobsCount, getOpsJobList, getDeliverySchedule, getCostSummary, getPendingOpsActions
    - _Requirements: 8.4_
  - [x] 5.6 Implement HR widget data fetchers
    - getAttendanceSummary, getPendingLeave, getSkillsGap
    - _Requirements: 8.5_
  - [x] 5.7 Implement executive widget data fetchers
    - getCompanyHealth, getDeptScores, getKPISummary
    - _Requirements: 8.6_
  - [x] 5.8 Write property test for data source invocation
    - **Property 8: Data Source Invocation**
    - **Validates: Requirements 6.1, 6.5**

- [x] 6. Widget Type Components
  - [x] 6.1 Create StatCardWidget component
    - Display value, label, optional trend indicator
    - Support color variants (default, success, warning, danger)
    - _Requirements: 5.1_
  - [x] 6.2 Create ChartWidget component
    - Support bar, line, pie, funnel chart types
    - Use existing chart library or simple SVG implementation
    - _Requirements: 5.2_
  - [x] 6.3 Create ListWidget component
    - Scrollable list with items
    - Support action links and status badges
    - _Requirements: 5.3_
  - [x] 6.4 Create TableWidget component
    - Tabular data display
    - Sortable columns
    - _Requirements: 5.4_
  - [x] 6.5 Create ProgressWidget component
    - Progress bar or gauge display
    - Support segmented progress
    - _Requirements: 5.5_
  - [x] 6.6 Create CalendarWidget component
    - Date-based event display
    - _Requirements: 5.6_
  - [x] 6.7 Write property test for widget type renderer selection
    - **Property 7: Widget Type Renderer Selection**
    - **Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5, 5.6**

- [x] 7. Widget Renderer and Grid
  - [x] 7.1 Create WidgetRenderer component
    - Dispatch to correct widget type component
    - Handle loading and error states
    - Support refresh functionality
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 6.2, 6.3_
  - [x] 7.2 Create WidgetGrid component
    - 4-column responsive grid layout
    - Support widget spanning (1-4 columns, 1-3 rows)
    - Collapse to 2 columns on tablet, 1 on mobile
    - _Requirements: 7.1, 7.2, 7.3, 7.4_
  - [x] 7.3 Create useWidgetData hook
    - Fetch widget data on mount
    - Handle loading and error states
    - Support manual refresh
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_
  - [x] 7.4 Write property test for user configuration precedence
    - **Property 4: User Configuration Precedence**
    - **Validates: Requirements 4.1, 4.2, 4.4**

- [x] 8. Checkpoint - Widget components complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Dashboard Integration
  - [x] 9.1 Create WidgetDashboard component
    - Load user widgets on mount
    - Render WidgetGrid with configs
    - _Requirements: 2.1, 3.1, 4.2_
  - [x] 9.2 Add widget customization UI
    - Toggle edit mode
    - Drag-and-drop widget repositioning (optional)
    - Widget visibility toggles
    - Save/reset layout buttons
    - _Requirements: 4.1, 4.3, 4.4, 4.5_
  - [x] 9.3 Integrate with existing dashboard pages
    - Update finance dashboard to use widget system
    - Update sales dashboard to use widget system
    - Update ops dashboard to use widget system
    - Update owner dashboard to use widget system
    - _Requirements: 2.1, 3.1_

- [x] 10. Final Checkpoint
  - Ensure all tests pass, ask the user if questions arise.
  - Verify all widget types render correctly
  - Verify role-based filtering works
  - Verify user customization persists

## Notes

- All tasks including property-based tests are required for comprehensive coverage
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- The widget system is designed to be extensible - new widgets can be added via database inserts
