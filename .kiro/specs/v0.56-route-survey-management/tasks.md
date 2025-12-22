# Implementation Plan: Route Survey Management

## Overview

This implementation plan covers the Route Survey Management system for heavy-haul logistics. The plan follows an incremental approach, starting with database schema and types, then utility functions with property tests, followed by server actions, and finally UI components.

## Tasks

- [x] 1. Set up database schema and types
  - [x] 1.1 Create database migration for route_surveys, route_waypoints, route_survey_checklist, and route_survey_checklist_template tables
  - [x] 1.2 Create TypeScript types in types/survey.ts

- [x] 2. Implement survey utility functions
  - [x] 2.1 Create lib/survey-utils.ts with core utility functions
  - [x] 2.2 Write property test for survey number format validity
  - [x] 2.3 Write property test for status count accuracy
  - [x] 2.4 Write property test for survey filtering correctness
  - [x] 2.5 Write property test for survey search correctness

- [x] 3. Implement waypoint utility functions
  - [x] 3.1 Add waypoint utilities to lib/survey-utils.ts
  - [x] 3.2 Write property test for passability assessment correctness
  - [x] 3.3 Write property test for waypoint order sequentiality

- [x] 4. Implement validation utilities
  - [x] 4.1 Add validation functions to lib/survey-utils.ts
  - [x] 4.2 Write property test for survey validation completeness
  - [x] 4.3 Write property test for checklist status validity

- [x] 5. Checkpoint - All utility tests pass (25/25)

- [x] 6. Implement server actions
  - [x] 6.1 Create lib/survey-actions.ts with survey CRUD operations
  - [x] 6.2 Add waypoint server actions
  - [x] 6.3 Add checklist server actions
  - [x] 6.4 Add survey completion actions
  - [x] 6.5 Write property test for initial survey status invariant
  - [x] 6.6 Write property test for checklist initialization completeness
  - [x] 6.7 Write property test for survey completion validation

- [x] 7. Checkpoint - All server action tests pass

- [x] 8. Implement survey list components
  - [x] 8.1 Create components/surveys/survey-status-cards.tsx
  - [x] 8.2 Create components/surveys/survey-list.tsx
  - [x] 8.3 Create app/(main)/engineering/surveys/page.tsx

- [x] 9. Implement survey form components
  - [x] 9.1 Create components/surveys/survey-form.tsx
  - [x] 9.2 Create app/(main)/engineering/surveys/new/page.tsx
  - [x] 9.3 Create app/(main)/engineering/surveys/[id]/edit/page.tsx

- [x] 10. Implement survey detail components
  - [x] 10.1 Create components/surveys/route-overview.tsx
  - [x] 10.2 Create components/surveys/waypoint-table.tsx
  - [x] 10.3 Create components/surveys/waypoint-form.tsx
  - [x] 10.4 Create components/surveys/checklist-section.tsx
  - [x] 10.5 Create components/surveys/feasibility-form.tsx
  - [x] 10.6 Create components/surveys/survey-detail-view.tsx
  - [x] 10.7 Create app/(main)/engineering/surveys/[id]/page.tsx

- [x] 11. Add navigation
  - [x] 11.1 Update lib/navigation.ts to add engineering surveys route

- [x] 12. Final checkpoint - All tests pass (25/25)

## Completed Files

### Types
- `types/survey.ts` - All survey-related TypeScript types

### Utilities
- `lib/survey-utils.ts` - Survey utility functions with validation

### Server Actions
- `lib/survey-actions.ts` - CRUD operations for surveys, waypoints, checklist

### Components
- `components/surveys/survey-status-cards.tsx` - Status summary cards
- `components/surveys/survey-list.tsx` - Survey list with filters
- `components/surveys/survey-form.tsx` - Create/edit survey form
- `components/surveys/survey-detail-view.tsx` - Tabbed detail view
- `components/surveys/waypoint-table.tsx` - Waypoints table
- `components/surveys/waypoint-form.tsx` - Add/edit waypoint dialog
- `components/surveys/checklist-section.tsx` - Checklist by category
- `components/surveys/route-overview.tsx` - Visual route summary
- `components/surveys/feasibility-form.tsx` - Complete survey dialog

### Pages
- `app/(main)/engineering/surveys/page.tsx` - Survey list page
- `app/(main)/engineering/surveys/new/page.tsx` - New survey page
- `app/(main)/engineering/surveys/[id]/page.tsx` - Survey detail page
- `app/(main)/engineering/surveys/[id]/edit/page.tsx` - Edit survey page

### Tests
- `__tests__/survey-utils.property.test.ts` - 25 property tests (all passing)
