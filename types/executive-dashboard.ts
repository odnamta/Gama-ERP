// =====================================================
// v0.61: EXECUTIVE DASHBOARD - KPI OVERVIEW TYPES
// =====================================================

// KPI Category
export type KPICategory = 'financial' | 'operational' | 'sales' | 'hr' | 'hse' | 'customer';

// Calculation types
export type CalculationType = 'sum' | 'average' | 'count' | 'ratio' | 'percentage' | 'custom';

// Unit types
export type KPIUnit = 'currency' | 'percent' | 'number' | 'days' | 'hours';

// Target types
export type TargetType = 'higher_better' | 'lower_better' | 'target_range';

// KPI Status
export type KPIStatus = 'exceeded' | 'on_track' | 'warning' | 'critical';

// Trend direction
export type TrendDirection = 'up' | 'down' | 'stable';

// Period types
export type PeriodType = 'mtd' | 'qtd' | 'ytd' | 'custom';

// Widget types
export type WidgetType = 'kpi_card' | 'chart' | 'table' | 'funnel' | 'gauge' | 'list';

// Valid calculation types array for validation
export const VALID_CALCULATION_TYPES: CalculationType[] = ['sum', 'average', 'count', 'ratio', 'percentage', 'custom'];

// Valid unit types array for validation
export const VALID_UNIT_TYPES: KPIUnit[] = ['currency', 'percent', 'number', 'days', 'hours'];

// Valid target types array for validation
export const VALID_TARGET_TYPES: TargetType[] = ['higher_better', 'lower_better', 'target_range'];

// Valid widget types array for validation
export const VALID_WIDGET_TYPES: WidgetType[] = ['kpi_card', 'chart', 'table', 'funnel', 'gauge', 'list'];

// KPI Definition (from database)
export interface KPIDefinition {
  id: string;
  kpiCode: string;
  kpiName: string;
  description?: string;
  category: KPICategory;
  calculationType: CalculationType;
  dataSource?: string;
  valueField?: string;
  filterConditions?: Record<string, unknown>;
  numeratorQuery?: string;
  denominatorQuery?: string;
  customQuery?: string;
  unit: KPIUnit;
  decimalPlaces: number;
  targetType: TargetType;
  defaultTarget?: number;
  warningThreshold?: number;
  criticalThreshold?: number;
  showTrend: boolean;
  comparisonPeriod: string;
  visibleToRoles: string[];
  displayOrder: number;
  isActive: boolean;
}

// KPI Definition from database (snake_case)
export interface KPIDefinitionDB {
  id: string;
  kpi_code: string;
  kpi_name: string;
  description?: string;
  category: KPICategory;
  calculation_type: CalculationType;
  data_source?: string;
  value_field?: string;
  filter_conditions?: Record<string, unknown>;
  numerator_query?: string;
  denominator_query?: string;
  custom_query?: string;
  unit: KPIUnit;
  decimal_places: number;
  target_type: TargetType;
  default_target?: number;
  warning_threshold?: number;
  critical_threshold?: number;
  show_trend: boolean;
  comparison_period: string;
  visible_to_roles: string[];
  display_order: number;
  is_active: boolean;
  created_at: string;
}

// KPI Target
export interface KPITarget {
  id: string;
  kpiId: string;
  periodType: 'monthly' | 'quarterly' | 'yearly';
  periodYear: number;
  periodMonth?: number;
  periodQuarter?: number;
  targetValue: number;
  stretchTarget?: number;
  notes?: string;
  createdBy?: string;
}

// KPI Target from database (snake_case)
export interface KPITargetDB {
  id: string;
  kpi_id: string;
  period_type: 'monthly' | 'quarterly' | 'yearly';
  period_year: number;
  period_month?: number;
  period_quarter?: number;
  target_value: number;
  stretch_target?: number;
  notes?: string;
  created_by?: string;
  created_at: string;
}

// KPI Value (computed)
export interface KPIValue {
  kpiCode: string;
  kpiName: string;
  category: KPICategory;
  currentValue: number;
  previousValue: number;
  targetValue: number;
  changeValue: number;
  changePercentage: number;
  status: KPIStatus;
  trend: TrendDirection;
  unit: KPIUnit;
  decimalPlaces: number;
  targetType: TargetType;
}

// KPI Snapshot
export interface KPISnapshot {
  id: string;
  kpiId: string;
  snapshotDate: Date;
  periodType: string;
  actualValue: number;
  targetValue: number;
  previousValue: number;
  changeValue: number;
  changePercentage: number;
  status: KPIStatus;
}

// KPI Snapshot from database (snake_case)
export interface KPISnapshotDB {
  id: string;
  kpi_id: string;
  snapshot_date: string;
  period_type: string;
  actual_value: number;
  target_value: number;
  previous_value: number;
  change_value: number;
  change_percentage: number;
  status: KPIStatus;
  created_at: string;
}

// Widget Position
export interface WidgetPosition {
  x: number;
  y: number;
  w: number;
  h: number;
}

// Dashboard Widget
export interface DashboardWidget {
  widgetId: string;
  type: WidgetType;
  kpiId?: string;
  kpiCodes?: string[];
  position: WidgetPosition;
  config: Record<string, unknown>;
}

// Dashboard Layout
export interface DashboardLayout {
  id: string;
  userId?: string;
  role?: string;
  dashboardType: string;
  layoutName?: string;
  widgets: DashboardWidget[];
  isDefault: boolean;
}

// Dashboard Layout from database (snake_case)
export interface DashboardLayoutDB {
  id: string;
  user_id?: string;
  role?: string;
  dashboard_type: string;
  layout_name?: string;
  widgets: DashboardWidget[];
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

// Trend Data Point
export interface TrendDataPoint {
  month: string;
  value: number;
}

// Sales Funnel Stage
export interface FunnelStage {
  stage: string;
  count: number;
  value: number;
}

// Date Range
export interface DateRange {
  start: Date;
  end: Date;
}

// Status Thresholds
export interface StatusThresholds {
  exceeded: number;
  onTrack: number;
  warning: number;
  critical: number;
}

// Change Result
export interface ChangeResult {
  changeValue: number;
  changePercentage: number;
  trend: TrendDirection;
}

// Period Date Ranges
export interface PeriodDateRanges {
  current: DateRange;
  previous: DateRange;
}

// Validation Result
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

// KPI Definition Input (for validation)
export interface KPIDefinitionInput {
  kpiCode: string;
  kpiName: string;
  category: string;
  calculationType: string;
  unit: string;
  targetType?: string;
}

// Target Input (for validation)
export interface TargetInput {
  kpiId: string;
  periodType: string;
  periodYear: number;
  periodMonth?: number;
  periodQuarter?: number;
  targetValue: number;
  stretchTarget?: number;
}

// Snapshot Input
export interface SnapshotInput {
  kpiId: string;
  snapshotDate: Date;
  periodType: string;
  actualValue: number;
  targetValue: number;
  previousValue?: number;
}

// Export Data
export interface ExportData {
  kpiCode: string;
  kpiName: string;
  category: string;
  currentValue: number;
  targetValue: number;
  status: KPIStatus;
  trend: TrendDirection;
  changePercentage: number;
  unit: string;
}
