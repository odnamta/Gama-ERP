// =====================================================
// v0.70: OVERDUE INVOICE CHECK UTILITY FUNCTIONS
// =====================================================

import {
  OverdueSeverity,
  OverdueInvoice,
  OverdueCheckResult,
  FollowUpTaskInput,
  OverdueStatusUpdateResult,
  OVERDUE_SEVERITY_THRESHOLDS,
  OVERDUE_ELIGIBLE_STATUSES,
} from '@/types/overdue-check';

// =====================================================
// OVERDUE DETECTION FUNCTIONS
// =====================================================

/**
 * Calculates the number of days an invoice is overdue.
 * @param dueDate - The due date of the invoice (ISO string or Date)
 * @param referenceDate - The reference date to calculate from (default: today)
 * @returns Number of days overdue (0 if not overdue)
 */
export function calculateDaysOverdue(
  dueDate: string | Date,
  referenceDate: Date = new Date()
): number {
  const due = new Date(dueDate);
  const ref = new Date(referenceDate);
  
  // Normalize to start of day for accurate day calculation
  due.setHours(0, 0, 0, 0);
  ref.setHours(0, 0, 0, 0);
  
  const diffMs = ref.getTime() - due.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  return Math.max(0, diffDays);
}

/**
 * Classifies the severity of an overdue invoice based on days overdue.
 * - critical: >60 days overdue
 * - high: 31-60 days overdue
 * - medium: 15-30 days overdue
 * - low: 1-14 days overdue
 * 
 * @param daysOverdue - Number of days the invoice is overdue
 * @returns The severity classification
 */
export function classifyOverdueSeverity(daysOverdue: number): OverdueSeverity {
  if (daysOverdue > OVERDUE_SEVERITY_THRESHOLDS.critical) {
    return 'critical';
  }
  if (daysOverdue > OVERDUE_SEVERITY_THRESHOLDS.high) {
    return 'high';
  }
  if (daysOverdue > OVERDUE_SEVERITY_THRESHOLDS.medium) {
    return 'medium';
  }
  return 'low';
}

/**
 * Checks if an invoice status is eligible to be marked as overdue.
 * Only invoices with status 'sent' or 'partial' can be marked as overdue.
 * 
 * @param status - The current invoice status
 * @returns True if the invoice can be marked as overdue
 */
export function isEligibleForOverdue(status: string): boolean {
  return OVERDUE_ELIGIBLE_STATUSES.includes(status as typeof OVERDUE_ELIGIBLE_STATUSES[number]);
}

/**
 * Checks if an invoice is overdue based on due date and status.
 * 
 * @param dueDate - The due date of the invoice
 * @param status - The current invoice status
 * @param referenceDate - The reference date to check against (default: today)
 * @returns True if the invoice is overdue
 */
export function isInvoiceOverdue(
  dueDate: string | Date,
  status: string,
  referenceDate: Date = new Date()
): boolean {
  if (!isEligibleForOverdue(status)) {
    return false;
  }
  
  const daysOverdue = calculateDaysOverdue(dueDate, referenceDate);
  return daysOverdue > 0;
}

/**
 * Groups overdue invoices by severity level.
 * 
 * @param invoices - Array of overdue invoices to group
 * @returns Grouped result with totals
 */
export function groupOverdueInvoices(invoices: OverdueInvoice[]): OverdueCheckResult {
  const result: OverdueCheckResult = {
    critical: [],
    high: [],
    medium: [],
    low: [],
    total_count: 0,
    total_amount: 0,
  };
  
  for (const invoice of invoices) {
    result[invoice.severity].push(invoice);
    result.total_count++;
    result.total_amount += invoice.amount;
  }
  
  return result;
}

/**
 * Creates an OverdueInvoice object from raw invoice data.
 * 
 * @param invoice - Raw invoice data
 * @param customerName - Customer name
 * @param referenceDate - Reference date for calculating days overdue
 * @returns OverdueInvoice object or null if not overdue
 */
export function createOverdueInvoice(
  invoice: {
    id: string;
    invoice_number: string;
    customer_id: string;
    grand_total: number;
    due_date: string;
    status: string;
    jo_id: string | null;
  },
  customerName: string,
  referenceDate: Date = new Date()
): OverdueInvoice | null {
  if (!isEligibleForOverdue(invoice.status)) {
    return null;
  }
  
  const daysOverdue = calculateDaysOverdue(invoice.due_date, referenceDate);
  
  if (daysOverdue <= 0) {
    return null;
  }
  
  return {
    id: invoice.id,
    invoice_number: invoice.invoice_number,
    customer_id: invoice.customer_id,
    customer_name: customerName,
    amount: invoice.grand_total,
    due_date: invoice.due_date,
    days_overdue: daysOverdue,
    severity: classifyOverdueSeverity(daysOverdue),
    status: invoice.status,
    jo_id: invoice.jo_id,
  };
}

/**
 * Filters and transforms raw invoice data into overdue invoices.
 * 
 * @param invoices - Array of raw invoice data with customer info
 * @param referenceDate - Reference date for calculating days overdue
 * @returns Array of overdue invoices
 */
export function filterOverdueInvoices(
  invoices: Array<{
    id: string;
    invoice_number: string;
    customer_id: string;
    grand_total: number;
    due_date: string;
    status: string;
    jo_id: string | null;
    customer_name: string;
  }>,
  referenceDate: Date = new Date()
): OverdueInvoice[] {
  const overdueInvoices: OverdueInvoice[] = [];
  
  for (const invoice of invoices) {
    const overdueInvoice = createOverdueInvoice(
      {
        id: invoice.id,
        invoice_number: invoice.invoice_number,
        customer_id: invoice.customer_id,
        grand_total: invoice.grand_total,
        due_date: invoice.due_date,
        status: invoice.status,
        jo_id: invoice.jo_id,
      },
      invoice.customer_name,
      referenceDate
    );
    
    if (overdueInvoice) {
      overdueInvoices.push(overdueInvoice);
    }
  }
  
  return overdueInvoices;
}

// =====================================================
// OVERDUE PROCESSING FUNCTIONS
// =====================================================

/**
 * Prepares the update data for marking an invoice as overdue.
 * 
 * @param invoiceId - The ID of the invoice to update
 * @param previousStatus - The previous status of the invoice
 * @returns Update result object
 */
export function prepareOverdueStatusUpdate(
  invoiceId: string,
  previousStatus: string
): OverdueStatusUpdateResult {
  return {
    success: true,
    invoice_id: invoiceId,
    previous_status: previousStatus,
    new_status: 'overdue',
    updated_at: new Date().toISOString(),
  };
}

/**
 * Validates that an invoice can be updated to overdue status.
 * 
 * @param currentStatus - The current status of the invoice
 * @returns True if the invoice can be marked as overdue
 */
export function canUpdateToOverdue(currentStatus: string): boolean {
  return isEligibleForOverdue(currentStatus);
}

/**
 * Creates follow-up task input from an overdue invoice.
 * 
 * @param invoice - The overdue invoice
 * @param assignedTo - Optional user ID to assign the task to
 * @returns Follow-up task input
 */
export function createFollowUpTaskInput(
  invoice: OverdueInvoice,
  assignedTo?: string
): FollowUpTaskInput {
  return {
    invoice_id: invoice.id,
    invoice_number: invoice.invoice_number,
    customer_name: invoice.customer_name,
    amount: invoice.amount,
    days_overdue: invoice.days_overdue,
    severity: invoice.severity,
    assigned_to: assignedTo,
  };
}

/**
 * Determines the priority for a follow-up task based on severity.
 * 
 * @param severity - The overdue severity
 * @returns Priority string for the task
 */
export function getFollowUpPriority(severity: OverdueSeverity): 'urgent' | 'high' | 'medium' | 'low' {
  switch (severity) {
    case 'critical':
      return 'urgent';
    case 'high':
      return 'high';
    case 'medium':
      return 'medium';
    case 'low':
      return 'low';
  }
}

/**
 * Generates a follow-up task description based on the overdue invoice.
 * 
 * @param invoice - The overdue invoice
 * @returns Task description string
 */
export function generateFollowUpDescription(invoice: OverdueInvoice): string {
  const severityLabel = invoice.severity.charAt(0).toUpperCase() + invoice.severity.slice(1);
  return `[${severityLabel}] Follow up on overdue invoice ${invoice.invoice_number} for ${invoice.customer_name}. Amount: ${formatCurrency(invoice.amount)}. ${invoice.days_overdue} days overdue.`;
}

/**
 * Formats currency for display (Indonesian Rupiah).
 * 
 * @param amount - The amount to format
 * @returns Formatted currency string
 */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// =====================================================
// SUMMARY AND REPORTING FUNCTIONS
// =====================================================

/**
 * Generates a summary of the overdue check result.
 * 
 * @param result - The overdue check result
 * @returns Summary object for logging/reporting
 */
export function generateOverdueSummary(result: OverdueCheckResult): {
  total_count: number;
  total_amount: number;
  by_severity: Record<OverdueSeverity, { count: number; amount: number }>;
} {
  return {
    total_count: result.total_count,
    total_amount: result.total_amount,
    by_severity: {
      critical: {
        count: result.critical.length,
        amount: result.critical.reduce((sum, inv) => sum + inv.amount, 0),
      },
      high: {
        count: result.high.length,
        amount: result.high.reduce((sum, inv) => sum + inv.amount, 0),
      },
      medium: {
        count: result.medium.length,
        amount: result.medium.reduce((sum, inv) => sum + inv.amount, 0),
      },
      low: {
        count: result.low.length,
        amount: result.low.reduce((sum, inv) => sum + inv.amount, 0),
      },
    },
  };
}

/**
 * Checks if there are any critical overdue invoices that need immediate attention.
 * 
 * @param result - The overdue check result
 * @returns True if there are critical overdue invoices
 */
export function hasCriticalOverdue(result: OverdueCheckResult): boolean {
  return result.critical.length > 0;
}

/**
 * Gets the most critical invoices that need immediate attention.
 * 
 * @param result - The overdue check result
 * @param limit - Maximum number of invoices to return
 * @returns Array of the most critical invoices
 */
export function getMostCriticalInvoices(
  result: OverdueCheckResult,
  limit: number = 5
): OverdueInvoice[] {
  // Combine all invoices and sort by days overdue (descending)
  const allInvoices = [
    ...result.critical,
    ...result.high,
    ...result.medium,
    ...result.low,
  ];
  
  return allInvoices
    .sort((a, b) => b.days_overdue - a.days_overdue)
    .slice(0, limit);
}
