/**
 * Property-based tests for Sales/Engineering Dashboard Utilities
 * Using fast-check for property-based testing
 */

import * as fc from 'fast-check'
import {
  calculateTotalPipelineValue,
  calculateTotalPipelineCount,
  calculateWinRate,
  isDeadlineUrgent,
  isDeadlineCritical,
  filterUrgentQuotations,
  sortByDeadlineUrgency,
  getEngineeringStatusDisplay,
  groupAssessmentsByType,
  isDashboardStale,
  formatPipelineFunnelData,
  URGENT_DEADLINE_DAYS,
  CRITICAL_DEADLINE_DAYS,
  STALENESS_THRESHOLD_MS,
  type SalesPipelineSummary,
  type EngineeringWorkloadSummary,
  type QuotationListItem,
  type EngineeringStatusType,
} from '@/lib/sales-engineering-dashboard-utils'

// =====================================================
// Helper for generating valid ISO date strings
// =====================================================
const isoDateStringArb = fc.integer({ min: 2020, max: 2030 }).chain((year) =>
  fc.integer({ min: 1, max: 12 }).chain((month) =>
    fc.integer({ min: 1, max: 28 }).map((day) => {
      const d = new Date(year, month - 1, day, 12, 0, 0)
      return d.toISOString()
    })
  )
)

const dateOnlyStringArb = fc.integer({ min: 2020, max: 2030 }).chain((year) =>
  fc.integer({ min: 1, max: 12 }).chain((month) =>
    fc.integer({ min: 1, max: 28 }).map((day) => {
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    })
  )
)

// =====================================================
// Arbitraries
// =====================================================

const salesPipelineSummaryArb = fc.record({
  draftCount: fc.integer({ min: 0, max: 100 }),
  draftValue: fc.integer({ min: 0, max: 10_000_000_000 }),
  engReviewCount: fc.integer({ min: 0, max: 100 }),
  engReviewValue: fc.integer({ min: 0, max: 10_000_000_000 }),
  submittedCount: fc.integer({ min: 0, max: 100 }),
  submittedValue: fc.integer({ min: 0, max: 10_000_000_000 }),
  readyCount: fc.integer({ min: 0, max: 100 }),
  readyValue: fc.integer({ min: 0, max: 10_000_000_000 }),
  wonMTD: fc.integer({ min: 0, max: 100 }),
  wonValueMTD: fc.integer({ min: 0, max: 10_000_000_000 }),
  lostMTD: fc.integer({ min: 0, max: 100 }),
  lostValueMTD: fc.integer({ min: 0, max: 10_000_000_000 }),
  winRate90d: fc.integer({ min: 0, max: 100 }),
  pursuitCostsMTD: fc.integer({ min: 0, max: 1_000_000_000 }),
  calculatedAt: isoDateStringArb,
})

const engineeringWorkloadSummaryArb = fc.record({
  pendingAssessments: fc.integer({ min: 0, max: 100 }),
  pendingSurveys: fc.integer({ min: 0, max: 50 }),
  pendingTechnical: fc.integer({ min: 0, max: 50 }),
  pendingJMP: fc.integer({ min: 0, max: 50 }),
  pendingPermit: fc.integer({ min: 0, max: 50 }),
  completedMTD: fc.integer({ min: 0, max: 100 }),
  complexInPipeline: fc.integer({ min: 0, max: 50 }),
  calculatedAt: isoDateStringArb,
})

const quotationStatusArb = fc.constantFrom(
  'draft',
  'engineering_review',
  'ready',
  'submitted',
  'won',
  'lost',
  'cancelled'
) as fc.Arbitrary<QuotationListItem['status']>

const engineeringStatusArb = fc.constantFrom(
  'not_required',
  'pending',
  'in_progress',
  'completed'
) as fc.Arbitrary<EngineeringStatusType>

const quotationListItemArb = fc.record({
  id: fc.uuid(),
  quotationNumber: fc.string({ minLength: 1, maxLength: 20 }),
  rfqNumber: fc.option(fc.string({ minLength: 1, maxLength: 20 }), { nil: null }),
  customerName: fc.string({ minLength: 1, maxLength: 100 }),
  cargoDescription: fc.option(fc.string({ minLength: 1, maxLength: 200 }), { nil: null }),
  totalRevenue: fc.integer({ min: 0, max: 10_000_000_000 }),
  grossMargin: fc.option(fc.integer({ min: -100, max: 100 }), { nil: null }),
  status: quotationStatusArb,
  marketType: fc.constantFrom('simple', 'complex') as fc.Arbitrary<'simple' | 'complex'>,
  submissionDeadline: fc.option(dateOnlyStringArb, { nil: null }),
  createdAt: isoDateStringArb,
  updatedAt: isoDateStringArb,
  engineeringStatus: engineeringStatusArb,
  daysToDeadline: fc.option(fc.integer({ min: -30, max: 365 }), { nil: null }),
})

// =====================================================
// Property 1: Pipeline Value and Count Calculation
// =====================================================

describe('Property 1: Pipeline Value and Count Calculation', () => {
  it('total pipeline value equals sum of draft + eng_review + ready + submitted values', () => {
    fc.assert(
      fc.property(salesPipelineSummaryArb, (summary) => {
        const totalValue = calculateTotalPipelineValue(summary)
        const expectedValue =
          summary.draftValue +
          summary.engReviewValue +
          summary.readyValue +
          summary.submittedValue
        return totalValue === expectedValue
      }),
      { numRuns: 100 }
    )
  })

  it('total pipeline count equals sum of draft + eng_review + ready + submitted counts', () => {
    fc.assert(
      fc.property(salesPipelineSummaryArb, (summary) => {
        const totalCount = calculateTotalPipelineCount(summary)
        const expectedCount =
          summary.draftCount +
          summary.engReviewCount +
          summary.readyCount +
          summary.submittedCount
        return totalCount === expectedCount
      }),
      { numRuns: 100 }
    )
  })

  it('pipeline value is always non-negative', () => {
    fc.assert(
      fc.property(salesPipelineSummaryArb, (summary) => {
        return calculateTotalPipelineValue(summary) >= 0
      }),
      { numRuns: 100 }
    )
  })

  it('pipeline count is always non-negative', () => {
    fc.assert(
      fc.property(salesPipelineSummaryArb, (summary) => {
        return calculateTotalPipelineCount(summary) >= 0
      }),
      { numRuns: 100 }
    )
  })
})

// =====================================================
// Property 2: Urgent Deadline Detection
// =====================================================

describe('Property 2: Urgent Deadline Detection', () => {
  it('returns true for days <= 7 and >= 0', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: URGENT_DEADLINE_DAYS }), (days) => {
        return isDeadlineUrgent(days) === true
      }),
      { numRuns: 100 }
    )
  })

  it('returns false for days > 7', () => {
    fc.assert(
      fc.property(fc.integer({ min: URGENT_DEADLINE_DAYS + 1, max: 365 }), (days) => {
        return isDeadlineUrgent(days) === false
      }),
      { numRuns: 100 }
    )
  })

  it('returns false for negative days', () => {
    fc.assert(
      fc.property(fc.integer({ min: -365, max: -1 }), (days) => {
        return isDeadlineUrgent(days) === false
      }),
      { numRuns: 100 }
    )
  })

  it('returns false for null', () => {
    expect(isDeadlineUrgent(null)).toBe(false)
  })
})

// =====================================================
// Property 3: Critical Deadline Detection
// =====================================================

describe('Property 3: Critical Deadline Detection', () => {
  it('returns true for days <= 3 and >= 0', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: CRITICAL_DEADLINE_DAYS }), (days) => {
        return isDeadlineCritical(days) === true
      }),
      { numRuns: 100 }
    )
  })

  it('returns false for days > 3', () => {
    fc.assert(
      fc.property(fc.integer({ min: CRITICAL_DEADLINE_DAYS + 1, max: 365 }), (days) => {
        return isDeadlineCritical(days) === false
      }),
      { numRuns: 100 }
    )
  })

  it('returns false for negative days', () => {
    fc.assert(
      fc.property(fc.integer({ min: -365, max: -1 }), (days) => {
        return isDeadlineCritical(days) === false
      }),
      { numRuns: 100 }
    )
  })

  it('returns false for null', () => {
    expect(isDeadlineCritical(null)).toBe(false)
  })

  it('critical implies urgent', () => {
    fc.assert(
      fc.property(fc.option(fc.integer({ min: -30, max: 365 }), { nil: null }), (days) => {
        if (isDeadlineCritical(days)) {
          return isDeadlineUrgent(days)
        }
        return true
      }),
      { numRuns: 100 }
    )
  })
})

// =====================================================
// Property 4: Urgent Quotations Filter
// =====================================================

describe('Property 4: Urgent Quotations Filter', () => {
  it('all returned quotations have daysToDeadline <= maxDays and >= 0', () => {
    fc.assert(
      fc.property(
        fc.array(quotationListItemArb, { minLength: 0, maxLength: 20 }),
        fc.integer({ min: 1, max: 30 }),
        (quotations, maxDays) => {
          const filtered = filterUrgentQuotations(quotations, maxDays)
          return filtered.every(
            (q) =>
              q.daysToDeadline !== null &&
              q.daysToDeadline >= 0 &&
              q.daysToDeadline <= maxDays
          )
        }
      ),
      { numRuns: 100 }
    )
  })

  it('excludes quotations with null deadline', () => {
    fc.assert(
      fc.property(
        fc.array(quotationListItemArb, { minLength: 0, maxLength: 20 }),
        (quotations) => {
          const filtered = filterUrgentQuotations(quotations)
          return filtered.every((q) => q.daysToDeadline !== null)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('excludes quotations with negative deadline', () => {
    fc.assert(
      fc.property(
        fc.array(quotationListItemArb, { minLength: 0, maxLength: 20 }),
        (quotations) => {
          const filtered = filterUrgentQuotations(quotations)
          return filtered.every((q) => q.daysToDeadline !== null && q.daysToDeadline >= 0)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('filtered count is <= original count', () => {
    fc.assert(
      fc.property(
        fc.array(quotationListItemArb, { minLength: 0, maxLength: 20 }),
        (quotations) => {
          const filtered = filterUrgentQuotations(quotations)
          return filtered.length <= quotations.length
        }
      ),
      { numRuns: 100 }
    )
  })
})

// =====================================================
// Property 5: Engineering Status Display
// =====================================================

describe('Property 5: Engineering Status Display', () => {
  it('completed status returns checkmark icon', () => {
    const display = getEngineeringStatusDisplay('completed')
    expect(display.icon).toBe('✅')
    expect(display.label).toBe('Completed')
  })

  it('in_progress status returns spinner icon', () => {
    const display = getEngineeringStatusDisplay('in_progress')
    expect(display.icon).toBe('🔄')
    expect(display.label).toBe('In Progress')
  })

  it('pending status returns hourglass icon', () => {
    const display = getEngineeringStatusDisplay('pending')
    expect(display.icon).toBe('⏳')
    expect(display.label).toBe('Pending')
  })

  it('not_required status returns N/A', () => {
    const display = getEngineeringStatusDisplay('not_required')
    expect(display.icon).toBe('N/A')
    expect(display.label).toBe('Not Required')
  })

  it('all statuses return valid display objects', () => {
    fc.assert(
      fc.property(engineeringStatusArb, (status) => {
        const display = getEngineeringStatusDisplay(status)
        return (
          typeof display.icon === 'string' &&
          display.icon.length > 0 &&
          typeof display.label === 'string' &&
          display.label.length > 0 &&
          typeof display.colorClass === 'string'
        )
      }),
      { numRuns: 50 }
    )
  })
})

// =====================================================
// Property 6: Win Rate Calculation
// =====================================================

describe('Property 6: Win Rate Calculation', () => {
  it('returns 0 when both won and lost are 0', () => {
    expect(calculateWinRate(0, 0)).toBe(0)
  })

  it('returns 100 when lost is 0 and won > 0', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 1000 }), (won) => {
        return calculateWinRate(won, 0) === 100
      }),
      { numRuns: 100 }
    )
  })

  it('returns 0 when won is 0 and lost > 0', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 1000 }), (lost) => {
        return calculateWinRate(0, lost) === 0
      }),
      { numRuns: 100 }
    )
  })

  it('win rate is between 0 and 100', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 1000 }),
        fc.integer({ min: 0, max: 1000 }),
        (won, lost) => {
          const rate = calculateWinRate(won, lost)
          return rate >= 0 && rate <= 100
        }
      ),
      { numRuns: 100 }
    )
  })

  it('win rate equals (won / (won + lost)) * 100', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 1000 }),
        fc.integer({ min: 0, max: 1000 }),
        (won, lost) => {
          const rate = calculateWinRate(won, lost)
          const total = won + lost
          if (total === 0) return rate === 0
          const expected = (won / total) * 100
          return Math.abs(rate - expected) < 0.0001
        }
      ),
      { numRuns: 100 }
    )
  })
})

// =====================================================
// Property 7: Staleness Detection
// =====================================================

describe('Property 7: Staleness Detection', () => {
  it('returns true when data is older than 5 minutes', () => {
    const now = new Date()
    const oldTime = new Date(now.getTime() - STALENESS_THRESHOLD_MS - 1000)
    expect(isDashboardStale(oldTime.toISOString(), now)).toBe(true)
  })

  it('returns false when data is newer than 5 minutes', () => {
    const now = new Date()
    const recentTime = new Date(now.getTime() - STALENESS_THRESHOLD_MS + 60000)
    expect(isDashboardStale(recentTime.toISOString(), now)).toBe(false)
  })

  it('returns false for current time', () => {
    const now = new Date()
    expect(isDashboardStale(now.toISOString(), now)).toBe(false)
  })

  it('staleness is monotonic with time difference', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 60 * 60 * 1000 }), // up to 1 hour
        (diffMs) => {
          const now = new Date()
          const past = new Date(now.getTime() - diffMs)
          const isStale = isDashboardStale(past.toISOString(), now)
          if (diffMs > STALENESS_THRESHOLD_MS) {
            return isStale === true
          } else {
            return isStale === false
          }
        }
      ),
      { numRuns: 100 }
    )
  })
})

// =====================================================
// Property 8: Pipeline Funnel Data
// =====================================================

describe('Property 8: Pipeline Funnel Data', () => {
  it('returns exactly 4 items in correct order', () => {
    fc.assert(
      fc.property(salesPipelineSummaryArb, (summary) => {
        const funnel = formatPipelineFunnelData(summary)
        return (
          funnel.length === 4 &&
          funnel[0].stage === 'draft' &&
          funnel[1].stage === 'eng_review' &&
          funnel[2].stage === 'ready' &&
          funnel[3].stage === 'submitted'
        )
      }),
      { numRuns: 100 }
    )
  })

  it('funnel values match summary values', () => {
    fc.assert(
      fc.property(salesPipelineSummaryArb, (summary) => {
        const funnel = formatPipelineFunnelData(summary)
        return (
          funnel[0].value === summary.draftValue &&
          funnel[0].count === summary.draftCount &&
          funnel[1].value === summary.engReviewValue &&
          funnel[1].count === summary.engReviewCount &&
          funnel[2].value === summary.readyValue &&
          funnel[2].count === summary.readyCount &&
          funnel[3].value === summary.submittedValue &&
          funnel[3].count === summary.submittedCount
        )
      }),
      { numRuns: 100 }
    )
  })

  it('all funnel items have required properties', () => {
    fc.assert(
      fc.property(salesPipelineSummaryArb, (summary) => {
        const funnel = formatPipelineFunnelData(summary)
        return funnel.every(
          (item) =>
            typeof item.stage === 'string' &&
            typeof item.label === 'string' &&
            typeof item.count === 'number' &&
            typeof item.value === 'number' &&
            typeof item.colorClass === 'string'
        )
      }),
      { numRuns: 100 }
    )
  })
})

// =====================================================
// Property 9: Assessment Type Grouping
// =====================================================

describe('Property 9: Assessment Type Grouping', () => {
  it('returns exactly 4 groups', () => {
    fc.assert(
      fc.property(engineeringWorkloadSummaryArb, (summary) => {
        const groups = groupAssessmentsByType(summary)
        return groups.length === 4
      }),
      { numRuns: 100 }
    )
  })

  it('group counts match summary counts', () => {
    fc.assert(
      fc.property(engineeringWorkloadSummaryArb, (summary) => {
        const groups = groupAssessmentsByType(summary)
        const surveyGroup = groups.find((g) => g.type === 'route_survey')
        const technicalGroup = groups.find((g) => g.type === 'technical_review')
        const jmpGroup = groups.find((g) => g.type === 'jmp_creation')
        const permitGroup = groups.find((g) => g.type === 'permit_check')

        return (
          surveyGroup?.count === summary.pendingSurveys &&
          technicalGroup?.count === summary.pendingTechnical &&
          jmpGroup?.count === summary.pendingJMP &&
          permitGroup?.count === summary.pendingPermit
        )
      }),
      { numRuns: 100 }
    )
  })

  it('maxCount is at least 1', () => {
    fc.assert(
      fc.property(engineeringWorkloadSummaryArb, (summary) => {
        const groups = groupAssessmentsByType(summary)
        return groups.every((g) => g.maxCount >= 1)
      }),
      { numRuns: 100 }
    )
  })

  it('maxCount is >= all individual counts', () => {
    fc.assert(
      fc.property(engineeringWorkloadSummaryArb, (summary) => {
        const groups = groupAssessmentsByType(summary)
        return groups.every((g) => g.maxCount >= g.count)
      }),
      { numRuns: 100 }
    )
  })
})

// =====================================================
// Property 10: Quotation Sorting
// =====================================================

describe('Property 10: Quotation Sorting', () => {
  it('sorted list has same length as input', () => {
    fc.assert(
      fc.property(
        fc.array(quotationListItemArb, { minLength: 0, maxLength: 20 }),
        (quotations) => {
          const sorted = sortByDeadlineUrgency(quotations)
          return sorted.length === quotations.length
        }
      ),
      { numRuns: 100 }
    )
  })

  it('non-null deadlines come before null deadlines', () => {
    fc.assert(
      fc.property(
        fc.array(quotationListItemArb, { minLength: 0, maxLength: 20 }),
        (quotations) => {
          const sorted = sortByDeadlineUrgency(quotations)
          let seenNull = false
          for (const q of sorted) {
            if (q.daysToDeadline === null) {
              seenNull = true
            } else if (seenNull) {
              // Found non-null after null - invalid
              return false
            }
          }
          return true
        }
      ),
      { numRuns: 100 }
    )
  })

  it('non-null deadlines are sorted ascending', () => {
    fc.assert(
      fc.property(
        fc.array(quotationListItemArb, { minLength: 0, maxLength: 20 }),
        (quotations) => {
          const sorted = sortByDeadlineUrgency(quotations)
          const nonNull = sorted.filter((q) => q.daysToDeadline !== null)
          for (let i = 1; i < nonNull.length; i++) {
            if (nonNull[i].daysToDeadline! < nonNull[i - 1].daysToDeadline!) {
              return false
            }
          }
          return true
        }
      ),
      { numRuns: 100 }
    )
  })

  it('does not mutate original array', () => {
    fc.assert(
      fc.property(
        fc.array(quotationListItemArb, { minLength: 1, maxLength: 10 }),
        (quotations) => {
          const original = [...quotations]
          sortByDeadlineUrgency(quotations)
          return quotations.every((q, i) => q === original[i])
        }
      ),
      { numRuns: 100 }
    )
  })
})

// =====================================================
// Additional Edge Case Tests
// =====================================================

describe('Edge Cases', () => {
  it('handles empty quotation list', () => {
    expect(filterUrgentQuotations([])).toEqual([])
    expect(sortByDeadlineUrgency([])).toEqual([])
  })

  it('handles zero values in pipeline summary', () => {
    const zeroSummary: SalesPipelineSummary = {
      draftCount: 0,
      draftValue: 0,
      engReviewCount: 0,
      engReviewValue: 0,
      submittedCount: 0,
      submittedValue: 0,
      readyCount: 0,
      readyValue: 0,
      wonMTD: 0,
      wonValueMTD: 0,
      lostMTD: 0,
      lostValueMTD: 0,
      winRate90d: 0,
      pursuitCostsMTD: 0,
      calculatedAt: new Date().toISOString(),
    }
    expect(calculateTotalPipelineValue(zeroSummary)).toBe(0)
    expect(calculateTotalPipelineCount(zeroSummary)).toBe(0)
    expect(formatPipelineFunnelData(zeroSummary)).toHaveLength(4)
  })

  it('handles zero values in engineering summary', () => {
    const zeroSummary: EngineeringWorkloadSummary = {
      pendingAssessments: 0,
      pendingSurveys: 0,
      pendingTechnical: 0,
      pendingJMP: 0,
      pendingPermit: 0,
      completedMTD: 0,
      complexInPipeline: 0,
      calculatedAt: new Date().toISOString(),
    }
    const groups = groupAssessmentsByType(zeroSummary)
    expect(groups).toHaveLength(4)
    expect(groups.every((g) => g.count === 0)).toBe(true)
    expect(groups.every((g) => g.maxCount >= 1)).toBe(true)
  })
})
