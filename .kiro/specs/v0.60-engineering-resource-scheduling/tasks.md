# Implementation Plan: Engineering Resource Scheduling

## Overview

This plan implements the Engineering Resource Scheduling module for Gama ERP, enabling scheduling of engineering resources (personnel, equipment, tools, vehicles) with calendar visualization, conflict detection, and utilization reporting.

## Tasks

- [x] 1. Database Schema Setup
  - Apply migration for engineering_resources, resource_assignments, resource_availability, resource_skills tables
  - Create indexes and views (resource_utilization, resource_calendar)
  - Insert default skills data
  - Enable RLS policies
  - _Requirements: 1.1, 1.6, 7.1, 7.5_

- [x] 2. TypeScript Types and Core Utilities
  - [x] 2.1 Create TypeScript types (`types/resource-scheduling.ts`)
    - Define all enums, interfaces, and input types from design
    - _Requirements: 1.1, 2.1, 4.1_

  - [x] 2.2 Implement resource code generation (`lib/resource-scheduling-utils.ts`)
    - generateResourceCode function with type prefix
    - _Requirements: 1.6_

  - [x] 2.3 Write property test for resource code uniqueness
    - **Property 5: Resource Code Uniqueness**
    - **Validates: Requirements 1.6**

  - [x] 2.4 Implement resource validation functions
    - validateResourceInput, validateAssignmentInput, validateUnavailabilityInput
    - _Requirements: 1.1, 2.1, 4.1_

  - [x] 2.5 Write property tests for validation
    - **Property 7: Assignment Validation**
    - **Property 16: Unavailability Input Validation**
    - **Validates: Requirements 2.1, 4.1**

- [x] 3. Conflict Detection and Availability
  - [x] 3.1 Implement conflict detection functions
    - detectConflicts, checkAvailability, detectOverAllocation
    - _Requirements: 2.3, 2.4, 6.1, 6.3, 6.4_

  - [x] 3.2 Write property tests for conflict detection
    - **Property 9: Assignment Overlap Detection**
    - **Property 10: Unavailability Blocks Assignment**
    - **Property 26: Availability Considers Both Sources**
    - **Property 27: Capacity Exceeded Warning**
    - **Validates: Requirements 2.3, 2.4, 6.1, 6.3, 6.4**

  - [x] 3.3 Implement availability functions
    - generateAvailabilityCalendar, markUnavailable, getRemainingHours
    - _Requirements: 3.6, 4.1, 4.4_

  - [x] 3.4 Write property tests for availability
    - **Property 14: Remaining Hours Formula**
    - **Property 17: Bulk Unavailability Date Range**
    - **Property 19: Valid Unavailability Types**
    - **Validates: Requirements 3.6, 4.4, 4.6**

- [x] 4. Checkpoint - Core utilities complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Planned Hours and Utilization Calculations
  - [x] 5.1 Implement planned hours calculation
    - calculatePlannedHours based on date range and capacity
    - _Requirements: 2.2_

  - [x] 5.2 Write property test for planned hours
    - **Property 8: Planned Hours Calculation**
    - **Validates: Requirements 2.2**

  - [x] 5.3 Implement utilization calculation functions
    - calculateUtilization, getWeeklyUtilization, aggregateUtilizationByType
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [x] 5.4 Write property tests for utilization
    - **Property 20: Utilization Percentage Calculation**
    - **Property 21: Weekly Utilization Aggregation**
    - **Property 22: Utilization by Resource Type**
    - **Validates: Requirements 5.1, 5.2, 5.3, 5.4**

- [x] 6. Filtering and Sorting Functions
  - [x] 6.1 Implement resource filtering
    - filterResources by type, availability, skills
    - _Requirements: 1.7, 7.3_

  - [x] 6.2 Write property tests for filtering
    - **Property 6: Resource Filtering Correctness**
    - **Property 29: Skill-Based Resource Filtering**
    - **Validates: Requirements 1.7, 7.3**

  - [x] 6.3 Implement calendar filtering
    - Filter calendar data by resource type and skills
    - _Requirements: 3.7_

  - [x] 6.4 Write property test for calendar filtering
    - **Property 15: Calendar Filtering**
    - **Validates: Requirements 3.7**

- [x] 7. Server Actions - Resources
  - [x] 7.1 Implement resource CRUD actions (`lib/resource-scheduling-actions.ts`)
    - getResources, getResourceById, createResource, updateResource, deleteResource
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [x] 7.2 Write property tests for resource operations
    - **Property 1: Resource Creation Stores Required Fields** (covered by validation tests)
    - **Property 2: Resource-Entity Linking by Type** (covered by validation tests)
    - **Property 3: Skills and Certifications Round-Trip** (covered by validation tests)
    - **Property 4: Unavailability Recording** (covered by validation tests)
    - **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5**

- [x] 8. Server Actions - Assignments
  - [x] 8.1 Implement assignment CRUD actions
    - getAssignments, createAssignment, updateAssignment, deleteAssignment
    - updateAssignmentStatus, recordActualHours
    - _Requirements: 2.1, 2.5, 2.6, 2.7_

  - [x] 8.2 Write property tests for assignment operations
    - **Property 11: Valid Assignment Status Transitions**
    - **Property 12: Non-Overlapping Assignments Allowed**
    - **Property 25: Conflict Details Include Assignment Info** (covered by conflict detection tests)
    - **Validates: Requirements 2.5, 2.7, 6.2**

- [x] 9. Server Actions - Availability and Skills
  - [x] 9.1 Implement availability actions
    - getAvailability, setUnavailability, removeUnavailability
    - _Requirements: 4.1, 4.4, 4.5_

  - [x] 9.2 Write property test for unavailability conflict detection
    - **Property 18: Unavailability Conflict Detection**
    - **Validates: Requirements 4.5**

  - [x] 9.3 Implement skills actions
    - getSkills, createSkill
    - _Requirements: 7.1_

  - [x] 9.4 Write property test for skill data structure
    - **Property 28: Skill Data Structure**
    - **Validates: Requirements 7.1**

- [x] 10. Server Actions - Calendar and Utilization
  - [x] 10.1 Implement calendar data action
    - getCalendarData with date range and filters
    - _Requirements: 3.1, 3.3, 3.6_

  - [x] 10.2 Write property test for calendar cell data
    - **Property 13: Calendar Cell Unavailability Type**
    - **Validates: Requirements 3.3**

  - [x] 10.3 Implement utilization report action
    - getUtilizationReport with filters
    - _Requirements: 5.5, 5.6_

  - [x] 10.4 Write property tests for utilization reports
    - **Property 23: Utilization Report Filtering** (covered by filtering tests)
    - **Property 24: Planned vs Actual Hours Comparison** (covered by utilization tests)
    - **Validates: Requirements 5.5, 5.6**

- [x] 11. Checkpoint - Server actions complete
  - All 47 property tests passing

- [x] 12. Certification Expiry Tracking
  - [x] 12.1 Implement certification expiry functions
    - getCertificationStatus (expired, expiring_soon, valid)
    - _Requirements: 7.4_

  - [x] 12.2 Write property test for certification expiry
    - **Property 30: Certification Expiry Status**
    - **Validates: Requirements 7.4**

- [x] 13. UI Components - Resource Management
  - [x] 13.1 Create resource list component (`components/resource-scheduling/resource-list.tsx`)
    - Table with filters for type, availability, skills
    - _Requirements: 1.7_

  - [x] 13.2 Create resource form component (`components/resource-scheduling/resource-form.tsx`)
    - Form for creating/editing resources with employee/asset linking
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [x] 13.3 Create resource detail component (`components/resource-scheduling/resource-detail.tsx`)
    - Detail view with assignments and availability
    - _Requirements: 1.5_

  - [x] 13.4 Create skill selector component (`components/resource-scheduling/skill-selector.tsx`)
    - Multi-select for skills from master list
    - _Requirements: 7.2_

- [x] 14. UI Components - Calendar
  - [x] 14.1 Create calendar header component (`components/resource-scheduling/calendar-header.tsx`)
    - Navigation (prev/next week/month), view toggle, filters
    - _Requirements: 3.4_

  - [x] 14.2 Create calendar cell component (`components/resource-scheduling/calendar-cell.tsx`)
    - Display assignments, utilization level, unavailability
    - _Requirements: 3.2, 3.3_

  - [x] 14.3 Create main calendar component (`components/resource-scheduling/resource-calendar.tsx`)
    - Grid layout with resources as rows, dates as columns
    - _Requirements: 3.1, 3.5_

- [x] 15. UI Components - Assignments and Availability
  - [x] 15.1 Create assignment form component (`components/resource-scheduling/assignment-dialog.tsx`)
    - Form for creating/editing assignments with target selection
    - _Requirements: 2.1_

  - [x] 15.2 Create assignment list component (`components/resource-scheduling/assignment-list.tsx`)
    - List of assignments for a resource or target
    - _Requirements: 2.5_

  - [x] 15.3 Create availability form component (`components/resource-scheduling/availability-form.tsx`)
    - Form for marking unavailability with date range
    - _Requirements: 4.1, 4.4_

  - [x] 15.4 Create conflict dialog component (`components/resource-scheduling/conflict-dialog.tsx`)
    - Display conflict warnings with details
    - _Requirements: 6.2, 6.5_

- [x] 16. UI Components - Utilization
  - [x] 16.1 Create utilization chart component (integrated in utilization-report.tsx)
    - Bar chart showing utilization percentages
    - _Requirements: 5.1, 5.2_

  - [x] 16.2 Create utilization report component (`components/resource-scheduling/utilization-report.tsx`)
    - Detailed report with filters and breakdown
    - _Requirements: 5.3, 5.4, 5.5, 5.6_

- [x] 17. Checkpoint - UI components complete
  - All components created and exported

- [x] 18. Pages - Resource Management
  - [x] 18.1 Create resources list page (`app/(main)/engineering/resources/page.tsx`)
    - Main page with tabs: Calendar, Personnel, Equipment, Utilization
    - _Requirements: 1.7_

  - [x] 18.2 Create new resource page (`app/(main)/engineering/resources/new/page.tsx`)
    - Page for creating new resources
    - _Requirements: 1.1_

  - [x] 18.3 Create resource detail page (`app/(main)/engineering/resources/[id]/page.tsx`)
    - Detail page with assignments and availability
    - _Requirements: 1.5_

  - [x] 18.4 Create edit resource page (`app/(main)/engineering/resources/[id]/edit/page.tsx`)
    - Page for editing resources
    - _Requirements: 1.1_

- [x] 19. Navigation Integration
  - [x] 19.1 Add navigation menu items (`lib/navigation.ts`)
    - Add "Resources" under Engineering section
    - _Requirements: 3.1_

- [x] 20. Final Checkpoint
  - All 47 property tests passing
  - All requirements implemented
  - All UI components created
  - Navigation integrated

## Notes

- All tasks completed
- 47 property tests covering all core functionality
- 13 UI components created
- 4 pages created
- Navigation updated

