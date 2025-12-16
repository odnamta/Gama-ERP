# Design Document: Owner Dashboard & Navigation

## Overview

This feature adds the `owner` role (System Owner) to the Gama ERP system and enhances sidebar navigation with role-based routing. The owner role is distinct from `admin` (Administration Division) and represents the business owner with full system control.

**Key Distinction:**
- `owner` = System Owner (business owner, full control, user management)
- `admin` = Administration Division (document workflow - PJO/JO/Invoice)

## Architecture

```mermaid
graph TB
    subgraph "Authentication Flow"
        A[Google OAuth Login] --> B{Email Match?}
        B -->|Owner Email| C[Assign Owner Role]
        B -->|Pre-registered| D[Link to Existing Profile]
        B -->|New User| E[Create Default Profile]
    end
    
    subgraph "Navigation System"
        F[Sidebar Component] --> G[filterNavItems]
        G --> H{User Role}
        H --> I[Owner: All Items]
        H --> J[Admin: Admin Items]
        H --> K[Other: Role-specific Items]
    end
    
    subgraph "Dashboard Routing"
        L[/dashboard] --> M{Check Role}
        M -->|owner| N[Owner Dashboard]
        M -->|admin| O[Admin Dashboard]
        M -->|manager| P[Redirect /dashboard/manager]
        M -->|ops| Q[Redirect /dashboard/ops]
        M -->|finance| R[Redirect /dashboard/finance]
        M -->|sales| S[Redirect /dashboard/sales]
    end
```

## Components and Interfaces

### 1. Type Definitions

```typescript
// types/permissions.ts - Updated
export type UserRole = 'owner' | 'admin' | 'manager' | 'ops' | 'finance' | 'sales' | 'viewer'

export interface UserProfile {
  id: string
  user_id: string | null  // null for pre-registered users
  email: string
  full_name: string | null
  avatar_url: string | null
  role: UserRole
  custom_dashboard: DashboardType
  is_active: boolean
  created_at: string
  updated_at: string
  last_login_at: string | null  // NEW: track login activity
  // Permissions
  can_see_revenue: boolean
  can_see_profit: boolean
  can_approve_pjo: boolean
  can_manage_invoices: boolean
  can_manage_users: boolean
  can_create_pjo: boolean
  can_fill_costs: boolean
}
```

### 2. Permission Utilities

```typescript
// lib/permissions.ts - Updated
export const OWNER_EMAIL = 'dioatmando@gama-group.co'

export const DEFAULT_PERMISSIONS: Record<UserRole, UserPermissions> = {
  owner: {
    can_see_revenue: true,
    can_see_profit: true,
    can_approve_pjo: true,
    can_manage_invoices: true,
    can_manage_users: true,
    can_create_pjo: true,
    can_fill_costs: true,
  },
  // ... existing roles unchanged
}

export function getAssignableRoles(): UserRole[] {
  // Owner role cannot be assigned through UI
  return ['admin', 'manager', 'ops', 'finance', 'sales', 'viewer']
}

export function canModifyUser(actorRole: UserRole, targetRole: UserRole): boolean {
  // Owner cannot be modified by anyone
  if (targetRole === 'owner') return false
  // Only owner can modify users
  return actorRole === 'owner'
}
```

### 3. Navigation Configuration

```typescript
// lib/navigation.ts - Updated
export const NAV_ITEMS: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    roles: ['owner', 'admin', 'manager', 'ops', 'finance', 'sales', 'viewer'],
  },
  {
    title: 'Customers',
    href: '/customers',
    icon: Users,
    roles: ['owner', 'admin', 'manager', 'finance', 'sales'],
  },
  {
    title: 'Projects',
    href: '/projects',
    icon: FolderKanban,
    roles: ['owner', 'admin', 'manager', 'ops', 'finance', 'sales', 'viewer'],
  },
  {
    title: 'Proforma JO',
    href: '/proforma-jo',
    icon: FileText,
    roles: ['owner', 'admin', 'manager', 'ops', 'finance', 'sales'],
  },
  {
    title: 'Cost Entry',
    href: '/cost-entry',
    icon: Calculator,
    roles: ['owner', 'admin', 'ops'],
  },
  {
    title: 'Job Orders',
    href: '/job-orders',
    icon: Briefcase,
    roles: ['owner', 'admin', 'manager', 'ops', 'finance'],
  },
  {
    title: 'Invoices',
    href: '/invoices',
    icon: Receipt,
    roles: ['owner', 'admin', 'finance'],
    permission: 'can_manage_invoices',
  },
  {
    title: 'Reports',
    href: '/reports',
    icon: BarChart3,
    roles: ['owner', 'admin', 'manager', 'ops', 'finance', 'sales'],
  },
  {
    title: 'Settings',
    href: '/settings',
    icon: Settings,
    roles: ['owner', 'admin'],
    children: [
      { title: 'Users', href: '/settings/users', permission: 'can_manage_users' },
    ],
  },
]

export function getDashboardPath(role: UserRole): string {
  const dashboardMap: Record<UserRole, string> = {
    owner: '/dashboard',
    admin: '/dashboard',
    manager: '/dashboard/manager',
    ops: '/dashboard/ops',
    finance: '/dashboard/finance',
    sales: '/dashboard/sales',
    viewer: '/dashboard',
  }
  return dashboardMap[role] || '/dashboard'
}
```

### 4. User Management Functions

```typescript
// lib/permissions-server.ts - New functions

export async function createPreregisteredUser(
  email: string,
  fullName: string,
  role: UserRole,
  permissions: UserPermissions
): Promise<{ success: boolean; error?: string }> {
  // Validate not owner role
  // Check email doesn't exist
  // Create profile with user_id = null
}

export async function toggleUserActive(
  targetUserId: string,
  actorUserId: string
): Promise<{ success: boolean; error?: string }> {
  // Prevent self-deactivation
  // Prevent deactivating owner
  // Toggle is_active
}

export async function isOwnerEmail(email: string): Promise<boolean> {
  return email.toLowerCase() === OWNER_EMAIL.toLowerCase()
}
```

## Data Models

### Database Changes

```sql
-- Add last_login_at column to user_profiles
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;

-- Update role check constraint to include 'owner'
ALTER TABLE user_profiles 
DROP CONSTRAINT IF EXISTS user_profiles_role_check;

ALTER TABLE user_profiles 
ADD CONSTRAINT user_profiles_role_check 
CHECK (role IN ('owner', 'admin', 'manager', 'ops', 'finance', 'sales', 'viewer'));

-- Allow null user_id for pre-registered users
ALTER TABLE user_profiles 
ALTER COLUMN user_id DROP NOT NULL;

-- Add unique constraint on email
ALTER TABLE user_profiles
ADD CONSTRAINT user_profiles_email_unique UNIQUE (email);
```

### Owner Dashboard Data Model

```typescript
interface OwnerDashboardData {
  userMetrics: {
    totalUsers: number
    activeUsers: number
    inactiveUsers: number
    usersByRole: Record<UserRole, number>
    pendingUsers: number  // pre-registered but not logged in
  }
  recentLogins: {
    userId: string
    email: string
    fullName: string
    lastLoginAt: string
  }[]
  systemKPIs: {
    totalPJOs: number
    totalJOs: number
    totalInvoices: number
    totalRevenue: number
    totalProfit: number
  }
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Owner email auto-assignment
*For any* login attempt, if the email matches the configured owner email (case-insensitive), the resulting profile role SHALL be 'owner'
**Validates: Requirements 1.1**

### Property 2: Owner role exclusion from assignable roles
*For any* call to getAssignableRoles(), the returned array SHALL NOT contain 'owner'
**Validates: Requirements 1.2**

### Property 3: Owner role immutability
*For any* attempt to modify a user profile where the target role is 'owner', the modification SHALL be rejected
**Validates: Requirements 1.4**

### Property 4: Owner permissions completeness
*For any* user with role 'owner', all permission flags (can_see_revenue, can_see_profit, can_approve_pjo, can_manage_invoices, can_manage_users, can_create_pjo, can_fill_costs) SHALL be true
**Validates: Requirements 1.5**

### Property 5: Pre-registration creates inactive-auth profile
*For any* valid pre-registration request, the created profile SHALL have user_id as null and is_active as true
**Validates: Requirements 2.2**

### Property 6: Pre-registration email uniqueness
*For any* pre-registration attempt with an email that already exists in user_profiles, the operation SHALL be rejected
**Validates: Requirements 2.4**

### Property 7: Pending user identification
*For any* user profile where user_id is null, the user SHALL be identified as "pending" (not yet logged in)
**Validates: Requirements 2.5**

### Property 8: Profile linking on first login
*For any* first-time login where a pre-registered profile exists with matching email, the auth user_id SHALL be linked to that existing profile
**Validates: Requirements 2.3**

### Property 9: User deactivation sets is_active false
*For any* valid deactivation request, the target user's is_active flag SHALL be set to false
**Validates: Requirements 3.1**

### Property 10: Inactive user redirect
*For any* page access attempt by a user with is_active=false, the request SHALL be redirected to the deactivated account page
**Validates: Requirements 3.2**

### Property 11: Reactivation preserves role and permissions
*For any* user that is deactivated then reactivated, the role and all permission flags SHALL remain unchanged
**Validates: Requirements 3.3**

### Property 12: Self-deactivation prevention
*For any* deactivation attempt where actor user_id equals target user_id, the operation SHALL be rejected
**Validates: Requirements 3.5**

### Property 13: Owner navigation completeness
*For any* call to filterNavItems with role 'owner', the result SHALL include all navigation items
**Validates: Requirements 4.1**

### Property 14: Role-based navigation filtering
*For any* role and call to filterNavItems, the returned items SHALL only include items where the role is in the item's roles array
**Validates: Requirements 4.2, 4.3, 4.4, 4.5, 4.6**

### Property 15: Dashboard path mapping
*For any* role, getDashboardPath SHALL return the correct role-specific dashboard path as defined in the mapping
**Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5, 5.6**

## Error Handling

| Error Scenario | Error Message | HTTP Status |
|----------------|---------------|-------------|
| Attempt to assign owner role | "Owner role cannot be assigned" | 403 |
| Attempt to modify owner | "Cannot modify owner account" | 403 |
| Duplicate email on pre-registration | "User with this email already exists" | 409 |
| Self-deactivation attempt | "Cannot deactivate your own account" | 403 |
| Deactivate owner attempt | "Cannot deactivate owner account" | 403 |
| Inactive user access | Redirect to /account-deactivated | 302 |
| Invalid role assignment | "Invalid role specified" | 400 |

## Testing Strategy

### Property-Based Testing

The project uses **Vitest** with **fast-check** for property-based testing.

Each correctness property will be implemented as a property-based test that:
- Generates random valid inputs using fast-check arbitraries
- Verifies the property holds across 100+ iterations
- Tags the test with the property number and requirements reference

Example structure:
```typescript
describe('Owner Role Properties', () => {
  it('Property 2: Owner role exclusion from assignable roles', () => {
    // **Feature: v0.9.0-owner-dashboard-navigation, Property 2: Owner role exclusion**
    // **Validates: Requirements 1.2**
    const assignableRoles = getAssignableRoles()
    expect(assignableRoles).not.toContain('owner')
  })

  it('Property 4: Owner permissions completeness', () => {
    fc.assert(
      fc.property(fc.constant('owner'), (role) => {
        // **Feature: v0.9.0-owner-dashboard-navigation, Property 4: Owner permissions completeness**
        // **Validates: Requirements 1.5**
        const permissions = getDefaultPermissions(role)
        return Object.values(permissions).every(v => v === true)
      })
    )
  })
})
```

### Unit Tests

- Test owner email matching (case-insensitive)
- Test navigation filtering for each role
- Test dashboard path mapping
- Test user creation and linking flows
- Test activation/deactivation logic
