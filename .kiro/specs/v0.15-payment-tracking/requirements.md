# Requirements Document

## Introduction

The Payment Tracking System enables recording and tracking of multiple payments against invoices in the Gama ERP system. This feature supports partial payments, automatic balance calculation, and invoice status updates based on payment progress. The system integrates with the existing invoice module and finance dashboard to provide comprehensive payment visibility.

## Glossary

- **Payment**: A monetary transaction recorded against an invoice, representing funds received from a customer
- **Invoice**: A billing document issued to customers for services rendered
- **Partial Payment**: A payment that covers only a portion of the invoice total amount
- **Remaining Balance**: The difference between the invoice total amount and the sum of all payments received
- **Payment Method**: The mechanism used to transfer funds (Bank Transfer, Cash, Check, Giro Bilyet)
- **Reference Number**: A unique identifier for the payment transaction (transfer reference, check number, etc.)
- **Amount Paid**: The cumulative sum of all payments recorded against an invoice
- **Giro Bilyet**: A type of payment instrument commonly used in Indonesian banking

## Requirements

### Requirement 1

**User Story:** As a finance user, I want to record payments against invoices, so that I can track customer payment activity and outstanding balances.

#### Acceptance Criteria

1. WHEN a finance user clicks the "Record Payment" button on an invoice detail page THEN the System SHALL display a payment recording dialog with invoice context (invoice number, customer name, remaining balance)
2. WHEN a finance user submits a valid payment record THEN the System SHALL create a new payment entry linked to the invoice with amount, date, method, and optional reference details
3. WHEN a payment is recorded THEN the System SHALL update the invoice's amount_paid field with the cumulative total of all payments
4. WHEN a user attempts to record a payment with an empty amount THEN the System SHALL prevent submission and display a validation error
5. WHEN a user attempts to record a payment exceeding the remaining balance THEN the System SHALL display a warning but allow the payment to proceed (overpayment scenario)

### Requirement 2

**User Story:** As a finance user, I want to view payment history for an invoice, so that I can audit payment activity and verify customer payments.

#### Acceptance Criteria

1. WHEN a user views an invoice detail page THEN the System SHALL display a payments section showing invoice total, amount paid, and remaining balance
2. WHEN payments exist for an invoice THEN the System SHALL display a payment history table with date, amount, method, reference number, and recorded by columns
3. WHEN no payments exist for an invoice THEN the System SHALL display an empty state message indicating no payments recorded
4. WHEN displaying payment amounts THEN the System SHALL format values in Indonesian Rupiah (Rp) with thousand separators

### Requirement 3

**User Story:** As a finance user, I want invoice status to automatically update based on payment progress, so that I can quickly identify payment status without manual updates.

#### Acceptance Criteria

1. WHEN total payments equal or exceed the invoice total amount THEN the System SHALL update the invoice status to "paid" and record the paid_at timestamp
2. WHEN total payments are greater than zero but less than the invoice total THEN the System SHALL update the invoice status to "partial"
3. WHEN a payment is deleted and remaining payments are less than invoice total THEN the System SHALL revert the invoice status from "paid" to "partial" or "sent" as appropriate
4. WHEN invoice status changes THEN the System SHALL reflect the new status in the invoice status badge with appropriate color coding

### Requirement 4

**User Story:** As a finance user, I want a "Pay Full" convenience button, so that I can quickly record full payment of the remaining balance without manual calculation.

#### Acceptance Criteria

1. WHEN a user clicks the "Pay Full" button in the payment dialog THEN the System SHALL auto-populate the amount field with the exact remaining balance
2. WHEN the remaining balance is zero THEN the System SHALL disable the "Pay Full" button
3. WHEN the amount field is auto-populated THEN the System SHALL allow the user to modify the value before submission

### Requirement 5

**User Story:** As a finance manager, I want to see payment statistics on the finance dashboard, so that I can monitor cash flow and payment collection performance.

#### Acceptance Criteria

1. WHEN a finance user views the finance dashboard THEN the System SHALL display a "Partial Payments" card showing count and total value of partially paid invoices
2. WHEN a finance user views the finance dashboard THEN the System SHALL display a "Payments This Month" card showing the sum of payments recorded in the current month
3. WHEN dashboard data is loading THEN the System SHALL display skeleton loading states for payment statistics

### Requirement 6

**User Story:** As a system administrator, I want payment recording restricted to authorized roles, so that only appropriate users can modify financial records.

#### Acceptance Criteria

1. WHEN a user with owner, admin, manager, or finance role accesses payment features THEN the System SHALL allow payment recording and viewing
2. WHEN a user with ops, sales, or viewer role accesses the invoice detail page THEN the System SHALL hide the "Record Payment" button
3. WHEN an unauthorized user attempts to record a payment via direct API call THEN the System SHALL reject the request and return an authorization error

### Requirement 7

**User Story:** As a finance user, I want to specify payment method and bank details, so that I can maintain accurate records for reconciliation purposes.

#### Acceptance Criteria

1. WHEN recording a payment THEN the System SHALL require selection of a payment method from: Bank Transfer, Cash, Check (Cek), Giro Bilyet
2. WHEN "Bank Transfer" is selected as payment method THEN the System SHALL display optional fields for bank name and bank account
3. WHEN recording a payment THEN the System SHALL allow entry of an optional reference number for transaction tracking
4. WHEN recording a payment THEN the System SHALL allow entry of optional notes for additional context
