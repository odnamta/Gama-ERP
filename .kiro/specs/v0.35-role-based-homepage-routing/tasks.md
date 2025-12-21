# Implementation Plan: Role-Based Homepage Routing

## Overview

This implementation plan breaks down the role-based homepage routing feature into discrete coding tasks. The approach prioritizes database schema first, then core utilities, middleware integration, and finally testing.

## Tasks

- [x] 1. Create database schema and seed data
  - [x] 1.1 Create migration for `role_homepages` table
    - Create table with id, role (unique), homepage_route, fallback_route, redirect_rules (JSONB), created_at
    - Add unique constraint on role column
    - _Requirements: 1.1, 1.3_
  - [x] 1.2 Create migration to add `custom_homepage` column to `user_profiles`
    - Add nullable VARCHAR(200) column
    - _Requirements: 2.1_
  - [x] 1.3 Insert default role homepage configurations
    - Insert rows for: owner→/dashboard/executive, admin→/dashboard/admin, manager→/dashboard/manager, finance→/dashboard/finance, ops→/dashboard/operations, sales→/dashboard/sales, viewer→/dashboard/viewer
    - _Requirements: 1.2, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

- [x] 2. Create TypeScript types and interfaces
  - [x] 2.1 Create `types/homepage-routing.ts` with type definitions
    - Define RoleHomepage, RedirectRule, RedirectCondition, HomepageResolutionResult interfaces
    - _Requirements: 4.1_

- [x] 3. Implement homepage routing utilities
  - [x] 3.1 Create `lib/homepage-routing-utils.ts` with core functions
    - Implement getRoleHomepage() for static role-to-route mapping
    - Implement getUserHomepage() for full resolution with priority logic
    - Implement evaluateCondition() dispatcher
    - _Requirements: 1.4, 2.2, 2.3, 3.1-3.7, 4.2, 4.5_
  - [x] 3.2 Write property test for custom homepage override priority
    - **Property 1: Custom Homepage Override Priority**
    - **Validates: Requirements 2.2**
  - [x] 3.3 Write property test for role-to-route mapping consistency
    - **Property 2: Role-to-Route Mapping Consistency**
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7**
  - [x] 3.4 Write property test for unknown role fallback
    - **Property 3: Unknown Role Fallback**
    - **Validates: Requirements 1.4**

- [x] 4. Implement condition evaluators
  - [x] 4.1 Implement hasPendingApprovals() function
    - Check user role is owner/admin/manager AND pending BKK exists
    - _Requirements: 4.3_
  - [x] 4.2 Implement hasUrgentItems() function
    - Check for items requiring immediate attention
    - _Requirements: 4.4_
  - [x] 4.3 Write property test for redirect rule order evaluation
    - **Property 4: Redirect Rule Order Evaluation**
    - **Validates: Requirements 4.2**
  - [x] 4.4 Write property test for pending approvals condition
    - **Property 5: Pending Approvals Condition**
    - **Validates: Requirements 4.3**

- [x] 5. Checkpoint - Ensure all utility tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Update middleware for homepage routing
  - [x] 6.1 Modify `middleware.ts` to integrate homepage routing
    - Add root path '/' redirect to resolved homepage
    - Add '/dashboard' (without sub-path) redirect to resolved homepage
    - Keep existing authentication and role restriction logic
    - _Requirements: 5.1, 5.2, 5.3, 5.4_
  - [x] 6.2 Write property test for unauthenticated user redirect
    - **Property 6: Unauthenticated User Redirect**
    - **Validates: Requirements 5.1**
  - [x] 6.3 Write property test for root path redirect
    - **Property 7: Root Path Redirect**
    - **Validates: Requirements 5.2**
  - [x] 6.4 Write property test for dashboard path redirect
    - **Property 8: Dashboard Path Redirect**
    - **Validates: Requirements 5.3**

- [x] 7. Create dashboard route structure
  - [x] 7.1 Create dashboard route pages
    - Create /dashboard/executive/page.tsx (owner view)
    - Create /dashboard/admin/page.tsx (admin view)
    - Create /dashboard/manager/page.tsx (manager view)
    - Create /dashboard/finance/page.tsx (finance view)
    - Create /dashboard/operations/page.tsx (ops view)
    - Create /dashboard/sales/page.tsx (sales view)
    - Create /dashboard/viewer/page.tsx (viewer view)
    - Each page imports and renders the appropriate dashboard component
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

- [x] 8. Create loading skeleton component
  - [x] 8.1 Create `components/dashboard/dashboard-skeleton.tsx`
    - Create loading skeleton for dashboard routing transition
    - _Requirements: 6.1_

- [x] 9. Update dashboard router component
  - [x] 9.1 Create `components/dashboard/dashboard-router.tsx`
    - Implement client-side router component that resolves homepage
    - Use router.replace() for navigation
    - Show skeleton during resolution
    - _Requirements: 6.1, 6.2, 6.4_

- [x] 10. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- All tasks including property tests are required for comprehensive coverage
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
