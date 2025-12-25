// =====================================================
// v0.70: EXPIRY CHECK TYPES
// =====================================================

/**
 * Urgency classification for expiring items
 * - expired: past expiry date
 * - expiring_this_week: expiring within 7 days
 * - expiring_this_month: expiring within 30 days
 */
export type ExpiryUrgency = 'expired' | 'expiring_this_week' | 'expiring_this_month';

/**
 * Types of items that can expire
 */
export type ExpiryItemType = 'document' | 'permit' | 'certification';

/**
 * Represents an item that is expiring or has expired
 */
export interface ExpiringItem {
  id: string;
  item_type: ExpiryItemType;
  name: string;
  description: string | null;
  expiry_date: string;
  days_until_expiry: number;
  urgency: ExpiryUrgency;
  responsible_user_id: string | null;
  responsible_user_name: string | null;
  /** Reference to parent entity (asset_id, employee_id, etc.) */
  parent_id: string | null;
  parent_name: string | null;
}

/**
 * Result of the expiry check grouped by urgency
 */
export interface ExpiryCheckResult {
  expired: ExpiringItem[];
  expiring_this_week: ExpiringItem[];
  expiring_this_month: ExpiringItem[];
  total_count: number;
}

/**
 * Expiring document specific interface
 */
export interface ExpiringDocument extends ExpiringItem {
  item_type: 'document';
  document_type: string;
  asset_id: string | null;
  asset_code: string | null;
}

/**
 * Expiring permit specific interface
 */
export interface ExpiringPermit extends ExpiringItem {
  item_type: 'permit';
  permit_type: string;
  permit_number: string | null;
  work_location: string | null;
}

/**
 * Expiring certification specific interface
 */
export interface ExpiringCertification extends ExpiringItem {
  item_type: 'certification';
  skill_name: string;
  skill_code: string;
  employee_id: string;
  employee_name: string;
  certification_number: string | null;
}

/**
 * Urgency thresholds in days
 */
export const EXPIRY_URGENCY_THRESHOLDS = {
  expiring_this_week: 7,   // <= 7 days
  expiring_this_month: 30, // <= 30 days
} as const;

/**
 * Default number of days to look ahead for expiring items
 */
export const DEFAULT_EXPIRY_LOOKAHEAD_DAYS = 30;

/**
 * Summary of expiry check for logging/reporting
 */
export interface ExpiryCheckSummary {
  total_count: number;
  by_urgency: Record<ExpiryUrgency, { count: number }>;
  by_type: Record<ExpiryItemType, { count: number }>;
  check_date: string;
  lookahead_days: number;
}
