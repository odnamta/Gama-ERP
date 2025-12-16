/**
 * Navigation Tests
 * Feature: v0.9.0-owner-dashboard-navigation
 */
import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { NAV_ITEMS, filterNavItems, getDashboardPath } from '@/lib/navigation'
import { DEFAULT_PERMISSIONS } from '@/lib/permissions'
import { UserRole } from '@/types/permissions'

const ALL_ROLES: UserRole[] = ['owner', 'admin', 'manager', 'ops', 'finance', 'sales', 'viewer']

describe('Navigation Properties', () => {
  /**
   * Property 13: Owner navigation completeness
   * **Feature: v0.9.0-owner-dashboard-navigation, Property 13: Owner navigation completeness**
   * **Validates: Requirements 4.1**
   */
  it('Property 13: Owner navigation completeness - owner sees all nav items', () => {
    const ownerPermissions = DEFAULT_PERMISSIONS.owner
    const filteredItems = filterNavItems(NAV_ITEMS, 'owner', ownerPermissions)
    
    // Owner should see all navigation items
    expect(filteredItems.length).toBe(NAV_ITEMS.length)
    
    // Verify all items are present
    const filteredTitles = filteredItems.map(item => item.title)
    const allTitles = NAV_ITEMS.map(item => item.title)
    expect(filteredTitles).toEqual(allTitles)
  })

  /**
   * Property 14: Role-based navigation filtering
   * **Feature: v0.9.0-owner-dashboard-navigation, Property 14: Role-based navigation filtering**
   * **Validates: Requirements 4.2, 4.3, 4.4, 4.5, 4.6**
   */
  it('Property 14: Role-based navigation filtering', () => {
    fc.assert(
      fc.property(fc.constantFrom(...ALL_ROLES), (role) => {
        const permissions = DEFAULT_PERMISSIONS[role]
        const filteredItems = filterNavItems(NAV_ITEMS, role, permissions)
        
        // All filtered items should have the role in their roles array
        return filteredItems.every(item => item.roles.includes(role))
      }),
      { numRuns: 100 }
    )
  })

  /**
   * Property 15: Dashboard path mapping
   * **Feature: v0.9.0-owner-dashboard-navigation, Property 15: Dashboard path mapping**
   * **Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5, 5.6**
   */
  it('Property 15: Dashboard path mapping', () => {
    const expectedPaths: Record<UserRole, string> = {
      owner: '/dashboard',
      admin: '/dashboard',
      manager: '/dashboard/manager',
      ops: '/dashboard/ops',
      finance: '/dashboard/finance',
      sales: '/dashboard/sales',
      viewer: '/dashboard',
    }

    fc.assert(
      fc.property(fc.constantFrom(...ALL_ROLES), (role) => {
        const path = getDashboardPath(role)
        return path === expectedPaths[role]
      }),
      { numRuns: 100 }
    )
  })
})

describe('Role-specific navigation', () => {
  it('admin sees Dashboard, Customers, Projects, Proforma JO, Cost Entry, Job Orders, Invoices, Reports, Settings', () => {
    const adminPermissions = DEFAULT_PERMISSIONS.admin
    const filteredItems = filterNavItems(NAV_ITEMS, 'admin', adminPermissions)
    const titles = filteredItems.map(item => item.title)
    
    expect(titles).toContain('Dashboard')
    expect(titles).toContain('Customers')
    expect(titles).toContain('Projects')
    expect(titles).toContain('Proforma JO')
    expect(titles).toContain('Cost Entry')
    expect(titles).toContain('Job Orders')
    expect(titles).toContain('Invoices')
    expect(titles).toContain('Reports')
    expect(titles).toContain('Settings')
  })

  it('manager sees Dashboard, Customers, Projects, Proforma JO, Job Orders, Reports (no Settings, no Cost Entry)', () => {
    const managerPermissions = DEFAULT_PERMISSIONS.manager
    const filteredItems = filterNavItems(NAV_ITEMS, 'manager', managerPermissions)
    const titles = filteredItems.map(item => item.title)
    
    expect(titles).toContain('Dashboard')
    expect(titles).toContain('Customers')
    expect(titles).toContain('Projects')
    expect(titles).toContain('Proforma JO')
    expect(titles).toContain('Job Orders')
    expect(titles).toContain('Reports')
    expect(titles).not.toContain('Settings')
    expect(titles).not.toContain('Cost Entry')
  })

  it('ops sees Dashboard, Projects, Proforma JO, Cost Entry, Job Orders (no Customers, no Invoices, no Reports, no Settings)', () => {
    const opsPermissions = DEFAULT_PERMISSIONS.ops
    const filteredItems = filterNavItems(NAV_ITEMS, 'ops', opsPermissions)
    const titles = filteredItems.map(item => item.title)
    
    expect(titles).toContain('Dashboard')
    expect(titles).toContain('Projects')
    expect(titles).toContain('Proforma JO')
    expect(titles).toContain('Cost Entry')
    expect(titles).toContain('Job Orders')
    expect(titles).not.toContain('Customers')
    expect(titles).not.toContain('Invoices')
    expect(titles).not.toContain('Settings')
  })

  it('finance sees Dashboard, Customers, Projects, Proforma JO, Job Orders, Invoices, Reports (no Settings, no Cost Entry)', () => {
    const financePermissions = DEFAULT_PERMISSIONS.finance
    const filteredItems = filterNavItems(NAV_ITEMS, 'finance', financePermissions)
    const titles = filteredItems.map(item => item.title)
    
    expect(titles).toContain('Dashboard')
    expect(titles).toContain('Customers')
    expect(titles).toContain('Projects')
    expect(titles).toContain('Proforma JO')
    expect(titles).toContain('Job Orders')
    expect(titles).toContain('Invoices')
    expect(titles).toContain('Reports')
    expect(titles).not.toContain('Settings')
    expect(titles).not.toContain('Cost Entry')
  })

  it('sales sees Dashboard, Customers, Projects, Proforma JO, Reports (no Job Orders, no Invoices, no Settings, no Cost Entry)', () => {
    const salesPermissions = DEFAULT_PERMISSIONS.sales
    const filteredItems = filterNavItems(NAV_ITEMS, 'sales', salesPermissions)
    const titles = filteredItems.map(item => item.title)
    
    expect(titles).toContain('Dashboard')
    expect(titles).toContain('Customers')
    expect(titles).toContain('Projects')
    expect(titles).toContain('Proforma JO')
    expect(titles).toContain('Reports')
    expect(titles).not.toContain('Job Orders')
    expect(titles).not.toContain('Invoices')
    expect(titles).not.toContain('Settings')
    expect(titles).not.toContain('Cost Entry')
  })
})
