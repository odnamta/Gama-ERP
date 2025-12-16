# Requirements Document

## Introduction

This feature introduces an **Owner** role for PT. Gama Intisamudera's ERP system and enhances the sidebar navigation to properly route users to their role-specific dashboards. The Owner role is the highest privilege level (system owner/business owner), capable of managing all users including adding new users before they log in, and cannot have their permissions revoked.

**Important Naming Clarification:**
- `owner` = **System Owner** (business owner, full system control, user management) - NEW
- `admin` = **Administration Division** (handles PJO/JO/Invoice document workflow) - EXISTING, unchanged

The `owner` role is distinct from `admin`. The `admin` role remains the Administration Division role for document workflow. Only the business owner (dioatmando@gama-group.co) will have the `owner` role.

Currently, the system has 6 roles (admin, manager, ops, finance, sales, viewer) but lacks a true system owner role that can bootstrap user management. This creates a chicken-and-egg problem where the first user cannot assign roles to others.

## Glossary

- **Owner**: The System Owner role - highest privilege level, typically the business owner (dioatmando@gama-group.co). Has irrevocable user management permissions. NOT the same as `admin`.
- **Admin**: The Administration Division role - handles document workflow (PJO/JO/Invoice creation). This is a department role, not a system administrator.
- **User Profile**: Database record in `user_profiles` table containing user role and permissions.
- **Pre-registration**: Adding a user to the system before they log in via Google OAuth.
- **Sidebar Navigation**: The left-side menu showing available pages based on user role.
- **Dashboard Redirect**: Automatic routing to role-specific dashboard upon login.
- **Role-Based Navigation**: Filtering menu items based on user's role and permissions.

## Requirements

### Requirement 1

**User Story:** As the system owner, I want to have a dedicated owner role that cannot be demoted, so that I always maintain control over user management.

#### Acceptance Criteria

1. WHEN a user with email matching the configured owner email logs in THEN the System SHALL assign the `owner` role automatically
2. WHEN displaying role options in user management THEN the System SHALL exclude the `owner` role from assignable roles
3. WHEN an owner views the user management page THEN the System SHALL display all users including other owners
4. WHEN any user attempts to modify an owner's role THEN the System SHALL reject the modification and display an error message
5. WHEN the owner role is assigned THEN the System SHALL grant all permissions (can_see_revenue, can_see_profit, can_approve_pjo, can_manage_invoices, can_manage_users, can_create_pjo, can_fill_costs) as true

### Requirement 2

**User Story:** As the system owner, I want to add new users before they log in, so that I can pre-configure their roles and permissions.

#### Acceptance Criteria

1. WHEN an owner clicks "Add User" button THEN the System SHALL display a form requesting email, full name, role, and permissions
2. WHEN an owner submits a valid new user form THEN the System SHALL create a user_profile record with is_active set to true
3. WHEN a pre-registered user logs in via Google OAuth for the first time THEN the System SHALL link their auth account to the existing profile by matching email
4. WHEN an owner attempts to add a user with an existing email THEN the System SHALL reject the submission and display "User already exists"
5. WHEN displaying the user list THEN the System SHALL indicate pre-registered users who have not yet logged in with a "Pending" badge

### Requirement 3

**User Story:** As the system owner, I want to activate or deactivate users, so that I can control system access without deleting user data.

#### Acceptance Criteria

1. WHEN an owner toggles a user's active status to inactive THEN the System SHALL set is_active to false in the user_profile
2. WHEN a deactivated user attempts to access any page THEN the System SHALL redirect them to a "Account Deactivated" page
3. WHEN an owner reactivates a user THEN the System SHALL restore their previous role and permissions
4. WHEN displaying the user list THEN the System SHALL show active/inactive status with visual distinction
5. WHEN an owner attempts to deactivate themselves THEN the System SHALL reject the action and display "Cannot deactivate your own account"

### Requirement 4

**User Story:** As a user, I want the sidebar to show only the menu items relevant to my role, so that I can navigate efficiently.

#### Acceptance Criteria

1. WHEN a user with `owner` role views the sidebar THEN the System SHALL display all menu items including Settings
2. WHEN a user with `admin` role views the sidebar THEN the System SHALL display Dashboard, Customers, Projects, Proforma JO, Job Orders, Invoices, Reports, and Settings
3. WHEN a user with `manager` role views the sidebar THEN the System SHALL display Dashboard, Customers, Projects, Proforma JO, Job Orders, Invoices, and Reports
4. WHEN a user with `ops` role views the sidebar THEN the System SHALL display Dashboard, Projects, Proforma JO, Cost Entry, and Job Orders
5. WHEN a user with `finance` role views the sidebar THEN the System SHALL display Dashboard, Customers, Projects, Proforma JO, Job Orders, Invoices, and Reports
6. WHEN a user with `sales` role views the sidebar THEN the System SHALL display Dashboard, Customers, Projects, Proforma JO, and Reports

### Requirement 5

**User Story:** As a user, I want to be redirected to my role-specific dashboard after login, so that I see relevant information immediately.

#### Acceptance Criteria

1. WHEN a user with `owner` role navigates to /dashboard THEN the System SHALL display the owner dashboard with system-wide metrics
2. WHEN a user with `admin` role navigates to /dashboard THEN the System SHALL display the admin dashboard
3. WHEN a user with `manager` role navigates to /dashboard THEN the System SHALL redirect to /dashboard/manager
4. WHEN a user with `ops` role navigates to /dashboard THEN the System SHALL redirect to /dashboard/ops
5. WHEN a user with `finance` role navigates to /dashboard THEN the System SHALL redirect to /dashboard/finance
6. WHEN a user with `sales` role navigates to /dashboard THEN the System SHALL redirect to /dashboard/sales

### Requirement 6

**User Story:** As the system owner, I want a dashboard showing system health and user activity, so that I can monitor overall system usage.

#### Acceptance Criteria

1. WHEN an owner views their dashboard THEN the System SHALL display total user count by role
2. WHEN an owner views their dashboard THEN the System SHALL display count of active vs inactive users
3. WHEN an owner views their dashboard THEN the System SHALL display recent user login activity (last 7 days)
4. WHEN an owner views their dashboard THEN the System SHALL display system-wide KPIs (total PJOs, JOs, Invoices, Revenue)
5. WHEN an owner views their dashboard THEN the System SHALL provide quick links to user management and reports
