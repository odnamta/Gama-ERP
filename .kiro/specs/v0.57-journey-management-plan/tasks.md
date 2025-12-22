# Implementation Plan: Journey Management Plan (JMP)

## Overview

This implementation plan covers the JMP module for heavy-haul journey planning and execution tracking. The implementation follows a bottom-up approach: database schema → types → utilities → actions → components → pages.

## Tasks

- [x] 1. Set up database schema
  - [x] 1.1 Create journey_management_plans table with all fields and auto-number trigger
    - Create table with JSONB fields for convoy config, drivers, contacts, permits
    - Create sequence and trigger for JMP-YYYY-NNNN format
    - Add indexes for survey, job order, and status
    - _Requirements: 1.1-1.15_
  - [x] 1.2 Create jmp_checkpoints table
    - Create table with location, schedule, and status fields
    - Add cascade delete on jmp_id
    - Add index on jmp_id
    - _Requirements: 2.1-2.10_
  - [x] 1.3 Create jmp_risk_assessment table
    - Create table with risk category, likelihood, consequence, and controls
    - Add cascade delete on jmp_id
    - _Requirements: 3.1-3.9_
  - [x] 1.4 Create active_journeys view
    - Create view joining JMP with customer, job order, employee
    - Include checkpoint progress calculation
    - _Requirements: 15.1-15.3_

- [x] 2. Create TypeScript types
  - [x] 2.1 Create types/jmp.ts with all interfaces
    - Define enums: JmpStatus, CheckpointLocationType, CheckpointStatus, RiskCategory, Likelihood, Consequence, RiskLevel
    - Define JSONB interfaces: MovementWindow, ConvoyConfiguration, DriverAssignment, etc.
    - Define main interfaces: JourneyManagementPlan, JmpCheckpoint, JmpRiskAssessment
    - Define form data and row types
    - _Requirements: 1.1-3.9_

- [x] 3. Implement utility functions
  - [x] 3.1 Create lib/jmp-utils.ts with core utilities
    - Implement calculateRiskLevel with 5x5 matrix
    - Implement validateJmpForm and validateCheckpoint
    - Implement isPermitValid and getPermitStatus
    - Implement calculateJourneyProgress and isOnSchedule
    - Implement calculateTimeVariance
    - Implement sortCheckpointsByDistance and validateCheckpointSequence
    - Implement mapRowToJmp and mapJmpToRow
    - Implement formatJmpStatus, getJmpStatusColor, formatRiskLevel, getRiskLevelColor
    - _Requirements: 7.3, 7.6, 7.7, 7.8, 8.4, 10.2, 10.3, 13.5, 15.4_
  - [x] 3.2 Write property tests for risk level calculation
    - **Property 8: Risk Level Matrix Calculation**
    - **Validates: Requirements 8.4**
  - [x] 3.3 Write property tests for permit validity
    - **Property 9: Permit Validity Determination**
    - **Validates: Requirements 10.2, 10.3**
  - [x] 3.4 Write property tests for checkpoint utilities
    - **Property 5: Stop Duration Calculation**
    - **Property 6: Checkpoint Ordering by Distance**
    - **Property 7: Checkpoint Sequence Validation**
    - **Validates: Requirements 7.3, 7.6, 7.7, 7.8**
  - [x] 3.5 Write property tests for time variance and schedule
    - **Property 13: Time Variance Calculation**
    - **Property 14: Schedule Comparison**
    - **Validates: Requirements 13.5, 15.4**

- [x] 4. Checkpoint - Ensure all utility tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Implement server actions
  - [x] 5.1 Create lib/jmp-actions.ts with CRUD operations
    - Implement createJmp with auto-number generation
    - Implement updateJmp and deleteJmp
    - Implement createJmpFromSurvey with data pre-population
    - Implement getJmpById, getJmpList, getActiveJourneys, getJmpStatusCounts
    - _Requirements: 4.1-4.10, 14.1-14.6_
  - [x] 5.2 Implement approval workflow actions
    - Implement submitJmpForReview with status change and prepared_by recording
    - Implement approveJmp with commander validation and approval recording
    - Implement rejectJmp returning to draft
    - _Requirements: 6.4, 11.1-11.6_
  - [x] 5.3 Implement journey execution actions
    - Implement startJourney with status change and actual_departure recording
    - Implement completeJourney with incident summary validation
    - Implement cancelJourney
    - _Requirements: 12.1, 12.5, 12.6, 13.1-13.5_
  - [x] 5.4 Implement checkpoint actions
    - Implement addCheckpoint, updateCheckpoint, deleteCheckpoint
    - Implement markCheckpointArrival and markCheckpointDeparture
    - _Requirements: 7.1-7.8, 12.2-12.4_
  - [x] 5.5 Implement risk assessment actions
    - Implement addRisk with auto risk level calculation
    - Implement updateRisk and deleteRisk
    - _Requirements: 8.1-8.7_
  - [x] 5.6 Write property tests for JMP creation
    - **Property 1: JMP Number Format Validation**
    - **Property 2: Survey Data Pre-population**
    - **Property 3: Initial Status is Draft**
    - **Validates: Requirements 1.1, 4.1, 4.2, 4.9**
  - [x] 5.7 Write property tests for approval workflow
    - **Property 4: Convoy Commander Required for Approval**
    - **Property 10: Status Transition Validity**
    - **Validates: Requirements 6.4, 11.1, 11.6, 12.1, 12.5**
  - [x] 5.8 Write property tests for checkpoint tracking
    - **Property 11: Checkpoint Tracking Updates**
    - **Validates: Requirements 12.2, 12.3**
  - [x] 5.9 Write property tests for journey completion
    - **Property 12: Incident Summary Conditional Requirement**
    - **Validates: Requirements 13.3**

- [x] 6. Checkpoint - Ensure all action tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Create list and status components
  - [x] 7.1 Create components/jmp/jmp-status-cards.tsx
    - Display counts for draft, pending_review, approved, active, completed
    - Use color-coded badges
    - _Requirements: 14.6_
  - [x] 7.2 Create components/jmp/jmp-list.tsx
    - Display JMP number, title, customer, status, planned dates
    - Implement status, date range, customer filters
    - Implement search by JMP number or title
    - _Requirements: 14.1-14.6_

- [x] 8. Create JMP form components
  - [x] 8.1 Create components/jmp/jmp-form.tsx
    - Form for journey title, description, cargo details
    - Route survey selector with data pre-population
    - Job order and project selectors
    - Origin/destination inputs
    - Schedule inputs (departure, arrival, duration)
    - _Requirements: 4.1-4.10_
  - [x] 8.2 Create components/jmp/convoy-config-form.tsx
    - Lead vehicle configuration
    - Cargo transport configuration
    - Escort vehicles configuration
    - Chase vehicle configuration
    - Support vehicles list
    - _Requirements: 5.1-5.5_
  - [x] 8.4 Create components/jmp/team-assignment-form.tsx
    - Convoy commander selector from employees
    - Drivers list with vehicle, role, phone
    - Escort details form
    - _Requirements: 6.1-6.4_

- [x] 9. Create checkpoint components
  - [x] 9.1 Create components/jmp/checkpoint-form.tsx
    - Dialog for adding/editing checkpoints
    - Location name, type, km from start, coordinates
    - Planned arrival/departure times
    - Activities and reporting requirements
    - _Requirements: 7.1-7.5_
  - [x] 9.2 Create components/jmp/checkpoint-table.tsx
    - Table showing all checkpoints in order
    - Columns: KM, Location, Arrive, Depart, Stop, Activity
    - Edit and delete actions
    - _Requirements: 7.1-7.8_
  - [x] 9.3 Create components/jmp/checkpoint-tracker.tsx
    - Real-time checkpoint status during execution
    - Mark arrival/departure buttons
    - Actual times display
    - Progress indicator
    - _Requirements: 12.2-12.4_

- [x] 10. Create risk assessment components
  - [x] 10.1 Create components/jmp/risk-form.tsx
    - Dialog for adding/editing risks
    - Category selector
    - Likelihood and consequence selectors
    - Auto-calculated risk level display
    - Control measures text area
    - _Requirements: 8.1-8.7_
  - [x] 10.2 Create components/jmp/risk-assessment-table.tsx
    - Table showing all risks
    - Color-coded risk level badges
    - Highlight high/extreme risks
    - Edit and delete actions
    - _Requirements: 8.1-8.8_

- [x] 11. Create emergency and permit components
  - [x] 11.1 Create components/jmp/emergency-contacts-form.tsx
    - Add/edit emergency contacts
    - Radio frequencies list
    - Nearest hospitals list
    - Nearest workshops list
    - _Requirements: 9.1-9.5_
  - [x] 11.3 Create components/jmp/permits-form.tsx
    - Add/edit permits
    - Validity status display (valid, expiring soon, expired)
    - Warning for expired permits
    - _Requirements: 10.1-10.3_

- [x] 12. Create detail view and execution components
  - [x] 12.1 Create components/jmp/jmp-detail-view.tsx
    - Tabbed interface: Plan, Team, Checkpoints, Risks, Contacts, Documents
    - Header with JMP number, title, status badge
    - Action buttons: Edit, Submit, Approve, Start Journey, Print
    - _Requirements: All detail requirements_
  - [x] 12.2 Create components/jmp/active-journeys-view.tsx
    - List of active journeys
    - Progress bars showing checkpoints completed
    - Behind schedule highlighting
    - Convoy commander contact info
    - Auto-refresh capability
    - _Requirements: 15.1-15.5_
  - [x] 12.4 Create components/jmp/post-journey-form.tsx
    - Journey log text area
    - Incidents occurred checkbox
    - Incident summary (required if incidents occurred)
    - Lessons learned text area
    - Time variance display
    - _Requirements: 13.1-13.5_

- [x] 14. Create pages
  - [x] 14.1 Create app/(main)/engineering/jmp/page.tsx
    - JMP list page with status cards
    - Filters and search
    - New JMP button
    - _Requirements: 14.1-14.6_
  - [x] 14.2 Create app/(main)/engineering/jmp/new/page.tsx
    - New JMP form page
    - Optional survey selection for pre-population
    - _Requirements: 4.1-4.10_
  - [x] 14.3 Create app/(main)/engineering/jmp/[id]/page.tsx
    - JMP detail page
    - All tabs and actions
    - _Requirements: All detail requirements_
  - [x] 14.4 Create app/(main)/engineering/jmp/[id]/edit/page.tsx
    - Edit JMP form page
    - _Requirements: 4.1-4.10_
  - [x] 14.5 Create app/(main)/engineering/jmp/active/page.tsx
    - Active journeys dashboard
    - Real-time monitoring
    - _Requirements: 15.1-15.5_

- [x] 15. Add navigation and permissions
  - [x] 15.1 Update navigation to include JMP menu item
    - Add under Engineering section
    - Link to /engineering/jmp
    - Added Active Journeys link

- [x] 16. Final checkpoint - Ensure all tests pass
  - All 26 property tests passing

## Notes

- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases

## Deferred Items (can be added later)
- 8.3 Convoy diagram visualization
- 8.5 Movement windows form
- 10.3 Risk matrix visualization
- 11.2 Contingency form
- 12.3 Journey progress card
- 13.1 Print view
- 15.2 Granular permissions (currently using role-based access)
