/**
 * Payment Utils Property-Based Tests
 * Tests for payment calculation, validation, and status determination
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import {
  calculateRemainingBalance,
  calculatePaymentSummary,
  calculateTotalPaid,
  determineInvoiceStatus,
  validatePaymentAmount,
  isValidPaymentMethod,
  getPaymentMethodLabel,
  isOverpayment,
  canRecordPayment,
  VALID_PAYMENT_METHODS,
  PAYMENT_ALLOWED_ROLES,
} from '@/lib/payment-utils'
import { InvoiceStatus } from '@/types'

// Arbitrary for generating positive amounts (currency values)
const positiveAmountArb = fc.integer({ min: 1, max: 100000000 })
  .map(n => n / 100) // Convert to decimal with 2 places

// Arbitrary for generating non-negative amounts
const nonNegativeAmountArb = fc.integer({ min: 0, max: 100000000 })
  .map(n => n / 100)

// Arbitrary for payment method
const paymentMethodArb = fc.constantFrom(...VALID_PAYMENT_METHODS)

// Arbitrary for invoice status
const invoiceStatusArb = fc.constantFrom<InvoiceStatus>('draft', 'sent', 'partial', 'paid', 'overdue', 'cancelled')

// Arbitrary for payment-eligible statuses (not draft or cancelled)
const paymentEligibleStatusArb = fc.constantFrom<InvoiceStatus>('sent', 'partial', 'paid', 'overdue')

describe('Payment Utils - Amount Calculations', () => {
  /**
   * **Feature: payment-tracking, Property 2: Amount paid invariant**
   * **Validates: Requirements 1.3**
   * 
   * For any invoice with one or more payments, the invoice's amount_paid field
   * SHALL equal the sum of all payment amounts linked to that invoice.
   */
  it('Property 2: Amount paid equals sum of all payments', () => {
    fc.assert(
      fc.property(
        fc.array(positiveAmountArb, { minLength: 1, maxLength: 20 }),
        (paymentAmounts) => {
          const payments = paymentAmounts.map(amount => ({ amount }))
          const totalPaid = calculateTotalPaid(payments)
          const expectedSum = paymentAmounts.reduce((sum, amt) => sum + amt, 0)
          
          // Allow for floating point precision issues
          expect(Math.abs(totalPaid - expectedSum)).toBeLessThan(0.01)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('calculateTotalPaid returns 0 for empty array', () => {
    expect(calculateTotalPaid([])).toBe(0)
  })

  it('calculateRemainingBalance never returns negative', () => {
    fc.assert(
      fc.property(
        positiveAmountArb,
        positiveAmountArb,
        (totalAmount, amountPaid) => {
          const remaining = calculateRemainingBalance(totalAmount, amountPaid)
          expect(remaining).toBeGreaterThanOrEqual(0)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('calculateRemainingBalance is correct when paid < total', () => {
    fc.assert(
      fc.property(
        positiveAmountArb,
        fc.integer({ min: 1, max: 99 }).map(n => n / 100),
        (totalAmount, paidRatio) => {
          const amountPaid = totalAmount * paidRatio
          const remaining = calculateRemainingBalance(totalAmount, amountPaid)
          const expected = totalAmount - amountPaid
          
          expect(Math.abs(remaining - expected)).toBeLessThan(0.01)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('calculatePaymentSummary returns consistent values', () => {
    fc.assert(
      fc.property(
        positiveAmountArb,
        nonNegativeAmountArb,
        (invoiceTotal, amountPaid) => {
          const summary = calculatePaymentSummary(invoiceTotal, amountPaid)
          
          expect(summary.invoice_total).toBe(invoiceTotal)
          expect(summary.amount_paid).toBe(amountPaid)
          expect(summary.remaining_balance).toBe(
            calculateRemainingBalance(invoiceTotal, amountPaid)
          )
        }
      ),
      { numRuns: 100 }
    )
  })
})

describe('Payment Utils - Invoice Status Determination', () => {
  /**
   * **Feature: payment-tracking, Property 3: Invoice status reflects payment progress**
   * **Validates: Requirements 3.1, 3.2, 3.3**
   * 
   * For any invoice:
   * - If sum(payments) >= total_amount, status SHALL be "paid"
   * - If 0 < sum(payments) < total_amount, status SHALL be "partial"
   * - If sum(payments) = 0 and previously sent, status SHALL be "sent"
   */
  it('Property 3: Status is "paid" when fully paid', () => {
    fc.assert(
      fc.property(
        positiveAmountArb,
        paymentEligibleStatusArb,
        (totalAmount, currentStatus) => {
          // Amount paid equals or exceeds total
          const amountPaid = totalAmount * (1 + Math.random() * 0.5) // 100-150% of total
          const newStatus = determineInvoiceStatus(totalAmount, amountPaid, currentStatus)
          
          expect(newStatus).toBe('paid')
        }
      ),
      { numRuns: 100 }
    )
  })

  it('Property 3: Status is "partial" when partially paid', () => {
    fc.assert(
      fc.property(
        positiveAmountArb,
        fc.integer({ min: 1, max: 99 }).map(n => n / 100),
        paymentEligibleStatusArb,
        (totalAmount, paidRatio, currentStatus) => {
          const amountPaid = totalAmount * paidRatio
          const newStatus = determineInvoiceStatus(totalAmount, amountPaid, currentStatus)
          
          expect(newStatus).toBe('partial')
        }
      ),
      { numRuns: 100 }
    )
  })

  it('Property 3: Status reverts to "sent" when no payments (from sent)', () => {
    const newStatus = determineInvoiceStatus(1000, 0, 'sent')
    expect(newStatus).toBe('sent')
  })

  it('Property 3: Status stays "overdue" when no payments (from overdue)', () => {
    const newStatus = determineInvoiceStatus(1000, 0, 'overdue')
    expect(newStatus).toBe('overdue')
  })

  it('Draft invoices keep draft status regardless of payments', () => {
    fc.assert(
      fc.property(
        positiveAmountArb,
        nonNegativeAmountArb,
        (totalAmount, amountPaid) => {
          const newStatus = determineInvoiceStatus(totalAmount, amountPaid, 'draft')
          expect(newStatus).toBe('draft')
        }
      ),
      { numRuns: 100 }
    )
  })

  it('Cancelled invoices keep cancelled status regardless of payments', () => {
    fc.assert(
      fc.property(
        positiveAmountArb,
        nonNegativeAmountArb,
        (totalAmount, amountPaid) => {
          const newStatus = determineInvoiceStatus(totalAmount, amountPaid, 'cancelled')
          expect(newStatus).toBe('cancelled')
        }
      ),
      { numRuns: 100 }
    )
  })
})

describe('Payment Utils - Payment Method Validation', () => {
  /**
   * **Feature: payment-tracking, Property 10: Payment method validation**
   * **Validates: Requirements 7.1**
   * 
   * For any payment submission, the payment_method field SHALL be one of:
   * 'transfer', 'cash', 'check', 'giro'. Any other value SHALL be rejected.
   */
  it('Property 10: Valid payment methods are accepted', () => {
    fc.assert(
      fc.property(
        paymentMethodArb,
        (method) => {
          expect(isValidPaymentMethod(method)).toBe(true)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('Property 10: Invalid payment methods are rejected', () => {
    fc.assert(
      fc.property(
        fc.string().filter(s => !VALID_PAYMENT_METHODS.includes(s as any)),
        (invalidMethod) => {
          expect(isValidPaymentMethod(invalidMethod)).toBe(false)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('Null and undefined payment methods are rejected', () => {
    expect(isValidPaymentMethod(null)).toBe(false)
    expect(isValidPaymentMethod(undefined)).toBe(false)
    expect(isValidPaymentMethod('')).toBe(false)
  })

  it('getPaymentMethodLabel returns correct labels', () => {
    expect(getPaymentMethodLabel('transfer')).toBe('Bank Transfer')
    expect(getPaymentMethodLabel('cash')).toBe('Cash')
    expect(getPaymentMethodLabel('check')).toBe('Check (Cek)')
    expect(getPaymentMethodLabel('giro')).toBe('Giro Bilyet')
  })
})

describe('Payment Utils - Amount Validation', () => {
  it('validatePaymentAmount accepts positive amounts', () => {
    fc.assert(
      fc.property(
        positiveAmountArb,
        (amount) => {
          const result = validatePaymentAmount(amount)
          expect(result.isValid).toBe(true)
          expect(result.error).toBeUndefined()
        }
      ),
      { numRuns: 100 }
    )
  })

  it('validatePaymentAmount rejects zero and negative amounts', () => {
    expect(validatePaymentAmount(0).isValid).toBe(false)
    expect(validatePaymentAmount(-100).isValid).toBe(false)
    expect(validatePaymentAmount(-0.01).isValid).toBe(false)
  })

  it('validatePaymentAmount rejects null and undefined', () => {
    expect(validatePaymentAmount(null).isValid).toBe(false)
    expect(validatePaymentAmount(undefined).isValid).toBe(false)
  })

  it('validatePaymentAmount rejects NaN', () => {
    expect(validatePaymentAmount(NaN).isValid).toBe(false)
  })
})

describe('Payment Utils - Overpayment Detection', () => {
  it('isOverpayment returns true when payment exceeds balance', () => {
    fc.assert(
      fc.property(
        positiveAmountArb,
        fc.integer({ min: 101, max: 1000 }).map(n => n / 100),
        (balance, multiplier) => {
          const payment = balance * multiplier
          expect(isOverpayment(payment, balance)).toBe(true)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('isOverpayment returns false when payment is within balance', () => {
    fc.assert(
      fc.property(
        positiveAmountArb,
        fc.integer({ min: 0, max: 100 }).map(n => n / 100),
        (balance, ratio) => {
          const payment = balance * ratio
          expect(isOverpayment(payment, balance)).toBe(false)
        }
      ),
      { numRuns: 100 }
    )
  })
})

describe('Payment Utils - Role-Based Access', () => {
  /**
   * **Feature: payment-tracking, Property 9: Role-based payment access**
   * **Validates: Requirements 6.1, 6.2, 6.3**
   * 
   * For any user with role in {owner, admin, manager, finance}, payment recording
   * SHALL be permitted. For any user with role in {ops, sales, viewer}, payment
   * recording SHALL be denied.
   */
  it('Property 9: Authorized roles can record payments', () => {
    const authorizedRoles = ['owner', 'admin', 'manager', 'finance']
    authorizedRoles.forEach(role => {
      expect(canRecordPayment(role)).toBe(true)
    })
  })

  it('Property 9: Unauthorized roles cannot record payments', () => {
    const unauthorizedRoles = ['ops', 'sales', 'viewer']
    unauthorizedRoles.forEach(role => {
      expect(canRecordPayment(role)).toBe(false)
    })
  })

  it('Unknown roles cannot record payments', () => {
    fc.assert(
      fc.property(
        fc.string().filter(s => ![...PAYMENT_ALLOWED_ROLES].includes(s as any)),
        (unknownRole) => {
          expect(canRecordPayment(unknownRole)).toBe(false)
        }
      ),
      { numRuns: 100 }
    )
  })
})
