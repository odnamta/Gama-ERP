// =====================================================
// v0.69: ACCOUNTING TRANSFORMER PROPERTY TESTS
// Property 5: Invoice Transformation Round-Trip
// Validates: Requirements 3.2
// =====================================================
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  transformInvoiceToAccurate,
  transformPaymentToAccurate,
  transformCustomerToAccurate,
  transformInvoiceFromAccurate,
  formatDateForAccurate,
  generateCustomerCode,
  generateItemCode,
  mapPaymentMethod,
  validateInvoiceForTransformation,
  validatePaymentForTransformation,
  validateCustomerForTransformation,
  type GamaInvoice,
  type GamaInvoiceLineItem,
  type GamaPayment,
  type GamaCustomer,
  type AccurateInvoice,
} from '@/lib/accounting-transformer';

// =====================================================
// ARBITRARIES (Test Data Generators)
// =====================================================

// UUID generator
const uuidArb = fc.uuid();

// Date string generator (ISO format) - using a simpler approach
const dateStringArb = fc.integer({ min: 1577836800000, max: 1924905600000 }) // 2020-01-01 to 2030-12-31
  .map(ts => new Date(ts).toISOString().split('T')[0] + 'T00:00:00.000Z');

// Positive number generator for amounts (using integer to avoid float precision issues)
const positiveAmountArb = fc.integer({ min: 1, max: 100000000 })
  .map(n => n / 100); // Convert cents to dollars

// Line item generator
const lineItemArb: fc.Arbitrary<GamaInvoiceLineItem> = fc.record({
  id: uuidArb,
  description: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
  quantity: fc.integer({ min: 1, max: 1000 }),
  unit: fc.option(fc.constantFrom('UNIT', 'PCS', 'KG', 'M3', 'TRIP'), { nil: null }),
  unit_price: positiveAmountArb,
  subtotal: fc.option(positiveAmountArb, { nil: null }),
});

// Invoice generator
const invoiceArb: fc.Arbitrary<GamaInvoice> = fc.record({
  id: uuidArb,
  invoice_number: fc.stringMatching(/^INV-\d{4}-\d{4}$/),
  invoice_date: fc.option(dateStringArb, { nil: null }),
  due_date: dateStringArb,
  customer_id: uuidArb,
  customer_code: fc.option(fc.string({ minLength: 5, maxLength: 20 }), { nil: undefined }),
  jo_id: uuidArb,
  subtotal: positiveAmountArb,
  tax_amount: positiveAmountArb,
  total_amount: positiveAmountArb,
  status: fc.constantFrom('draft', 'sent', 'paid', 'overdue', 'cancelled'),
  notes: fc.option(fc.string({ maxLength: 500 }), { nil: null }),
  line_items: fc.array(lineItemArb, { minLength: 1, maxLength: 10 }),
});

// Payment generator
const paymentArb: fc.Arbitrary<GamaPayment> = fc.record({
  id: uuidArb,
  invoice_id: uuidArb,
  invoice_number: fc.option(fc.stringMatching(/^INV-\d{4}-\d{4}$/), { nil: undefined }),
  amount: positiveAmountArb,
  payment_date: dateStringArb,
  payment_method: fc.constantFrom('cash', 'bank_transfer', 'transfer', 'check', 'credit_card', 'giro', 'other'),
  reference_number: fc.option(fc.string({ minLength: 5, maxLength: 50 }), { nil: null }),
  bank_name: fc.option(fc.constantFrom('BCA', 'Mandiri', 'BNI', 'BRI', 'CIMB'), { nil: null }),
  bank_account: fc.option(fc.stringMatching(/^\d{10,16}$/), { nil: null }),
  notes: fc.option(fc.string({ maxLength: 200 }), { nil: null }),
});

// Customer generator
const customerArb: fc.Arbitrary<GamaCustomer> = fc.record({
  id: uuidArb,
  name: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
  email: fc.emailAddress(),
  phone: fc.option(fc.stringMatching(/^\+?\d{10,15}$/), { nil: null }),
  address: fc.option(fc.string({ minLength: 10, maxLength: 200 }), { nil: null }),
  is_active: fc.boolean(),
});

// =====================================================
// PROPERTY TESTS
// =====================================================

describe('Accounting Transformer Property Tests', () => {
  describe('Property 5: Invoice Transformation Round-Trip', () => {
    /**
     * Property: For any valid Gama ERP invoice, transforming it to Accurate Online format
     * SHALL produce an object containing transDate, transNo, customerNo, dueDate,
     * detailItem array, subtotal, taxAmount, totalAmount, and description.
     * The transformation SHALL be deterministic.
     * Validates: Requirements 3.2
     */
    it('transforms invoice to Accurate format with all required fields', () => {
      fc.assert(
        fc.property(invoiceArb, (invoice) => {
          const result = transformInvoiceToAccurate(invoice);

          // Verify all required fields are present
          expect(result).toHaveProperty('transDate');
          expect(result).toHaveProperty('transNo');
          expect(result).toHaveProperty('customerNo');
          expect(result).toHaveProperty('dueDate');
          expect(result).toHaveProperty('detailItem');
          expect(result).toHaveProperty('subtotal');
          expect(result).toHaveProperty('taxAmount');
          expect(result).toHaveProperty('totalAmount');
          expect(result).toHaveProperty('description');

          // Verify transNo matches invoice_number
          expect(result.transNo).toBe(invoice.invoice_number);

          // Verify amounts are preserved
          expect(result.subtotal).toBe(invoice.subtotal);
          expect(result.taxAmount).toBe(invoice.tax_amount);
          expect(result.totalAmount).toBe(invoice.total_amount);

          // Verify line items count matches
          expect(result.detailItem.length).toBe(invoice.line_items.length);

          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('transformation is deterministic - same input produces same output', () => {
      fc.assert(
        fc.property(invoiceArb, (invoice) => {
          const result1 = transformInvoiceToAccurate(invoice);
          const result2 = transformInvoiceToAccurate(invoice);

          // Results should be identical
          expect(result1.transNo).toBe(result2.transNo);
          expect(result1.customerNo).toBe(result2.customerNo);
          expect(result1.subtotal).toBe(result2.subtotal);
          expect(result1.taxAmount).toBe(result2.taxAmount);
          expect(result1.totalAmount).toBe(result2.totalAmount);
          expect(result1.detailItem.length).toBe(result2.detailItem.length);

          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('line items are transformed with itemNo, itemName, quantity, unitPrice, unit, amount', () => {
      fc.assert(
        fc.property(invoiceArb, (invoice) => {
          const result = transformInvoiceToAccurate(invoice);

          result.detailItem.forEach((item, index) => {
            expect(item).toHaveProperty('itemNo');
            expect(item).toHaveProperty('itemName');
            expect(item).toHaveProperty('quantity');
            expect(item).toHaveProperty('unitPrice');
            expect(item).toHaveProperty('unit');
            expect(item).toHaveProperty('amount');

            // Verify itemName matches description
            expect(item.itemName).toBe(invoice.line_items[index].description);
            // Verify quantity matches
            expect(item.quantity).toBe(invoice.line_items[index].quantity);
            // Verify unitPrice matches
            expect(item.unitPrice).toBe(invoice.line_items[index].unit_price);
          });

          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('dates are formatted as yyyy-MM-dd', () => {
      fc.assert(
        fc.property(invoiceArb, (invoice) => {
          const result = transformInvoiceToAccurate(invoice);

          // Verify date format (yyyy-MM-dd)
          const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
          expect(result.transDate).toMatch(dateRegex);
          expect(result.dueDate).toMatch(dateRegex);

          return true;
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Payment Transformation', () => {
    it('transforms payment to Accurate format with all required fields', () => {
      fc.assert(
        fc.property(paymentArb, (payment) => {
          const result = transformPaymentToAccurate(payment);

          expect(result).toHaveProperty('transDate');
          expect(result).toHaveProperty('transNo');
          expect(result).toHaveProperty('invoiceNo');
          expect(result).toHaveProperty('amount');
          expect(result).toHaveProperty('paymentMethod');
          expect(result).toHaveProperty('bankAccount');
          expect(result).toHaveProperty('referenceNo');
          expect(result).toHaveProperty('description');

          // Verify amount is preserved
          expect(result.amount).toBe(payment.amount);

          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('payment method is mapped correctly', () => {
      fc.assert(
        fc.property(paymentArb, (payment) => {
          const result = transformPaymentToAccurate(payment);

          // Payment method should be uppercase
          expect(result.paymentMethod).toMatch(/^[A-Z_]+$/);

          return true;
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Customer Transformation', () => {
    it('transforms customer to Accurate format with all required fields', () => {
      fc.assert(
        fc.property(customerArb, (customer) => {
          const result = transformCustomerToAccurate(customer);

          expect(result).toHaveProperty('customerNo');
          expect(result).toHaveProperty('name');
          expect(result).toHaveProperty('email');
          expect(result).toHaveProperty('phone');
          expect(result).toHaveProperty('address');
          expect(result).toHaveProperty('isActive');

          // Verify name and email are preserved
          expect(result.name).toBe(customer.name);
          expect(result.email).toBe(customer.email);
          expect(result.isActive).toBe(customer.is_active);

          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('customerNo is generated from customer id', () => {
      fc.assert(
        fc.property(customerArb, (customer) => {
          const result = transformCustomerToAccurate(customer);

          // Customer number should start with CUST-
          expect(result.customerNo).toMatch(/^CUST-[A-Z0-9]+$/);

          return true;
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Helper Functions', () => {
    it('formatDateForAccurate returns valid date format', () => {
      fc.assert(
        fc.property(dateStringArb, (dateStr) => {
          const result = formatDateForAccurate(dateStr);
          expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('formatDateForAccurate handles null gracefully', () => {
      const result = formatDateForAccurate(null);
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('generateCustomerCode produces consistent codes', () => {
      fc.assert(
        fc.property(uuidArb, (uuid) => {
          const code1 = generateCustomerCode(uuid);
          const code2 = generateCustomerCode(uuid);
          expect(code1).toBe(code2);
          expect(code1).toMatch(/^CUST-[A-Z0-9]+$/);
          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('generateItemCode produces unique codes for different indices', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.integer({ min: 0, max: 100 }),
          (description, index) => {
            const code = generateItemCode(description, index);
            expect(code).toMatch(/^ITEM-[A-Z0-9]*-\d{3}$/);
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('mapPaymentMethod returns valid Accurate payment methods', () => {
      const methods = ['cash', 'bank_transfer', 'transfer', 'check', 'cheque', 'credit_card', 'debit_card', 'giro', 'other'];
      fc.assert(
        fc.property(fc.constantFrom(...methods), (method) => {
          const result = mapPaymentMethod(method);
          expect(result).toMatch(/^[A-Z_]+$/);
          return true;
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Validation Functions', () => {
    it('validates valid invoices', () => {
      fc.assert(
        fc.property(invoiceArb, (invoice) => {
          const result = validateInvoiceForTransformation(invoice);
          expect(result.valid).toBe(true);
          expect(result.errors).toHaveLength(0);
          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('rejects invoices without invoice_number', () => {
      const invalidInvoice: GamaInvoice = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        invoice_number: '',
        invoice_date: null,
        due_date: '2025-01-01',
        customer_id: '123e4567-e89b-12d3-a456-426614174001',
        jo_id: '123e4567-e89b-12d3-a456-426614174002',
        subtotal: 100,
        tax_amount: 11,
        total_amount: 111,
        status: 'draft',
        notes: null,
        line_items: [{ id: '1', description: 'Test', quantity: 1, unit: null, unit_price: 100, subtotal: 100 }],
      };
      const result = validateInvoiceForTransformation(invalidInvoice);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('invoice_number is required');
    });

    it('rejects invoices without line items', () => {
      const invalidInvoice: GamaInvoice = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        invoice_number: 'INV-2025-0001',
        invoice_date: null,
        due_date: '2025-01-01',
        customer_id: '123e4567-e89b-12d3-a456-426614174001',
        jo_id: '123e4567-e89b-12d3-a456-426614174002',
        subtotal: 100,
        tax_amount: 11,
        total_amount: 111,
        status: 'draft',
        notes: null,
        line_items: [],
      };
      const result = validateInvoiceForTransformation(invalidInvoice);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('At least one line item is required');
    });

    it('validates valid payments', () => {
      fc.assert(
        fc.property(paymentArb, (payment) => {
          const result = validatePaymentForTransformation(payment);
          expect(result.valid).toBe(true);
          expect(result.errors).toHaveLength(0);
          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('validates valid customers', () => {
      fc.assert(
        fc.property(customerArb, (customer) => {
          const result = validateCustomerForTransformation(customer);
          expect(result.valid).toBe(true);
          expect(result.errors).toHaveLength(0);
          return true;
        }),
        { numRuns: 100 }
      );
    });
  });
});
