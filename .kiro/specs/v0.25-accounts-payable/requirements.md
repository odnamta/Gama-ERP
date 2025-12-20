# Requirements Document

## Introduction

This document defines the requirements for the Accounts Payable module (v0.25) in Gama ERP. The module enables tracking of vendor invoices (what the company owes vendors) to complete the payment cycle and calculate true profitability. Currently, the system tracks BKK (cash disbursement) but does not track the actual vendor invoices received, creating a gap in the financial workflow.

**Current Flow (Incomplete):**
```
JO → BKK Request → Cash Released → Actual Spent → ???
                                                    ↑
                                        Vendor invoice not tracked!
```

**Complete Flow (After v0.25):**
```
JO → BKK Request → Cash Released → Vendor Invoice Received → Payment → Reconciled
                                            ↓
                                    True cost recorded
                                            ↓
                                    Profitability calculated
```

## Glossary

- **Vendor_Invoice**: A bill received from a vendor for goods or services rendered, containing the vendor's invoice number, amounts, and payment terms
- **Internal_Ref**: Auto-generated internal reference number for vendor invoices (format: VI-YYYY-NNNNN)
- **BKK**: Bukti Kas Keluar - Cash disbursement voucher used to release funds for operational expenses
- **Three_Way_Match**: Verification process comparing BKK amount, receipt/delivery confirmation, and vendor invoice amount
- **Vendor_Payment**: A payment record against a vendor invoice, supporting partial or full payment
- **AP_Summary**: Aggregated statistics showing total unpaid, due today, overdue, paid MTD, and pending verification counts
- **Expense_Category**: Classification of vendor invoice expenses (trucking, shipping, port, handling, fuel, toll, permit, crew, equipment, overhead, other)
- **Variance**: The difference between BKK amount and vendor invoice amount, used for verification
- **Finance_User**: A user with the finance role who can manage vendor invoices and payments
- **System**: The Gama ERP Accounts Payable module

## Requirements

### Requirement 1: Vendor Invoice Creation

**User Story:** As a finance user, I want to record vendor invoices received from vendors, so that I can track what the company owes and manage payments.

#### Acceptance Criteria

1. WHEN a finance user submits a new vendor invoice form, THE System SHALL create a vendor invoice record with the provided vendor, invoice number, dates, and amounts
2. WHEN a vendor invoice is created, THE System SHALL auto-generate an internal reference number in format VI-YYYY-NNNNN
3. WHEN a vendor invoice is created without a due date, THE System SHALL default the due date to 30 days from the invoice date
4. WHEN a vendor invoice is created, THE System SHALL calculate total_amount as subtotal plus tax_amount
5. WHEN a vendor invoice is created, THE System SHALL set the initial status to 'received'
6. WHEN a vendor invoice is linked to a JO, THE System SHALL store the jo_id reference
7. WHEN a vendor invoice is linked to a BKK, THE System SHALL store the bkk_id reference and update the BKK record with the vendor_invoice_id

### Requirement 2: Vendor Invoice Document Management

**User Story:** As a finance user, I want to upload scanned vendor invoices, so that I have digital records for verification and audit purposes.

#### Acceptance Criteria

1. WHEN a finance user uploads a document during invoice creation, THE System SHALL store the document URL with the vendor invoice record
2. WHEN a document is uploaded, THE System SHALL accept PDF, JPG, and PNG formats up to 5MB
3. WHEN viewing a vendor invoice detail, THE System SHALL display the uploaded document with view and download options

### Requirement 3: Vendor Invoice Listing and Filtering

**User Story:** As a finance user, I want to view and filter vendor invoices, so that I can manage accounts payable efficiently.

#### Acceptance Criteria

1. WHEN a finance user accesses the vendor invoices page, THE System SHALL display a paginated list of vendor invoices ordered by due date ascending
2. WHEN viewing the list, THE System SHALL display internal ref, vendor name, vendor invoice number, description, amount, due date, and status for each invoice
3. WHEN a finance user applies a status filter, THE System SHALL show only invoices matching the selected status
4. WHEN a finance user applies a vendor filter, THE System SHALL show only invoices from the selected vendor
5. WHEN a finance user applies a date range filter, THE System SHALL show only invoices within the specified date range
6. WHEN an invoice is overdue, THE System SHALL highlight it with a visual indicator
7. WHEN an invoice is due within 7 days, THE System SHALL display a "due soon" indicator

### Requirement 4: AP Summary Dashboard

**User Story:** As a finance user, I want to see a summary of accounts payable status, so that I can quickly understand the company's payment obligations.

#### Acceptance Criteria

1. WHEN a finance user views the vendor invoices page, THE System SHALL display summary cards showing total unpaid amount
2. WHEN displaying the summary, THE System SHALL show the amount due today
3. WHEN displaying the summary, THE System SHALL show the total overdue amount with a warning indicator
4. WHEN displaying the summary, THE System SHALL show the total paid amount for the current month (MTD)
5. WHEN displaying the summary, THE System SHALL show the count of invoices pending verification

### Requirement 5: Three-Way Match Verification

**User Story:** As a finance user, I want to verify vendor invoices against BKK amounts, so that I can ensure accuracy before approving payment.

#### Acceptance Criteria

1. WHEN a vendor invoice is linked to a BKK, THE System SHALL calculate the variance between BKK amount and invoice total
2. WHEN the variance is within 2% tolerance, THE System SHALL allow auto-verification with status 'verified'
3. WHEN the variance exceeds 2% tolerance, THE System SHALL flag the invoice as 'disputed' and require manual review
4. WHEN a finance user verifies an invoice, THE System SHALL record the verification timestamp, user, and notes
5. WHEN viewing invoice details, THE System SHALL display the 3-way match comparison showing BKK amount, invoice amount, and variance percentage

### Requirement 6: Vendor Invoice Approval

**User Story:** As a manager, I want to approve verified vendor invoices for payment, so that I can authorize disbursements.

#### Acceptance Criteria

1. WHEN a manager approves a verified vendor invoice, THE System SHALL update the status to 'approved'
2. WHEN approving an invoice, THE System SHALL record the approval timestamp and approving user
3. IF an invoice is not in 'verified' status, THEN THE System SHALL prevent approval

### Requirement 7: Payment Recording

**User Story:** As a finance user, I want to record payments against vendor invoices, so that I can track payment status and outstanding amounts.

#### Acceptance Criteria

1. WHEN a finance user records a payment, THE System SHALL create a payment record with amount, date, method, and reference number
2. WHEN a payment is recorded, THE System SHALL update the vendor invoice amount_paid total
3. WHEN the total payments equal or exceed the invoice total, THE System SHALL update the invoice status to 'paid'
4. WHEN partial payment is made, THE System SHALL update the invoice status to 'partial'
5. WHEN recording a payment, THE System SHALL allow upload of payment proof document
6. WHEN viewing invoice details, THE System SHALL display the payment history with all recorded payments

### Requirement 8: Vendor Invoice Status Management

**User Story:** As a finance user, I want vendor invoice statuses to reflect the current state, so that I can track the payment lifecycle.

#### Acceptance Criteria

1. THE System SHALL support the following statuses: received, verified, approved, partial, paid, disputed, cancelled
2. WHEN an invoice is created, THE System SHALL set status to 'received'
3. WHEN an invoice passes verification, THE System SHALL set status to 'verified'
4. WHEN an invoice fails verification, THE System SHALL set status to 'disputed'
5. WHEN an invoice is approved, THE System SHALL set status to 'approved'
6. WHEN partial payment is made, THE System SHALL set status to 'partial'
7. WHEN full payment is made, THE System SHALL set status to 'paid'

### Requirement 9: Navigation and Access Control

**User Story:** As a user, I want appropriate access to the accounts payable module based on my role, so that sensitive financial data is protected.

#### Acceptance Criteria

1. THE System SHALL display "Vendor Invoices" menu item under the Finance section in the sidebar
2. WHEN there are invoices pending verification, THE System SHALL display a badge count on the menu item
3. WHEN an owner, admin, manager, or finance user accesses vendor invoices, THE System SHALL allow viewing
4. WHEN an ops or sales user attempts to access vendor invoices, THE System SHALL deny access
5. WHEN a finance user or admin creates, edits, or records payments, THE System SHALL allow the action
6. WHEN a manager or owner approves an invoice, THE System SHALL allow the action
7. IF a user without appropriate permissions attempts a restricted action, THEN THE System SHALL display an access denied message

### Requirement 10: BKK Integration

**User Story:** As a finance user, I want to link vendor invoices to existing BKK records, so that I can reconcile disbursements with actual vendor bills.

#### Acceptance Criteria

1. WHEN creating a vendor invoice and selecting a JO, THE System SHALL display matching BKK records for that JO and vendor
2. WHEN a vendor invoice is linked to a BKK, THE System SHALL update the BKK record with the vendor_invoice_id
3. WHEN viewing a vendor invoice linked to a BKK, THE System SHALL display the BKK reference and amount for comparison

### Requirement 11: Flexible Job Reference

**User Story:** As a finance user, I want to link vendor invoices to either PJO or JO, so that I can track costs at any stage of the project lifecycle.

#### Acceptance Criteria

1. WHEN creating a vendor invoice, THE System SHALL allow linking to either a PJO (during project planning) or a JO (during/after execution)
2. WHEN a vendor invoice is linked to a PJO only, THE System SHALL track it as a pre-execution cost
3. WHEN a PJO is converted to JO, THE System SHALL maintain the vendor invoice linkage by updating the jo_id reference
4. WHEN viewing vendor invoices, THE System SHALL display the linked PJO number, JO number, or both as applicable
5. WHEN filtering vendor invoices by job, THE System SHALL allow filtering by either PJO or JO reference

### Requirement 12: Payment Aging and Due Date Management

**User Story:** As a finance user, I want to manage vendor payment terms flexibly, so that I can handle both immediate payments and deferred payments based on vendor agreements.

#### Acceptance Criteria

1. WHEN creating a vendor invoice, THE System SHALL allow setting custom payment terms (due date)
2. WHEN a vendor invoice has payment terms beyond project delivery, THE System SHALL track it as an aged payable
3. WHEN viewing the AP summary, THE System SHALL show aging buckets (current, 1-30 days, 31-60 days, 61-90 days, 90+ days)
4. WHEN a vendor invoice approaches its due date, THE System SHALL include it in the "due soon" indicator
5. WHEN generating reports, THE System SHALL allow filtering by aging bucket
