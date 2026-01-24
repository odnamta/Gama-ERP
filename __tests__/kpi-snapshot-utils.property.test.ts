// =====================================================
// v0.70: KPI SNAPSHOT UTILS PROPERTY TESTS
// =====================================================
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  getWeekNumber,
  getWeekDateRange,
  getPreviousWeek,
  calculateRevenueMetrics,
  calculateOperationalMetrics,
  calculateFinancialMetrics,
  createKPISnapshotInput,
  isKPISnapshotComplete,
  filterKPISnapshots,
  getRecentSnapshots,
  determineTrendDirection,
  calculateChangePercent,
  createKPITrend,
  calculateWeekOverWeekTrends,
  isValidWeekNumber,
  isValidYear,
  isValidRevenueMetrics,
  isValidOperationalMetrics,
  isValidFinancialMetrics,
} from '@/lib/kpi-snapshot-utils';
import {
  KPISnapshot,
  RevenueMetrics,
  OperationalMetrics,
  FinancialMetrics,
} from '@/types/kpi-snapshot';

// =====================================================
// GENERATORS
// =====================================================

const weekNumberArb = fc.integer({ min: 1, max: 53 });
const yearArb = fc.integer({ min: 2020, max: 2030 });
const positiveAmountArb = fc.integer({ min: 0, max: 1000000 });
const percentageArb = fc.integer({ min: 0, max: 100 });
const nonNegativeIntArb = fc.integer({ min: 0, max: 1000 });

const revenueMetricsArb: fc.Arbitrary<RevenueMetrics> = fc.record({
  total_revenue: positiveAmountArb,
  revenue_by_customer: fc.constant({ 'Customer A': 1000 }),
  revenue_by_service: fc.constant({ 'Trucking': 1000 }),
});

const operationalMetricsArb: fc.Arbitrary<OperationalMetrics> = fc.record({
  jobs_completed: nonNegativeIntArb,
  on_time_delivery_rate: percentageArb,
  average_job_duration_days: fc.integer({ min: 0, max: 365 }),
});

const financialMetricsArb: fc.Arbitrary<FinancialMetrics> = fc.record({
  ar_aging_current: positiveAmountArb,
  ar_aging_30_days: positiveAmountArb,
  ar_aging_60_days: positiveAmountArb,
  ar_aging_90_plus: positiveAmountArb,
  collection_rate: percentageArb,
});

const kpiSnapshotArb: fc.Arbitrary<KPISnapshot> = fc.record({
  id: fc.uuid(),
  week_number: weekNumberArb,
  year: yearArb,
  snapshot_date: fc.constant('2024-06-15'),
  revenue_metrics: revenueMetricsArb,
  operational_metrics: operationalMetricsArb,
  financial_metrics: financialMetricsArb,
  created_at: fc.constant('2024-06-15T00:00:00.000Z'),
});

// =====================================================
// PROPERTY TESTS
// =====================================================

describe('KPI Snapshot Utils Property Tests', () => {
  /**
   * **Feature: n8n-scheduled-tasks, Property 12: KPI Snapshot Completeness**
   * **Validates: Requirements 6.2, 6.3, 6.4, 6.5**
   */
  describe('Property 12: KPI Snapshot Completeness', () => {
    it('should validate complete KPI snapshots as complete', () => {
      fc.assert(
        fc.property(kpiSnapshotArb, (snapshot) => {
          return isKPISnapshotComplete(snapshot) === true;
        }),
        { numRuns: 100 }
      );
    });

    it('should create snapshot input with all required fields', () => {
      fc.assert(
        fc.property(
          weekNumberArb,
          yearArb,
          revenueMetricsArb,
          operationalMetricsArb,
          financialMetricsArb,
          (weekNumber, year, revenue, operational, financial) => {
            const input = createKPISnapshotInput(weekNumber, year, revenue, operational, financial);
            return (
              input.week_number === weekNumber &&
              input.year === year &&
              input.snapshot_date !== undefined &&
              input.revenue_metrics === revenue &&
              input.operational_metrics === operational &&
              input.financial_metrics === financial
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject snapshots missing required revenue metrics', () => {
      fc.assert(
        fc.property(kpiSnapshotArb, (snapshot) => {
          const invalidSnapshot = {
            ...snapshot,
            revenue_metrics: { ...snapshot.revenue_metrics, total_revenue: undefined as any },
          };
          return isKPISnapshotComplete(invalidSnapshot) === false;
        }),
        { numRuns: 100 }
      );
    });

    it('should reject snapshots missing required operational metrics', () => {
      fc.assert(
        fc.property(kpiSnapshotArb, (snapshot) => {
          const invalidSnapshot = {
            ...snapshot,
            operational_metrics: { ...snapshot.operational_metrics, jobs_completed: undefined as any },
          };
          return isKPISnapshotComplete(invalidSnapshot) === false;
        }),
        { numRuns: 100 }
      );
    });

    it('should reject snapshots missing required financial metrics', () => {
      fc.assert(
        fc.property(kpiSnapshotArb, (snapshot) => {
          const invalidSnapshot = {
            ...snapshot,
            financial_metrics: { ...snapshot.financial_metrics, collection_rate: undefined as any },
          };
          return isKPISnapshotComplete(invalidSnapshot) === false;
        }),
        { numRuns: 100 }
      );
    });

    it('should validate revenue metrics structure', () => {
      fc.assert(
        fc.property(revenueMetricsArb, (metrics) => {
          return isValidRevenueMetrics(metrics) === true;
        }),
        { numRuns: 100 }
      );
    });

    it('should validate operational metrics structure', () => {
      fc.assert(
        fc.property(operationalMetricsArb, (metrics) => {
          return isValidOperationalMetrics(metrics) === true;
        }),
        { numRuns: 100 }
      );
    });

    it('should validate financial metrics structure', () => {
      fc.assert(
        fc.property(financialMetricsArb, (metrics) => {
          return isValidFinancialMetrics(metrics) === true;
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: n8n-scheduled-tasks, Property 13: Week-over-Week Trend Calculation**
   * **Validates: Requirements 6.6**
   */
  describe('Property 13: Week-over-Week Trend Calculation', () => {
    it('should calculate change percent correctly', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 10000 }),
          fc.integer({ min: 1, max: 10000 }),
          (currentValue, previousValue) => {
            const changePercent = calculateChangePercent(currentValue, previousValue);
            const expected = ((currentValue - previousValue) / previousValue) * 100;
            return Math.abs(changePercent - expected) < 0.01;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return 100% change when previous value is 0 and current is positive', () => {
      fc.assert(
        fc.property(fc.integer({ min: 1, max: 10000 }), (currentValue) => {
          const changePercent = calculateChangePercent(currentValue, 0);
          return changePercent === 100;
        }),
        { numRuns: 100 }
      );
    });

    it('should return 0% change when both values are 0', () => {
      const changePercent = calculateChangePercent(0, 0);
      expect(changePercent).toBe(0);
    });

    it('should determine trend direction correctly for positive change', () => {
      fc.assert(
        fc.property(fc.integer({ min: 1, max: 1000 }), (positiveChange) => {
          return determineTrendDirection(positiveChange) === 'up';
        }),
        { numRuns: 100 }
      );
    });

    it('should determine trend direction correctly for negative change', () => {
      fc.assert(
        fc.property(fc.integer({ min: -1000, max: -1 }), (negativeChange) => {
          return determineTrendDirection(negativeChange) === 'down';
        }),
        { numRuns: 100 }
      );
    });

    it('should determine trend direction as stable for zero change', () => {
      expect(determineTrendDirection(0)).toBe('stable');
    });

    it('should create KPI trend with correct structure', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 20 }),
          fc.integer({ min: 0, max: 10000 }),
          fc.integer({ min: 1, max: 10000 }),
          (metricName, currentValue, previousValue) => {
            const trend = createKPITrend(metricName, currentValue, previousValue);
            return (
              trend.metric_name === metricName &&
              trend.current_value === currentValue &&
              trend.previous_value === previousValue &&
              typeof trend.change_percent === 'number' &&
              ['up', 'down', 'stable'].includes(trend.trend)
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should calculate week-over-week trends for all metrics', () => {
      fc.assert(
        fc.property(kpiSnapshotArb, kpiSnapshotArb, (current, previous) => {
          const trends = calculateWeekOverWeekTrends(current, previous);
          const expectedMetrics = [
            'total_revenue', 'jobs_completed', 'on_time_delivery_rate',
            'average_job_duration_days', 'ar_aging_current', 'ar_aging_30_days',
            'ar_aging_60_days', 'ar_aging_90_plus', 'collection_rate',
          ];
          const trendMetricNames = trends.map(t => t.metric_name);
          return expectedMetrics.every(m => trendMetricNames.includes(m));
        }),
        { numRuns: 100 }
      );
    });

    it('should calculate correct trend direction for each metric', () => {
      fc.assert(
        fc.property(kpiSnapshotArb, kpiSnapshotArb, (current, previous) => {
          const trends = calculateWeekOverWeekTrends(current, previous);
          for (const trend of trends) {
            const expectedDirection = determineTrendDirection(trend.change_percent);
            if (trend.trend !== expectedDirection) return false;
          }
          return true;
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Date Utilities', () => {
    // Custom date generator that ensures valid dates
    const validDateArb = fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') })
      .filter(d => !isNaN(d.getTime()));

    it('should return valid week numbers (1-53)', () => {
      fc.assert(
        fc.property(validDateArb, (date) => {
          const weekNum = getWeekNumber(date);
          return weekNum >= 1 && weekNum <= 53;
        }),
        { numRuns: 100 }
      );
    });

    it('should return valid date range for week', () => {
      fc.assert(
        fc.property(weekNumberArb, yearArb, (weekNumber, year) => {
          const range = getWeekDateRange(weekNumber, year);
          return range.endDate.getTime() > range.startDate.getTime();
        }),
        { numRuns: 100 }
      );
    });

    it('should get previous week correctly', () => {
      fc.assert(
        fc.property(weekNumberArb, yearArb, (weekNumber, year) => {
          const prev = getPreviousWeek(weekNumber, year);
          if (weekNumber > 1) {
            return prev.weekNumber === weekNumber - 1 && prev.year === year;
          } else {
            return prev.weekNumber === 52 && prev.year === year - 1;
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should validate week numbers correctly', () => {
      fc.assert(
        fc.property(weekNumberArb, (weekNumber) => {
          return isValidWeekNumber(weekNumber) === true;
        }),
        { numRuns: 100 }
      );
    });

    it('should reject invalid week numbers', () => {
      fc.assert(
        fc.property(
          fc.oneof(fc.integer({ min: -100, max: 0 }), fc.integer({ min: 54, max: 200 })),
          (invalidWeek) => {
            return isValidWeekNumber(invalidWeek) === false;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should validate years correctly', () => {
      fc.assert(
        fc.property(yearArb, (year) => {
          return isValidYear(year) === true;
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Snapshot Filtering', () => {
    it('should filter snapshots by year', () => {
      fc.assert(
        fc.property(
          fc.array(kpiSnapshotArb, { minLength: 0, maxLength: 10 }),
          yearArb,
          (snapshots, filterYear) => {
            const filtered = filterKPISnapshots(snapshots, { year: filterYear });
            return filtered.every(s => s.year === filterYear);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should apply limit correctly', () => {
      fc.assert(
        fc.property(
          fc.array(kpiSnapshotArb, { minLength: 5, maxLength: 10 }),
          fc.integer({ min: 1, max: 5 }),
          (snapshots, limit) => {
            const filtered = filterKPISnapshots(snapshots, { limit });
            return filtered.length <= limit;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should sort snapshots by year and week descending', () => {
      fc.assert(
        fc.property(fc.array(kpiSnapshotArb, { minLength: 2, maxLength: 10 }), (snapshots) => {
          const filtered = filterKPISnapshots(snapshots, {});
          for (let i = 0; i < filtered.length - 1; i++) {
            const current = filtered[i];
            const next = filtered[i + 1];
            if (current.year < next.year) return false;
            if (current.year === next.year && current.week_number < next.week_number) return false;
          }
          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('should get recent snapshots with correct count', () => {
      fc.assert(
        fc.property(
          fc.array(kpiSnapshotArb, { minLength: 5, maxLength: 10 }),
          fc.integer({ min: 1, max: 5 }),
          (snapshots, weeks) => {
            const recent = getRecentSnapshots(snapshots, weeks);
            return recent.length <= weeks;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
