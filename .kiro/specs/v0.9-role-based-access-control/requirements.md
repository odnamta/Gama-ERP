# Requirements: Role-Based Access Control (RBAC)

## Overview
Implement a comprehensive role-based access control system that restricts user access based on their role. Key requirement: Operations users must NOT see revenue/profit data - only costs.

## Actors
- **Admin**: Full system access, can manage user permissions
- **Manager**: Approve PJOs, view all financial data, reports
- **Ops**: Execute JOs, fill costs, NO revenue/profit visibility
- **Finance**: Manage invoices, view AR, quotation monitoring
- **Viewer**: Read-only limited access

## User Stories

### 1. User Profile Management
**ID**: RBAC-1
**As an** authenticated user
**I want to** have a profile with role and permissions
**So that** the system knows what I can access

**Acceptance Criteria (EARS format)**:
- WHEN a user logs in via Google OAuth, IF no profile exists, THEN the system creates a default profile with 'viewer' role
- WHEN a profile exists, THEN the system loads the user's role and permissions
- WHERE permissions are stored, THEN they include: can_see_revenue, can_see_profit, can_approve_pjo, can_manage_invoices, can_manage_users

### 2. Admin User Management
**ID**: RBAC-2
**As an** admin user
**I want to** manage other users' roles and permissions
**So that** I can control who has access to what

**Acceptance Criteria**:
- WHEN admin accesses /settings/users, THEN they see a list of all users with their roles
- WHEN admin edits a user, THEN they can change role and individual permissions
- WHEN admin changes a role, THEN default permissions for that role are applied
- WHEN admin saves changes, THEN the user's permissions are updated immediately

### 3. Ops Revenue Hiding
**ID**: RBAC-3
**As an** ops user
**I want to** see only cost-related information
**So that** I can focus on my job without seeing sensitive financial data

**Acceptance Criteria**:
- WHEN ops user views PJO list, THEN revenue and profit columns are hidden
- WHEN ops user views PJO detail, THEN revenue items section is hidden
- WHEN ops user views JO, THEN only cost information is visible
- WHEN ops user views dashboard, THEN only ops-relevant KPIs are shown (no AR, no profit)

### 4. Role-Based Dashboard
**ID**: RBAC-4
**As a** user with a specific role
**I want to** see a dashboard tailored to my role
**So that** I see relevant information for my job

**Acceptance Criteria**:
- WHEN admin/manager views dashboard, THEN all KPIs and sections are visible
- WHEN ops user views dashboard, THEN only: Awaiting Ops Input, Operations Queue are visible
- WHEN finance user views dashboard, THEN: Outstanding AR, Budget Health, Recent Activity are visible
- WHEN viewer views dashboard, THEN only basic project counts are visible

### 5. Navigation Filtering
**ID**: RBAC-5
**As a** user with restricted access
**I want to** only see navigation items I can access
**So that** I don't get confused by inaccessible features

**Acceptance Criteria**:
- WHEN ops user views sidebar, THEN Invoices menu is hidden
- WHEN viewer views sidebar, THEN only Dashboard and Projects are visible
- WHEN finance user views sidebar, THEN User Management is hidden
- WHEN admin views sidebar, THEN all menu items are visible

### 6. PJO Approval Permission
**ID**: RBAC-6
**As a** manager or admin
**I want to** approve/reject PJOs
**So that** the workflow can proceed

**Acceptance Criteria**:
- WHEN user with can_approve_pjo=true views pending PJO, THEN approve/reject buttons are visible
- WHEN user with can_approve_pjo=false views pending PJO, THEN approve/reject buttons are hidden
- WHEN unauthorized user tries to approve via API, THEN request is rejected with 403

### 7. Invoice Management Permission
**ID**: RBAC-7
**As a** finance or admin user
**I want to** manage invoices
**So that** I can handle billing

**Acceptance Criteria**:
- WHEN user with can_manage_invoices=true accesses /invoices, THEN full CRUD is available
- WHEN user with can_manage_invoices=false accesses /invoices, THEN page shows "Access Denied"
- WHEN ops user navigates, THEN /invoices link is not visible

### 8. Permission Context Provider
**ID**: RBAC-8
**As a** developer
**I want to** access user permissions throughout the app
**So that** I can conditionally render UI elements

**Acceptance Criteria**:
- WHEN app loads, THEN user permissions are fetched and stored in context
- WHEN permissions change, THEN context is updated
- WHEN component needs permission check, THEN it can use usePermissions() hook

### 9. Existing User Migration
**ID**: RBAC-9
**As an** admin
**I want to** existing users to have correct permissions
**So that** the system works correctly after deployment

**Acceptance Criteria**:
- WHEN migration runs, THEN dioatmando@gama-group.co has admin role with full permissions
- WHEN migration runs, THEN other @gama-group.co users have manager role
- WHEN new user signs up, THEN they get viewer role by default

## Permission Matrix

| Feature | Admin | Manager | Ops | Finance | Viewer |
|---------|-------|---------|-----|---------|--------|
| Dashboard - Full KPIs | ✅ | ✅ | ❌ | ❌ | ❌ |
| Dashboard - Ops KPIs | ✅ | ✅ | ✅ | ❌ | ❌ |
| Dashboard - Finance KPIs | ✅ | ✅ | ❌ | ✅ | ❌ |
| Customers - CRUD | ✅ | ✅ | ❌ | ❌ | ❌ |
| Customers - View | ✅ | ✅ | ❌ | ✅ | ✅ |
| Projects - CRUD | ✅ | ✅ | ❌ | ❌ | ❌ |
| Projects - View | ✅ | ✅ | ✅ | ✅ | ✅ |
| PJO - Create | ✅ | ✅ | ❌ | ✅ | ❌ |
| PJO - View Revenue | ✅ | ✅ | ❌ | ✅ | ❌ |
| PJO - View Costs | ✅ | ✅ | ✅ | ✅ | ❌ |
| PJO - Approve | ✅ | ✅ | ❌ | ❌ | ❌ |
| JO - View Full | ✅ | ✅ | ❌ | ✅ | ❌ |
| JO - View Costs Only | ✅ | ✅ | ✅ | ✅ | ❌ |
| JO - Fill Costs | ✅ | ✅ | ✅ | ❌ | ❌ |
| Invoices - CRUD | ✅ | ❌ | ❌ | ✅ | ❌ |
| Invoices - View | ✅ | ✅ | ❌ | ✅ | ❌ |
| Reports - P&L | ✅ | ✅ | ❌ | ✅ | ❌ |
| User Management | ✅ | ❌ | ❌ | ❌ | ❌ |

## Non-Functional Requirements

### Security
- All permission checks must happen server-side
- Client-side checks are for UX only, not security
- RLS policies must enforce permissions at database level

### Performance
- User permissions cached in session
- Permission checks should not add noticeable latency

### Audit
- Permission changes should be logged to activity_log
