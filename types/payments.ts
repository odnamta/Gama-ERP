/**
 * Payment Tracking Types
 * Types for recording and tracking payments against invoices
 */

/**
 * Valid payment methods
 */
export type PaymentMethod = 'transfer' | 'cash' | 'check' | 'giro';

/**
 * Payment method options for UI dropdowns
 */
export const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'transfer', label: 'Bank Transfer' },
  { value: 'cash', label: 'Cash' },
  { value: 'check', label: 'Check (Cek)' },
  { value: 'giro', label: 'Giro Bilyet' },
];

/**
 * Base payment record from database
 */
export interface Payment {
  id: string;
  invoice_id: string;
  amount: number;
  payment_date: string;
  payment_method: PaymentMethod;
  reference_number: string | null;
  bank_name: string | null;
  bank_account: string | null;
  notes: string | null;
  recorded_by: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Payment with recorder user details
 */
export interface PaymentWithRecorder extends Payment {
  recorder?: {
    id: string;
    full_name: string | null;
    email: string;
  } | null;
}

/**
 * Form data for creating a new payment
 */
export interface PaymentFormData {
  invoice_id: string;
  amount: number;
  payment_date: string;
  payment_method: PaymentMethod;
  reference_number?: string;
  bank_name?: string;
  bank_account?: string;
  notes?: string;
}

/**
 * Payment summary for an invoice
 */
export interface PaymentSummary {
  invoice_total: number;
  amount_paid: number;
  remaining_balance: number;
}

/**
 * Payment statistics for dashboard
 */
export interface PaymentStats {
  partialPaymentsCount: number;
  partialPaymentsTotal: number;
  monthlyPaymentsTotal: number;
}
