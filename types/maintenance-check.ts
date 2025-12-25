// =====================================================
// v0.70: MAINTENANCE CHECK TYPES
// Types for scheduled maintenance check utilities
// =====================================================

/**
 * Priority classification for maintenance items
 * - critical: overdue maintenance
 * - high: due within 3 days
 * - normal: due within 7 days
 */
export type MaintenancePriority = 'critical' | 'high' | 'normal';

/**
 * Represents a maintenance item that is due or overdue
 */
export interface MaintenanceItem {
  id: string;
  equipment_id: string;
  equipment_name: string;
  equipment_code: string;
  maintenance_type: string;
  maintenance_type_id: string;
  due_date: string;
  days_until_due: number;
  is_overdue: boolean;
  priority: MaintenancePriority;
  /** Trigger type: km, hours, days, date */
  trigger_type: string;
  /** Current reading (km or hours) if applicable */
  current_reading: number | null;
  /** Due reading (km or hours) if applicable */
  due_reading: number | null;
}

/**
 * Result of the maintenance check grouped by status
 */
export interface MaintenanceCheckResult {
  overdue: MaintenanceItem[];
  upcoming: MaintenanceItem[];
  equipment_count: number;
  maintenance_items_found: number;
}

/**
 * Priority thresholds in days
 * - critical: overdue (days_until_due < 0)
 * - high: due within 3 days
 * - normal: due within 7 days
 */
export const MAINTENANCE_PRIORITY_THRESHOLDS = {
  high: 3,    // <= 3 days
  normal: 7,  // <= 7 days
} as const;

/**
 * Default number of days to look ahead for upcoming maintenance
 */
export const DEFAULT_MAINTENANCE_LOOKAHEAD_DAYS = 7;

/**
 * Summary of maintenance check for logging/reporting
 */
export interface MaintenanceCheckSummary {
  equipment_count: number;
  maintenance_items_found: number;
  by_priority: Record<MaintenancePriority, { count: number }>;
  overdue_count: number;
  upcoming_count: number;
  check_date: string;
  lookahead_days: number;
}
