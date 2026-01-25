# Implementation Plan: Engineering Dashboard

## Overview

This implementation plan covers the Engineering Dashboard feature (v0.9.17) for GAMA ERP. The dashboard provides engineers with a centralized view of route surveys, JMPs, and engineering assessments. Implementation follows existing patterns from the Agency Dashboard.

## Tasks

- [x] 1. Create Engineering Data Service
  - [x] 1.1 Create lib/dashboard/engineering-data.ts with interfaces and main data fetcher
    - Define EngineeringDashboardMetrics interface
    - Define RecentSurvey, RecentJmp, RecentAssessment, MyAssignment interfaces
    - Implement getEngineeringDashboardMetrics function with cache integration
    - Use Promise.all for parallel database queries
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4, 6.1, 6.2, 6.3, 6.4_
  
  - [x] 1.2 Write property tests for status filtering
    - **Property 1: Status filtering correctness**
    - **Validates: Requirements 1.2, 2.1, 2.3, 3.1**
  
  - [x] 1.3 Write property tests for date range filtering
    - **Property 2: Date range filtering correctness**
    - **Validates: Requirements 1.3, 3.2**
  
  - [x] 1.4 Write property tests for recent items ordering
    - **Property 3: Recent items ordering and limiting**
    - **Validates: Requirements 1.4, 2.4, 3.4**

- [x] 2. Implement User Assignment Queries
  - [x] 2.1 Add user assignment fetching to engineering-data.ts
    - Fetch surveys where surveyor_id matches current user
    - Fetch assessments where assigned_to matches current user
    - Fetch JMPs where prepared_by or convoy_commander_id matches current user
    - Combine into MyAssignment array with type discriminator
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_
  
  - [x] 2.2 Write property tests for user assignment filtering
    - **Property 4: User assignment filtering**
    - **Validates: Requirements 4.1, 4.2, 4.3**

- [x] 3. Implement Completion Rate Calculation
  - [x] 3.1 Add completion rate calculation to engineering-data.ts
    - Calculate as (completed / total) * 100
    - Handle division by zero (return 0 if total is 0)
    - Round to nearest integer
    - _Requirements: 3.3_
  
  - [x] 3.2 Write property tests for completion rate calculation
    - **Property 5: Completion rate calculation**
    - **Validates: Requirements 3.3**

- [x] 4. Checkpoint - Verify Data Service
  - Ensure all data service functions work correctly
  - Run property tests to verify correctness
  - Ask the user if questions arise

- [x] 5. Update Engineering Dashboard Page
  - [x] 5.1 Update app/(main)/dashboard/engineering/page.tsx with full implementation
    - Add role-based access control (engineer, owner, director)
    - Fetch metrics using getEngineeringDashboardMetrics
    - Implement Survey Overview section with 4 metric cards
    - Implement JMP Status section with 3 metric cards
    - Implement Assessment Metrics section with 3 metric cards
    - Use formatDate and formatNumber from lib/utils/format.ts
    - _Requirements: 1.5, 2.5, 3.5, 7.1, 7.2, 7.3, 7.4, 8.5_
  
  - [x] 5.2 Write property tests for unauthorized role redirect
    - **Property 8: Unauthorized role redirect**
    - **Validates: Requirements 7.3**

- [x] 6. Implement Quick Actions Section
  - [x] 6.1 Add Quick Actions component to dashboard page
    - Add "New Survey" link to /engineering/surveys/new
    - Add "New JMP" link to /engineering/jmp/new
    - Add "View All Surveys" link to /engineering/surveys
    - Add "View All JMPs" link to /engineering/jmp
    - Style with consistent card layout
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 7. Implement Recent Activity Lists
  - [x] 7.1 Add Recent Surveys list component
    - Display survey_number, origin, destination, status, created_at
    - Add click navigation to survey detail page
    - Include StatusBadge component for status display
    - _Requirements: 8.1, 8.4_
  
  - [x] 7.2 Add Recent JMPs list component
    - Display jmp_number, journey_title, status, planned_departure
    - Add click navigation to JMP detail page
    - Include StatusBadge component for status display
    - _Requirements: 8.2, 8.4_
  
  - [x] 7.3 Add Recent Assessments list component
    - Display assessment_type, status, risk_level, created_at
    - Add click navigation to assessment detail page
    - Include StatusBadge and RiskBadge components
    - _Requirements: 8.3, 8.4_

- [x] 8. Implement My Assignments Section
  - [x] 8.1 Add My Assignments component to dashboard page
    - Display combined list of user's surveys, JMPs, and assessments
    - Show assignment counts by category
    - Include status indicators and due dates
    - Add navigation to individual items
    - _Requirements: 4.4, 4.5_

- [x] 9. Checkpoint - Verify Dashboard UI
  - Ensure all sections render correctly
  - Verify navigation links work
  - Test with different roles
  - Ask the user if questions arise

- [x] 10. Implement Cache Key Generation
  - [x] 10.1 Verify cache key generation in engineering-data.ts
    - Use generateCacheKey from dashboard-cache.ts
    - Format: 'engineering-dashboard-metrics:{role}:{date}'
    - _Requirements: 6.4_
  
  - [x] 10.2 Write property tests for cache key format
    - **Property 6: Cache key generation format**
    - **Validates: Requirements 6.4**
  
  - [x] 10.3 Write property tests for cache round-trip
    - **Property 7: Cache round-trip**
    - **Validates: Requirements 6.2, 6.3**

- [x] 11. Write Unit Tests
  - [x] 11.1 Write unit tests for engineering-data.ts
    - Test empty data scenarios
    - Test null value handling
    - Test date boundary cases
    - Test role access scenarios
    - _Requirements: All_

- [x] 12. Final Checkpoint - Complete Testing
  - Run all tests (npm run test)
  - Run build (npm run build)
  - Verify no TypeScript errors
  - Ask the user if questions arise

## Notes

- All tasks are required for comprehensive implementation
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- Follow existing patterns from lib/dashboard/agency-data.ts
- Use centralized formatters from lib/utils/format.ts
