/**
 * Payment Utility Functions
 * Core functions for payment calculations, validation, and status determination
 */

import { PaymentMethod, PaymentSummary, PAYMENT_METHODS } from '@/types/payments'
import { InvoiceStatus } from '@/types'

/**
 * Valid payment methods
 */
export const VALID_PAYMENT_METHODS: PaymentMethod[] = ['transfer', 'cash', 'check', 'giro']

/**
 * Calculate remaining balance for an invoice
 * @param totalAmount - Invoice total amount
 * @param amountPaid - Total amount already paid
 * @returns Remaining balance (never negative)
 */
export function calculateRemainingBalance(totalAmount: number, amountPaid: number): number {
  const remaining = totalAmount - amountPaid
  return Math.max(0, remaining)
}

/**
 * Calculate payment summary for an invoice
 * @param invoiceTotal - Invoice total amount
 * @param amountPaid - Total amount already paid
 * @returns Payment summary with total, paid, and remaining
 */
export function calculatePaymentSummary(
  invoiceTotal: number,
  amountPaid: number
): PaymentSummary {
  return {
    invoice_total: invoiceTotal,
    amount_paid: amountPaid,
    remaining_balance: calculateRemainingBalance(invoiceTotal, amountPaid),
  }
}

/**
 * Calculate total paid from an array of payment amounts
 * @param payments - Array of payment objects with amount field
 * @returns Sum of all payment amounts
 */
export function calculateTotalPaid(payments: { amount: number }[]): number {
  return payments.reduce((sum, payment) => sum + Number(payment.amount), 0)
}

/**
 * Determine invoice status based on payment progress
 * @param totalAmount - Invoice total amount
 * @param amountPaid - Total amount paid
 * @param currentStatus - Current invoice status
 * @returns New invoice status based on payment progress
 */
export function determineInvoiceStatus(
  totalAmount: number,
  amountPaid: number,
  currentStatus: InvoiceStatus
): InvoiceStatus {
  // Don't change status for draft or cancelled invoices
  if (currentStatus === 'draft' || currentStatus === 'cancelled') {
    return currentStatus
  }

  // Fully paid
  if (amountPaid >= totalAmount) {
    return 'paid'
  }

  // Partially paid
  if (amountPaid > 0) {
    return 'partial'
  }

  // No payments - revert to sent (or overdue if it was overdue)
  if (currentStatus === 'overdue') {
    return 'overdue'
  }

  return 'sent'
}

/**
 * Validate payment amount
 * @param amount - Payment amount to validate
 * @returns Object with isValid flag and optional error message
 */
export function validatePaymentAmount(amount: number | undefined | null): {
  isValid: boolean
  error?: string
} {
  if (amount === undefined || amount === null) {
    return { isValid: false, error: 'Payment amount is required' }
  }

  if (typeof amount !== 'number' || isNaN(amount)) {
    return { isValid: false, error: 'Payment amount must be a valid number' }
  }

  if (amount <= 0) {
    return { isValid: false, error: 'Payment amount must be greater than zero' }
  }

  return { isValid: true }
}

/**
 * Check if a payment method is valid
 * @param method - Payment method to validate
 * @returns True if valid, false otherwise
 */
export function isValidPaymentMethod(method: string | undefined | null): method is PaymentMethod {
  if (!method) return false
  return VALID_PAYMENT_METHODS.includes(method as PaymentMethod)
}

/**
 * Get payment method label for display
 * @param method - Payment method value
 * @returns Human-readable label
 */
export function getPaymentMethodLabel(method: PaymentMethod): string {
  const found = PAYMENT_METHODS.find((m) => m.value === method)
  return found?.label || method
}

/**
 * Check if payment would result in overpayment
 * @param paymentAmount - Amount being paid
 * @param remainingBalance - Current remaining balance
 * @returns True if payment exceeds remaining balance
 */
export function isOverpayment(paymentAmount: number, remainingBalance: number): boolean {
  return paymentAmount > remainingBalance
}

/**
 * Roles that can record payments
 */
export const PAYMENT_ALLOWED_ROLES = ['owner', 'admin', 'manager', 'finance'] as const

/**
 * Check if a role can record payments
 * @param role - User role to check
 * @returns True if role can record payments
 */
export function canRecordPayment(role: string): boolean {
  return PAYMENT_ALLOWED_ROLES.includes(role as typeof PAYMENT_ALLOWED_ROLES[number])
}
