import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import {
  REPORTS,
  getVisibleReports,
  canAccessReport,
  getReportsByCategory,
  canAccessCategory,
  isAdminRole,
  ADMIN_ROLES,
} from '@/lib/reports/report-permissions'
import { UserRole } from '@/types/permissions'

const ALL_ROLES: UserRole[] = ['admin', 'manager', 'ops', 'finance', 'sales', 'viewer']

describe('Report Permissions', () => {
  /**
   * **Feature: v0.9.6-reports-module, Property 1: Role-based report filtering**
   * *For any* user role and report configuration, the visible reports should exactly
   * match those where the role is included in the report's allowedRoles array.
   * **Validates: Requirements 1.4, 7.1, 7.2, 7.3, 7.4**
   */
  describe('Property 1: Role-based report filtering', () => {
    it('visible reports should match allowedRoles for any role', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...ALL_ROLES),
          (role) => {
            const visibleReports = getVisibleReports(role)
            
            // Every visible report should have this role in allowedRoles
            for (const report of visibleReports) {
              expect(report.allowedRoles).toContain(role)
            }
            
            // Every report with this role in allowedRoles should be visible
            const expectedReports = REPORTS.filter(r => r.allowedRoles.includes(role))
            expect(visibleReports.length).toBe(expectedReports.length)
            
            // IDs should match
            const visibleIds = visibleReports.map(r => r.id).sort()
            const expectedIds = expectedReports.map(r => r.id).sort()
            expect(visibleIds).toEqual(expectedIds)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('canAccessReport should be consistent with getVisibleReports', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...ALL_ROLES),
          fc.constantFrom(...REPORTS.map(r => r.id)),
          (role, reportId) => {
            const canAccess = canAccessReport(role, reportId)
            const visibleReports = getVisibleReports(role)
            const isVisible = visibleReports.some(r => r.id === reportId)
            
            expect(canAccess).toBe(isVisible)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('admin and manager should see all reports', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('admin', 'manager') as fc.Arbitrary<UserRole>,
          (role) => {
            const visibleReports = getVisibleReports(role)
            expect(visibleReports.length).toBe(REPORTS.length)
          }
        ),
        { numRuns: 10 }
      )
    })

    it('finance should see financial and AR reports only', () => {
      const financeReports = getVisibleReports('finance')
      const categories = new Set(financeReports.map(r => r.category))
      
      expect(categories.has('financial')).toBe(true)
      expect(categories.has('ar')).toBe(true)
      expect(categories.has('operational')).toBe(false)
      expect(categories.has('sales')).toBe(false)
    })

    it('ops should see operational reports only', () => {
      const opsReports = getVisibleReports('ops')
      const categories = new Set(opsReports.map(r => r.category))
      
      expect(categories.has('operational')).toBe(true)
      expect(categories.has('financial')).toBe(false)
      expect(categories.has('ar')).toBe(false)
      expect(categories.has('sales')).toBe(false)
    })

    it('sales should see sales reports and revenue-by-customer', () => {
      const salesReports = getVisibleReports('sales')
      const reportIds = salesReports.map(r => r.id)
      
      expect(reportIds).toContain('quotation-conversion')
      expect(reportIds).toContain('revenue-customer')
      expect(reportIds).toContain('revenue-by-customer')
      expect(reportIds).toContain('sales-pipeline')
      expect(reportIds).toContain('customer-acquisition')
      expect(reportIds).not.toContain('profit-loss')
      expect(reportIds).not.toContain('ar-aging')
    })

    /**
     * **Feature: v0.10.1-reports-phase2, Property 24: Role-based report access (Phase 2)**
     * For any user role and Phase 2 report configuration, the visible reports should exactly
     * match those where the role is included in the report's allowedRoles array.
     * **Validates: Requirements 13.1, 13.2, 13.3, 13.4, 13.5**
     */
    it('Phase 2: ops should see operational reports including on-time-delivery and vendor-performance', () => {
      const opsReports = getVisibleReports('ops')
      const reportIds = opsReports.map(r => r.id)
      
      expect(reportIds).toContain('budget-variance')
      expect(reportIds).toContain('jo-summary')
      expect(reportIds).toContain('on-time-delivery')
      expect(reportIds).toContain('vendor-performance')
    })

    it('Phase 2: finance should see payment history and outstanding invoices', () => {
      const financeReports = getVisibleReports('finance')
      const reportIds = financeReports.map(r => r.id)
      
      expect(reportIds).toContain('ar-aging')
      expect(reportIds).toContain('outstanding-invoices')
      expect(reportIds).toContain('customer-payment-history')
    })

    it('viewer should see no reports', () => {
      const viewerReports = getVisibleReports('viewer')
      expect(viewerReports.length).toBe(0)
    })
  })

  describe('getReportsByCategory', () => {
    it('should group reports correctly by category', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...ALL_ROLES),
          (role) => {
            const grouped = getReportsByCategory(role)
            const visibleReports = getVisibleReports(role)
            
            // All visible reports should be in one of the categories
            const allGrouped = [
              ...grouped.financial,
              ...grouped.operational,
              ...grouped.ar,
              ...grouped.sales,
            ]
            
            expect(allGrouped.length).toBe(visibleReports.length)
            
            // Each report should be in the correct category
            for (const report of grouped.financial) {
              expect(report.category).toBe('financial')
            }
            for (const report of grouped.operational) {
              expect(report.category).toBe('operational')
            }
            for (const report of grouped.ar) {
              expect(report.category).toBe('ar')
            }
            for (const report of grouped.sales) {
              expect(report.category).toBe('sales')
            }
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe('canAccessReport edge cases', () => {
    it('should return false for non-existent report', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...ALL_ROLES),
          fc.string().filter(s => !REPORTS.some(r => r.id === s)),
          (role, fakeReportId) => {
            expect(canAccessReport(role, fakeReportId)).toBe(false)
          }
        ),
        { numRuns: 50 }
      )
    })
  })

  /**
   * Property 3: Admin roles full access
   * For any report configuration in the default seed data, the allowed_roles array
   * must contain 'owner', 'admin', and 'manager'.
   * 
   * Feature: reports-module-foundation, Property 3: Admin roles full access
   * Validates: Requirements 4.2, 4.3, 4.4
   */
  describe('Property 3: Admin roles full access', () => {
    it('all reports should include owner, admin, and manager in allowedRoles', () => {
      for (const report of REPORTS) {
        expect(report.allowedRoles).toContain('owner')
        expect(report.allowedRoles).toContain('admin')
        expect(report.allowedRoles).toContain('manager')
      }
    })

    it('property: admin roles can access all reports', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...ADMIN_ROLES),
          fc.constantFrom(...REPORTS),
          (role, report) => {
            expect(report.allowedRoles.includes(role)).toBe(true)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('isAdminRole correctly identifies admin roles', () => {
      expect(isAdminRole('owner')).toBe(true)
      expect(isAdminRole('admin')).toBe(true)
      expect(isAdminRole('manager')).toBe(true)
      expect(isAdminRole('ops')).toBe(false)
      expect(isAdminRole('finance')).toBe(false)
      expect(isAdminRole('sales')).toBe(false)
      expect(isAdminRole('viewer')).toBe(false)
    })
  })

  /**
   * Property 4: Category-specific role restrictions
   * For any report configuration:
   * - If report_category is 'finance', allowed_roles must be a subset of ['owner', 'admin', 'manager', 'finance']
   * - If report_category is 'operations', allowed_roles must be a subset of ['owner', 'admin', 'manager', 'ops']
   * - If report_category is 'sales', allowed_roles must be a subset of ['owner', 'admin', 'manager', 'sales']
   * 
   * Feature: reports-module-foundation, Property 4: Category-specific role restrictions
   * Validates: Requirements 4.5, 4.6, 4.7
   */
  describe('Property 4: Category-specific role restrictions', () => {
    it('canAccessCategory returns correct access for each role-category combination', () => {
      // Finance role
      expect(canAccessCategory('finance', 'financial')).toBe(true)
      expect(canAccessCategory('finance', 'ar')).toBe(true)
      expect(canAccessCategory('finance', 'operational')).toBe(false)
      expect(canAccessCategory('finance', 'sales')).toBe(false)

      // Ops role
      expect(canAccessCategory('ops', 'operational')).toBe(true)
      expect(canAccessCategory('ops', 'financial')).toBe(false)
      expect(canAccessCategory('ops', 'ar')).toBe(false)
      expect(canAccessCategory('ops', 'sales')).toBe(false)

      // Sales role
      expect(canAccessCategory('sales', 'sales')).toBe(true)
      expect(canAccessCategory('sales', 'financial')).toBe(false)
      expect(canAccessCategory('sales', 'ar')).toBe(false)
      expect(canAccessCategory('sales', 'operational')).toBe(false)
    })

    it('property: admin roles can access all categories', () => {
      const categories = ['financial', 'operational', 'ar', 'sales'] as const
      
      fc.assert(
        fc.property(
          fc.constantFrom(...ADMIN_ROLES),
          fc.constantFrom(...categories),
          (role, category) => {
            expect(canAccessCategory(role, category)).toBe(true)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('property: non-admin roles have restricted category access', () => {
      const restrictedRoles: UserRole[] = ['ops', 'finance', 'sales']
      const categories = ['financial', 'operational', 'ar', 'sales'] as const
      
      fc.assert(
        fc.property(
          fc.constantFrom(...restrictedRoles),
          fc.constantFrom(...categories),
          (role, category) => {
            const hasAccess = canAccessCategory(role, category)
            
            // Each restricted role should only access their specific categories
            if (role === 'finance') {
              expect(hasAccess).toBe(category === 'financial' || category === 'ar')
            } else if (role === 'ops') {
              expect(hasAccess).toBe(category === 'operational')
            } else if (role === 'sales') {
              expect(hasAccess).toBe(category === 'sales')
            }
          }
        ),
        { numRuns: 100 }
      )
    })
  })
})
