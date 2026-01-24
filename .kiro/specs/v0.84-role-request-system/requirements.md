# Requirements Document

## Introduction

This document defines the requirements for a self-service role request system that enables new users to request access to the GAMA ERP system without requiring manual admin intervention. The system allows users who log in with their @gama-group.co Google account to submit role requests, which administrators can then approve or reject through the existing User Management interface.

## Glossary

- **Role_Request_System**: The system component that handles the submission, tracking, and processing of user role requests
- **Request_Access_Page**: The user interface where new users submit their role requests
- **Admin_Panel**: The section in User Management where administrators review and process role requests
- **Pending_User**: A user who has logged in but has no assigned role or has a pending role request
- **Admin_User**: A user with role owner, director, or sysadmin who can approve/reject role requests
- **Department**: One of the organizational units (Operations, Finance, Marketing, HR, HSE, Engineering, Agency, Customs, Administration)
- **Role**: A permission set assigned to users (ops, finance, marketing, hr, hse, engineer, agency, customs, administration, etc.)

## Requirements

### Requirement 1: Role Request Submission

**User Story:** As a new user, I want to submit a role request after logging in, so that I can gain access to the appropriate dashboard and features.

#### Acceptance Criteria

1. WHEN a user without a role visits the application THEN THE Role_Request_System SHALL redirect them to the Request_Access_Page
2. WHEN a user visits the Request_Access_Page THEN THE Role_Request_System SHALL display a welcome message, department dropdown, role dropdown, and optional reason textarea
3. WHEN a user selects a department THEN THE Role_Request_System SHALL filter the role dropdown to show only roles relevant to that department
4. WHEN a user submits a valid role request THEN THE Role_Request_System SHALL create a new role_request record with status 'pending'
5. WHEN a user submits a role request THEN THE Role_Request_System SHALL store the user_id, user_email, user_name, requested_role, requested_department, and reason
6. IF a user attempts to submit a request while having a pending request THEN THE Role_Request_System SHALL prevent submission and display the existing request status

### Requirement 2: Request Status Display

**User Story:** As a user with a pending request, I want to see my request status, so that I know whether my request is being processed.

#### Acceptance Criteria

1. WHEN a user with a pending request visits the Request_Access_Page THEN THE Role_Request_System SHALL display the pending request details and status
2. WHEN a user's request has been rejected THEN THE Role_Request_System SHALL display the rejection reason and allow resubmission
3. WHEN a user's request has been approved THEN THE Role_Request_System SHALL redirect them to their role-appropriate dashboard

### Requirement 3: Admin Request Management

**User Story:** As an administrator, I want to view and process pending role requests, so that I can grant or deny access to new users.

#### Acceptance Criteria

1. WHEN an Admin_User visits the User Management page THEN THE Admin_Panel SHALL display a section showing pending role requests
2. WHEN displaying pending requests THEN THE Admin_Panel SHALL show user email, user name, requested department, requested role, reason, and submission date
3. WHEN an Admin_User approves a request THEN THE Role_Request_System SHALL update the request status to 'approved' and assign the requested role to the user
4. WHEN an Admin_User rejects a request THEN THE Role_Request_System SHALL update the request status to 'rejected' and store the admin_notes
5. WHEN an Admin_User processes a request THEN THE Role_Request_System SHALL record the reviewed_by user and reviewed_at timestamp

### Requirement 4: Middleware Routing

**User Story:** As a system architect, I want proper routing for users without roles, so that they are directed to the appropriate page.

#### Acceptance Criteria

1. WHEN an authenticated user without a role accesses any protected route THEN THE Role_Request_System SHALL redirect them to /request-access
2. THE Role_Request_System SHALL exclude /request-access, /auth/*, /api/*, and /login from the role-required redirect
3. WHEN a user with an approved role accesses /request-access THEN THE Role_Request_System SHALL redirect them to their dashboard

### Requirement 5: Database Schema

**User Story:** As a developer, I want a proper database schema for role requests, so that request data is stored securely and consistently.

#### Acceptance Criteria

1. THE Role_Request_System SHALL store role requests in a role_requests table with id, user_id, user_email, user_name, requested_role, requested_department, reason, status, reviewed_by, reviewed_at, admin_notes, created_at, and updated_at columns
2. THE Role_Request_System SHALL enforce that status values are one of: 'pending', 'approved', 'rejected'
3. THE Role_Request_System SHALL create RLS policies allowing users to view and create their own requests
4. THE Role_Request_System SHALL create RLS policies allowing Admin_Users to view all requests and update request status

### Requirement 6: Notification

**User Story:** As an administrator, I want to be notified of new role requests, so that I can process them promptly.

#### Acceptance Criteria

1. WHEN a new role request is submitted THEN THE Role_Request_System SHALL create a notification for Admin_Users
2. WHEN a role request is approved or rejected THEN THE Role_Request_System SHALL create a notification for the requesting user
