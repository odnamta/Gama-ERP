/**
 * Vendor Invoice Utility Functions
 * Core utility functions for accounts payable operations
 */

import type {
  VendorInvoiceStatus,
  ExpenseCategory,
  VendorPaymentMethod,
  AgingBucket,
  StatusDisplayInfo,
  ExpenseCategoryOption,
  PaymentMethodOption,
} from '@/types/vendor-invoices';

// =====================================================
// Constants
// =====================================================

/**
 * Valid vendor invoice statuses
 */
export const VENDOR_INVOICE_STATUSES: VendorInvoiceStatus[] = [
  'received',
  'verified',
  'approved',
  'partial',
  'paid',
  'disputed',
  'cancelled',
];

/**
 * Status colors for UI display
 */
export const VENDOR_INVOICE_STATUS_COLORS: Record<VendorInvoiceStatus, StatusDisplayInfo> = {
  received: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Received' },
  verified: { bg: 'bg-cyan-100', text: 'text-cyan-800', label: 'Verified' },
  approved: { bg: 'bg-indigo-100', text: 'text-indigo-800', label: 'Approved' },
  partial: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Partial' },
  paid: { bg: 'bg-green-100', text: 'text-green-800', label: 'Paid' },
  disputed: { bg: 'bg-red-100', text: 'text-red-800', label: 'Disputed' },
  cancelled: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Cancelled' },
};

/**
 * Expense category options for dropdowns
 */
export const EXPENSE_CATEGORIES: ExpenseCategoryOption[] = [
  { value: 'trucking', label: 'Trucking' },
  { value: 'shipping', label: 'Shipping' },
  { value: 'port', label: 'Port Charges' },
  { value: 'handling', label: 'Handling' },
  { value: 'fuel', label: 'Fuel' },
  { value: 'toll', label: 'Toll' },
  { value: 'permit', label: 'Permit' },
  { value: 'crew', label: 'Crew' },
  { value: 'equipment', label: 'Equipment' },
  { value: 'overhead', label: 'Overhead' },
  { value: 'other', label: 'Other' },
];

/**
 * Payment method options for dropdowns
 */
export const VENDOR_PAYMENT_METHODS: PaymentMethodOption[] = [
  { value: 'transfer', label: 'Bank Transfer' },
  { value: 'cash', label: 'Cash' },
  { value: 'check', label: 'Check (Cek)' },
  { value: 'giro', label: 'Giro Bilyet' },
];

/**
 * Valid payment methods
 */
export const VALID_VENDOR_PAYMENT_METHODS: VendorPaymentMethod[] = ['transfer', 'cash', 'check', 'giro'];

/**
 * Variance tolerance percentage for 3-way match (2%)
 */
export const VARIANCE_TOLERANCE_PERCENT = 2;

/**
 * Default payment terms in days
 */
export const DEFAULT_PAYMENT_TERMS_DAYS = 30;

/**
 * Due soon threshold in days
 */
export const DUE_SOON_THRESHOLD_DAYS = 7;

// =====================================================
// Internal Reference Functions
// =====================================================

/**
 * Generate internal reference number
 * Format: VI-YYYY-NNNNN
 */
export function generateInternalRef(year: number, sequence: number): string {
  const paddedSequence = String(sequence).padStart(5, '0');
  return `VI-${year}-${paddedSequence}`;
}

/**
 * Parse internal reference to extract year and sequence
 */
export function parseInternalRef(ref: string): { year: number; sequence: number } | null {
  const match = ref.match(/^VI-(\d{4})-(\d{5})$/);
  if (!match) return null;
  return {
    year: parseInt(match[1], 10),
    sequence: parseInt(match[2], 10),
  };
}

/**
 * Validate internal reference format
 */
export function isValidInternalRef(ref: string): boolean {
  return /^VI-\d{4}-\d{5}$/.test(ref);
}


// =====================================================
// Date Functions
// =====================================================

/**
 * Calculate default due date (30 days from invoice date)
 */
export function calculateDefaultDueDate(invoiceDate: string): string {
  const date = new Date(invoiceDate);
  date.setDate(date.getDate() + DEFAULT_PAYMENT_TERMS_DAYS);
  return date.toISOString().split('T')[0];
}

/**
 * Check if invoice is overdue
 */
export function isOverdue(dueDate: string | null, status: VendorInvoiceStatus): boolean {
  if (!dueDate) return false;
  if (status === 'paid' || status === 'cancelled') return false;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  
  return due < today;
}

/**
 * Check if invoice is due soon (within 7 days)
 */
export function isDueSoon(dueDate: string | null, status: VendorInvoiceStatus): boolean {
  if (!dueDate) return false;
  if (status === 'paid' || status === 'cancelled') return false;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  
  // If already overdue, not "due soon"
  if (due < today) return false;
  
  const threshold = new Date(today);
  threshold.setDate(threshold.getDate() + DUE_SOON_THRESHOLD_DAYS);
  
  return due <= threshold;
}

/**
 * Calculate days until due (negative if overdue)
 */
export function getDaysUntilDue(dueDate: string | null): number | null {
  if (!dueDate) return null;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  
  const diffTime = due.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
}

/**
 * Calculate aging bucket for a due date
 */
export function calculateAgingBucket(dueDate: string | null): AgingBucket {
  if (!dueDate) return 'current';
  
  const daysUntilDue = getDaysUntilDue(dueDate);
  if (daysUntilDue === null) return 'current';
  
  // If not yet due, it's current
  if (daysUntilDue >= 0) return 'current';
  
  // Calculate days overdue (positive number)
  const daysOverdue = Math.abs(daysUntilDue);
  
  if (daysOverdue <= 30) return '1-30';
  if (daysOverdue <= 60) return '31-60';
  if (daysOverdue <= 90) return '61-90';
  return '90+';
}

// =====================================================
// Variance and Verification Functions
// =====================================================

/**
 * Calculate 3-way match variance
 */
export function calculateVariance(
  bkkAmount: number,
  invoiceAmount: number
): { variance: number; variancePercent: number; withinTolerance: boolean } {
  const variance = invoiceAmount - bkkAmount;
  const variancePercent = bkkAmount > 0 ? (variance / bkkAmount) * 100 : 0;
  const withinTolerance = isWithinTolerance(variancePercent);
  
  return { variance, variancePercent, withinTolerance };
}

/**
 * Determine if variance is within acceptable tolerance (2%)
 */
export function isWithinTolerance(variancePercent: number): boolean {
  return Math.abs(variancePercent) <= VARIANCE_TOLERANCE_PERCENT;
}

// =====================================================
// Payment Functions
// =====================================================

/**
 * Calculate remaining balance
 */
export function calculateRemainingBalance(totalAmount: number, amountPaid: number): number {
  const remaining = totalAmount - amountPaid;
  return Math.max(0, remaining);
}

/**
 * Calculate total paid from payments array
 */
export function calculateTotalPaid(payments: { amount: number }[]): number {
  return payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
}

/**
 * Determine invoice status based on payment progress
 */
export function determineVendorInvoiceStatus(
  totalAmount: number,
  amountPaid: number,
  currentStatus: VendorInvoiceStatus
): VendorInvoiceStatus {
  // Don't change status for cancelled or disputed invoices
  if (currentStatus === 'cancelled' || currentStatus === 'disputed') {
    return currentStatus;
  }
  
  // Fully paid
  if (amountPaid >= totalAmount) {
    return 'paid';
  }
  
  // Partially paid
  if (amountPaid > 0) {
    return 'partial';
  }
  
  // No payments - keep current status if it's a valid pre-payment status
  if (['received', 'verified', 'approved'].includes(currentStatus)) {
    return currentStatus;
  }
  
  return 'received';
}


// =====================================================
// Validation Functions
// =====================================================

/**
 * Validate payment amount
 */
export function validatePaymentAmount(amount: number | undefined | null): {
  isValid: boolean;
  error?: string;
} {
  if (amount === undefined || amount === null) {
    return { isValid: false, error: 'Payment amount is required' };
  }
  
  if (typeof amount !== 'number' || isNaN(amount)) {
    return { isValid: false, error: 'Payment amount must be a valid number' };
  }
  
  if (amount <= 0) {
    return { isValid: false, error: 'Payment amount must be greater than zero' };
  }
  
  return { isValid: true };
}

/**
 * Check if payment method is valid
 */
export function isValidPaymentMethod(method: string | undefined | null): method is VendorPaymentMethod {
  if (!method) return false;
  return VALID_VENDOR_PAYMENT_METHODS.includes(method as VendorPaymentMethod);
}

/**
 * Validate vendor invoice creation input
 */
export function validateVendorInvoiceInput(input: {
  vendor_id?: string;
  invoice_number?: string;
  invoice_date?: string;
  subtotal?: number;
  tax_amount?: number;
}): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!input.vendor_id || input.vendor_id.trim() === '') {
    errors.push('Vendor is required');
  }
  
  if (!input.invoice_number || input.invoice_number.trim() === '') {
    errors.push('Vendor invoice number is required');
  }
  
  if (!input.invoice_date) {
    errors.push('Invoice date is required');
  }
  
  if (input.subtotal === undefined || input.subtotal === null) {
    errors.push('Subtotal is required');
  } else if (input.subtotal <= 0) {
    errors.push('Subtotal must be greater than zero');
  }
  
  if (input.tax_amount !== undefined && input.tax_amount !== null && input.tax_amount < 0) {
    errors.push('Tax amount cannot be negative');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

// =====================================================
// Display Functions
// =====================================================

/**
 * Get status display info (color, label)
 */
export function getStatusDisplayInfo(status: VendorInvoiceStatus): StatusDisplayInfo {
  return VENDOR_INVOICE_STATUS_COLORS[status] || VENDOR_INVOICE_STATUS_COLORS.received;
}

/**
 * Get expense category label
 */
export function getExpenseCategoryLabel(category: ExpenseCategory | null | undefined): string {
  if (!category) return '-';
  const found = EXPENSE_CATEGORIES.find((c) => c.value === category);
  return found?.label || category;
}

/**
 * Get payment method label
 */
export function getPaymentMethodLabel(method: VendorPaymentMethod): string {
  const found = VENDOR_PAYMENT_METHODS.find((m) => m.value === method);
  return found?.label || method;
}

/**
 * Format currency for display (Indonesian Rupiah)
 */
export function formatVendorInvoiceCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return '-';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format date for display (DD/MM/YYYY)
 */
export function formatVendorInvoiceDate(date: string | null | undefined): string {
  if (!date) return '-';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

/**
 * Format variance percentage for display
 */
export function formatVariancePercent(percent: number): string {
  const sign = percent >= 0 ? '+' : '';
  return `${sign}${percent.toFixed(1)}%`;
}

// =====================================================
// Permission Functions
// =====================================================

/**
 * Roles that can view vendor invoices
 */
export const VENDOR_INVOICE_VIEW_ROLES = ['owner', 'director', 'sysadmin', 'marketing_manager', 'finance_manager', 'operations_manager', 'finance', 'administration'] as const;

/**
 * Roles that can create/edit vendor invoices
 */
export const VENDOR_INVOICE_EDIT_ROLES = ['owner', 'director', 'sysadmin', 'finance', 'administration'] as const;

/**
 * Roles that can approve vendor invoices
 */
export const VENDOR_INVOICE_APPROVE_ROLES = ['owner', 'director', 'sysadmin', 'marketing_manager', 'finance_manager', 'operations_manager'] as const;

/**
 * Roles that can delete vendor invoices
 */
export const VENDOR_INVOICE_DELETE_ROLES = ['owner', 'director', 'sysadmin'] as const;

/**
 * Check if a role can view vendor invoices
 */
export function canViewVendorInvoices(role: string): boolean {
  return VENDOR_INVOICE_VIEW_ROLES.includes(role as typeof VENDOR_INVOICE_VIEW_ROLES[number]);
}

/**
 * Check if a role can create/edit vendor invoices
 */
export function canEditVendorInvoices(role: string): boolean {
  return VENDOR_INVOICE_EDIT_ROLES.includes(role as typeof VENDOR_INVOICE_EDIT_ROLES[number]);
}

/**
 * Check if a role can approve vendor invoices
 */
export function canApproveVendorInvoices(role: string): boolean {
  return VENDOR_INVOICE_APPROVE_ROLES.includes(role as typeof VENDOR_INVOICE_APPROVE_ROLES[number]);
}

/**
 * Check if a role can delete vendor invoices
 */
export function canDeleteVendorInvoices(role: string): boolean {
  return VENDOR_INVOICE_DELETE_ROLES.includes(role as typeof VENDOR_INVOICE_DELETE_ROLES[number]);
}
