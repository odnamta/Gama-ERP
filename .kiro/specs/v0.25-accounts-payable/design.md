# Design Document: Accounts Payable Module (v0.25)

## Overview

The Accounts Payable module enables tracking of vendor invoices (what the company owes vendors) to complete the payment cycle and calculate true profitability. This module bridges the gap between BKK (cash disbursement) and actual vendor billing, providing a complete financial picture.

The module follows existing patterns in the codebase, particularly mirroring the payment tracking system used for customer invoices but adapted for vendor invoices (accounts payable vs accounts receivable).

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Accounts Payable Module                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                  │
│  │   UI Layer   │    │   Actions    │    │   Database   │                  │
│  │              │    │   (Server)   │    │   (Supabase) │                  │
│  ├──────────────┤    ├──────────────┤    ├──────────────┤                  │
│  │ List Page    │───▶│ CRUD Actions │───▶│vendor_invoices│                  │
│  │ Detail Page  │    │ Payment Acts │    │vendor_payments│                  │
│  │ Forms        │    │ Verification │    │ (+ BKK link) │                  │
│  │ Summary Cards│    │ Summary Calc │    │              │                  │
│  └──────────────┘    └──────────────┘    └──────────────┘                  │
│         │                   │                   │                           │
│         └───────────────────┴───────────────────┘                           │
│                             │                                               │
│                    ┌────────▼────────┐                                      │
│                    │   Utilities     │                                      │
│                    │ vendor-invoice- │                                      │
│                    │    utils.ts     │                                      │
│                    └─────────────────┘                                      │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Integration Points

1. **Vendors Module**: Links vendor invoices to existing vendors
2. **Job Orders Module**: Associates vendor invoices with JOs for cost tracking
3. **BKK Module**: Links vendor invoices to cash disbursements for 3-way matching
4. **Navigation**: Adds "Vendor Invoices" under Finance section in sidebar

## Components and Interfaces

### Types (types/vendor-invoices.ts)

```typescript
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
 * Vendor Invoice record
 */
export interface VendorInvoice {
  id: string;
  invoice_number: string;      // Vendor's invoice number
  internal_ref: string;        // Auto-generated: VI-YYYY-NNNNN
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
  amount_due: number;          // Computed: total_amount - amount_paid
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
    bank_name?: string;
    bank_account?: string;
    tax_id?: string;
  };
  job_order?: {
    id: string;
    jo_number: string;
  };
  bkk?: {
    id: string;
    bkk_number: string;
    amount_spent: number;
  };
  verifier?: {
    id: string;
    full_name: string;
  };
  approver?: {
    id: string;
    full_name: string;
  };
}

/**
 * Vendor Payment record
 */
export interface VendorPayment {
  id: string;
  vendor_invoice_id: string;
  payment_date: string;
  amount: number;
  payment_method: 'transfer' | 'cash' | 'check' | 'giro';
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
    full_name: string;
  };
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
  payment_method: 'transfer' | 'cash' | 'check' | 'giro';
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
  current: number;      // Not yet due
  days1to30: number;    // 1-30 days overdue
  days31to60: number;   // 31-60 days overdue
  days61to90: number;   // 61-90 days overdue
  days90plus: number;   // 90+ days overdue
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
  pjoId: string | 'all';      // Filter by PJO
  joId: string | 'all';       // Filter by JO
  agingBucket: 'all' | 'current' | '1-30' | '31-60' | '61-90' | '90+';
  dateFrom: string | null;
  dateTo: string | null;
}
```

### Utility Functions (lib/vendor-invoice-utils.ts)

```typescript
/**
 * Generate internal reference number
 * Format: VI-YYYY-NNNNN
 */
export function generateInternalRef(year: number, sequence: number): string;

/**
 * Parse internal reference to extract year and sequence
 */
export function parseInternalRef(ref: string): { year: number; sequence: number } | null;

/**
 * Validate internal reference format
 */
export function isValidInternalRef(ref: string): boolean;

/**
 * Calculate default due date (30 days from invoice date)
 */
export function calculateDefaultDueDate(invoiceDate: string): string;

/**
 * Check if invoice is overdue
 */
export function isOverdue(dueDate: string | null, status: VendorInvoiceStatus): boolean;

/**
 * Check if invoice is due soon (within 7 days)
 */
export function isDueSoon(dueDate: string | null, status: VendorInvoiceStatus): boolean;

/**
 * Calculate days until due (negative if overdue)
 */
export function getDaysUntilDue(dueDate: string | null): number | null;

/**
 * Calculate 3-way match variance
 */
export function calculateVariance(bkkAmount: number, invoiceAmount: number): {
  variance: number;
  variancePercent: number;
  withinTolerance: boolean;
};

/**
 * Determine if variance is within acceptable tolerance (2%)
 */
export function isWithinTolerance(variancePercent: number): boolean;

/**
 * Calculate remaining balance
 */
export function calculateRemainingBalance(totalAmount: number, amountPaid: number): number;

/**
 * Calculate total paid from payments array
 */
export function calculateTotalPaid(payments: { amount: number }[]): number;

/**
 * Determine invoice status based on payment progress
 */
export function determineVendorInvoiceStatus(
  totalAmount: number,
  amountPaid: number,
  currentStatus: VendorInvoiceStatus
): VendorInvoiceStatus;

/**
 * Validate payment amount
 */
export function validatePaymentAmount(amount: number | undefined | null): {
  isValid: boolean;
  error?: string;
};

/**
 * Check if payment method is valid
 */
export function isValidPaymentMethod(method: string | undefined | null): boolean;

/**
 * Get status display info (color, label)
 */
export function getStatusDisplayInfo(status: VendorInvoiceStatus): {
  bg: string;
  text: string;
  label: string;
};

/**
 * Get expense category label
 */
export function getExpenseCategoryLabel(category: ExpenseCategory): string;

/**
 * Format currency for display (Indonesian Rupiah)
 */
export function formatCurrency(amount: number): string;
```

### Server Actions (app/(main)/finance/vendor-invoices/actions.ts)

```typescript
/**
 * Generate unique internal reference for current year
 */
export async function generateInternalRefAction(): Promise<string>;

/**
 * Create a new vendor invoice
 */
export async function createVendorInvoice(
  data: VendorInvoiceFormData
): Promise<{ id?: string; error?: string }>;

/**
 * Update an existing vendor invoice
 */
export async function updateVendorInvoice(
  id: string,
  data: Partial<VendorInvoiceFormData>
): Promise<{ error?: string }>;

/**
 * Delete a vendor invoice (only if status is 'received')
 */
export async function deleteVendorInvoice(
  id: string
): Promise<{ error?: string }>;

/**
 * Get vendor invoices with filters
 */
export async function getVendorInvoices(
  filters: VendorInvoiceFilterState
): Promise<VendorInvoiceWithRelations[]>;

/**
 * Get a single vendor invoice by ID
 */
export async function getVendorInvoiceById(
  id: string
): Promise<VendorInvoiceWithRelations | null>;

/**
 * Verify vendor invoice (3-way match)
 */
export async function verifyVendorInvoice(
  id: string,
  notes?: string
): Promise<{ result?: VerificationResult; error?: string }>;

/**
 * Approve vendor invoice for payment
 */
export async function approveVendorInvoice(
  id: string
): Promise<{ error?: string }>;

/**
 * Flag vendor invoice as disputed
 */
export async function disputeVendorInvoice(
  id: string,
  reason: string
): Promise<{ error?: string }>;

/**
 * Record payment against vendor invoice
 */
export async function recordVendorPayment(
  data: VendorPaymentFormData
): Promise<{ id?: string; error?: string }>;

/**
 * Get payments for a vendor invoice
 */
export async function getVendorPayments(
  vendorInvoiceId: string
): Promise<VendorPaymentWithRecorder[]>;

/**
 * Delete a vendor payment
 */
export async function deleteVendorPayment(
  paymentId: string
): Promise<{ error?: string }>;

/**
 * Get AP summary statistics
 */
export async function getAPSummary(): Promise<APSummary>;

/**
 * Get AP summary with aging buckets
 */
export async function getAPSummaryWithAging(): Promise<APSummaryWithAging>;

/**
 * Get matching BKKs for a vendor and JO/PJO
 */
export async function getMatchingBKKs(
  vendorId: string,
  joId?: string,
  pjoId?: string
): Promise<{ id: string; bkk_number: string; amount_spent: number }[]>;

/**
 * Update vendor invoice JO reference when PJO is converted to JO
 */
export async function updateVendorInvoiceJOReference(
  pjoId: string,
  joId: string
): Promise<{ error?: string }>;

/**
 * Calculate aging bucket for a due date
 */
export function calculateAgingBucket(dueDate: string | null): 'current' | '1-30' | '31-60' | '61-90' | '90+';
```

### UI Components

```
components/vendor-invoices/
├── vendor-invoice-list.tsx        # Main list with filters and pagination
├── vendor-invoice-table.tsx       # Table component
├── vendor-invoice-form.tsx        # Create/edit form
├── vendor-invoice-detail-view.tsx # Detail page content
├── vendor-invoice-filters.tsx     # Filter controls
├── vendor-invoice-summary.tsx     # Summary cards (AP dashboard)
├── verification-section.tsx       # 3-way match display
├── vendor-payment-form.tsx        # Payment recording dialog
├── vendor-payment-history.tsx     # Payment history list
└── index.ts                       # Barrel exports

components/ui/
└── vendor-invoice-status-badge.tsx # Status badge component
```

## Data Models

### Database Schema

```sql
-- Vendor invoices table
CREATE TABLE vendor_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identification
  invoice_number VARCHAR(100) NOT NULL,
  internal_ref VARCHAR(50) UNIQUE,
  
  -- Vendor reference
  vendor_id UUID NOT NULL REFERENCES vendors(id),
  
  -- Job references
  jo_id UUID REFERENCES job_orders(id),
  pjo_id UUID REFERENCES proforma_job_orders(id),
  bkk_id UUID REFERENCES bukti_kas_keluar(id),
  
  -- Dates
  invoice_date DATE NOT NULL,
  received_date DATE DEFAULT CURRENT_DATE,
  due_date DATE,
  
  -- Details
  description TEXT,
  expense_category VARCHAR(50),
  
  -- Amounts
  subtotal DECIMAL(15,2) NOT NULL,
  tax_amount DECIMAL(15,2) DEFAULT 0,
  total_amount DECIMAL(15,2) NOT NULL,
  amount_paid DECIMAL(15,2) DEFAULT 0,
  amount_due DECIMAL(15,2) GENERATED ALWAYS AS (total_amount - amount_paid) STORED,
  
  -- Status
  status VARCHAR(20) DEFAULT 'received',
  
  -- Verification
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES user_profiles(id),
  verification_notes TEXT,
  
  -- Approval
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES user_profiles(id),
  
  -- Document
  document_url VARCHAR(500),
  
  -- Metadata
  notes TEXT,
  created_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vendor payments table
CREATE TABLE vendor_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_invoice_id UUID NOT NULL REFERENCES vendor_invoices(id) ON DELETE CASCADE,
  
  -- Payment details
  payment_date DATE NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  payment_method VARCHAR(30) NOT NULL,
  reference_number VARCHAR(100),
  
  -- Bank details
  bank_name VARCHAR(100),
  bank_account VARCHAR(50),
  
  -- Proof
  proof_url VARCHAR(500),
  
  -- Metadata
  notes TEXT,
  created_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add vendor_invoice_id to BKK table
ALTER TABLE bukti_kas_keluar
ADD COLUMN IF NOT EXISTS vendor_invoice_id UUID REFERENCES vendor_invoices(id);

-- Indexes
CREATE INDEX idx_vendor_invoices_vendor ON vendor_invoices(vendor_id);
CREATE INDEX idx_vendor_invoices_jo ON vendor_invoices(jo_id);
CREATE INDEX idx_vendor_invoices_bkk ON vendor_invoices(bkk_id);
CREATE INDEX idx_vendor_invoices_status ON vendor_invoices(status);
CREATE INDEX idx_vendor_invoices_due_date ON vendor_invoices(due_date);
CREATE INDEX idx_vendor_payments_invoice ON vendor_payments(vendor_invoice_id);

-- Sequence for internal reference
CREATE SEQUENCE IF NOT EXISTS vendor_invoice_seq START 1;

-- Trigger for auto-generating internal reference
CREATE OR REPLACE FUNCTION generate_vendor_invoice_ref()
RETURNS TRIGGER AS $$
BEGIN
  NEW.internal_ref := 'VI-' || TO_CHAR(NOW(), 'YYYY') || '-' || 
                      LPAD(NEXTVAL('vendor_invoice_seq')::TEXT, 5, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_vendor_invoice_ref
BEFORE INSERT ON vendor_invoices
FOR EACH ROW
EXECUTE FUNCTION generate_vendor_invoice_ref();
```

### RLS Policies

```sql
-- Enable RLS
ALTER TABLE vendor_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_payments ENABLE ROW LEVEL SECURITY;

-- Vendor invoices policies
CREATE POLICY "Users can view vendor invoices based on role"
ON vendor_invoices FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.user_id = auth.uid()
    AND user_profiles.role IN ('owner', 'admin', 'manager', 'finance')
  )
);

CREATE POLICY "Finance and admin can insert vendor invoices"
ON vendor_invoices FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.user_id = auth.uid()
    AND user_profiles.role IN ('owner', 'admin', 'finance')
  )
);

CREATE POLICY "Finance and admin can update vendor invoices"
ON vendor_invoices FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.user_id = auth.uid()
    AND user_profiles.role IN ('owner', 'admin', 'finance')
  )
);

CREATE POLICY "Admin can delete vendor invoices"
ON vendor_invoices FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.user_id = auth.uid()
    AND user_profiles.role IN ('owner', 'admin')
  )
);

-- Vendor payments policies
CREATE POLICY "Users can view vendor payments based on role"
ON vendor_payments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.user_id = auth.uid()
    AND user_profiles.role IN ('owner', 'admin', 'manager', 'finance')
  )
);

CREATE POLICY "Finance and admin can insert vendor payments"
ON vendor_payments FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.user_id = auth.uid()
    AND user_profiles.role IN ('owner', 'admin', 'finance')
  )
);
```



## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Internal Reference Format Validity

*For any* vendor invoice created in the system, the auto-generated internal_ref SHALL match the pattern `VI-YYYY-NNNNN` where YYYY is the 4-digit year and NNNNN is a 5-digit zero-padded sequence number.

**Validates: Requirements 1.2**

### Property 2: Default Due Date Calculation

*For any* vendor invoice created without an explicit due_date, the system SHALL set due_date to exactly 30 days after the invoice_date.

**Validates: Requirements 1.3**

### Property 3: Total Amount Calculation Invariant

*For any* vendor invoice, the total_amount SHALL always equal subtotal + tax_amount.

**Validates: Requirements 1.4**

### Property 4: Invoice Creation Data Integrity

*For any* valid vendor invoice form data submitted, the created invoice record SHALL contain all provided fields (vendor_id, invoice_number, dates, amounts, jo_id, bkk_id, document_url) with matching values, and the initial status SHALL be 'received'.

**Validates: Requirements 1.1, 1.5, 1.6, 2.1**

### Property 5: BKK Bidirectional Linking

*For any* vendor invoice linked to a BKK, both the vendor_invoice.bkk_id SHALL reference the BKK AND the BKK.vendor_invoice_id SHALL reference the vendor invoice.

**Validates: Requirements 1.7, 10.2**

### Property 6: Invoice List Ordering

*For any* list of vendor invoices returned by the system, the invoices SHALL be ordered by due_date in ascending order (earliest due date first).

**Validates: Requirements 3.1**

### Property 7: Filter Results Correctness

*For any* filter applied to the vendor invoices list:
- If status filter is applied, all returned invoices SHALL have the matching status
- If vendor filter is applied, all returned invoices SHALL have the matching vendor_id
- If date range filter is applied, all returned invoices SHALL have invoice_date within the specified range (inclusive)

**Validates: Requirements 3.3, 3.4, 3.5**

### Property 8: Overdue Detection

*For any* vendor invoice with a due_date before today and status not in ('paid', 'cancelled'), the isOverdue function SHALL return true; otherwise it SHALL return false.

**Validates: Requirements 3.6**

### Property 9: Due Soon Detection

*For any* vendor invoice with a due_date within 7 days from today (inclusive) and status not in ('paid', 'cancelled', 'overdue'), the isDueSoon function SHALL return true; otherwise it SHALL return false.

**Validates: Requirements 3.7**

### Property 10: AP Summary Calculation

*For any* set of vendor invoices and payments:
- totalUnpaid SHALL equal the sum of amount_due for all invoices where status is not 'paid' or 'cancelled'
- dueToday SHALL equal the sum of amount_due for invoices where due_date equals today and status is not 'paid' or 'cancelled'
- overdue SHALL equal the sum of amount_due for invoices where due_date is before today and status is not 'paid' or 'cancelled'
- paidMTD SHALL equal the sum of payment amounts where payment_date is within the current month
- pendingVerification SHALL equal the count of invoices where status is 'received'

**Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5**

### Property 11: Variance Calculation

*For any* vendor invoice linked to a BKK, the variance SHALL equal (invoice.total_amount - bkk.amount_spent) and variancePercent SHALL equal (variance / bkk.amount_spent) * 100.

**Validates: Requirements 5.1**

### Property 12: Verification Status Determination

*For any* vendor invoice verification:
- If |variancePercent| <= 2, the status SHALL be set to 'verified'
- If |variancePercent| > 2, the status SHALL be set to 'disputed'

**Validates: Requirements 5.2, 5.3**

### Property 13: Verification Metadata Recording

*For any* vendor invoice that undergoes verification, the verified_at timestamp SHALL be set to the current time, verified_by SHALL be set to the verifying user's ID, and verification_notes SHALL contain any provided notes.

**Validates: Requirements 5.4**

### Property 14: Approval Status Transition

*For any* vendor invoice approval attempt:
- If current status is 'verified', the status SHALL be updated to 'approved' with approved_at and approved_by set
- If current status is not 'verified', the approval SHALL be rejected with an error

**Validates: Requirements 6.1, 6.2, 6.3**

### Property 15: Payment Recording and Status Update

*For any* payment recorded against a vendor invoice:
- The invoice's amount_paid SHALL increase by the payment amount
- If amount_paid >= total_amount, status SHALL be 'paid'
- If 0 < amount_paid < total_amount, status SHALL be 'partial'

**Validates: Requirements 7.1, 7.2, 7.3, 7.4**

### Property 16: Matching BKK Query

*For any* query for matching BKKs given a vendor_id and optional jo_id, all returned BKKs SHALL have the matching vendor_id AND (if jo_id provided) the matching jo_id.

**Validates: Requirements 10.1**

### Property 17: Role-Based Access Control

*For any* user attempting to access vendor invoices:
- Users with role in ('owner', 'admin', 'manager', 'finance') SHALL be allowed to view
- Users with role in ('ops', 'sales') SHALL be denied access
- Users with role in ('owner', 'admin', 'finance') SHALL be allowed to create, edit, and record payments
- Users with role in ('owner', 'admin', 'manager') SHALL be allowed to approve invoices
- Users without appropriate permissions SHALL receive an access denied error

**Validates: Requirements 9.3, 9.4, 9.5, 9.6, 9.7**

### Property 18: Flexible Job Reference Linking

*For any* vendor invoice, the system SHALL allow linking to:
- Only a PJO (pjo_id set, jo_id null) for pre-execution costs
- Only a JO (jo_id set, pjo_id may be null or set) for execution/post-execution costs
- Both PJO and JO when the PJO has been converted to JO

**Validates: Requirements 11.1, 11.2**

### Property 19: PJO to JO Conversion Linkage

*For any* PJO that is converted to a JO, all vendor invoices linked to that PJO SHALL have their jo_id updated to reference the new JO while maintaining the pjo_id reference.

**Validates: Requirements 11.3**

### Property 20: Aging Bucket Calculation

*For any* vendor invoice with a due_date:
- If due_date >= today, aging bucket SHALL be 'current'
- If due_date is 1-30 days before today, aging bucket SHALL be '1-30'
- If due_date is 31-60 days before today, aging bucket SHALL be '31-60'
- If due_date is 61-90 days before today, aging bucket SHALL be '61-90'
- If due_date is more than 90 days before today, aging bucket SHALL be '90+'

**Validates: Requirements 12.3**

### Property 21: Aging Filter Correctness

*For any* aging bucket filter applied to the vendor invoices list, all returned invoices SHALL have their calculated aging bucket matching the filter value.

**Validates: Requirements 12.5**

## Error Handling

### Validation Errors

| Error Condition | Error Message | HTTP Status |
|-----------------|---------------|-------------|
| Missing vendor_id | "Vendor is required" | 400 |
| Missing invoice_number | "Vendor invoice number is required" | 400 |
| Missing invoice_date | "Invoice date is required" | 400 |
| Invalid subtotal (<=0) | "Subtotal must be greater than zero" | 400 |
| Invalid tax_amount (<0) | "Tax amount cannot be negative" | 400 |
| Invalid payment amount (<=0) | "Payment amount must be greater than zero" | 400 |
| Invalid payment method | "Invalid payment method selected" | 400 |
| Duplicate invoice_number for vendor | "Invoice number already exists for this vendor" | 409 |

### Business Logic Errors

| Error Condition | Error Message | HTTP Status |
|-----------------|---------------|-------------|
| Approve non-verified invoice | "Cannot approve invoice that is not verified" | 400 |
| Delete non-received invoice | "Can only delete invoices in 'received' status" | 400 |
| Record payment on cancelled invoice | "Cannot record payment for cancelled invoice" | 400 |
| Verify invoice without BKK link | "Cannot verify invoice without linked BKK" | 400 |

### Permission Errors

| Error Condition | Error Message | HTTP Status |
|-----------------|---------------|-------------|
| Unauthorized view | "You do not have permission to view vendor invoices" | 403 |
| Unauthorized create | "You do not have permission to create vendor invoices" | 403 |
| Unauthorized approve | "You do not have permission to approve vendor invoices" | 403 |
| Unauthorized payment | "You do not have permission to record payments" | 403 |
| Not authenticated | "You must be logged in to perform this action" | 401 |

## Testing Strategy

### Unit Tests

Unit tests will focus on utility functions and edge cases:

1. **vendor-invoice-utils.ts**
   - `generateInternalRef()` - format validation
   - `parseInternalRef()` - parsing edge cases
   - `calculateDefaultDueDate()` - date calculation
   - `isOverdue()` - boundary conditions (today, yesterday, tomorrow)
   - `isDueSoon()` - 7-day boundary
   - `calculateVariance()` - positive/negative/zero variance
   - `isWithinTolerance()` - 2% boundary
   - `determineVendorInvoiceStatus()` - all status transitions
   - `validatePaymentAmount()` - validation edge cases

2. **Permission checks**
   - Role-based access for each action
   - Edge cases for role combinations

### Property-Based Tests

Property-based tests will use **fast-check** library with minimum 100 iterations per test.

Each property test will be tagged with:
```typescript
// Feature: accounts-payable, Property N: [Property Title]
// Validates: Requirements X.Y
```

**Test Configuration:**
- Framework: Vitest with fast-check
- Minimum iterations: 100
- Generators: Custom generators for VendorInvoice, VendorPayment, dates, amounts

**Generator Strategy:**
- Generate valid vendor invoice data with realistic constraints
- Generate payment amounts within invoice total bounds
- Generate dates within reasonable ranges (past year to next year)
- Generate variance percentages around the 2% boundary

### Integration Tests

Integration tests will verify end-to-end flows:

1. **Invoice Lifecycle**
   - Create → Verify → Approve → Pay → Paid status
   - Create → Verify (fail) → Disputed status

2. **BKK Integration**
   - Create invoice linked to BKK
   - Verify bidirectional linking
   - 3-way match verification

3. **Payment Flow**
   - Single full payment
   - Multiple partial payments
   - Payment deletion and status recalculation

### Test File Structure

```
__tests__/
├── vendor-invoice-utils.test.ts      # Unit tests for utilities
├── vendor-invoice-actions.test.ts    # Server action tests
├── vendor-invoice-permissions.test.ts # Permission tests
└── vendor-invoice-properties.test.ts  # Property-based tests
```
