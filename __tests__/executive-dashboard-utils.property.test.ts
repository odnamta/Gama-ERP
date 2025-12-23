// =====================================================
// v0.61: EXECUTIVE DASHBOARD - PROPERTY-BASED TESTS
// =====================================================
// Feature: executive-dashboard-kpi
// Property-based tests using fast-check

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  evaluateStatus,
  calculateChange,
  determineTrend,
  getDateRangeForPeriod,
  validateDateRange,
  validateKPIDefinition,
  filterKPIsByRole,
  validateTarget,
  getTargetForPeriod,
  validateWidgetPosition,
  addWidget,
  removeWidget,
  isValidWidgetType,
  createSnapshotKey,
  getDefaultLayoutForRole,
} from '@/lib/executive-dashboard-utils';
import {
  KPIDefinition,
  DashboardWidget,
  DashboardLayout,
  VALID_CALCULATION_TYPES,
  VALID_UNIT_TYPES,
  VALID_WIDGET_TYPES,
} from '@/types/executive-dashboard';

// =====================================================
// Property 1: Status Evaluation for Higher-Better KPIs
// Validates: Requirements 1.4, 4.1, 4.2, 4.3, 4.4
// =====================================================
describe('Feature: executive-dashboard-kpi, Property 1: Status Evaluation for Higher-Better KPIs', () => {
  it('should return "exceeded" when actual >= target', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 1000000 }),
        fc.integer({ min: 0, max: 100 }),
        (target, extraPercent) => {
          const actual = target * (1 + extraPercent / 100); // actual >= target
          const status = evaluateStatus(actual, target, 'higher_better');
          expect(status).toBe('exceeded');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return "on_track" when actual is 90-99% of target', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 100, max: 1000000 }),
        fc.integer({ min: 91, max: 99 }), // Use 91-99 to avoid floating-point boundary issues at exactly 90%
        (target, percent) => {
          const actual = target * (percent / 100);
          const status = evaluateStatus(actual, target, 'higher_better');
          expect(status).toBe('on_track');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return "warning" when actual is 70-89% of target', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 100, max: 1000000 }),
        fc.integer({ min: 71, max: 89 }), // Use 71-89 to avoid floating-point boundary issues at exactly 70%
        (target, percent) => {
          const actual = target * (percent / 100);
          const status = evaluateStatus(actual, target, 'higher_better');
          expect(status).toBe('warning');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return "critical" when actual is below 70% of target', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 100, max: 1000000 }),
        fc.integer({ min: 0, max: 69 }),
        (target, percent) => {
          const actual = target * (percent / 100);
          const status = evaluateStatus(actual, target, 'higher_better');
          expect(status).toBe('critical');
        }
      ),
      { numRuns: 100 }
    );
  });
});

// =====================================================
// Property 2: Status Evaluation for Lower-Better KPIs
// Validates: Requirements 1.5, 4.5, 4.6, 4.7, 4.8
// =====================================================
describe('Feature: executive-dashboard-kpi, Property 2: Status Evaluation for Lower-Better KPIs', () => {
  it('should return "exceeded" when actual <= target', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 1000000 }),
        fc.integer({ min: 0, max: 100 }),
        (target, percent) => {
          const actual = target * (percent / 100); // actual <= target
          const status = evaluateStatus(actual, target, 'lower_better');
          expect(status).toBe('exceeded');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return "on_track" when actual is 101-110% of target', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 100, max: 1000000 }),
        fc.integer({ min: 101, max: 110 }),
        (target, percent) => {
          const actual = target * (percent / 100);
          const status = evaluateStatus(actual, target, 'lower_better');
          expect(status).toBe('on_track');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return "warning" when actual is 111-130% of target', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 100, max: 1000000 }),
        fc.integer({ min: 111, max: 130 }),
        (target, percent) => {
          const actual = target * (percent / 100);
          const status = evaluateStatus(actual, target, 'lower_better');
          expect(status).toBe('warning');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return "critical" when actual exceeds 130% of target', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 100, max: 1000000 }),
        fc.integer({ min: 131, max: 500 }),
        (target, percent) => {
          const actual = target * (percent / 100);
          const status = evaluateStatus(actual, target, 'lower_better');
          expect(status).toBe('critical');
        }
      ),
      { numRuns: 100 }
    );
  });
});

// =====================================================
// Property 3: Trend Direction Determination
// Validates: Requirements 5.4, 5.5, 5.6
// =====================================================
describe('Feature: executive-dashboard-kpi, Property 3: Trend Direction Determination', () => {
  it('should return "up" when change percentage > 2', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 3, max: 1000 }),
        (changePercentage) => {
          const trend = determineTrend(changePercentage);
          expect(trend).toBe('up');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return "down" when change percentage < -2', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -1000, max: -3 }),
        (changePercentage) => {
          const trend = determineTrend(changePercentage);
          expect(trend).toBe('down');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return "stable" when change percentage is between -2 and 2', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -2, max: 2 }),
        (changePercentage) => {
          const trend = determineTrend(changePercentage);
          expect(trend).toBe('stable');
        }
      ),
      { numRuns: 100 }
    );
  });
});

// =====================================================
// Property 4: Change Percentage Calculation
// Validates: Requirements 5.1, 5.2
// =====================================================
describe('Feature: executive-dashboard-kpi, Property 4: Change Percentage Calculation', () => {
  it('should calculate change_value as current - previous', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -1000000, max: 1000000 }),
        fc.integer({ min: 1, max: 1000000 }), // non-zero previous
        (current, previous) => {
          const result = calculateChange(current, previous);
          expect(result.changeValue).toBeCloseTo(current - previous, 5);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should calculate change_percentage as ((current - previous) / previous) * 100', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -1000000, max: 1000000 }),
        fc.integer({ min: 1, max: 1000000 }), // non-zero previous
        (current, previous) => {
          const result = calculateChange(current, previous);
          const expected = ((current - previous) / previous) * 100;
          expect(result.changePercentage).toBeCloseTo(expected, 5);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return 0 for change_percentage when previous is 0', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -1000000, max: 1000000 }),
        (current) => {
          const result = calculateChange(current, 0);
          expect(result.changePercentage).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// =====================================================
// Property 5: Period Date Range Calculation
// Validates: Requirements 2.2
// =====================================================
describe('Feature: executive-dashboard-kpi, Property 5: Period Date Range Calculation', () => {
  it('should have start_date <= end_date for all period types', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('mtd', 'qtd', 'ytd') as fc.Arbitrary<'mtd' | 'qtd' | 'ytd'>,
        (period) => {
          const ranges = getDateRangeForPeriod(period);
          expect(ranges.current.start.getTime()).toBeLessThanOrEqual(ranges.current.end.getTime());
          expect(ranges.previous.start.getTime()).toBeLessThanOrEqual(ranges.previous.end.getTime());
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should have MTD start at first day of month', () => {
    const ranges = getDateRangeForPeriod('mtd');
    expect(ranges.current.start.getDate()).toBe(1);
  });

  it('should have QTD start at first day of quarter', () => {
    const ranges = getDateRangeForPeriod('qtd');
    const quarterStartMonth = Math.floor(ranges.current.start.getMonth() / 3) * 3;
    expect(ranges.current.start.getMonth()).toBe(quarterStartMonth);
    expect(ranges.current.start.getDate()).toBe(1);
  });

  it('should have YTD start at January 1st', () => {
    const ranges = getDateRangeForPeriod('ytd');
    expect(ranges.current.start.getMonth()).toBe(0);
    expect(ranges.current.start.getDate()).toBe(1);
  });
});

// =====================================================
// Property 6: Date Range Validation
// Validates: Requirements 11.3
// =====================================================
describe('Feature: executive-dashboard-kpi, Property 6: Date Range Validation', () => {
  it('should reject date ranges where start > end', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2020, max: 2030 }),
        fc.integer({ min: 0, max: 11 }),
        fc.integer({ min: 1, max: 28 }),
        fc.integer({ min: 1, max: 365 }),
        (year, month, day, daysBefore) => {
          const endDate = new Date(year, month, day);
          const startDate = new Date(endDate.getTime() + daysBefore * 24 * 60 * 60 * 1000);
          const result = validateDateRange({ start: startDate, end: endDate });
          expect(result.valid).toBe(false);
          expect(result.errors.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should accept date ranges where start <= end', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2020, max: 2030 }),
        fc.integer({ min: 0, max: 11 }),
        fc.integer({ min: 1, max: 28 }),
        fc.integer({ min: 0, max: 365 }),
        (year, month, day, daysAfter) => {
          const startDate = new Date(year, month, day);
          const endDate = new Date(startDate.getTime() + daysAfter * 24 * 60 * 60 * 1000);
          const result = validateDateRange({ start: startDate, end: endDate });
          expect(result.valid).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// =====================================================
// Property 7: Role-Based KPI Filtering
// Validates: Requirements 13.1
// =====================================================
describe('Feature: executive-dashboard-kpi, Property 7: Role-Based KPI Filtering', () => {
  const createMockKPI = (visibleToRoles: string[]): KPIDefinition => ({
    id: 'test-id',
    kpiCode: 'TEST',
    kpiName: 'Test KPI',
    category: 'financial',
    calculationType: 'sum',
    unit: 'currency',
    decimalPlaces: 0,
    targetType: 'higher_better',
    showTrend: true,
    comparisonPeriod: 'previous_month',
    visibleToRoles,
    displayOrder: 1,
    isActive: true,
  });

  it('should only include KPIs where user role is in visible_to_roles', () => {
    fc.assert(
      fc.property(
        fc.array(fc.constantFrom('owner', 'admin', 'manager', 'finance', 'sales', 'ops'), { minLength: 0, maxLength: 6 }),
        fc.constantFrom('owner', 'admin', 'manager', 'finance', 'sales', 'ops'),
        (visibleRoles, userRole) => {
          const kpi = createMockKPI(visibleRoles);
          const filtered = filterKPIsByRole([kpi], userRole);
          
          if (visibleRoles.includes(userRole)) {
            expect(filtered).toHaveLength(1);
          } else {
            expect(filtered).toHaveLength(0);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return empty array when KPI has no visible roles', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('owner', 'admin', 'manager', 'finance', 'sales', 'ops'),
        (userRole) => {
          const kpi = createMockKPI([]);
          const filtered = filterKPIsByRole([kpi], userRole);
          expect(filtered).toHaveLength(0);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// =====================================================
// Property 8: Layout Widget Management
// Validates: Requirements 10.1, 10.4, 10.5
// =====================================================
describe('Feature: executive-dashboard-kpi, Property 8: Layout Widget Management', () => {
  const createMockLayout = (widgets: DashboardWidget[] = []): DashboardLayout => ({
    id: 'test-layout',
    dashboardType: 'executive',
    widgets,
    isDefault: false,
  });

  const createMockWidget = (id: string): DashboardWidget => ({
    widgetId: id,
    type: 'kpi_card',
    position: { x: 0, y: 0, w: 3, h: 2 },
    config: {},
  });

  it('should increase widget count by 1 when adding a widget', () => {
    fc.assert(
      fc.property(
        fc.array(fc.string({ minLength: 1, maxLength: 10 }), { minLength: 0, maxLength: 10 }),
        fc.string({ minLength: 1, maxLength: 10 }),
        (existingIds, newId) => {
          const existingWidgets = existingIds.map(createMockWidget);
          const layout = createMockLayout(existingWidgets);
          const newWidget = createMockWidget(newId);
          const newLayout = addWidget(layout, newWidget);
          expect(newLayout.widgets.length).toBe(layout.widgets.length + 1);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should decrease widget count by 1 when removing an existing widget', () => {
    fc.assert(
      fc.property(
        fc.array(fc.string({ minLength: 1, maxLength: 10 }), { minLength: 1, maxLength: 10 }),
        (widgetIds) => {
          const widgets = widgetIds.map(createMockWidget);
          const layout = createMockLayout(widgets);
          const idToRemove = widgetIds[0];
          const newLayout = removeWidget(layout, idToRemove);
          expect(newLayout.widgets.length).toBe(layout.widgets.length - 1);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should validate widget positions have non-negative values', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 100 }),
        fc.integer({ min: 0, max: 100 }),
        fc.integer({ min: 0, max: 100 }),
        fc.integer({ min: 0, max: 100 }),
        (x, y, w, h) => {
          const result = validateWidgetPosition({ x, y, w, h });
          expect(result.valid).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should reject widget positions with negative values', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -100, max: -1 }),
        fc.integer({ min: 0, max: 100 }),
        fc.integer({ min: 0, max: 100 }),
        fc.integer({ min: 0, max: 100 }),
        (x, y, w, h) => {
          const result = validateWidgetPosition({ x, y, w, h });
          expect(result.valid).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should validate widget types are from allowed list', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...VALID_WIDGET_TYPES),
        (widgetType) => {
          expect(isValidWidgetType(widgetType)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// =====================================================
// Property 11: Target Validation
// Validates: Requirements 3.2
// =====================================================
describe('Feature: executive-dashboard-kpi, Property 11: Target Validation', () => {
  it('should reject targets with non-positive values', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -1000000, max: 0 }),
        (targetValue) => {
          const result = validateTarget({
            kpiId: 'test-kpi',
            periodType: 'monthly',
            periodYear: 2025,
            targetValue,
          });
          expect(result.valid).toBe(false);
          expect(result.errors.some(e => e.includes('positive'))).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should accept targets with positive values', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 1000000 }),
        (targetValue) => {
          const result = validateTarget({
            kpiId: 'test-kpi',
            periodType: 'monthly',
            periodYear: 2025,
            targetValue,
          });
          expect(result.valid).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// =====================================================
// Property 12: Target Fallback to Default
// Validates: Requirements 3.4
// =====================================================
describe('Feature: executive-dashboard-kpi, Property 12: Target Fallback to Default', () => {
  it('should use period target when available', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 1000000 }),
        fc.integer({ min: 1, max: 1000000 }),
        (periodTarget, defaultTarget) => {
          const result = getTargetForPeriod(periodTarget, defaultTarget);
          expect(result).toBe(periodTarget);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should fall back to default when period target is null/undefined', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 1000000 }),
        (defaultTarget) => {
          const result = getTargetForPeriod(null, defaultTarget);
          expect(result).toBe(defaultTarget);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return 0 when both targets are null/undefined', () => {
    const result = getTargetForPeriod(null, null);
    expect(result).toBe(0);
  });
});

// =====================================================
// Property 13: Snapshot Uniqueness
// Validates: Requirements 14.4
// =====================================================
describe('Feature: executive-dashboard-kpi, Property 13: Snapshot Uniqueness', () => {
  it('should create unique keys for different KPI/date/period combinations', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        fc.integer({ min: 2020, max: 2030 }),
        fc.integer({ min: 0, max: 11 }),
        fc.integer({ min: 1, max: 28 }),
        fc.constantFrom('daily', 'weekly', 'monthly'),
        fc.uuid(),
        fc.integer({ min: 2020, max: 2030 }),
        fc.integer({ min: 0, max: 11 }),
        fc.integer({ min: 1, max: 28 }),
        fc.constantFrom('daily', 'weekly', 'monthly'),
        (kpiId1, year1, month1, day1, period1, kpiId2, year2, month2, day2, period2) => {
          const date1 = new Date(year1, month1, day1);
          const date2 = new Date(year2, month2, day2);
          const key1 = createSnapshotKey(kpiId1, date1, period1);
          const key2 = createSnapshotKey(kpiId2, date2, period2);
          
          // Keys should be equal only if all components are equal
          const sameKpi = kpiId1 === kpiId2;
          const sameDate = date1.toISOString().split('T')[0] === date2.toISOString().split('T')[0];
          const samePeriod = period1 === period2;
          
          if (sameKpi && sameDate && samePeriod) {
            expect(key1).toBe(key2);
          } else {
            expect(key1).not.toBe(key2);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

// =====================================================
// Property 14: KPI Definition Validation
// Validates: Requirements 1.2, 1.3
// =====================================================
describe('Feature: executive-dashboard-kpi, Property 14: KPI Definition Validation', () => {
  it('should accept valid calculation types', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...VALID_CALCULATION_TYPES),
        fc.constantFrom(...VALID_UNIT_TYPES),
        (calculationType, unit) => {
          const result = validateKPIDefinition({
            kpiCode: 'TEST',
            kpiName: 'Test KPI',
            category: 'financial',
            calculationType,
            unit,
          });
          expect(result.valid).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should reject invalid calculation types', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 20 }).filter(s => !VALID_CALCULATION_TYPES.includes(s as any)),
        (invalidType) => {
          const result = validateKPIDefinition({
            kpiCode: 'TEST',
            kpiName: 'Test KPI',
            category: 'financial',
            calculationType: invalidType,
            unit: 'currency',
          });
          expect(result.valid).toBe(false);
          expect(result.errors.some(e => e.includes('calculation type'))).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should reject invalid unit types', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 20 }).filter(s => !VALID_UNIT_TYPES.includes(s as any)),
        (invalidUnit) => {
          const result = validateKPIDefinition({
            kpiCode: 'TEST',
            kpiName: 'Test KPI',
            category: 'financial',
            calculationType: 'sum',
            unit: invalidUnit,
          });
          expect(result.valid).toBe(false);
          expect(result.errors.some(e => e.includes('unit type'))).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// =====================================================
// Property 9 & 10: Layout Persistence (Unit Tests)
// These require database interaction, so we test the utility functions
// =====================================================
describe('Feature: executive-dashboard-kpi, Property 9 & 10: Default Layout Fallback', () => {
  it('should return a valid default layout for each role', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('owner', 'admin', 'manager', 'finance', 'sales', 'ops'),
        (role) => {
          const layout = getDefaultLayoutForRole(role);
          expect(layout.isDefault).toBe(true);
          expect(layout.role).toBe(role);
          expect(layout.dashboardType).toBe('executive');
          expect(Array.isArray(layout.widgets)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should include financial widgets for finance role', () => {
    const layout = getDefaultLayoutForRole('finance');
    const hasFinancialWidgets = layout.widgets.some(w => 
      w.kpiCodes?.some(code => ['REV_MTD', 'PROFIT_MTD', 'PROFIT_MARGIN', 'AR_OUTSTANDING'].includes(code))
    );
    expect(hasFinancialWidgets).toBe(true);
  });

  it('should include sales widgets for sales role', () => {
    const layout = getDefaultLayoutForRole('sales');
    const hasSalesWidgets = layout.widgets.some(w => 
      w.kpiCodes?.some(code => ['PIPELINE_VALUE', 'QUOTES_MTD', 'WIN_RATE'].includes(code))
    );
    expect(hasSalesWidgets).toBe(true);
  });

  it('should include operations widgets for ops role', () => {
    const layout = getDefaultLayoutForRole('ops');
    const hasOpsWidgets = layout.widgets.some(w => 
      w.kpiCodes?.some(code => ['JOBS_ACTIVE', 'JOBS_COMPLETED_MTD', 'ON_TIME_DELIVERY'].includes(code))
    );
    expect(hasOpsWidgets).toBe(true);
  });
});
