# Implementation Plan: Equipment Maintenance Tracking

## Overview

This implementation plan covers the Equipment Maintenance Tracking module (v0.42) for Gama ERP. The module enables tracking of scheduled and unscheduled maintenance activities for all assets including service records, parts replacement, and maintenance costs.

## Tasks

- [x] 1. Database Schema Setup
  - [x] 1.1 Create maintenance_types table with default data
    - Create table with type_code, type_name, is_scheduled, default intervals
    - Insert 12 default maintenance types (Oil Change, KIR, etc.)
    - _Requirements: 1.1, 1.2, 1.3, 1.4_
  - [x] 1.2 Create maintenance_schedules table
    - Create table with asset_id, maintenance_type_id, trigger_type, next_due fields
    - Add indexes for asset_id and next_due_date
    - _Requirements: 2.1, 2.2, 2.3, 2.4_
  - [x] 1.3 Create maintenance_records table with auto-generated record numbers
    - Create table with all fields including costs and status
    - Create sequence and trigger for MNT-YYYY-NNNNN format
    - Add indexes for asset_id, maintenance_date, maintenance_type_id
    - _Requirements: 4.1, 4.2, 4.4, 6.1_
  - [x] 1.4 Create maintenance_parts table
    - Create table with part details and calculated total_price
    - Add foreign key to maintenance_records with CASCADE delete
    - _Requirements: 5.1, 5.4_
  - [x] 1.5 Create database views
    - Create upcoming_maintenance view with urgency status
    - Create maintenance_cost_summary view for cost reporting
    - _Requirements: 3.5, 6.5_
  - [x] 1.6 Enable RLS policies
    - Add RLS policies for all maintenance tables
    - _Requirements: Security_

- [x] 2. TypeScript Types and Utility Functions
  - [x] 2.1 Create types/maintenance.ts with all interfaces
    - Define MaintenanceType, MaintenanceSchedule, MaintenanceRecord, MaintenancePart
    - Define input types and filter types
    - _Requirements: All_
  - [x] 2.2 Create lib/maintenance-utils.ts with pure utility functions
    - Implement calculatePartsCost, calculateTotalCost
    - Implement getMaintenanceUrgency, calculateRemaining
    - Implement calculateNextDueDate, calculateNextDueKm
    - Implement validation functions
    - _Requirements: 3.3, 3.4, 5.2, 5.3, 6.2, 7.1, 7.2, 7.3_
  - [x] 2.3 Write property tests for maintenance utility functions
    - **Property 1: Maintenance Urgency Determination**
    - **Property 2: Parts Cost Calculation**
    - **Property 3: Total Cost Calculation**
    - **Property 4: Next Due Calculation After Completion**
    - **Validates: Requirements 3.3, 3.4, 5.2, 5.3, 6.2, 7.1, 7.2, 7.3**
  - [x] 2.4 Write property tests for validation functions
    - **Property 6: Schedule Input Validation**
    - **Property 7: Record Input Validation**
    - **Property 8: Record Number Format Validation**
    - **Validates: Requirements 2.1, 4.1, 4.2**

- [x] 3. Checkpoint - Database and Utils Complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Server Actions
  - [x] 4.1 Create lib/maintenance-actions.ts with server actions
    - Implement createMaintenanceRecord with parts insertion
    - Implement updateAssetOdometer when odometer provided
    - Implement updateNextMaintenanceDue after completion
    - Implement createMaintenanceSchedule
    - Implement getUpcomingMaintenance, getMaintenanceHistory
    - Implement getMaintenanceCostSummary, getDashboardStats
    - _Requirements: 4.3, 7.1, 7.2, 7.3, 8.1, 9.1_
  - [x] 4.2 Database types regenerated with maintenance tables
    - Updated lib/supabase/database.types.ts with maintenance_types, maintenance_schedules, maintenance_records, maintenance_parts tables
    - Added upcoming_maintenance and maintenance_cost_summary views
    - _Requirements: Type safety_

- [x] 5. Dashboard Components
  - [x] 5.1 Create components/maintenance/maintenance-summary-cards.tsx
    - Display overdue, due soon, in progress counts
    - Display cost MTD with currency formatting
    - _Requirements: 9.1_
  - [x] 5.2 Create components/maintenance/upcoming-maintenance-list.tsx
    - Group items by urgency (overdue, due_soon)
    - Show asset info, maintenance type, remaining days/km
    - Add quick action buttons for log completion and schedule service
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_
  - [x] 5.3 Create components/maintenance/maintenance-type-select.tsx
    - Combobox for selecting maintenance type
    - Show scheduled vs unscheduled types
    - _Requirements: 1.1, 1.3_

- [x] 6. Maintenance Record Form
  - [x] 6.1 Create components/maintenance/maintenance-parts-table.tsx
    - Editable table for adding/removing parts
    - Auto-calculate part totals and sum
    - _Requirements: 5.1, 5.2, 5.3_
  - [x] 6.2 Create components/maintenance/maintenance-record-form.tsx
    - Asset selection with search
    - Maintenance type selection
    - Date, odometer, location fields
    - Description, findings, recommendations
    - Technician selection
    - Parts table integration
    - Cost fields with auto-calculation
    - BKK linking (optional)
    - Photo upload integration
    - _Requirements: 4.1, 4.4, 4.5, 4.6, 4.7, 5.1, 6.1, 6.4, 10.1_
  - [x] 6.3 Write property test for parts cost calculation in form
    - **Property 2: Parts Cost Calculation**
    - **Validates: Requirements 5.2, 5.3**

- [x] 7. Checkpoint - Form Components Complete
  - All tests pass (32 property tests in maintenance-utils.property.test.ts)

- [x] 8. History and Cost Views
  - [x] 8.1 Create components/maintenance/maintenance-history-table.tsx
    - Filterable table with asset, type, date range filters
    - Show record number, date, type, description, cost
    - Row click to view details
    - Export to Excel button
    - _Requirements: 8.1, 8.2, 8.4_
  - [x] 8.2 Create components/maintenance/maintenance-cost-summary.tsx
    - Table showing costs by asset
    - Monthly breakdown with totals
    - _Requirements: 6.3, 6.5, 9.3_
  - [x] 8.3 Write property tests for history filtering and cost grouping
    - **Property 9: Cost Summary Grouping**
    - **Property 10: History Filtering**
    - **Validates: Requirements 6.5, 8.1**

- [x] 9. Schedule Management
  - [x] 9.1 Create components/maintenance/maintenance-schedule-form.tsx
    - Asset selection
    - Maintenance type selection
    - Trigger type selection (km, hours, days, date)
    - Interval/date input based on trigger type
    - Warning threshold configuration
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_
  - [x] 9.2 Create components/maintenance/maintenance-schedule-list.tsx
    - Table showing all schedules
    - Filter by asset, type, active status
    - Show next due date/km
    - Edit/delete actions
    - _Requirements: 9.4_
  - [x] 9.3 Write property test for active schedules filtering
    - **Property 11: Active Schedules Filtering**
    - **Validates: Requirements 9.4**

- [x] 10. Page Routes
  - [x] 10.1 Create app/(main)/equipment/maintenance/page.tsx
    - Dashboard with summary cards
    - Tabs: Upcoming, History, Costs, Schedules
    - _Requirements: 9.1, 9.2_
  - [x] 10.2 Create app/(main)/equipment/maintenance/maintenance-client.tsx
    - Client component with tab state management
    - Data fetching for each tab
    - _Requirements: 9.2_
  - [x] 10.3 Create app/(main)/equipment/maintenance/new/page.tsx
    - Log new maintenance form page
    - Handle schedule_id and asset_id query params for pre-fill
    - _Requirements: 4.1_
  - [x] 10.4 Create app/(main)/equipment/maintenance/[id]/page.tsx
    - View maintenance record details
    - Show parts used, costs, photos
    - _Requirements: 8.3_
  - [x] 10.5 Create app/(main)/equipment/maintenance/schedules/page.tsx
    - Schedule management page
    - _Requirements: 9.4_
  - [x] 10.6 Create app/(main)/equipment/maintenance/schedules/new/page.tsx
    - Create new schedule form page
    - _Requirements: 2.1_

- [x] 11. Navigation and Integration
  - [x] 11.1 Update lib/navigation.ts to add maintenance routes
    - Add /equipment/maintenance to navigation
    - _Requirements: Navigation_
  - [x] 11.2 Add maintenance link to asset detail page
    - Show maintenance history for specific asset
    - Quick action to log maintenance for asset
    - _Requirements: 8.1_
  - [x] 11.3 Create components/maintenance/index.ts barrel export
    - Export all maintenance components
    - _Requirements: Code organization_

- [x] 12. Dashboard Statistics Property Test
  - [x] 12.1 Write property test for dashboard statistics
    - **Property 5: Dashboard Statistics Calculation**
    - **Validates: Requirements 3.1, 3.2, 9.1**

- [x] 13. Final Checkpoint
  - All 50 property tests pass (32 in maintenance-utils + 18 in maintenance-validation)
  - All acceptance criteria met
  - End-to-end flow verified: create schedule → log maintenance → verify next due updated

## Notes

- All tasks are required for comprehensive implementation
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- The module integrates with existing Asset Registry (v0.41) and BKK modules
