// =====================================================
// v0.61: EXECUTIVE DASHBOARD - KPI UTILITY FUNCTIONS
// =====================================================

import {
  KPIStatus,
  TargetType,
  TrendDirection,
  PeriodType,
  WidgetType,
  CalculationType,
  KPIUnit,
  DateRange,
  PeriodDateRanges,
  ChangeResult,
  ValidationResult,
  KPIDefinitionInput,
  TargetInput,
  DashboardWidget,
  DashboardLayout,
  KPIDefinition,
  SnapshotInput,
  VALID_CALCULATION_TYPES,
  VALID_UNIT_TYPES,
  VALID_TARGET_TYPES,
  VALID_WIDGET_TYPES,
} from '@/types/executive-dashboard';

// =====================================================
// STATUS EVALUATION FUNCTIONS
// =====================================================

/**
 * Evaluates KPI status based on actual value, target value, and target type.
 * 
 * For higher_better:
 * - >= 100% of target: 'exceeded'
 * - 90-99% of target: 'on_track'
 * - 70-89% of target: 'warning'
 * - < 70% of target: 'critical'
 * 
 * For lower_better:
 * - <= 100% of target: 'exceeded'
 * - 100-110% of target: 'on_track'
 * - 110-130% of target: 'warning'
 * - > 130% of target: 'critical'
 * 
 * For target_range:
 * - 90-110% of target: 'on_track'
 * - 80-120% of target: 'warning'
 * - outside 80-120%: 'critical'
 */
export function evaluateStatus(
  actualValue: number,
  targetValue: number,
  targetType: TargetType
): KPIStatus {
  // Handle zero or negative target - return on_track as default
  if (targetValue <= 0) {
    return 'on_track';
  }

  const ratio = actualValue / targetValue;

  if (targetType === 'higher_better') {
    if (ratio >= 1.0) return 'exceeded';
    if (ratio >= 0.9) return 'on_track';
    if (ratio >= 0.7) return 'warning';
    return 'critical';
  }

  if (targetType === 'lower_better') {
    if (ratio <= 1.0) return 'exceeded';
    if (ratio <= 1.1) return 'on_track';
    if (ratio <= 1.3) return 'warning';
    return 'critical';
  }

  // target_range - within 10% of target is on_track
  if (ratio >= 0.9 && ratio <= 1.1) return 'on_track';
  if (ratio >= 0.8 && ratio <= 1.2) return 'warning';
  return 'critical';
}

/**
 * Gets status thresholds for a given target type.
 */
export function getStatusThresholds(targetType: TargetType): {
  exceeded: number;
  onTrack: number;
  warning: number;
  critical: number;
} {
  if (targetType === 'higher_better') {
    return {
      exceeded: 1.0,
      onTrack: 0.9,
      warning: 0.7,
      critical: 0,
    };
  }

  if (targetType === 'lower_better') {
    return {
      exceeded: 1.0,
      onTrack: 1.1,
      warning: 1.3,
      critical: Infinity,
    };
  }

  // target_range
  return {
    exceeded: 1.0,
    onTrack: 0.9,
    warning: 0.8,
    critical: 0,
  };
}

// =====================================================
// TREND ANALYSIS FUNCTIONS
// =====================================================

/**
 * Calculates the change between current and previous values.
 * Returns changeValue, changePercentage, and trend direction.
 */
export function calculateChange(
  currentValue: number,
  previousValue: number
): ChangeResult {
  const changeValue = currentValue - previousValue;
  
  // Handle division by zero
  const changePercentage = previousValue !== 0
    ? (changeValue / previousValue) * 100
    : 0;

  const trend = determineTrend(changePercentage);

  return {
    changeValue,
    changePercentage,
    trend,
  };
}

/**
 * Determines trend direction based on change percentage.
 * - > 2%: 'up'
 * - < -2%: 'down'
 * - between -2% and 2%: 'stable'
 */
export function determineTrend(changePercentage: number): TrendDirection {
  if (changePercentage > 2) return 'up';
  if (changePercentage < -2) return 'down';
  return 'stable';
}

// =====================================================
// PERIOD DATE RANGE FUNCTIONS
// =====================================================

/**
 * Calculates date ranges for a given period type.
 * Returns both current period and previous comparable period.
 */
export function getDateRangeForPeriod(
  period: PeriodType,
  customRange?: DateRange,
  referenceDate?: Date
): PeriodDateRanges {
  const now = referenceDate || new Date();

  switch (period) {
    case 'mtd': {
      const currentStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const previousStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const previousEnd = new Date(now.getFullYear(), now.getMonth(), 0);
      return {
        current: { start: currentStart, end: now },
        previous: { start: previousStart, end: previousEnd },
      };
    }

    case 'qtd': {
      const quarter = Math.floor(now.getMonth() / 3);
      const currentStart = new Date(now.getFullYear(), quarter * 3, 1);
      const previousStart = new Date(now.getFullYear(), (quarter - 1) * 3, 1);
      const previousEnd = new Date(now.getFullYear(), quarter * 3, 0);
      return {
        current: { start: currentStart, end: now },
        previous: { start: previousStart, end: previousEnd },
      };
    }

    case 'ytd': {
      const currentStart = new Date(now.getFullYear(), 0, 1);
      const previousStart = new Date(now.getFullYear() - 1, 0, 1);
      const previousEnd = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
      return {
        current: { start: currentStart, end: now },
        previous: { start: previousStart, end: previousEnd },
      };
    }

    case 'custom': {
      if (!customRange) {
        throw new Error('Custom range required for custom period type');
      }
      const daysDiff = Math.ceil(
        (customRange.end.getTime() - customRange.start.getTime()) / (1000 * 60 * 60 * 24)
      );
      const previousEnd = new Date(customRange.start.getTime() - 24 * 60 * 60 * 1000);
      const previousStart = new Date(previousEnd.getTime() - daysDiff * 24 * 60 * 60 * 1000);
      return {
        current: customRange,
        previous: { start: previousStart, end: previousEnd },
      };
    }

    default:
      throw new Error(`Invalid period type: ${period}`);
  }
}

/**
 * Validates a date range.
 * Returns true if start date is before or equal to end date.
 */
export function validateDateRange(dateRange: DateRange): ValidationResult {
  const errors: string[] = [];

  if (!dateRange.start || !dateRange.end) {
    errors.push('Both start and end dates are required');
    return { valid: false, errors };
  }

  if (dateRange.start > dateRange.end) {
    errors.push('Start date must be before or equal to end date');
    return { valid: false, errors };
  }

  return { valid: true, errors: [] };
}

// =====================================================
// KPI DEFINITION VALIDATION
// =====================================================

/**
 * Validates a KPI definition input.
 */
export function validateKPIDefinition(input: KPIDefinitionInput): ValidationResult {
  const errors: string[] = [];

  if (!input.kpiCode || input.kpiCode.trim() === '') {
    errors.push('KPI code is required');
  }

  if (!input.kpiName || input.kpiName.trim() === '') {
    errors.push('KPI name is required');
  }

  if (!input.category || input.category.trim() === '') {
    errors.push('Category is required');
  }

  if (!VALID_CALCULATION_TYPES.includes(input.calculationType as CalculationType)) {
    errors.push(`Invalid calculation type: ${input.calculationType}. Must be one of: ${VALID_CALCULATION_TYPES.join(', ')}`);
  }

  if (!VALID_UNIT_TYPES.includes(input.unit as KPIUnit)) {
    errors.push(`Invalid unit type: ${input.unit}. Must be one of: ${VALID_UNIT_TYPES.join(', ')}`);
  }

  if (input.targetType && !VALID_TARGET_TYPES.includes(input.targetType as TargetType)) {
    errors.push(`Invalid target type: ${input.targetType}. Must be one of: ${VALID_TARGET_TYPES.join(', ')}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Checks if a calculation type is valid.
 */
export function isValidCalculationType(type: string): type is CalculationType {
  return VALID_CALCULATION_TYPES.includes(type as CalculationType);
}

/**
 * Checks if a unit type is valid.
 */
export function isValidUnitType(type: string): type is KPIUnit {
  return VALID_UNIT_TYPES.includes(type as KPIUnit);
}

/**
 * Checks if a target type is valid.
 */
export function isValidTargetType(type: string): type is TargetType {
  return VALID_TARGET_TYPES.includes(type as TargetType);
}

// =====================================================
// ROLE-BASED KPI FILTERING
// =====================================================

/**
 * Filters KPI definitions based on user role.
 * Returns only KPIs where the user's role is in visible_to_roles.
 */
export function filterKPIsByRole(
  kpis: KPIDefinition[],
  userRole: string
): KPIDefinition[] {
  return kpis.filter((kpi) => {
    if (!kpi.visibleToRoles || kpi.visibleToRoles.length === 0) {
      return false;
    }
    return kpi.visibleToRoles.includes(userRole);
  });
}

// =====================================================
// TARGET MANAGEMENT FUNCTIONS
// =====================================================

/**
 * Validates a target input.
 * Target value must be a positive number (> 0).
 */
export function validateTarget(input: TargetInput): ValidationResult {
  const errors: string[] = [];

  if (!input.kpiId || input.kpiId.trim() === '') {
    errors.push('KPI ID is required');
  }

  if (!input.periodType || input.periodType.trim() === '') {
    errors.push('Period type is required');
  }

  if (typeof input.periodYear !== 'number' || input.periodYear < 2000 || input.periodYear > 2100) {
    errors.push('Period year must be a valid year between 2000 and 2100');
  }

  if (typeof input.targetValue !== 'number' || input.targetValue <= 0) {
    errors.push('Target value must be a positive number greater than 0');
  }

  if (input.stretchTarget !== undefined && input.stretchTarget !== null) {
    if (typeof input.stretchTarget !== 'number' || input.stretchTarget <= 0) {
      errors.push('Stretch target must be a positive number greater than 0');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Gets the target value for a KPI, falling back to default if no period-specific target exists.
 */
export function getTargetForPeriod(
  periodTarget: number | undefined | null,
  defaultTarget: number | undefined | null
): number {
  if (periodTarget !== undefined && periodTarget !== null && periodTarget > 0) {
    return periodTarget;
  }
  if (defaultTarget !== undefined && defaultTarget !== null && defaultTarget > 0) {
    return defaultTarget;
  }
  return 0;
}

// =====================================================
// LAYOUT WIDGET FUNCTIONS
// =====================================================

/**
 * Validates a widget type.
 */
export function isValidWidgetType(type: string): type is WidgetType {
  return VALID_WIDGET_TYPES.includes(type as WidgetType);
}

/**
 * Validates widget position.
 * All position values must be non-negative.
 */
export function validateWidgetPosition(position: { x: number; y: number; w: number; h: number }): ValidationResult {
  const errors: string[] = [];

  if (typeof position.x !== 'number' || position.x < 0) {
    errors.push('Widget x position must be a non-negative number');
  }

  if (typeof position.y !== 'number' || position.y < 0) {
    errors.push('Widget y position must be a non-negative number');
  }

  if (typeof position.w !== 'number' || position.w < 0) {
    errors.push('Widget width must be a non-negative number');
  }

  if (typeof position.h !== 'number' || position.h < 0) {
    errors.push('Widget height must be a non-negative number');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validates a dashboard widget.
 */
export function validateWidget(widget: DashboardWidget): ValidationResult {
  const errors: string[] = [];

  if (!widget.widgetId || widget.widgetId.trim() === '') {
    errors.push('Widget ID is required');
  }

  if (!isValidWidgetType(widget.type)) {
    errors.push(`Invalid widget type: ${widget.type}. Must be one of: ${VALID_WIDGET_TYPES.join(', ')}`);
  }

  const positionValidation = validateWidgetPosition(widget.position);
  if (!positionValidation.valid) {
    errors.push(...positionValidation.errors);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Adds a widget to a layout.
 * Returns a new layout with the widget added.
 */
export function addWidget(
  layout: DashboardLayout,
  widget: DashboardWidget
): DashboardLayout {
  return {
    ...layout,
    widgets: [...layout.widgets, widget],
  };
}

/**
 * Removes a widget from a layout by widget ID.
 * Returns a new layout with the widget removed.
 */
export function removeWidget(
  layout: DashboardLayout,
  widgetId: string
): DashboardLayout {
  return {
    ...layout,
    widgets: layout.widgets.filter((w) => w.widgetId !== widgetId),
  };
}

/**
 * Updates a widget in a layout.
 * Returns a new layout with the widget updated.
 */
export function updateWidget(
  layout: DashboardLayout,
  widgetId: string,
  updates: Partial<DashboardWidget>
): DashboardLayout {
  return {
    ...layout,
    widgets: layout.widgets.map((w) =>
      w.widgetId === widgetId ? { ...w, ...updates } : w
    ),
  };
}

// =====================================================
// SNAPSHOT FUNCTIONS
// =====================================================

/**
 * Validates a snapshot input.
 */
export function validateSnapshotInput(input: SnapshotInput): ValidationResult {
  const errors: string[] = [];

  if (!input.kpiId || input.kpiId.trim() === '') {
    errors.push('KPI ID is required');
  }

  if (!input.snapshotDate) {
    errors.push('Snapshot date is required');
  }

  if (!input.periodType || input.periodType.trim() === '') {
    errors.push('Period type is required');
  }

  if (typeof input.actualValue !== 'number') {
    errors.push('Actual value must be a number');
  }

  if (typeof input.targetValue !== 'number') {
    errors.push('Target value must be a number');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Creates a snapshot key for uniqueness checking.
 */
export function createSnapshotKey(
  kpiId: string,
  snapshotDate: Date,
  periodType: string
): string {
  const dateStr = snapshotDate.toISOString().split('T')[0];
  return `${kpiId}-${dateStr}-${periodType}`;
}

// =====================================================
// DEFAULT LAYOUT FUNCTIONS
// =====================================================

/**
 * Gets the default layout for a role.
 */
export function getDefaultLayoutForRole(role: string): DashboardLayout {
  const baseWidgets: DashboardWidget[] = [];

  // Financial KPIs - visible to owner, admin, manager, finance
  if (['owner', 'admin', 'manager', 'finance'].includes(role)) {
    baseWidgets.push(
      { widgetId: 'rev-mtd', type: 'kpi_card', kpiCodes: ['REV_MTD'], position: { x: 0, y: 0, w: 3, h: 2 }, config: {} },
      { widgetId: 'profit-mtd', type: 'kpi_card', kpiCodes: ['PROFIT_MTD'], position: { x: 3, y: 0, w: 3, h: 2 }, config: {} },
      { widgetId: 'profit-margin', type: 'kpi_card', kpiCodes: ['PROFIT_MARGIN'], position: { x: 6, y: 0, w: 3, h: 2 }, config: {} },
      { widgetId: 'ar-outstanding', type: 'kpi_card', kpiCodes: ['AR_OUTSTANDING'], position: { x: 9, y: 0, w: 3, h: 2 }, config: {} }
    );
  }

  // Sales KPIs - visible to owner, admin, manager, sales
  if (['owner', 'admin', 'manager', 'sales'].includes(role)) {
    baseWidgets.push(
      { widgetId: 'pipeline-value', type: 'kpi_card', kpiCodes: ['PIPELINE_VALUE'], position: { x: 0, y: 2, w: 3, h: 2 }, config: {} },
      { widgetId: 'quotes-mtd', type: 'kpi_card', kpiCodes: ['QUOTES_MTD'], position: { x: 3, y: 2, w: 3, h: 2 }, config: {} },
      { widgetId: 'win-rate', type: 'kpi_card', kpiCodes: ['WIN_RATE'], position: { x: 6, y: 2, w: 3, h: 2 }, config: {} },
      { widgetId: 'sales-funnel', type: 'funnel', position: { x: 0, y: 4, w: 12, h: 4 }, config: {} }
    );
  }

  // Operations KPIs - visible to owner, admin, manager, ops
  if (['owner', 'admin', 'manager', 'ops'].includes(role)) {
    baseWidgets.push(
      { widgetId: 'jobs-active', type: 'kpi_card', kpiCodes: ['JOBS_ACTIVE'], position: { x: 0, y: 8, w: 3, h: 2 }, config: {} },
      { widgetId: 'jobs-completed', type: 'kpi_card', kpiCodes: ['JOBS_COMPLETED_MTD'], position: { x: 3, y: 8, w: 3, h: 2 }, config: {} },
      { widgetId: 'on-time-delivery', type: 'kpi_card', kpiCodes: ['ON_TIME_DELIVERY'], position: { x: 6, y: 8, w: 3, h: 2 }, config: {} },
      { widgetId: 'equipment-util', type: 'kpi_card', kpiCodes: ['EQUIPMENT_UTIL'], position: { x: 9, y: 8, w: 3, h: 2 }, config: {} }
    );
  }

  // HSE KPIs - visible to owner, admin, manager, ops
  if (['owner', 'admin', 'manager', 'ops'].includes(role)) {
    baseWidgets.push(
      { widgetId: 'days-no-lti', type: 'kpi_card', kpiCodes: ['DAYS_NO_LTI'], position: { x: 0, y: 10, w: 3, h: 2 }, config: {} },
      { widgetId: 'trir', type: 'kpi_card', kpiCodes: ['TRIR'], position: { x: 3, y: 10, w: 3, h: 2 }, config: {} },
      { widgetId: 'near-miss', type: 'kpi_card', kpiCodes: ['NEAR_MISS_MTD'], position: { x: 6, y: 10, w: 3, h: 2 }, config: {} },
      { widgetId: 'training-compliance', type: 'kpi_card', kpiCodes: ['TRAINING_COMPLIANCE'], position: { x: 9, y: 10, w: 3, h: 2 }, config: {} }
    );
  }

  // Trend chart - visible to owner, admin, manager
  if (['owner', 'admin', 'manager'].includes(role)) {
    baseWidgets.push(
      { widgetId: 'trend-chart', type: 'chart', kpiCodes: ['REV_MTD', 'PROFIT_MTD'], position: { x: 0, y: 12, w: 12, h: 4 }, config: { chartType: 'line', months: 12 } }
    );
  }

  return {
    id: `default-${role}`,
    role,
    dashboardType: 'executive',
    layoutName: `Default ${role} Layout`,
    widgets: baseWidgets,
    isDefault: true,
  };
}

// =====================================================
// FORMATTING FUNCTIONS
// =====================================================

/**
 * Formats a KPI value based on its unit type.
 */
export function formatKPIValue(value: number, unit: KPIUnit, decimalPlaces: number = 0): string {
  switch (unit) {
    case 'currency':
      return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value);

    case 'percent':
      return `${value.toFixed(decimalPlaces)}%`;

    case 'days':
      return `${value.toFixed(decimalPlaces)} days`;

    case 'hours':
      return `${value.toFixed(decimalPlaces)} hrs`;

    case 'number':
    default:
      return new Intl.NumberFormat('id-ID', {
        minimumFractionDigits: decimalPlaces,
        maximumFractionDigits: decimalPlaces,
      }).format(value);
  }
}

/**
 * Gets the status color class for a KPI status.
 */
export function getStatusColor(status: KPIStatus): string {
  switch (status) {
    case 'exceeded':
      return 'text-green-600 bg-green-50';
    case 'on_track':
      return 'text-blue-600 bg-blue-50';
    case 'warning':
      return 'text-yellow-600 bg-yellow-50';
    case 'critical':
      return 'text-red-600 bg-red-50';
    default:
      return 'text-gray-600 bg-gray-50';
  }
}

/**
 * Gets the trend icon for a trend direction.
 */
export function getTrendIcon(trend: TrendDirection): string {
  switch (trend) {
    case 'up':
      return '▲';
    case 'down':
      return '▼';
    case 'stable':
      return '→';
    default:
      return '';
  }
}

/**
 * Gets the trend color class for a trend direction and target type.
 */
export function getTrendColor(trend: TrendDirection, targetType: TargetType): string {
  if (trend === 'stable') return 'text-gray-500';

  if (targetType === 'higher_better') {
    return trend === 'up' ? 'text-green-600' : 'text-red-600';
  }

  if (targetType === 'lower_better') {
    return trend === 'down' ? 'text-green-600' : 'text-red-600';
  }

  // target_range - both directions could be concerning
  return 'text-yellow-600';
}
