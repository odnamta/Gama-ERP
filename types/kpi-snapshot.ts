// =====================================================
// v0.70: KPI SNAPSHOT TYPES
// =====================================================

/**
 * Revenue metrics for a KPI snapshot period
 */
export interface RevenueMetrics {
  total_revenue: number;
  revenue_by_customer: Record<string, number>;
  revenue_by_service: Record<string, number>;
}

/**
 * Operational metrics for a KPI snapshot period
 */
export interface OperationalMetrics {
  jobs_completed: number;
  on_time_delivery_rate: number;
  average_job_duration_days: number;
}

/**
 * Financial metrics for AR aging and collection
 */
export interface FinancialMetrics {
  ar_aging_current: number;
  ar_aging_30_days: number;
  ar_aging_60_days: number;
  ar_aging_90_plus: number;
  collection_rate: number;
}

/**
 * Complete KPI snapshot record
 */
export interface KPISnapshot {
  id: string;
  week_number: number;
  year: number;
  snapshot_date: string;
  revenue_metrics: RevenueMetrics;
  operational_metrics: OperationalMetrics;
  financial_metrics: FinancialMetrics;
  created_at: string;
}

/**
 * Trend direction for KPI comparison
 */
export type TrendDirection = 'up' | 'down' | 'stable';

/**
 * Week-over-week trend for a single metric
 */
export interface KPITrend {
  metric_name: string;
  current_value: number;
  previous_value: number;
  change_percent: number;
  trend: TrendDirection;
}

/**
 * Input for creating a KPI snapshot
 */
export interface CreateKPISnapshotInput {
  week_number: number;
  year: number;
  snapshot_date: string;
  revenue_metrics: RevenueMetrics;
  operational_metrics: OperationalMetrics;
  financial_metrics: FinancialMetrics;
}

/**
 * Filters for querying KPI snapshots
 */
export interface KPISnapshotFilters {
  year?: number;
  startWeek?: number;
  endWeek?: number;
  limit?: number;
}

/**
 * Date range for KPI calculations
 */
export interface DateRange {
  startDate: Date;
  endDate: Date;
}

/**
 * Default empty revenue metrics
 */
export const EMPTY_REVENUE_METRICS: RevenueMetrics = {
  total_revenue: 0,
  revenue_by_customer: {},
  revenue_by_service: {},
};

/**
 * Default empty operational metrics
 */
export const EMPTY_OPERATIONAL_METRICS: OperationalMetrics = {
  jobs_completed: 0,
  on_time_delivery_rate: 0,
  average_job_duration_days: 0,
};

/**
 * Default empty financial metrics
 */
export const EMPTY_FINANCIAL_METRICS: FinancialMetrics = {
  ar_aging_current: 0,
  ar_aging_30_days: 0,
  ar_aging_60_days: 0,
  ar_aging_90_plus: 0,
  collection_rate: 0,
};
