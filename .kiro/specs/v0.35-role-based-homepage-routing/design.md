# Design Document: Role-Based Homepage Routing

## Overview

This design implements intelligent role-based homepage routing for the Gama ERP system. The feature automatically directs users to their most appropriate dashboard based on their role, with support for custom overrides and conditional redirect rules. The implementation integrates with the existing middleware and permissions system while adding new database-driven configuration capabilities.

## Architecture

The homepage routing system follows a layered architecture:

```
┌─────────────────────────────────────────────────────────────┐
│                      Next.js Middleware                      │
│  (Authentication check, route interception, redirect logic)  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Homepage Router Service                   │
│  (Resolves homepage based on user, role, and conditions)    │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│  User Profile   │ │ Role Homepages  │ │ Condition       │
│  (custom_home)  │ │ (role configs)  │ │ Evaluators      │
└─────────────────┘ └─────────────────┘ └─────────────────┘
```

### Route Resolution Priority

1. **Custom Homepage** (highest priority) - User-specific override
2. **Redirect Rules** - Conditional redirects based on runtime state
3. **Role Homepage** - Default route for the user's role
4. **Fallback Route** - '/dashboard' if nothing else matches

## Components and Interfaces

### Database Schema

```sql
-- Role homepage configurations
CREATE TABLE role_homepages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role VARCHAR(30) UNIQUE NOT NULL,
  homepage_route VARCHAR(200) NOT NULL,
  fallback_route VARCHAR(200) DEFAULT '/dashboard',
  redirect_rules JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User profile extension
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS custom_homepage VARCHAR(200);
```

### TypeScript Interfaces

```typescript
// lib/homepage-routing-types.ts

export interface RoleHomepage {
  id: string;
  role: string;
  homepage_route: string;
  fallback_route: string;
  redirect_rules: RedirectRule[];
  created_at: string;
}

export interface RedirectRule {
  condition: RedirectCondition;
  route: string;
}

export type RedirectCondition = 
  | 'has_pending_approvals'
  | 'has_urgent_items'
  | 'first_login_today';

export interface HomepageResolutionResult {
  route: string;
  source: 'custom' | 'redirect_rule' | 'role_default' | 'fallback';
  matchedCondition?: RedirectCondition;
}
```

### Homepage Router Utility

```typescript
// lib/homepage-routing-utils.ts

/**
 * Get the resolved homepage for a user
 * Priority: custom_homepage > redirect_rules > role_homepage > fallback
 */
export async function getUserHomepage(
  userId: string
): Promise<HomepageResolutionResult>;

/**
 * Get homepage route for a role (without user context)
 */
export function getRoleHomepage(role: UserRole): string;

/**
 * Evaluate a redirect condition for a user
 */
export async function evaluateCondition(
  userId: string,
  condition: RedirectCondition
): Promise<boolean>;

/**
 * Check if user has pending approvals
 */
export async function hasPendingApprovals(userId: string): Promise<boolean>;

/**
 * Check if user has urgent items requiring attention
 */
export async function hasUrgentItems(userId: string): Promise<boolean>;

/**
 * Check if this is the user's first login today
 */
export async function isFirstLoginToday(userId: string): Promise<boolean>;
```

### Default Role Mappings

| Role | Homepage Route | Fallback Route |
|------|---------------|----------------|
| owner | /dashboard/executive | /dashboard |
| admin | /dashboard/admin | /dashboard |
| manager | /dashboard/manager | /dashboard |
| finance | /dashboard/finance | /dashboard |
| ops | /dashboard/operations | /dashboard |
| sales | /dashboard/sales | /dashboard |
| viewer | /dashboard/viewer | /dashboard |

## Data Models

### Role Homepage Configuration

```typescript
interface RoleHomepageConfig {
  id: string;
  role: UserRole;
  homepage_route: string;
  fallback_route: string;
  redirect_rules: RedirectRule[];
  created_at: string;
}
```

### Redirect Rule Structure

```typescript
interface RedirectRule {
  condition: RedirectCondition;
  route: string;
}

// Example redirect rules for manager role:
const managerRedirectRules: RedirectRule[] = [
  { condition: 'has_pending_approvals', route: '/finance/bkk?status=pending' },
  { condition: 'has_urgent_items', route: '/dashboard/manager?urgent=true' }
];
```

### User Profile Extension

The existing `user_profiles` table is extended with:

```typescript
interface UserProfileExtension {
  custom_homepage: string | null;  // User-specific override
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Custom Homepage Override Priority

*For any* user with a non-null `custom_homepage` value, the resolved homepage SHALL equal the `custom_homepage` value, regardless of their role or redirect rules.

**Validates: Requirements 2.2**

### Property 2: Role-to-Route Mapping Consistency

*For any* user with a known role (owner, admin, manager, finance, ops, sales, viewer) and no custom homepage, when no redirect rules match, the resolved homepage SHALL equal the `homepage_route` configured for that role in the `role_homepages` table.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7**

### Property 3: Unknown Role Fallback

*For any* user whose role is not configured in the `role_homepages` table, the resolved homepage SHALL be '/dashboard'.

**Validates: Requirements 1.4**

### Property 4: Redirect Rule Order Evaluation

*For any* set of redirect rules where multiple conditions evaluate to true, the Homepage_Router SHALL return the route from the first matching rule in the array order.

**Validates: Requirements 4.2**

### Property 5: Pending Approvals Condition

*For any* user, the `has_pending_approvals` condition SHALL return true if and only if:
1. The user's role is in ['owner', 'admin', 'manager'], AND
2. There exists at least one BKK record with status 'pending'

**Validates: Requirements 4.3**

### Property 6: Unauthenticated User Redirect

*For any* request to a protected route without a valid session, the middleware SHALL redirect to '/login'.

**Validates: Requirements 5.1**

### Property 7: Root Path Redirect

*For any* authenticated user accessing the root path '/', the middleware SHALL redirect to their resolved homepage.

**Validates: Requirements 5.2**

### Property 8: Dashboard Path Redirect

*For any* authenticated user accessing '/dashboard' (without a specific sub-path), the middleware SHALL redirect to their resolved homepage.

**Validates: Requirements 5.3**

## Error Handling

### Database Errors

- If `role_homepages` table query fails, fall back to hardcoded defaults
- If `user_profiles` query fails, redirect to '/dashboard'
- Log all database errors for monitoring

### Invalid Configuration

- If `homepage_route` is empty or invalid, use `fallback_route`
- If `fallback_route` is also invalid, use '/dashboard'
- Validate routes start with '/' before redirecting

### Condition Evaluation Errors

- If a condition evaluator throws an error, treat condition as false
- Log condition evaluation errors but don't block routing
- Continue to next condition or fall back to default route

## Testing Strategy

### Unit Tests

Unit tests will verify specific examples and edge cases:

1. **Route Resolution Logic**
   - Custom homepage takes precedence over role default
   - Role default used when no custom homepage
   - Fallback used for unknown roles

2. **Condition Evaluators**
   - `hasPendingApprovals` returns correct boolean
   - `hasUrgentItems` returns correct boolean
   - Error handling in condition evaluation

3. **Middleware Integration**
   - Unauthenticated users redirected to login
   - Root path triggers homepage resolution
   - Specific dashboard paths allowed through

### Property-Based Tests

Property-based tests will verify universal properties across many generated inputs using `fast-check`:

1. **Property 1**: Custom homepage override (generate random users with custom homepages)
2. **Property 2**: Role-to-route mapping (generate users with each role)
3. **Property 3**: Unknown role fallback (generate random role strings)
4. **Property 4**: Redirect rule ordering (generate rule arrays with multiple matching conditions)
5. **Property 5**: Pending approvals condition (generate users with various roles and BKK states)

### Test Configuration

- Property tests: minimum 100 iterations per property
- Use `fast-check` for property-based testing
- Tag format: **Feature: role-based-homepage-routing, Property N: [property_text]**
