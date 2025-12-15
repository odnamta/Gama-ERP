# Design: Role-Based Access Control (RBAC)

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client Layer                              │
├─────────────────────────────────────────────────────────────────┤
│  PermissionProvider (Context)                                    │
│    └── usePermissions() hook                                     │
│    └── <PermissionGate> component                                │
│    └── <HideForRole> / <ShowForRole> components                  │
├─────────────────────────────────────────────────────────────────┤
│                        Server Layer                              │
├─────────────────────────────────────────────────────────────────┤
│  Middleware: checkPermission()                                   │
│  Server Actions: requirePermission()                             │
│  lib/permissions.ts: permission utilities                        │
├─────────────────────────────────────────────────────────────────┤
│                        Database Layer                            │
├─────────────────────────────────────────────────────────────────┤
│  user_profiles table                                             │
│  RLS policies with permission checks                             │
└─────────────────────────────────────────────────────────────────┘
```

## Database Schema

### user_profiles Table
```sql
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'viewer' 
    CHECK (role IN ('admin', 'manager', 'ops', 'finance', 'viewer')),
  
  -- Granular permissions (can override role defaults)
  can_see_revenue BOOLEAN NOT NULL DEFAULT false,
  can_see_profit BOOLEAN NOT NULL DEFAULT false,
  can_approve_pjo BOOLEAN NOT NULL DEFAULT false,
  can_manage_invoices BOOLEAN NOT NULL DEFAULT false,
  can_manage_users BOOLEAN NOT NULL DEFAULT false,
  can_create_pjo BOOLEAN NOT NULL DEFAULT false,
  can_fill_costs BOOLEAN NOT NULL DEFAULT false,
  
  -- Dashboard customization
  custom_dashboard TEXT DEFAULT 'default'
    CHECK (custom_dashboard IN ('admin', 'manager', 'ops', 'finance', 'viewer', 'default')),
  
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_user_profiles_email ON user_profiles(email);
CREATE INDEX idx_user_profiles_role ON user_profiles(role);
```

### RLS Policies
```sql
-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
  ON user_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() AND can_manage_users = true
    )
  );

-- Admins can update profiles
CREATE POLICY "Admins can update profiles"
  ON user_profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() AND can_manage_users = true
    )
  );

-- System can insert profiles (for new user creation)
CREATE POLICY "System can insert profiles"
  ON user_profiles FOR INSERT
  WITH CHECK (true);
```

## Type Definitions

```typescript
// types/permissions.ts

export type UserRole = 'admin' | 'manager' | 'ops' | 'finance' | 'viewer'

export type DashboardType = 'admin' | 'manager' | 'ops' | 'finance' | 'viewer' | 'default'

export interface UserPermissions {
  can_see_revenue: boolean
  can_see_profit: boolean
  can_approve_pjo: boolean
  can_manage_invoices: boolean
  can_manage_users: boolean
  can_create_pjo: boolean
  can_fill_costs: boolean
}

export interface UserProfile {
  id: string
  user_id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  role: UserRole
  custom_dashboard: DashboardType
  is_active: boolean
  created_at: string
  updated_at: string
  // Permissions
  can_see_revenue: boolean
  can_see_profit: boolean
  can_approve_pjo: boolean
  can_manage_invoices: boolean
  can_manage_users: boolean
  can_create_pjo: boolean
  can_fill_costs: boolean
}

export interface PermissionContext {
  profile: UserProfile | null
  isLoading: boolean
  hasPermission: (permission: keyof UserPermissions) => boolean
  isRole: (role: UserRole | UserRole[]) => boolean
  canAccess: (feature: FeatureKey) => boolean
}

export type FeatureKey = 
  | 'dashboard.full'
  | 'dashboard.ops'
  | 'dashboard.finance'
  | 'customers.crud'
  | 'customers.view'
  | 'projects.crud'
  | 'projects.view'
  | 'pjo.create'
  | 'pjo.view_revenue'
  | 'pjo.view_costs'
  | 'pjo.approve'
  | 'jo.view_full'
  | 'jo.view_costs'
  | 'jo.fill_costs'
  | 'invoices.crud'
  | 'invoices.view'
  | 'reports.pnl'
  | 'users.manage'
```

## Default Permissions by Role

```typescript
// lib/permissions.ts

export const DEFAULT_PERMISSIONS: Record<UserRole, UserPermissions> = {
  admin: {
    can_see_revenue: true,
    can_see_profit: true,
    can_approve_pjo: true,
    can_manage_invoices: true,
    can_manage_users: true,
    can_create_pjo: true,
    can_fill_costs: true,
  },
  manager: {
    can_see_revenue: true,
    can_see_profit: true,
    can_approve_pjo: true,
    can_manage_invoices: false,
    can_manage_users: false,
    can_create_pjo: true,
    can_fill_costs: true,
  },
  ops: {
    can_see_revenue: false,  // CRITICAL: Hidden
    can_see_profit: false,   // CRITICAL: Hidden
    can_approve_pjo: false,
    can_manage_invoices: false,
    can_manage_users: false,
    can_create_pjo: false,
    can_fill_costs: true,
  },
  finance: {
    can_see_revenue: true,
    can_see_profit: true,
    can_approve_pjo: false,
    can_manage_invoices: true,
    can_manage_users: false,
    can_create_pjo: true,
    can_fill_costs: false,
  },
  viewer: {
    can_see_revenue: false,
    can_see_profit: false,
    can_approve_pjo: false,
    can_manage_invoices: false,
    can_manage_users: false,
    can_create_pjo: false,
    can_fill_costs: false,
  },
}
```

## Component Architecture

### PermissionProvider
```typescript
// components/providers/permission-provider.tsx

'use client'

export function PermissionProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchUserProfile().then(setProfile).finally(() => setIsLoading(false))
  }, [])

  const hasPermission = (permission: keyof UserPermissions) => {
    return profile?.[permission] ?? false
  }

  const isRole = (role: UserRole | UserRole[]) => {
    if (!profile) return false
    const roles = Array.isArray(role) ? role : [role]
    return roles.includes(profile.role)
  }

  return (
    <PermissionContext.Provider value={{ profile, isLoading, hasPermission, isRole }}>
      {children}
    </PermissionContext.Provider>
  )
}
```

### PermissionGate Component
```typescript
// components/permission-gate.tsx

interface PermissionGateProps {
  permission?: keyof UserPermissions
  role?: UserRole | UserRole[]
  fallback?: React.ReactNode
  children: React.ReactNode
}

export function PermissionGate({ 
  permission, 
  role, 
  fallback = null, 
  children 
}: PermissionGateProps) {
  const { hasPermission, isRole } = usePermissions()

  if (permission && !hasPermission(permission)) return fallback
  if (role && !isRole(role)) return fallback

  return children
}
```

### Usage Examples
```tsx
// Hide revenue for ops users
<PermissionGate permission="can_see_revenue">
  <RevenueColumn value={pjo.total_revenue} />
</PermissionGate>

// Show only for admin
<PermissionGate role="admin">
  <UserManagementLink />
</PermissionGate>

// Show for multiple roles
<PermissionGate role={['admin', 'manager']}>
  <ApproveButton />
</PermissionGate>
```

## Server-Side Permission Checks

```typescript
// lib/permissions-server.ts

export async function requirePermission(
  permission: keyof UserPermissions
): Promise<UserProfile> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('Unauthorized')
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!profile || !profile[permission]) {
    throw new Error('Forbidden')
  }

  return profile
}

// Usage in server action
export async function approvePJO(id: string) {
  await requirePermission('can_approve_pjo')
  // ... rest of logic
}
```

## Navigation Configuration

```typescript
// lib/navigation.ts

export const NAV_ITEMS = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    roles: ['admin', 'manager', 'ops', 'finance', 'viewer'],
  },
  {
    title: 'Customers',
    href: '/customers',
    icon: Users,
    roles: ['admin', 'manager', 'finance'],
  },
  {
    title: 'Projects',
    href: '/projects',
    icon: FolderKanban,
    roles: ['admin', 'manager', 'ops', 'finance', 'viewer'],
  },
  {
    title: 'Proforma JO',
    href: '/proforma-jo',
    icon: FileText,
    roles: ['admin', 'manager', 'ops', 'finance'],
  },
  {
    title: 'Job Orders',
    href: '/job-orders',
    icon: Briefcase,
    roles: ['admin', 'manager', 'ops', 'finance'],
  },
  {
    title: 'Invoices',
    href: '/invoices',
    icon: Receipt,
    roles: ['admin', 'finance'],
  },
  {
    title: 'Settings',
    href: '/settings',
    icon: Settings,
    roles: ['admin'],
    children: [
      { title: 'Users', href: '/settings/users', permission: 'can_manage_users' },
    ],
  },
]
```

## Correctness Properties

### Property 1: Role-Permission Consistency
- GIVEN a user with role X
- WHEN default permissions are applied
- THEN permissions match DEFAULT_PERMISSIONS[X]

### Property 2: Ops Revenue Hiding
- GIVEN a user with can_see_revenue=false
- WHEN viewing any page with revenue data
- THEN revenue values are not rendered

### Property 3: Permission Inheritance
- GIVEN a user with custom permissions
- WHEN permission is explicitly set
- THEN custom value overrides role default

### Property 4: Server-Side Enforcement
- GIVEN a user without can_approve_pjo
- WHEN calling approvePJO() server action
- THEN request is rejected with 403

### Property 5: Navigation Filtering
- GIVEN a user with role X
- WHEN rendering navigation
- THEN only items with X in roles array are shown

### Property 6: Profile Auto-Creation
- GIVEN a new user logging in
- WHEN no profile exists
- THEN profile is created with viewer role

### Property 7: Admin Self-Protection
- GIVEN an admin editing their own profile
- WHEN trying to remove can_manage_users
- THEN operation is prevented (at least one admin required)

## Migration Strategy

1. Create user_profiles table
2. Create RLS policies
3. Migrate existing users:
   - dioatmando@gama-group.co → admin
   - Other @gama-group.co → manager
4. Add PermissionProvider to app layout
5. Update components to use permission checks
6. Update server actions with requirePermission()
