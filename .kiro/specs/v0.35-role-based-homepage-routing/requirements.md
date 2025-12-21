# Requirements Document

## Introduction

This document defines the requirements for implementing intelligent role-based homepage routing in the Gama ERP system. The feature will automatically direct users to the most appropriate dashboard based on their role and permissions, with support for custom overrides and conditional redirect rules.

## Glossary

- **Homepage_Router**: The system component responsible for determining and executing user redirects to appropriate dashboards
- **Role_Homepage**: A database configuration mapping a user role to its default dashboard route
- **Redirect_Rule**: A conditional rule that can override the default homepage based on runtime conditions
- **Custom_Homepage**: A user-specific override that takes precedence over role-based routing
- **Dashboard_Skeleton**: A loading placeholder displayed during route determination

## Requirements

### Requirement 1: Role Homepage Configuration Storage

**User Story:** As a system administrator, I want role-to-homepage mappings stored in the database, so that I can configure default dashboards for each role without code changes.

#### Acceptance Criteria

1. THE Database SHALL store role homepage configurations in a `role_homepages` table with role, homepage_route, fallback_route, and redirect_rules fields
2. WHEN the system initializes, THE Database SHALL contain default homepage configurations for all standard roles (owner, admin, manager, finance, ops, sales, viewer)
3. THE Role_Homepage configuration SHALL enforce unique role values to prevent duplicate mappings
4. WHEN a role homepage is not configured, THE Homepage_Router SHALL use '/dashboard' as the default fallback route

### Requirement 2: User Custom Homepage Override

**User Story:** As a user, I want to set a custom homepage preference, so that I can bypass the role default and go directly to my preferred dashboard.

#### Acceptance Criteria

1. THE Database SHALL support a `custom_homepage` column on the `user_profiles` table
2. WHEN a user has a custom_homepage set, THE Homepage_Router SHALL use the custom homepage instead of the role default
3. WHEN a user has no custom_homepage set, THE Homepage_Router SHALL fall back to the role-based homepage

### Requirement 3: Role-Based Homepage Resolution

**User Story:** As a user, I want to be automatically routed to my role-appropriate dashboard when I log in, so that I see relevant information immediately.

#### Acceptance Criteria

1. WHEN an owner user accesses the application, THE Homepage_Router SHALL route them to '/dashboard/executive'
2. WHEN an admin user accesses the application, THE Homepage_Router SHALL route them to '/dashboard/admin'
3. WHEN a manager user accesses the application, THE Homepage_Router SHALL route them to '/dashboard/manager'
4. WHEN a finance user accesses the application, THE Homepage_Router SHALL route them to '/dashboard/finance'
5. WHEN an ops user accesses the application, THE Homepage_Router SHALL route them to '/dashboard/operations'
6. WHEN a sales user accesses the application, THE Homepage_Router SHALL route them to '/dashboard/sales'
7. WHEN a viewer user accesses the application, THE Homepage_Router SHALL route them to '/dashboard/viewer'

### Requirement 4: Conditional Redirect Rules

**User Story:** As a manager, I want to be redirected to the approvals page when I have pending items, so that I can address urgent matters immediately.

#### Acceptance Criteria

1. THE Role_Homepage configuration SHALL support an array of redirect_rules in JSONB format
2. WHEN evaluating redirect rules, THE Homepage_Router SHALL check each condition in order and redirect to the first matching rule's route
3. WHEN the 'has_pending_approvals' condition is evaluated, THE Homepage_Router SHALL return true if the user has manager/admin/owner role AND there are pending BKK approvals
4. WHEN the 'has_urgent_items' condition is evaluated, THE Homepage_Router SHALL return true if there are items requiring immediate attention
5. WHEN no redirect rules match, THE Homepage_Router SHALL use the default homepage_route

### Requirement 5: Middleware Route Protection

**User Story:** As a system administrator, I want unauthenticated users redirected to login and authenticated users routed appropriately, so that the application is secure and user-friendly.

#### Acceptance Criteria

1. WHEN an unauthenticated user accesses any protected route, THE Middleware SHALL redirect them to '/login'
2. WHEN an authenticated user accesses the root path '/', THE Middleware SHALL redirect them to their resolved homepage
3. WHEN an authenticated user accesses '/dashboard' without a specific path, THE Middleware SHALL redirect them to their resolved homepage
4. WHEN an authenticated user accesses a specific dashboard path, THE Middleware SHALL allow the request to proceed

### Requirement 6: User Experience During Routing

**User Story:** As a user, I want a smooth transition when being routed to my dashboard, so that I don't see flickering or wrong content.

#### Acceptance Criteria

1. WHILE the Homepage_Router is determining the destination, THE Dashboard_Skeleton SHALL be displayed
2. WHEN the homepage is resolved, THE Homepage_Router SHALL use router.replace() to prevent back-button issues
3. THE Homepage_Router SHALL complete routing without showing intermediate dashboard content
4. WHEN routing completes, THE URL SHALL reflect the final destination dashboard
