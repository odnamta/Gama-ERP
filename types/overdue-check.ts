// =====================================================
// v0.70: OVERDUE INVOICE CHECK TYPES
// =====================================================

/**
 * Severity classification for overdue invoices
 * - critical: >60 days overdue
 * - high: 31-60 days overdue
 * - medium: 15-30 days overdue
 * - low: 1-14 days overdue
 */
export type OverdueSeverity = 'critical' | 'high' | 'medium' | 'low';

/**
 * Represents an overdue invoice with classification
 */
export interface OverdueInvoice {
  id: string;
  invoice_number: string;
  customer_id: string;
  customer_name: string;
  amount: number;
  due_date: string;
  days_overdue: number;
  severity: OverdueSeverity;
  status: string;
  jo_id: string | null;
}

/**
 * Result of the overdue invoice check grouped by severity
 */
export interface OverdueCheckResult {
  critical: OverdueInvoice[];
  high: OverdueInvoice[];
  medium: OverdueInvoice[];
  low: OverdueInvoice[];
  total_count: number;
  total_amount: number;
}

/**
 * Input for creating a follow-up task
 */
export interface FollowUpTaskInput {
  invoice_id: string;
  invoice_number: string;
  customer_name: string;
  amount: number;
  days_overdue: number;
  severity: OverdueSeverity;
  assigned_to?: string;
}

/**
 * Result of updating invoice to overdue status
 */
export interface OverdueStatusUpdateResult {
  success: boolean;
  invoice_id: string;
  previous_status: string;
  new_status: string;
  updated_at: string;
}

/**
 * Severity thresholds in days
 */
export const OVERDUE_SEVERITY_THRESHOLDS = {
  critical: 60,  // >60 days
  high: 30,      // 31-60 days
  medium: 14,    // 15-30 days
  low: 0,        // 1-14 days
} as const;

/**
 * Invoice statuses that can be marked as overdue
 */
export const OVERDUE_ELIGIBLE_STATUSES = ['sent', 'partial'] as const;
