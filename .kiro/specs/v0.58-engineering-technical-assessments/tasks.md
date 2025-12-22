# Implementation Plan: Engineering Technical Assessments

## Overview

This implementation plan covers the Engineering Technical Assessments module (v0.58) for Gama ERP. The module enables engineers to create and manage technical assessments including lifting studies, load calculations, equipment specifications, and transport feasibility studies.

## Tasks

- [x] 1. Set up database schema and types
  - [x] 1.1 Create database migration for technical_assessment_types, technical_assessments, lifting_plans, and axle_load_calculations tables
    - Apply the SQL schema from the spec using Supabase MCP
    - Include indexes and auto-number trigger function
    - _Requirements: 1.1, 1.2, 2.1_

  - [x] 1.2 Create TypeScript types in types/assessment.ts
    - Define TechnicalAssessmentType, TechnicalAssessment, LiftingPlan, AxleLoadCalculation interfaces
    - Define input types for create/update operations
    - Define AssessmentStatus, ConclusionType enums
    - _Requirements: 1.1, 2.2, 2.3, 2.4_

- [x] 2. Implement utility functions
  - [x] 2.1 Create lib/assessment-utils.ts with core utility functions
    - Implement calculateTotalLiftedWeight, calculateUtilizationPercentage, isUtilizationSafe
    - Implement calculateAxleLoads, calculateTotalWeight, isWithinLegalLimits, determinePermitRequired
    - Implement getStatusColor, getStatusLabel, canTransitionTo
    - Implement validation functions: validateAssessmentData, validateLiftingPlan, validateAxleCalculation
    - Implement formatting functions: formatWeight, formatPercentage, formatDimensions
    - _Requirements: 6.2, 6.4, 6.5, 7.5, 7.6, 7.7, 7.8, 4.1_

  - [x] 2.2 Write property tests for lifting plan calculations
    - **Property 6: Lifting Plan Calculations**
    - **Validates: Requirements 6.2, 6.4, 6.5**

  - [x] 2.3 Write property tests for axle load calculations
    - **Property 7: Axle Load Calculations**
    - **Validates: Requirements 7.5, 7.6, 7.7, 7.8**

  - [x] 2.4 Write property tests for conclusion validation
    - **Property 9: Conclusion Value Validation**
    - **Validates: Requirements 3.1**

- [x] 3. Implement server actions
  - [x] 3.1 Create lib/assessment-actions.ts with assessment CRUD operations
    - Implement createAssessment, updateAssessment, deleteAssessment, getAssessment, getAssessments
    - Include auto-number generation via database trigger
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_

  - [x] 3.2 Implement workflow actions in lib/assessment-actions.ts
    - Implement submitForReview, reviewAssessment, approveAssessment, rejectAssessment
    - Implement createRevision with revision tracking
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 5.2, 5.3, 5.4_

  - [x] 3.3 Implement lifting plan actions in lib/assessment-actions.ts
    - Implement createLiftingPlan, updateLiftingPlan, deleteLiftingPlan, getLiftingPlans
    - Auto-calculate total_lifted_weight_tons and utilization_percentage
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.9_

  - [x] 3.4 Implement axle calculation actions in lib/assessment-actions.ts
    - Implement createAxleCalculation, updateAxleCalculation, deleteAxleCalculation, getAxleCalculations
    - Auto-calculate axle_loads, total_weight_tons, within_legal_limits, permit_required
    - _Requirements: 7.1, 7.2, 7.3, 7.5, 7.6, 7.7, 7.8_

  - [x] 3.5 Write property tests for required field validation
    - **Property 3: Required Field Validation**
    - **Validates: Requirements 2.3, 6.1, 7.1**

  - [x] 3.6 Write property tests for workflow state transitions
    - **Property 4: Workflow State Transitions**
    - **Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5**

  - [x] 3.7 Write property tests for revision tracking
    - **Property 5: Revision Tracking Invariants**
    - **Validates: Requirements 5.1, 5.2, 5.3, 5.4**

- [x] 4. Checkpoint - Core functionality complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Implement assessment list UI
  - [x] 5.1 Create components/assessments/assessment-status-cards.tsx
    - Display status counts (draft, pending_review, approved, rejected)
    - _Requirements: 9.3_

  - [x] 5.2 Create components/assessments/assessment-list.tsx
    - Display assessments in table with assessment_number, title, type, status, dates
    - Implement filtering by type, status, customer, project, date range
    - Implement sorting by assessment_number, created_at, status
    - _Requirements: 9.1, 9.2, 9.4_

  - [x] 5.3 Create app/(main)/engineering/assessments/page.tsx
    - Integrate status cards and assessment list
    - Add "New Assessment" button
    - _Requirements: 9.1_

  - [x] 5.4 Write property tests for filter results
    - **Property 8: Filter Results Correctness**
    - **Validates: Requirements 9.2, 9.3, 9.4**

- [x] 6. Implement assessment form
  - [x] 6.1 Create components/assessments/assessment-form.tsx
    - Form for assessment_type_id, title, description
    - Optional links to quotation, project, job_order, route_survey, customer
    - Cargo specifications section with dimensions and COG
    - _Requirements: 2.2, 2.3, 2.4_

  - [x] 6.2 Create app/(main)/engineering/assessments/new/page.tsx
    - New assessment page with form
    - Redirect to detail view on success
    - _Requirements: 2.1, 2.2, 2.3_

  - [x] 6.3 Create app/(main)/engineering/assessments/[id]/edit/page.tsx
    - Edit assessment page with pre-filled form
    - _Requirements: 2.4, 2.5, 2.6, 2.7_

- [x] 7. Implement assessment detail view
  - [x] 7.1 Create components/assessments/assessment-summary-tab.tsx
    - Display cargo specifications and COG data
    - Display equipment recommendations
    - _Requirements: 10.1_

  - [ ] 7.2 Create components/assessments/calculations-tab.tsx
    - Display calculations with name, formula, inputs, result, unit
    - Allow adding/editing calculations
    - _Requirements: 10.2_

  - [ ] 7.3 Create components/assessments/conclusion-form.tsx
    - Form for conclusion, conclusion_notes, recommendations, limitations, assumptions
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [ ] 7.4 Create components/assessments/review-workflow-panel.tsx
    - Display current status and workflow actions
    - Submit for review, approve, reject buttons based on permissions
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [ ] 7.5 Create components/assessments/revision-history.tsx
    - Display revision chain with links to previous versions
    - Create revision button
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [x] 7.6 Create components/assessments/assessment-detail-view.tsx
    - Tabbed interface: Summary, Calculations, Lifting Plan/Axle Loads, Drawings, Documents
    - Header with assessment number, title, status, actions
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6_

  - [x] 7.7 Create app/(main)/engineering/assessments/[id]/page.tsx
    - Assessment detail page with all tabs
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6_

- [x] 8. Checkpoint - Assessment UI complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Implement lifting plan management
  - [x] 9.1 Create components/assessments/lifting-plan-form.tsx
    - Form for load data, crane selection, rigging configuration, ground requirements
    - Auto-calculate total weight and utilization
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.6, 6.7, 6.8_

  - [ ] 9.2 Create components/assessments/crane-capacity-table.tsx
    - Display crane parameters with limits and utilization
    - Highlight if utilization > 80%
    - _Requirements: 6.4, 6.5_

  - [ ] 9.3 Create components/assessments/lifting-plan-table.tsx
    - List all lifting plans for an assessment
    - Edit/delete actions
    - _Requirements: 6.9_

  - [x] 9.4 Create components/assessments/lifting-plan-tab.tsx
    - Integrate lifting plan table and form
    - Display for lifting study assessments
    - _Requirements: 10.3_

  - [x] 9.5 Write property tests for multiple lifting plans
    - **Property 10: Multiple Lifting Plans Per Assessment**
    - **Validates: Requirements 6.9**

- [x] 10. Implement axle load calculation management
  - [x] 10.1 Create components/assessments/axle-calc-form.tsx
    - Form for trailer specs, prime mover specs, cargo weight and COG
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

  - [ ] 10.2 Create components/assessments/axle-load-table.tsx
    - Display axle loads with utilization and compliance status
    - Highlight axles exceeding limits
    - _Requirements: 7.5, 7.7, 7.8_

  - [x] 10.3 Create components/assessments/axle-calc-tab.tsx
    - Integrate axle calculation form and table
    - Display for transport study assessments
    - _Requirements: 10.4_

- [ ] 11. Implement document management
  - [ ] 11.1 Create components/assessments/drawings-tab.tsx
    - Display drawings with viewer
    - Upload new drawings
    - _Requirements: 8.2, 8.3_

  - [ ] 11.2 Create components/assessments/documents-tab.tsx
    - Display documents list
    - Upload new documents
    - _Requirements: 8.1, 8.4_

- [ ] 12. Final checkpoint - All features complete
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- All tasks including property-based tests are required for comprehensive coverage
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
