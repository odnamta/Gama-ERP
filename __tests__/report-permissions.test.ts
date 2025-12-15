import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import {
  REPORTS,
  getVisibleReports,
  canAccessReport,
  getReportsByCategory,
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

    it('sales should see sales reports and revenue-customer', () => {
      const salesReports = getVisibleReports('sales')
      const reportIds = salesReports.map(r => r.id)
      
      expect(reportIds).toContain('quotation-conversion')
      expect(reportIds).toContain('revenue-customer')
      expect(reportIds).not.toContain('profit-loss')
      expect(reportIds).not.toContain('ar-aging')
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
})
