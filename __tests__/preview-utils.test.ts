import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import {
  canUsePreviewFeature,
  getEffectiveRole,
  getEffectivePermissions,
  getRoleDisplayName,
  PREVIEW_ROLES,
} from '@/lib/preview-utils'
import { getDefaultPermissions, DEFAULT_PERMISSIONS } from '@/lib/permissions'
import { UserRole, UserPermissions } from '@/types/permissions'

const ALL_ROLES: UserRole[] = ['owner', 'director', 'marketing_manager', 'finance_manager', 'operations_manager', 'sysadmin', 'administration', 'finance', 'marketing', 'ops', 'engineer', 'hr', 'hse']
const NON_OWNER_ROLES: UserRole[] = ['director', 'marketing_manager', 'finance_manager', 'operations_manager', 'sysadmin', 'administration', 'finance', 'marketing', 'ops', 'engineer', 'hr', 'hse']

const roleArb = fc.constantFrom(...ALL_ROLES)
const nonOwnerRoleArb = fc.constantFrom(...NON_OWNER_ROLES)
const previewRoleArb = fc.constantFrom(...PREVIEW_ROLES)

describe('Preview Utils', () => {
  describe('PREVIEW_ROLES', () => {
    it('should contain all 15 roles', () => {
      expect(PREVIEW_ROLES).toHaveLength(15)
      expect(PREVIEW_ROLES).toContain('owner')
      expect(PREVIEW_ROLES).toContain('director')
      expect(PREVIEW_ROLES).toContain('marketing_manager')
      expect(PREVIEW_ROLES).toContain('finance_manager')
      expect(PREVIEW_ROLES).toContain('operations_manager')
      expect(PREVIEW_ROLES).toContain('sysadmin')
      expect(PREVIEW_ROLES).toContain('administration')
      expect(PREVIEW_ROLES).toContain('finance')
      expect(PREVIEW_ROLES).toContain('marketing')
      expect(PREVIEW_ROLES).toContain('ops')
      expect(PREVIEW_ROLES).toContain('engineer')
      expect(PREVIEW_ROLES).toContain('hr')
      expect(PREVIEW_ROLES).toContain('hse')
      expect(PREVIEW_ROLES).toContain('agency')
      expect(PREVIEW_ROLES).toContain('customs')
    })
  })

  /**
   * Property 1: Owner-only preview access
   * **Feature: v0.9.7-role-preview, Property 1: Owner-only preview access**
   * *For any* user role that is not 'owner', canUsePreviewFeature SHALL return false
   * AND getEffectiveRole SHALL return the actual role regardless of preview role
   * **Validates: Requirements 1.4, 7.1**
   */
  describe('Property 1: Owner-only preview access', () => {
    it('should return true only for owner role', () => {
      fc.assert(
        fc.property(roleArb, (role) => {
          const canUse = canUsePreviewFeature(role)
          if (role === 'owner') {
            expect(canUse).toBe(true)
          } else {
            expect(canUse).toBe(false)
          }
        }),
        { numRuns: 100 }
      )
    })

    it('should ignore preview role for non-owner users', () => {
      fc.assert(
        fc.property(nonOwnerRoleArb, previewRoleArb, (actualRole, previewRole) => {
          const effectiveRole = getEffectiveRole(actualRole, previewRole)
          // Non-owner users should always get their actual role
          expect(effectiveRole).toBe(actualRole)
        }),
        { numRuns: 100 }
      )
    })

    it('should ignore preview permissions for non-owner users', () => {
      fc.assert(
        fc.property(nonOwnerRoleArb, previewRoleArb, (actualRole, previewRole) => {
          const actualPermissions = getDefaultPermissions(actualRole)
          const effectivePermissions = getEffectivePermissions(actualRole, actualPermissions, previewRole)
          // Non-owner users should always get their actual permissions
          expect(effectivePermissions).toEqual(actualPermissions)
        }),
        { numRuns: 100 }
      )
    })
  })

  /**
   * Property 7: Permissions match effective role
   * **Feature: v0.9.7-role-preview, Property 7: Permissions match effective role**
   * *For any* effective role, the effectivePermissions SHALL equal getDefaultPermissions for that role
   * **Validates: Requirements 5.1**
   */
  describe('Property 7: Permissions match effective role', () => {
    it('should return preview role permissions when owner previews', () => {
      fc.assert(
        fc.property(previewRoleArb, (previewRole) => {
          const ownerPermissions = getDefaultPermissions('owner')
          const effectivePermissions = getEffectivePermissions('owner', ownerPermissions, previewRole)
          const expectedPermissions = getDefaultPermissions(previewRole)
          expect(effectivePermissions).toEqual(expectedPermissions)
        }),
        { numRuns: 100 }
      )
    })

    it('should return actual permissions when preview is null', () => {
      fc.assert(
        fc.property(roleArb, (role) => {
          const actualPermissions = getDefaultPermissions(role)
          const effectivePermissions = getEffectivePermissions(role, actualPermissions, null)
          expect(effectivePermissions).toEqual(actualPermissions)
        }),
        { numRuns: 100 }
      )
    })
  })

  describe('getEffectiveRole', () => {
    it('should return preview role when owner has preview active', () => {
      fc.assert(
        fc.property(previewRoleArb, (previewRole) => {
          const effectiveRole = getEffectiveRole('owner', previewRole)
          expect(effectiveRole).toBe(previewRole)
        }),
        { numRuns: 100 }
      )
    })

    it('should return actual role when preview is null', () => {
      fc.assert(
        fc.property(roleArb, (role) => {
          const effectiveRole = getEffectiveRole(role, null)
          expect(effectiveRole).toBe(role)
        }),
        { numRuns: 100 }
      )
    })
  })

  describe('getRoleDisplayName', () => {
    it('should return capitalized display name for all roles', () => {
      fc.assert(
        fc.property(roleArb, (role) => {
          const displayName = getRoleDisplayName(role)
          expect(displayName).toBeTruthy()
          expect(displayName[0]).toBe(displayName[0].toUpperCase())
        }),
        { numRuns: 100 }
      )
    })
  })
})


describe('Navigation Integration', () => {
  /**
   * Property 5: Navigation filtering matches effective role
   * **Feature: v0.9.7-role-preview, Property 5: Navigation filtering matches effective role**
   * *For any* effective role (actual or preview), the filtered navigation items SHALL match
   * exactly what filterNavItems returns for that role with its default permissions
   * **Validates: Requirements 3.1**
   */
  describe('Property 5: Navigation filtering matches effective role', () => {
    it('should filter navigation based on effective role permissions', async () => {
      const { filterNavItems, NAV_ITEMS } = await import('@/lib/navigation')

      fc.assert(
        fc.property(roleArb, previewRoleArb, (actualRole, previewRole) => {
          // Get effective role and permissions
          const effectiveRole = getEffectiveRole('owner', previewRole)
          const effectivePermissions = getEffectivePermissions(
            'owner',
            getDefaultPermissions('owner'),
            previewRole
          )

          // Filter nav items using effective role
          const filteredNav = filterNavItems(NAV_ITEMS, effectiveRole, effectivePermissions)

          // Verify each item in filtered nav is allowed for the effective role
          filteredNav.forEach((item: { roles: string[] }) => {
            expect(item.roles).toContain(effectiveRole)
          })
        }),
        { numRuns: 100 }
      )
    })

    it('should return same nav items for same effective role regardless of preview state', async () => {
      const { filterNavItems, NAV_ITEMS } = await import('@/lib/navigation')

      fc.assert(
        fc.property(roleArb, (role) => {
          // Direct role access
          const directPermissions = getDefaultPermissions(role)
          const directNav = filterNavItems(NAV_ITEMS, role, directPermissions)

          // Via preview (owner previewing as role)
          const effectiveRole = getEffectiveRole('owner', role)
          const effectivePermissions = getEffectivePermissions(
            'owner',
            getDefaultPermissions('owner'),
            role
          )
          const previewNav = filterNavItems(NAV_ITEMS, effectiveRole, effectivePermissions)

          // Should be identical
          expect(directNav.map((n: { title: string }) => n.title)).toEqual(
            previewNav.map((n: { title: string }) => n.title)
          )
        }),
        { numRuns: 100 }
      )
    })
  })
})


describe('Dashboard Selection', () => {
  /**
   * Property 6: Dashboard selection matches effective role
   * **Feature: v0.9.7-role-preview, Property 6: Dashboard selection matches effective role**
   * *For any* effective role, the dashboard type returned SHALL match getDashboardPath for that role
   * **Validates: Requirements 4.1**
   */
  describe('Property 6: Dashboard selection matches effective role', () => {
    it('should return correct dashboard path for any effective role', async () => {
      const { getDashboardPath } = await import('@/lib/navigation')

      fc.assert(
        fc.property(previewRoleArb, (previewRole) => {
          // Get effective role when owner previews
          const effectiveRole = getEffectiveRole('owner', previewRole)

          // Get dashboard path for effective role
          const dashboardPath = getDashboardPath(effectiveRole)

          // Verify path is valid
          expect(dashboardPath).toBeTruthy()
          expect(dashboardPath.startsWith('/dashboard')).toBe(true)
        }),
        { numRuns: 100 }
      )
    })

    it('should return same dashboard path for same role regardless of preview state', async () => {
      const { getDashboardPath } = await import('@/lib/navigation')

      fc.assert(
        fc.property(roleArb, (role) => {
          // Direct role access
          const directPath = getDashboardPath(role)

          // Via preview (owner previewing as role)
          const effectiveRole = getEffectiveRole('owner', role)
          const previewPath = getDashboardPath(effectiveRole)

          // Should be identical
          expect(directPath).toBe(previewPath)
        }),
        { numRuns: 100 }
      )
    })
  })
})
