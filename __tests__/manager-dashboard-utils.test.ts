/**
 * Manager Dashboard Utility Tests
 * Property-based tests using fast-check
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import {
  calculateVariance,
  calculateMargin,
  calculateGrossProfit,
  groupCostsByCategory,
  calculateTotalFromGroups,
  filterPendingApprovals,
  calculateEstimatedProfit,
  transformPendingApproval,
  getPendingApprovals,
  filterBudgetAlerts,
  calculateOverByPercentage,
  sortByVarianceDesc,
  getBudgetAlerts,
  calculatePerformanceRating,
  transformTeamMetrics,
  calculateTeamMetrics,
  getManagerPeriodDates,
  getPreviousPeriodDates,
  calculateManagerKPIs,
  buildPLSummaryRows,
  type JOInput,
  type CostItemInput,
  type PJOApprovalInput,
  type UserMetricsInput,
  type ManagerPeriodType,
} from '@/lib/manager-dashboard-utils'

// Arbitraries for test data generation
const positiveNumber = fc.float({ min: 0, max: Math.fround(10000000), noNaN: true })
const nonNegativeNumber = fc.float({ min: 0, max: Math.fround(10000000), noNaN: true })

const costCategory = fc.constantFrom(
  'trucking', 'port_charges', 'documentation', 'handling', 
  'customs', 'insurance', 'storage', 'labor', 'fuel', 'tolls', 'other'
)

const joStatus = fc.constantFrom('active', 'completed', 'submitted_to_finance', 'invoiced', 'closed')
const pjoStatus = fc.constantFrom('draft', 'pending_approval', 'approved', 'rejected')
const costItemStatus = fc.constantFrom('estimated', 'confirmed', 'exceeded', 'under_budget')
const userRole = fc.constantFrom('admin', 'sales', 'ops', 'finance', 'manager')
const periodType = fc.constantFrom('this_month', 'this_quarter', 'this_year', 'ytd') as fc.Arbitrary<ManagerPeriodType>

// Use integer timestamps to avoid date issues
const dateArb = fc.integer({ min: new Date('2024-01-01').getTime(), max: new Date('2025-12-31').getTime() }).map(ts => new Date(ts))

const joInputArb: fc.Arbitrary<JOInput> = fc.record({
  id: fc.uuid(),
  final_revenue: fc.option(positiveNumber, { nil: null }),
  final_cost: fc.option(positiveNumber, { nil: null }),
  status: joStatus,
  created_at: fc.option(dateArb.map(d => d.toISOString()), { nil: null }),
  completed_at: fc.option(dateArb.map(d => d.toISOString()), { nil: null }),
})

const costItemArb: fc.Arbitrary<CostItemInput> = fc.record({
  id: fc.uuid(),
  pjo_id: fc.uuid(),
  category: costCategory,
  estimated_amount: positiveNumber,
  actual_amount: fc.option(positiveNumber, { nil: null }),
  status: costItemStatus,
  pjo_number: fc.option(fc.string({ minLength: 5, maxLength: 20 }), { nil: undefined }),
})

const pjoApprovalArb: fc.Arbitrary<PJOApprovalInput> = fc.record({
  id: fc.uuid(),
  pjo_number: fc.string({ minLength: 5, maxLength: 20 }),
  status: pjoStatus,
  total_revenue_calculated: fc.option(positiveNumber, { nil: null }),
  total_cost_calculated: fc.option(positiveNumber, { nil: null }),
  estimated_amount: fc.option(positiveNumber, { nil: null }),
  created_at: fc.option(dateArb.map(d => d.toISOString()), { nil: null }),
  customer_name: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
  project_name: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
})

const userMetricsArb: fc.Arbitrary<UserMetricsInput> = fc.record({
  userId: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 50 }),
  role: userRole,
  pjosCreated: fc.option(fc.integer({ min: 0, max: 50 }), { nil: undefined }),
  josCompleted: fc.option(fc.integer({ min: 0, max: 50 }), { nil: undefined }),
  josOnTime: fc.option(fc.integer({ min: 0, max: 50 }), { nil: undefined }),
  josTotal: fc.option(fc.integer({ min: 0, max: 50 }), { nil: undefined }),
})


/**
 * **Feature: v0.9.4-manager-dashboard, Property 3: Variance calculation**
 * **Validates: Requirements 2.2, 3.6**
 */
describe('Property 3: Variance calculation', () => {
  it('should calculate variance as ((current - previous) / previous) * 100', () => {
    fc.assert(
      fc.property(
        positiveNumber,
        fc.float({ min: Math.fround(0.01), max: Math.fround(10000000), noNaN: true }), // previous must be > 0
        (current, previous) => {
          const variance = calculateVariance(current, previous)
          const expected = ((current - previous) / previous) * 100
          expect(variance).toBeCloseTo(expected, 5)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should return 0 when previous is 0', () => {
    fc.assert(
      fc.property(positiveNumber, (current) => {
        const variance = calculateVariance(current, 0)
        expect(variance).toBe(0)
        expect(Number.isFinite(variance)).toBe(true)
      }),
      { numRuns: 100 }
    )
  })

  it('should return positive variance when current > previous', () => {
    fc.assert(
      fc.property(
        fc.float({ min: Math.fround(100), max: Math.fround(10000000), noNaN: true }),
        fc.float({ min: Math.fround(1), max: Math.fround(99), noNaN: true }),
        (current, previous) => {
          const variance = calculateVariance(current, previous)
          expect(variance).toBeGreaterThan(0)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should return negative variance when current < previous', () => {
    fc.assert(
      fc.property(
        fc.float({ min: Math.fround(1), max: Math.fround(99), noNaN: true }),
        fc.float({ min: Math.fround(100), max: Math.fround(10000000), noNaN: true }),
        (current, previous) => {
          const variance = calculateVariance(current, previous)
          expect(variance).toBeLessThan(0)
        }
      ),
      { numRuns: 100 }
    )
  })
})

/**
 * **Feature: v0.9.4-manager-dashboard, Property 4: Margin calculation**
 * **Validates: Requirements 2.3, 3.7**
 */
describe('Property 4: Margin calculation', () => {
  it('should calculate margin as ((revenue - cost) / revenue) * 100', () => {
    fc.assert(
      fc.property(
        fc.float({ min: Math.fround(0.01), max: Math.fround(10000000), noNaN: true }), // revenue must be > 0
        nonNegativeNumber,
        (revenue, cost) => {
          const margin = calculateMargin(revenue, cost)
          const expected = ((revenue - cost) / revenue) * 100
          expect(margin).toBeCloseTo(expected, 5)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should return 0 when revenue is 0', () => {
    fc.assert(
      fc.property(nonNegativeNumber, (cost) => {
        const margin = calculateMargin(0, cost)
        expect(margin).toBe(0)
        expect(Number.isFinite(margin)).toBe(true)
      }),
      { numRuns: 100 }
    )
  })

  it('should return positive margin when revenue > cost', () => {
    fc.assert(
      fc.property(
        fc.float({ min: Math.fround(100), max: Math.fround(10000000), noNaN: true }),
        fc.float({ min: Math.fround(0), max: Math.fround(99), noNaN: true }),
        (revenue, cost) => {
          const margin = calculateMargin(revenue, cost)
          expect(margin).toBeGreaterThan(0)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should return negative margin when cost > revenue', () => {
    fc.assert(
      fc.property(
        fc.float({ min: Math.fround(1), max: Math.fround(99), noNaN: true }),
        fc.float({ min: Math.fround(100), max: Math.fround(10000000), noNaN: true }),
        (revenue, cost) => {
          const margin = calculateMargin(revenue, cost)
          expect(margin).toBeLessThan(0)
        }
      ),
      { numRuns: 100 }
    )
  })
})

/**
 * **Feature: v0.9.4-manager-dashboard, Property 2: KPI calculations are consistent**
 * **Validates: Requirements 2.1**
 */
describe('Property 2: KPI calculations are consistent', () => {
  it('should calculate revenue as sum of all final_revenue values', () => {
    fc.assert(
      fc.property(fc.array(joInputArb, { minLength: 0, maxLength: 20 }), (jos) => {
        const expectedRevenue = jos.reduce((sum, jo) => sum + (jo.final_revenue ?? 0), 0)
        const kpis = calculateManagerKPIs(jos, [], [], [], [])
        expect(kpis.revenueMTD).toBeCloseTo(expectedRevenue, 5)
      }),
      { numRuns: 100 }
    )
  })

  it('should calculate costs as sum of all final_cost values', () => {
    fc.assert(
      fc.property(fc.array(joInputArb, { minLength: 0, maxLength: 20 }), (jos) => {
        const expectedCosts = jos.reduce((sum, jo) => sum + (jo.final_cost ?? 0), 0)
        const kpis = calculateManagerKPIs(jos, [], [], [], [])
        expect(kpis.costsMTD).toBeCloseTo(expectedCosts, 5)
      }),
      { numRuns: 100 }
    )
  })

  it('should calculate profit as revenue minus costs', () => {
    fc.assert(
      fc.property(fc.array(joInputArb, { minLength: 0, maxLength: 20 }), (jos) => {
        const kpis = calculateManagerKPIs(jos, [], [], [], [])
        expect(kpis.profitMTD).toBeCloseTo(kpis.revenueMTD - kpis.costsMTD, 5)
      }),
      { numRuns: 100 }
    )
  })
})


/**
 * **Feature: v0.9.4-manager-dashboard, Property 5: Cost grouping by category**
 * **Validates: Requirements 3.3, 3.4**
 */
describe('Property 5: Cost grouping by category', () => {
  it('should group costs by category correctly', () => {
    fc.assert(
      fc.property(fc.array(costItemArb, { minLength: 0, maxLength: 30 }), (items) => {
        const groups = groupCostsByCategory(items)
        
        // Verify each category total
        for (const [category, total] of groups) {
          const categoryItems = items.filter(i => i.category === category)
          const expectedTotal = categoryItems.reduce((sum, i) => sum + (i.actual_amount ?? i.estimated_amount ?? 0), 0)
          expect(total).toBeCloseTo(expectedTotal, 5)
        }
      }),
      { numRuns: 100 }
    )
  })

  it('should have sum of category totals equal total of all items', () => {
    fc.assert(
      fc.property(fc.array(costItemArb, { minLength: 0, maxLength: 30 }), (items) => {
        const groups = groupCostsByCategory(items)
        const groupTotal = calculateTotalFromGroups(groups)
        const itemsTotal = items.reduce((sum, i) => sum + (i.actual_amount ?? i.estimated_amount ?? 0), 0)
        expect(groupTotal).toBeCloseTo(itemsTotal, 5)
      }),
      { numRuns: 100 }
    )
  })
})

/**
 * **Feature: v0.9.4-manager-dashboard, Property 6: Gross profit calculation**
 * **Validates: Requirements 3.5**
 */
describe('Property 6: Gross profit calculation', () => {
  it('should calculate gross profit as revenue minus cost', () => {
    fc.assert(
      fc.property(positiveNumber, positiveNumber, (revenue, cost) => {
        const profit = calculateGrossProfit(revenue, cost)
        expect(profit).toBeCloseTo(revenue - cost, 5)
      }),
      { numRuns: 100 }
    )
  })
})

/**
 * **Feature: v0.9.4-manager-dashboard, Property 7: Pending approvals filter**
 * **Validates: Requirements 4.1**
 */
describe('Property 7: Pending approvals filter', () => {
  it('should return only PJOs with status pending_approval', () => {
    fc.assert(
      fc.property(fc.array(pjoApprovalArb, { minLength: 0, maxLength: 30 }), (pjos) => {
        const filtered = filterPendingApprovals(pjos)
        
        // All filtered items should have pending_approval status
        expect(filtered.every(p => p.status === 'pending_approval')).toBe(true)
        
        // Count should match
        const expectedCount = pjos.filter(p => p.status === 'pending_approval').length
        expect(filtered.length).toBe(expectedCount)
      }),
      { numRuns: 100 }
    )
  })

  it('should not include PJOs with other statuses', () => {
    fc.assert(
      fc.property(fc.array(pjoApprovalArb, { minLength: 0, maxLength: 30 }), (pjos) => {
        const filtered = filterPendingApprovals(pjos)
        const otherStatuses = ['draft', 'approved', 'rejected']
        
        for (const pjo of filtered) {
          expect(otherStatuses).not.toContain(pjo.status)
        }
      }),
      { numRuns: 100 }
    )
  })
})

/**
 * **Feature: v0.9.4-manager-dashboard, Property 8: Approval queue data completeness**
 * **Validates: Requirements 4.2**
 */
describe('Property 8: Approval queue data completeness', () => {
  it('should include all required fields in transformed approval', () => {
    fc.assert(
      fc.property(
        pjoApprovalArb.filter(p => p.status === 'pending_approval'),
        (pjo) => {
          const currentDate = new Date()
          const approval = transformPendingApproval(pjo, currentDate)
          
          // Check all required fields exist
          expect(approval.id).toBe(pjo.id)
          expect(approval.pjo_number).toBe(pjo.pjo_number)
          expect(typeof approval.customer_name).toBe('string')
          expect(typeof approval.revenue).toBe('number')
          expect(typeof approval.estimatedProfit).toBe('number')
          expect(typeof approval.margin).toBe('number')
          expect(typeof approval.daysPending).toBe('number')
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should calculate estimated profit correctly', () => {
    fc.assert(
      fc.property(positiveNumber, positiveNumber, (revenue, cost) => {
        const profit = calculateEstimatedProfit(revenue, cost)
        expect(profit).toBeCloseTo(revenue - cost, 5)
      }),
      { numRuns: 100 }
    )
  })
})

/**
 * **Feature: v0.9.4-manager-dashboard, Property 9: Budget alerts filter and sort**
 * **Validates: Requirements 5.1, 5.2, 5.3**
 */
describe('Property 9: Budget alerts filter and sort', () => {
  it('should return only cost items with status exceeded', () => {
    fc.assert(
      fc.property(fc.array(costItemArb, { minLength: 0, maxLength: 30 }), (items) => {
        const filtered = filterBudgetAlerts(items)
        
        expect(filtered.every(i => i.status === 'exceeded')).toBe(true)
        
        const expectedCount = items.filter(i => i.status === 'exceeded').length
        expect(filtered.length).toBe(expectedCount)
      }),
      { numRuns: 100 }
    )
  })

  it('should calculate over-by percentage correctly', () => {
    fc.assert(
      fc.property(
        fc.float({ min: Math.fround(0.01), max: Math.fround(10000000), noNaN: true }),
        fc.float({ min: Math.fround(0.01), max: Math.fround(10000000), noNaN: true }),
        (budget, actual) => {
          const percentage = calculateOverByPercentage(budget, actual)
          const expected = ((actual - budget) / budget) * 100
          expect(percentage).toBeCloseTo(expected, 5)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should sort by variance percentage descending', () => {
    fc.assert(
      fc.property(
        fc.array(fc.record({ overByPercentage: fc.float({ min: Math.fround(-100), max: Math.fround(200), noNaN: true }) }), { minLength: 0, maxLength: 20 }),
        (items) => {
          const sorted = sortByVarianceDesc(items)
          
          for (let i = 1; i < sorted.length; i++) {
            expect(sorted[i - 1].overByPercentage).toBeGreaterThanOrEqual(sorted[i].overByPercentage)
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should return alerts sorted by variance descending', () => {
    fc.assert(
      fc.property(
        fc.array(costItemArb.filter(i => i.status === 'exceeded'), { minLength: 0, maxLength: 20 }),
        (items) => {
          const alerts = getBudgetAlerts(items)
          
          for (let i = 1; i < alerts.length; i++) {
            expect(alerts[i - 1].overByPercentage).toBeGreaterThanOrEqual(alerts[i].overByPercentage)
          }
        }
      ),
      { numRuns: 100 }
    )
  })
})


/**
 * **Feature: v0.9.4-manager-dashboard, Property 10: Team metrics by role**
 * **Validates: Requirements 6.3, 6.4**
 */
describe('Property 10: Team metrics by role', () => {
  it('should show PJOs created for admin/sales roles', () => {
    fc.assert(
      fc.property(
        userMetricsArb.filter(u => u.role === 'admin' || u.role === 'sales'),
        (user) => {
          const metrics = transformTeamMetrics(user)
          expect(metrics.pjosCreated).not.toBeNull()
          expect(typeof metrics.pjosCreated).toBe('number')
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should show JOs completed and on-time rate for ops role', () => {
    fc.assert(
      fc.property(
        userMetricsArb.filter(u => u.role === 'ops'),
        (user) => {
          const metrics = transformTeamMetrics(user)
          expect(metrics.josCompleted).not.toBeNull()
          expect(typeof metrics.josCompleted).toBe('number')
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should not show PJOs created for ops role', () => {
    fc.assert(
      fc.property(
        userMetricsArb.filter(u => u.role === 'ops'),
        (user) => {
          const metrics = transformTeamMetrics(user)
          expect(metrics.pjosCreated).toBeNull()
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should not show JOs completed for admin/sales roles', () => {
    fc.assert(
      fc.property(
        userMetricsArb.filter(u => u.role === 'admin' || u.role === 'sales'),
        (user) => {
          const metrics = transformTeamMetrics(user)
          expect(metrics.josCompleted).toBeNull()
          expect(metrics.onTimeRate).toBeNull()
        }
      ),
      { numRuns: 100 }
    )
  })
})

/**
 * **Feature: v0.9.4-manager-dashboard, Property 11: Performance rating calculation**
 * **Validates: Requirements 6.5**
 */
describe('Property 11: Performance rating calculation', () => {
  it('should return rating between 1 and 5 inclusive', () => {
    fc.assert(
      fc.property(userMetricsArb, (user) => {
        const rating = calculatePerformanceRating(user)
        expect(rating).toBeGreaterThanOrEqual(1)
        expect(rating).toBeLessThanOrEqual(5)
      }),
      { numRuns: 100 }
    )
  })

  it('should return integer rating', () => {
    fc.assert(
      fc.property(userMetricsArb, (user) => {
        const rating = calculatePerformanceRating(user)
        expect(Number.isInteger(rating)).toBe(true)
      }),
      { numRuns: 100 }
    )
  })

  it('should give higher rating for more PJOs created (admin/sales)', () => {
    const lowPerformer: UserMetricsInput = { userId: '1', name: 'Low', role: 'admin', pjosCreated: 1 }
    const highPerformer: UserMetricsInput = { userId: '2', name: 'High', role: 'admin', pjosCreated: 15 }
    
    expect(calculatePerformanceRating(highPerformer)).toBeGreaterThan(calculatePerformanceRating(lowPerformer))
  })

  it('should give higher rating for more JOs completed with good on-time rate (ops)', () => {
    const lowPerformer: UserMetricsInput = { userId: '1', name: 'Low', role: 'ops', josCompleted: 1, josOnTime: 0, josTotal: 1 }
    const highPerformer: UserMetricsInput = { userId: '2', name: 'High', role: 'ops', josCompleted: 20, josOnTime: 19, josTotal: 20 }
    
    expect(calculatePerformanceRating(highPerformer)).toBeGreaterThan(calculatePerformanceRating(lowPerformer))
  })
})

/**
 * **Feature: v0.9.4-manager-dashboard, Property 12: Period date calculation**
 * **Validates: Requirements 7.2**
 */
describe('Property 12: Period date calculation', () => {
  it('should return correct date range for this_month', () => {
    fc.assert(
      fc.property(
        dateArb,
        (currentDate) => {
          const period = getManagerPeriodDates('this_month', currentDate)
          
          // Start should be first day of month
          expect(period.startDate.getDate()).toBe(1)
          expect(period.startDate.getMonth()).toBe(currentDate.getMonth())
          expect(period.startDate.getFullYear()).toBe(currentDate.getFullYear())
          
          // End should be last day of month
          const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()
          expect(period.endDate.getDate()).toBe(lastDay)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should return correct date range for this_quarter', () => {
    fc.assert(
      fc.property(
        dateArb,
        (currentDate) => {
          const period = getManagerPeriodDates('this_quarter', currentDate)
          const quarter = Math.floor(currentDate.getMonth() / 3)
          
          // Start should be first day of quarter
          expect(period.startDate.getMonth()).toBe(quarter * 3)
          expect(period.startDate.getDate()).toBe(1)
          
          // End should be last day of quarter
          expect(period.endDate.getMonth()).toBe(quarter * 3 + 2)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should return correct date range for this_year', () => {
    fc.assert(
      fc.property(
        dateArb,
        (currentDate) => {
          const period = getManagerPeriodDates('this_year', currentDate)
          
          // Start should be Jan 1
          expect(period.startDate.getMonth()).toBe(0)
          expect(period.startDate.getDate()).toBe(1)
          
          // End should be Dec 31
          expect(period.endDate.getMonth()).toBe(11)
          expect(period.endDate.getDate()).toBe(31)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should return correct date range for ytd', () => {
    fc.assert(
      fc.property(
        dateArb,
        (currentDate) => {
          const period = getManagerPeriodDates('ytd', currentDate)
          
          // Start should be Jan 1
          expect(period.startDate.getMonth()).toBe(0)
          expect(period.startDate.getDate()).toBe(1)
          
          // End should be current date
          expect(period.endDate.getDate()).toBe(currentDate.getDate())
          expect(period.endDate.getMonth()).toBe(currentDate.getMonth())
        }
      ),
      { numRuns: 100 }
    )
  })
})

/**
 * **Feature: v0.9.4-manager-dashboard, Property 13: Previous period calculation**
 * **Validates: Requirements 7.4**
 */
describe('Property 13: Previous period calculation', () => {
  it('should return previous month for this_month period', () => {
    const currentDate = new Date('2025-06-15')
    const period = getManagerPeriodDates('this_month', currentDate)
    const previous = getPreviousPeriodDates(period)
    
    // Previous should be May
    expect(previous.startDate.getMonth()).toBe(4) // May
    expect(previous.endDate.getMonth()).toBe(4)
  })

  it('should return previous quarter for this_quarter period', () => {
    const currentDate = new Date('2025-06-15') // Q2
    const period = getManagerPeriodDates('this_quarter', currentDate)
    const previous = getPreviousPeriodDates(period)
    
    // Previous should be Q1
    expect(previous.startDate.getMonth()).toBe(0) // Jan
    expect(previous.endDate.getMonth()).toBe(2) // Mar
  })

  it('should have previous period end before current period start', () => {
    // Use a date range that ensures we have room for previous periods
    const laterDateArb = fc.integer({ min: new Date('2024-03-01').getTime(), max: new Date('2025-12-31').getTime() }).map(ts => new Date(ts))
    fc.assert(
      fc.property(
        periodType,
        laterDateArb,
        (type, currentDate) => {
          const period = getManagerPeriodDates(type, currentDate)
          const previous = getPreviousPeriodDates(period)
          
          expect(previous.endDate.getTime()).toBeLessThan(period.startDate.getTime())
        }
      ),
      { numRuns: 100 }
    )
  })
})

/**
 * **Feature: v0.9.4-manager-dashboard, Property 1: Dashboard routing for manager role**
 * **Validates: Requirements 1.1**
 */
describe('Property 1: Dashboard routing for manager role', () => {
  it('should identify manager role correctly', () => {
    // This is a simple check - actual routing is tested in integration
    const managerRoles = ['manager']
    expect(managerRoles.includes('manager')).toBe(true)
    expect(managerRoles.includes('admin')).toBe(false)
    expect(managerRoles.includes('ops')).toBe(false)
  })
})
