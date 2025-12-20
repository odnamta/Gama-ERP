/**
 * Vendor Invoice Types
 * Types for tracking vendor invoices (accounts payable) and payments
 */

/**
 * Vendor Invoice Status
 */
export type VendorInvoiceStatus =
  | 'received'    // Initial state when invoice is recorded
  | 'verified'    // Passed 3-way match verification
  | 'approved'    // Approved for payment by manager
  | 'partial'     // Partially paid
  | 'paid'        // Fully paid
  | 'disputed'    // Failed verification, needs review
  | 'cancelled';  // Cancelled/voided

/**
 * Expense categories for vendor invoices
 */
export type ExpenseCategory =
  | 'trucking'
  | 'shipping'
  | 'port'
  | 'handling'
  | 'fuel'
  | 'toll'
  | 'permit'
  | 'crew'
  | 'equipment'
  | 'overhead'
  | 'other';

/**
 * Payment methods for vendor payments
 */
export type VendorPaymentMethod = 'transfer' | 'cash' | 'check' | 'giro';

/**
 * Aging bucket categories
 */
export type AgingBucket = 'current' | '1-30' | '31-60' | '61-90' | '90+';

/**
 * Vendor Invoice record from database
 */
export interface VendorInvoice {
  id: string;
  invoice_number: string;
  internal_ref: string;
  vendor_id: string;
  jo_id: string | null;
  pjo_id: string | null;
  bkk_id: string | null;
  invoice_date: string;
  received_date: string;
  due_date: string | null;
  description: string | null;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  amount_paid: number;
  amount_due: number;
  status: VendorInvoiceStatus;
  verified_at: string | null;
  verified_by: string | null;
  verification_notes: string | null;
  approved_at: string | null;
  approved_by: string | null;
  document_url: string | null;
  expense_category: ExpenseCategory | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Vendor Invoice with relations for display
 */
export interface VendorInvoiceWithRelations extends VendorInvoice {
  vendor?: {
    id: string;
    vendor_name: string;
    vendor_code: string;
    bank_name?: string | null;
    bank_account?: string | null;
    tax_id?: string | null;
  } | null;
  job_order?: {
    id: string;
    jo_number: string;
  } | null;
  pjo?: {
    id: string;
    pjo_number: string;
  } | null;
  bkk?: {
    id: string;
    bkk_number: string;
    amount_spent: number | null;
    amount_requested: number;
  } | null;
  verifier?: {
    id: string;
    full_name: string | null;
  } | null;
  approver?: {
    id: string;
    full_name: string | null;
  } | null;
  creator?: {
    id: string;
    full_name: string | null;
  } | null;
}

/**
 * Vendor Payment record from database
 */
export interface VendorPayment {
  id: string;
  vendor_invoice_id: string;
  payment_date: string;
  amount: number;
  payment_method: VendorPaymentMethod;
  reference_number: string | null;
  bank_name: string | null;
  bank_account: string | null;
  proof_url: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
}

/**
 * Vendor Payment with recorder details
 */
export interface VendorPaymentWithRecorder extends VendorPayment {
  recorder?: {
    id: string;
    full_name: string | null;
  } | null;
}


/**
 * Form data for creating vendor invoice
 */
export interface VendorInvoiceFormData {
  vendor_id: string;
  invoice_number: string;
  invoice_date: string;
  received_date?: string;
  due_date?: string;
  description?: string;
  subtotal: number;
  tax_amount: number;
  expense_category?: ExpenseCategory;
  jo_id?: string;
  pjo_id?: string;
  bkk_id?: string;
  document_url?: string;
  notes?: string;
}

/**
 * Form data for recording vendor payment
 */
export interface VendorPaymentFormData {
  vendor_invoice_id: string;
  amount: number;
  payment_date: string;
  payment_method: VendorPaymentMethod;
  reference_number?: string;
  bank_name?: string;
  bank_account?: string;
  proof_url?: string;
  notes?: string;
}

/**
 * AP Summary statistics
 */
export interface APSummary {
  totalUnpaid: number;
  dueToday: number;
  overdue: number;
  paidMTD: number;
  pendingVerification: number;
}

/**
 * AP Aging buckets for reporting
 */
export interface APAgingBuckets {
  current: number;
  days1to30: number;
  days31to60: number;
  days61to90: number;
  days90plus: number;
}

/**
 * Extended AP Summary with aging
 */
export interface APSummaryWithAging extends APSummary {
  aging: APAgingBuckets;
}

/**
 * 3-way match verification result
 */
export interface VerificationResult {
  matched: boolean;
  bkkAmount: number;
  invoiceAmount: number;
  variance: number;
  variancePercent: number;
}

/**
 * Filter state for vendor invoices list
 */
export interface VendorInvoiceFilterState {
  search: string;
  status: VendorInvoiceStatus | 'all';
  vendorId: string | 'all';
  pjoId: string | 'all';
  joId: string | 'all';
  agingBucket: AgingBucket | 'all';
  dateFrom: string | null;
  dateTo: string | null;
}

/**
 * Status display info for UI
 */
export interface StatusDisplayInfo {
  bg: string;
  text: string;
  label: string;
}

/**
 * Expense category option for dropdowns
 */
export interface ExpenseCategoryOption {
  value: ExpenseCategory;
  label: string;
}

/**
 * Payment method option for dropdowns
 */
export interface PaymentMethodOption {
  value: VendorPaymentMethod;
  label: string;
}
