# Design Document: Payment Tracking System

## Overview

The Payment Tracking System extends the Gama ERP invoice module to support recording and tracking multiple payments against invoices. This feature enables partial payment handling, automatic balance calculation, and dynamic invoice status updates based on payment progress. The system integrates with the existing invoice detail view and finance dashboard to provide comprehensive payment visibility.

## Architecture

The payment tracking system follows the existing Gama ERP architecture patterns:

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js)                        │
├─────────────────────────────────────────────────────────────────┤
│  Invoice Detail Page    │    Finance Dashboard    │   Reports   │
│  ├─ PaymentsSection     │    ├─ PartialPayments   │             │
│  ├─ PaymentHistory      │    ├─ MonthlyPayments   │             │
│  └─ RecordPaymentDialog │    └─ ...               │             │
├─────────────────────────────────────────────────────────────────┤
│                     Server Actions Layer                         │
│  payment-actions.ts (recordPayment, deletePayment, getPayments) │
├─────────────────────────────────────────────────────────────────┤
│                     Utility Functions                            │
│  payment-utils.ts (calculations, validation, formatting)         │
├─────────────────────────────────────────────────────────────────┤
│                        Supabase                                  │
│  payments table │ invoices table (amount_paid) │ RLS policies   │
└─────────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### Database Schema

```sql
-- New payments table
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  amount DECIMAL(15,2) NOT NULL,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method VARCHAR(30) NOT NULL,
  reference_number VARCHAR(100),
  bank_name VARCHAR(100),
  bank_account VARCHAR(50),
  notes TEXT,
  recorded_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payments_invoice ON payments(invoice_id);
CREATE INDEX idx_payments_date ON payments(payment_date DESC);

-- Add amount_paid column to invoices
ALTER TABLE invoices
ADD COLUMN IF NOT EXISTS amount_paid DECIMAL(15,2) DEFAULT 0;
```

### TypeScript Types

```typescript
// types/payments.ts
export type PaymentMethod = 'transfer' | 'cash' | 'check' | 'giro';

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

export interface PaymentWithRecorder extends Payment {
  recorder?: {
    id: string;
    full_name: string | null;
    email: string;
  };
}

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

export interface PaymentSummary {
  invoice_total: number;
  amount_paid: number;
  remaining_balance: number;
}

export const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'transfer', label: 'Bank Transfer' },
  { value: 'cash', label: 'Cash' },
  { value: 'check', label: 'Check (Cek)' },
  { value: 'giro', label: 'Giro Bilyet' },
];
```

### Updated Invoice Status

```typescript
// Update InvoiceStatus type to include 'partial'
export type InvoiceStatus = 'draft' | 'sent' | 'partial' | 'paid' | 'overdue' | 'cancelled';
```

### React Components

1. **PaymentsSection** - Container component for payment display on invoice detail
2. **PaymentHistory** - Table displaying all payments for an invoice
3. **RecordPaymentDialog** - Modal form for recording new payments
4. **PaymentSummaryCard** - Displays total, paid, and remaining amounts

### Server Actions

```typescript
// app/(main)/invoices/payment-actions.ts
export async function recordPayment(data: PaymentFormData): Promise<{ data?: Payment; error?: string }>;
export async function getPayments(invoiceId: string): Promise<PaymentWithRecorder[]>;
export async function deletePayment(paymentId: string): Promise<{ error?: string }>;
```

## Data Models

### Entity Relationships

```
invoices (1) ──────< (many) payments
    │
    └── amount_paid (calculated field, updated on payment changes)
```

### Payment Flow State Machine

```
Invoice Status Transitions Based on Payments:

  draft ──[send]──> sent ──[payment]──> partial ──[full payment]──> paid
                      │                    │
                      │                    └──[delete payment]──> sent (if no payments)
                      │
                      └──[full payment]──> paid
                      
  partial ──[delete all payments]──> sent
  paid ──[delete payment]──> partial (if remaining > 0)
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Payment record integrity
*For any* valid payment form data submitted to the system, the created payment record SHALL contain all required fields (invoice_id, amount, payment_date, payment_method) with values matching the input data.
**Validates: Requirements 1.2**

### Property 2: Amount paid invariant
*For any* invoice with one or more payments, the invoice's amount_paid field SHALL equal the sum of all payment amounts linked to that invoice.
**Validates: Requirements 1.3**

### Property 3: Invoice status reflects payment progress
*For any* invoice:
- If sum(payments) >= total_amount, status SHALL be "paid"
- If 0 < sum(payments) < total_amount, status SHALL be "partial"  
- If sum(payments) = 0 and previously sent, status SHALL be "sent"
**Validates: Requirements 3.1, 3.2, 3.3**

### Property 4: Payment history completeness
*For any* payment record displayed in the payment history table, the rendered row SHALL include payment date, amount, method, reference number (or placeholder), and recorder name (or placeholder).
**Validates: Requirements 2.2**

### Property 5: Currency formatting consistency
*For any* numeric payment amount, the formatted display string SHALL follow the Indonesian Rupiah pattern: "Rp" prefix followed by the number with thousand separators.
**Validates: Requirements 2.4**

### Property 6: Pay Full amount accuracy
*For any* invoice with remaining_balance > 0, clicking "Pay Full" SHALL populate the amount field with exactly (total_amount - amount_paid).
**Validates: Requirements 4.1**

### Property 7: Partial payments dashboard aggregation
*For any* set of invoices with status "partial", the dashboard "Partial Payments" card SHALL display the correct count and sum of remaining balances.
**Validates: Requirements 5.1**

### Property 8: Monthly payments dashboard aggregation
*For any* set of payments with payment_date in the current month, the dashboard "Payments This Month" card SHALL display the correct sum of payment amounts.
**Validates: Requirements 5.2**

### Property 9: Role-based payment access
*For any* user with role in {owner, admin, manager, finance}, payment recording SHALL be permitted. *For any* user with role in {ops, sales, viewer}, payment recording SHALL be denied.
**Validates: Requirements 6.1, 6.2, 6.3**

### Property 10: Payment method validation
*For any* payment submission, the payment_method field SHALL be one of: 'transfer', 'cash', 'check', 'giro'. Any other value SHALL be rejected.
**Validates: Requirements 7.1**

## Error Handling

### Validation Errors
- Empty or zero amount: "Payment amount is required and must be greater than zero"
- Missing payment method: "Please select a payment method"
- Missing payment date: "Payment date is required"
- Invalid payment method: "Invalid payment method selected"

### Business Logic Errors
- Overpayment warning: "This payment exceeds the remaining balance. Continue anyway?"
- Invoice not found: "Invoice not found"
- Invoice cancelled: "Cannot record payment for cancelled invoice"

### Authorization Errors
- Unauthorized role: "You do not have permission to record payments"

## Testing Strategy

### Property-Based Testing Library
The project uses **Vitest** with **fast-check** for property-based testing.

### Unit Tests
- Payment utility functions (calculateRemainingBalance, formatPaymentAmount)
- Status transition logic
- Form validation functions
- Permission checks

### Property-Based Tests
Each correctness property will be implemented as a property-based test with minimum 100 iterations:
- **Property 1**: Generate random valid payment data, verify record creation
- **Property 2**: Generate random payment sequences, verify amount_paid sum
- **Property 3**: Generate invoices with various payment totals, verify status
- **Property 4**: Generate payment records, verify rendered columns
- **Property 5**: Generate random amounts, verify Rupiah formatting
- **Property 6**: Generate invoices with balances, verify Pay Full calculation
- **Property 7**: Generate partial invoices, verify dashboard aggregation
- **Property 8**: Generate monthly payments, verify sum calculation
- **Property 9**: Generate user roles, verify access control
- **Property 10**: Generate payment methods, verify validation

Test annotations will follow the format:
```typescript
// **Feature: payment-tracking, Property 2: Amount paid invariant**
```

### Integration Tests
- End-to-end payment recording flow
- Invoice status transitions with payments
- Dashboard statistics accuracy
