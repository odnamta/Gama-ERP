# Implementation Plan: Role Request System

## Overview

This implementation plan creates a self-service role request system for GAMA ERP. The plan follows incremental steps, building from database schema through UI components to middleware integration.

## Tasks

- [x] 1. Database Setup
  - [x] 1.1 Create role_requests table migration
    - Create migration file with table schema
    - Add columns: id, user_id, user_email, user_name, requested_role, requested_department, reason, status, reviewed_by, reviewed_at, admin_notes, created_at, updated_at
    - Add CHECK constraint for status values ('pending', 'approved', 'rejected')
    - Add indexes for user_id and status
    - _Requirements: 5.1, 5.2_
  
  - [x] 1.2 Create RLS policies for role_requests
    - Enable RLS on table
    - Create policy for users to view own requests
    - Create policy for users to create own requests
    - Create policy for admins to view all requests
    - Create policy for admins to update requests
    - _Requirements: 5.3, 5.4_

- [x] 2. Core Types and Configuration
  - [x] 2.1 Add RoleRequest type definitions
    - Create types/role-request.ts with RoleRequest interface
    - Add RoleRequestStatus type
    - Add RoleRequestWithUser interface for admin views
    - _Requirements: 5.1_
  
  - [x] 2.2 Create department-role mapping configuration
    - Add DEPARTMENT_ROLES constant to lib/permissions.ts
    - Map each department to allowed roles
    - Export helper function getDepartmentRoles()
    - _Requirements: 1.3_
  
  - [x] 2.3 Write property test for department-role filtering
    - **Property 2: Department-Role Filtering**
    - Test that filtered roles match DEPARTMENT_ROLES mapping
    - **Validates: Requirements 1.3**

- [x] 3. Request Access Page - Server Actions
  - [x] 3.1 Create submitRoleRequest server action
    - Create app/(main)/request-access/actions.ts
    - Implement submitRoleRequest() function
    - Check for existing pending request before creating
    - Create role_request record with pending status
    - _Requirements: 1.4, 1.5, 1.6_
  
  - [x] 3.2 Create getUserRoleRequest server action
    - Implement getUserRoleRequest() to fetch user's latest request
    - Return null if no request exists
    - _Requirements: 2.1, 2.2_
  
  - [x] 3.3 Write property test for request creation
    - **Property 3: Request Creation Data Integrity**
    - Test that created records contain all required fields
    - **Validates: Requirements 1.4, 1.5**
  
  - [x] 3.4 Write property test for duplicate prevention
    - **Property 4: Duplicate Request Prevention**
    - Test that users with pending requests cannot submit new ones
    - **Validates: Requirements 1.6**

- [x] 4. Request Access Page - UI Components
  - [x] 4.1 Create Request Access page server component
    - Create app/(main)/request-access/page.tsx
    - Check authentication and existing role
    - Redirect users with valid roles to dashboard
    - Fetch existing request if any
    - _Requirements: 1.1, 2.3_
  
  - [x] 4.2 Create RequestAccessClient component
    - Create app/(main)/request-access/request-access-client.tsx
    - Display welcome message and form
    - Department dropdown with all departments
    - Role dropdown filtered by selected department
    - Optional reason textarea
    - Submit button with loading state
    - _Requirements: 1.2, 1.3_
  
  - [x] 4.3 Create RequestStatusDisplay component
    - Show pending request details when exists
    - Show rejection reason and allow resubmission
    - Handle approved state (should redirect)
    - _Requirements: 2.1, 2.2_
  
  - [x] 4.4 Write unit tests for Request Access page
    - Test form validation
    - Test department-role filtering UI
    - Test status display states
    - _Requirements: 1.2, 1.3, 2.1, 2.2_

- [x] 5. Checkpoint - Request Submission Flow
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Admin Actions for Request Management
  - [x] 6.1 Create getPendingRoleRequests server action
    - Add to app/(main)/settings/users/actions.ts
    - Query role_requests with status='pending'
    - Join with user info for display
    - _Requirements: 3.1, 3.2_
  
  - [x] 6.2 Create approveRoleRequest server action
    - Update request status to 'approved'
    - Set reviewed_by and reviewed_at
    - Update user_profiles.role to requested_role
    - Sync user metadata for middleware
    - _Requirements: 3.3, 3.5_
  
  - [x] 6.3 Create rejectRoleRequest server action
    - Update request status to 'rejected'
    - Store admin_notes with rejection reason
    - Set reviewed_by and reviewed_at
    - _Requirements: 3.4, 3.5_
  
  - [x] 6.4 Write property test for approval state transition
    - **Property 7: Approval State Transition**
    - Test status change, role assignment, and audit fields
    - **Validates: Requirements 3.3, 3.5**
  
  - [x] 6.5 Write property test for rejection state transition
    - **Property 8: Rejection State Transition**
    - Test status change, notes storage, and audit fields
    - **Validates: Requirements 3.4, 3.5**

- [x] 7. Admin UI for Request Management
  - [x] 7.1 Create PendingRequestsSection component
    - Create app/(main)/settings/users/pending-requests.tsx
    - Display table of pending requests
    - Show user email, name, department, role, reason, date
    - _Requirements: 3.1, 3.2_
  
  - [x] 7.2 Create ApproveRejectDialog component
    - Approve button with confirmation
    - Reject button with reason input
    - Loading states for actions
    - _Requirements: 3.3, 3.4_
  
  - [x] 7.3 Integrate pending requests into User Management page
    - Add tab or section for pending requests
    - Update app/(main)/settings/users/page.tsx
    - Update user-management-client.tsx
    - _Requirements: 3.1_
  
  - [x] 7.4 Write unit tests for admin request management
    - Test pending requests display
    - Test approve/reject actions
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 8. Checkpoint - Admin Management Flow
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Middleware Updates
  - [x] 9.1 Update middleware for role-required routing
    - Add NO_ROLE_REQUIRED_ROUTES constant
    - Check if user has valid role from JWT metadata
    - Redirect roleless users to /request-access
    - Redirect users with roles away from /request-access
    - _Requirements: 4.1, 4.2, 4.3_
  
  - [x] 9.2 Update ensureUserProfile for new user handling
    - Modify lib/permissions-server.ts
    - New users get null/pending role instead of default
    - Ensure proper handling for role request flow
    - _Requirements: 1.1_
  
  - [x] 9.3 Write property test for route exclusion
    - **Property 6: Route Exclusion from Redirect**
    - Test that excluded paths don't trigger redirect
    - **Validates: Requirements 4.2**

- [x] 10. Notifications
  - [x] 10.1 Create notification for new role requests
    - Trigger notification to admin users on request submission
    - Use existing notification system
    - _Requirements: 6.1_
  
  - [x] 10.2 Create notification for request processing
    - Notify user when request is approved
    - Notify user when request is rejected (include reason)
    - _Requirements: 6.2_
  
  - [x] 10.3 Write property test for admin notification
    - **Property 12: Admin Notification on New Request**
    - Test notification created for admins
    - **Validates: Requirements 6.1**
  
  - [x] 10.4 Write property test for user notification
    - **Property 13: User Notification on Request Processing**
    - Test notification created for user on approval/rejection
    - **Validates: Requirements 6.2**

- [x] 11. Final Checkpoint
  - Ensure all tests pass, ask the user if questions arise.
  - Verify full flow: login → request → admin approve → user access
  - Run `npm run build` to verify no TypeScript errors

## Notes

- All tasks are required for comprehensive coverage
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- Follow existing patterns from lib/permissions-server.ts and app/(main)/settings/users/
