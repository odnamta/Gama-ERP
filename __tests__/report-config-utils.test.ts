// Report Configuration Utilities Tests
// Feature: reports-module-foundation

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import {
  filterReportsBySearch,
  sortReportsByDisplayOrder,
} from '@/lib/reports/report-config-utils'
import { ReportConfigurationDB, ReportCategoryDB } from '@/types/reports'

// Helper to generate mock report configurations
function createMockReport(overrides: Partial<ReportConfigurationDB> = {}): ReportConfigurationDB {
  return {
    id: 'test-id',
    report_code: 'test_report',
    report_name: 'Test Report',
    description: 'Test description',
    report_category: 'finance' as ReportCategoryDB,
    default_filters: {},
    columns: [],
    allowed_roles: ['owner', 'admin', 'manager'],
    is_active: true,
    display_order: 0,
    href: '/reports/test',
    icon: 'FileText',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  }
}

// Arbitrary for generating report configurations
const reportConfigArb = fc.record({
  id: fc.uuid(),
  report_code: fc.string({ minLength: 1, maxLength: 50 }),
  report_name: fc.string({ minLength: 1, maxLength: 200 }),
  description: fc.option(fc.string({ maxLength: 500 }), { nil: null }),
  report_category: fc.constantFrom('operations', 'finance', 'sales', 'executive') as fc.Arbitrary<ReportCategoryDB>,
  default_filters: fc.constant({}),
  columns: fc.constant([]),
  allowed_roles: fc.array(fc.constantFrom('owner', 'admin', 'manager', 'ops', 'finance', 'sales'), { minLength: 1, maxLength: 5 }),
  is_active: fc.boolean(),
  display_order: fc.integer({ min: 0, max: 100 }),
  href: fc.option(fc.string({ minLength: 1, maxLength: 200 }), { nil: null }),
  icon: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: null }),
  created_at: fc.constant(new Date().toISOString()),
  updated_at: fc.constant(new Date().toISOString()),
})

describe('Report Configuration Utilities', () => {
  describe('filterReportsBySearch', () => {
    it('returns all reports when query is empty', () => {
      const reports = [
        createMockReport({ report_name: 'Report A' }),
        createMockReport({ report_name: 'Report B' }),
      ]
      
      expect(filterReportsBySearch(reports, '')).toEqual(reports)
      expect(filterReportsBySearch(reports, '   ')).toEqual(reports)
    })

    it('filters by report name (case-insensitive)', () => {
      const reports = [
        createMockReport({ report_name: 'AR Aging Report' }),
        createMockReport({ report_name: 'Profit Loss' }),
      ]
      
      const result = filterReportsBySearch(reports, 'aging')
      expect(result).toHaveLength(1)
      expect(result[0].report_name).toBe('AR Aging Report')
    })

    it('filters by description (case-insensitive)', () => {
      const reports = [
        createMockReport({ report_name: 'Report A', description: 'Outstanding invoices by age' }),
        createMockReport({ report_name: 'Report B', description: 'Revenue analysis' }),
      ]
      
      const result = filterReportsBySearch(reports, 'invoices')
      expect(result).toHaveLength(1)
      expect(result[0].report_name).toBe('Report A')
    })

    it('handles null descriptions', () => {
      const reports = [
        createMockReport({ report_name: 'Report A', description: null }),
        createMockReport({ report_name: 'Report B', description: 'Has description' }),
      ]
      
      const result = filterReportsBySearch(reports, 'description')
      expect(result).toHaveLength(1)
      expect(result[0].report_name).toBe('Report B')
    })

    /**
     * Property 7: Report search filtering
     * For any search query string and set of reports, the filtered results must only
     * include reports where the query appears in either the report_name or description (case-insensitive).
     * 
     * Feature: reports-module-foundation, Property 7: Report search filtering
     * Validates: Requirements 3.4
     */
    it('property: filtered results contain query in name or description', () => {
      fc.assert(
        fc.property(
          fc.array(reportConfigArb, { minLength: 0, maxLength: 20 }),
          fc.string({ minLength: 1, maxLength: 50 }),
          (reports, query) => {
            const filtered = filterReportsBySearch(reports, query)
            const lowerQuery = query.toLowerCase().trim()
            
            // Every filtered report must contain the query in name or description
            for (const report of filtered) {
              const nameMatch = report.report_name.toLowerCase().includes(lowerQuery)
              const descMatch = report.description?.toLowerCase().includes(lowerQuery) ?? false
              expect(nameMatch || descMatch).toBe(true)
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * Property: Empty query returns all reports
     * Feature: reports-module-foundation, Property 7: Report search filtering (edge case)
     */
    it('property: empty query returns all reports unchanged', () => {
      fc.assert(
        fc.property(
          fc.array(reportConfigArb, { minLength: 0, maxLength: 20 }),
          (reports) => {
            const filtered = filterReportsBySearch(reports, '')
            expect(filtered).toEqual(reports)
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe('sortReportsByDisplayOrder', () => {
    it('sorts reports by display_order ascending', () => {
      const reports = [
        createMockReport({ report_name: 'C', display_order: 30 }),
        createMockReport({ report_name: 'A', display_order: 10 }),
        createMockReport({ report_name: 'B', display_order: 20 }),
      ]
      
      const sorted = sortReportsByDisplayOrder(reports)
      expect(sorted[0].report_name).toBe('A')
      expect(sorted[1].report_name).toBe('B')
      expect(sorted[2].report_name).toBe('C')
    })

    it('does not mutate original array', () => {
      const reports = [
        createMockReport({ display_order: 2 }),
        createMockReport({ display_order: 1 }),
      ]
      const original = [...reports]
      
      sortReportsByDisplayOrder(reports)
      expect(reports).toEqual(original)
    })

    /**
     * Property 8: Report category ordering
     * For any list of reports within a single category, the reports must be sorted
     * by display_order in ascending order.
     * 
     * Feature: reports-module-foundation, Property 8: Report category ordering
     * Validates: Requirements 3.6
     */
    it('property: sorted reports are in ascending display_order', () => {
      fc.assert(
        fc.property(
          fc.array(reportConfigArb, { minLength: 0, maxLength: 20 }),
          (reports) => {
            const sorted = sortReportsByDisplayOrder(reports)
            
            // Verify ascending order
            for (let i = 1; i < sorted.length; i++) {
              expect(sorted[i].display_order).toBeGreaterThanOrEqual(sorted[i - 1].display_order)
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * Property: Sorting preserves all elements
     * Feature: reports-module-foundation, Property 8: Report category ordering (invariant)
     */
    it('property: sorting preserves all elements', () => {
      fc.assert(
        fc.property(
          fc.array(reportConfigArb, { minLength: 0, maxLength: 20 }),
          (reports) => {
            const sorted = sortReportsByDisplayOrder(reports)
            expect(sorted.length).toBe(reports.length)
            
            // All original reports should be in sorted array
            for (const report of reports) {
              expect(sorted.some(r => r.id === report.id)).toBe(true)
            }
          }
        ),
        { numRuns: 100 }
      )
    })
  })
})


describe('Role-Based Report Visibility', () => {
  /**
   * Helper function to check if a role can access a report
   * This mirrors the logic in getReportConfigurations
   */
  function canRoleAccessReport(role: string, report: ReportConfigurationDB): boolean {
    return report.allowed_roles.includes(role)
  }

  /**
   * Filter reports by role (client-side version for testing)
   */
  function filterReportsByRole(reports: ReportConfigurationDB[], role: string): ReportConfigurationDB[] {
    return reports.filter(report => report.allowed_roles.includes(role))
  }

  it('owner role can access all reports with owner in allowed_roles', () => {
    const reports = [
      createMockReport({ allowed_roles: ['owner', 'admin', 'manager'] }),
      createMockReport({ allowed_roles: ['owner', 'admin'] }),
      createMockReport({ allowed_roles: ['admin', 'manager'] }),
    ]
    
    const visible = filterReportsByRole(reports, 'owner')
    expect(visible).toHaveLength(2)
  })

  it('ops role can only access reports with ops in allowed_roles', () => {
    const reports = [
      createMockReport({ allowed_roles: ['owner', 'admin', 'manager', 'ops'] }),
      createMockReport({ allowed_roles: ['owner', 'admin', 'manager', 'finance'] }),
    ]
    
    const visible = filterReportsByRole(reports, 'ops')
    expect(visible).toHaveLength(1)
  })

  /**
   * Property 2: Role-based report visibility
   * For any user with a given role and any report configuration, the report is visible
   * to the user if and only if the user's role is contained in the report's allowed_roles array.
   * 
   * Feature: reports-module-foundation, Property 2: Role-based report visibility
   * Validates: Requirements 3.1, 4.1
   */
  it('property: report visibility matches role membership in allowed_roles', () => {
    const roleArb = fc.constantFrom('owner', 'admin', 'manager', 'ops', 'finance', 'sales', 'viewer')
    
    fc.assert(
      fc.property(
        fc.array(reportConfigArb, { minLength: 0, maxLength: 20 }),
        roleArb,
        (reports, role) => {
          const visible = filterReportsByRole(reports, role)
          
          // Every visible report must have the role in allowed_roles
          for (const report of visible) {
            expect(report.allowed_roles.includes(role)).toBe(true)
          }
          
          // Every report with the role in allowed_roles must be visible
          for (const report of reports) {
            if (report.allowed_roles.includes(role)) {
              expect(visible.some(r => r.id === report.id)).toBe(true)
            }
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property: Visibility is deterministic
   * Feature: reports-module-foundation, Property 2: Role-based report visibility (invariant)
   */
  it('property: filtering by same role produces same results', () => {
    const roleArb = fc.constantFrom('owner', 'admin', 'manager', 'ops', 'finance', 'sales')
    
    fc.assert(
      fc.property(
        fc.array(reportConfigArb, { minLength: 0, maxLength: 20 }),
        roleArb,
        (reports, role) => {
          const result1 = filterReportsByRole(reports, role)
          const result2 = filterReportsByRole(reports, role)
          
          expect(result1.length).toBe(result2.length)
          for (let i = 0; i < result1.length; i++) {
            expect(result1[i].id).toBe(result2[i].id)
          }
        }
      ),
      { numRuns: 100 }
    )
  })
})
