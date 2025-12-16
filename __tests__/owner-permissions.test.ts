/**
 * Owner Role Permission Tests
 * Feature: v0.9.0-owner-dashboard-navigation
 */
import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import {
  DEFAULT_PERMISSIONS,
  getAssignableRoles,
  getDefaultPermissions,
  canModifyUser,
  isOwnerEmail,
  isPendingUser,
  OWNER_EMAIL,
} from '@/lib/permissions'
import { UserRole, UserProfile } from '@/types/permissions'

describe('Owner Role Properties', () => {
  /**
   * Property 2: Owner role exclusion from assignable roles
   * **Feature: v0.9.0-owner-dashboard-navigation, Property 2: Owner role exclusion**
   * **Validates: Requirements 1.2**
   */
  it('Property 2: Owner role exclusion from assignable roles', () => {
    const assignableRoles = getAssignableRoles()
    expect(assignableRoles).not.toContain('owner')
    expect(assignableRoles).toContain('admin')
    expect(assignableRoles).toContain('manager')
    expect(assignableRoles).toContain('ops')
    expect(assignableRoles).toContain('finance')
    expect(assignableRoles).toContain('sales')
    expect(assignableRoles).toContain('viewer')
  })

  /**
   * Property 4: Owner permissions completeness
   * **Feature: v0.9.0-owner-dashboard-navigation, Property 4: Owner permissions completeness**
   * **Validates: Requirements 1.5**
   */
  it('Property 4: Owner permissions completeness', () => {
    fc.assert(
      fc.property(fc.constant('owner' as UserRole), (role) => {
        const permissions = getDefaultPermissions(role)
        // All permissions must be true for owner
        return (
          permissions.can_see_revenue === true &&
          permissions.can_see_profit === true &&
          permissions.can_approve_pjo === true &&
          permissions.can_manage_invoices === true &&
          permissions.can_manage_users === true &&
          permissions.can_create_pjo === true &&
          permissions.can_fill_costs === true
        )
      }),
      { numRuns: 100 }
    )
  })

  /**
   * Property 3: Owner role immutability
   * **Feature: v0.9.0-owner-dashboard-navigation, Property 3: Owner role immutability**
   * **Validates: Requirements 1.4**
   */
  it('Property 3: Owner role immutability - cannot modify owner', () => {
    const allRoles: UserRole[] = ['owner', 'admin', 'manager', 'ops', 'finance', 'sales', 'viewer']
    
    fc.assert(
      fc.property(fc.constantFrom(...allRoles), (actorRole) => {
        // No role can modify owner
        return canModifyUser(actorRole, 'owner') === false
      }),
      { numRuns: 100 }
    )
  })

  it('Owner and admin can modify non-owner users', () => {
    const nonOwnerRoles: UserRole[] = ['admin', 'manager', 'ops', 'finance', 'sales', 'viewer']
    
    fc.assert(
      fc.property(fc.constantFrom(...nonOwnerRoles), (targetRole) => {
        // Owner can modify any non-owner
        expect(canModifyUser('owner', targetRole)).toBe(true)
        // Admin can modify any non-owner
        expect(canModifyUser('admin', targetRole)).toBe(true)
        return true
      }),
      { numRuns: 100 }
    )
  })

  it('Non-admin roles cannot modify users', () => {
    const nonAdminRoles: UserRole[] = ['manager', 'ops', 'finance', 'sales', 'viewer']
    const targetRoles: UserRole[] = ['admin', 'manager', 'ops', 'finance', 'sales', 'viewer']
    
    fc.assert(
      fc.property(
        fc.constantFrom(...nonAdminRoles),
        fc.constantFrom(...targetRoles),
        (actorRole, targetRole) => {
          return canModifyUser(actorRole, targetRole) === false
        }
      ),
      { numRuns: 100 }
    )
  })
})

describe('Owner Email Detection', () => {
  it('should detect owner email case-insensitively', () => {
    expect(isOwnerEmail(OWNER_EMAIL)).toBe(true)
    expect(isOwnerEmail(OWNER_EMAIL.toUpperCase())).toBe(true)
    expect(isOwnerEmail(OWNER_EMAIL.toLowerCase())).toBe(true)
    expect(isOwnerEmail('DioAtmando@Gama-Group.co')).toBe(true)
  })

  it('should reject non-owner emails', () => {
    fc.assert(
      fc.property(
        fc.emailAddress().filter(email => email.toLowerCase() !== OWNER_EMAIL.toLowerCase()),
        (email) => {
          return isOwnerEmail(email) === false
        }
      ),
      { numRuns: 100 }
    )
  })
})

describe('Pending User Detection', () => {
  /**
   * Property 7: Pending user identification
   * **Feature: v0.9.0-owner-dashboard-navigation, Property 7: Pending user identification**
   * **Validates: Requirements 2.5**
   */
  it('Property 7: Pending user identification', () => {
    const baseProfile: Omit<UserProfile, 'user_id'> = {
      id: 'test-id',
      email: 'test@example.com',
      full_name: 'Test User',
      avatar_url: null,
      role: 'viewer',
      custom_dashboard: 'default',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_login_at: null,
      can_see_revenue: false,
      can_see_profit: false,
      can_approve_pjo: false,
      can_manage_invoices: false,
      can_manage_users: false,
      can_create_pjo: false,
      can_fill_costs: false,
    }

    // User with null user_id is pending
    const pendingProfile: UserProfile = { ...baseProfile, user_id: null }
    expect(isPendingUser(pendingProfile)).toBe(true)

    // User with user_id is not pending
    const activeProfile: UserProfile = { ...baseProfile, user_id: 'auth-user-id' }
    expect(isPendingUser(activeProfile)).toBe(false)
  })
})

describe('DEFAULT_PERMISSIONS structure', () => {
  it('should have permissions for all roles', () => {
    const allRoles: UserRole[] = ['owner', 'admin', 'manager', 'ops', 'finance', 'sales', 'viewer']
    
    allRoles.forEach(role => {
      expect(DEFAULT_PERMISSIONS[role]).toBeDefined()
      expect(DEFAULT_PERMISSIONS[role]).toHaveProperty('can_see_revenue')
      expect(DEFAULT_PERMISSIONS[role]).toHaveProperty('can_see_profit')
      expect(DEFAULT_PERMISSIONS[role]).toHaveProperty('can_approve_pjo')
      expect(DEFAULT_PERMISSIONS[role]).toHaveProperty('can_manage_invoices')
      expect(DEFAULT_PERMISSIONS[role]).toHaveProperty('can_manage_users')
      expect(DEFAULT_PERMISSIONS[role]).toHaveProperty('can_create_pjo')
      expect(DEFAULT_PERMISSIONS[role]).toHaveProperty('can_fill_costs')
    })
  })

  it('ops role should not see revenue or profit', () => {
    expect(DEFAULT_PERMISSIONS.ops.can_see_revenue).toBe(false)
    expect(DEFAULT_PERMISSIONS.ops.can_see_profit).toBe(false)
  })
})
