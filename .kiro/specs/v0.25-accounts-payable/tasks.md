# Implementation Plan: Accounts Payable Module (v0.25)

## Overview

This implementation plan covers the Accounts Payable module for tracking vendor invoices and payments. The implementation follows the existing patterns in the codebase (BKK, payments, vendors modules) and builds incrementally from database schema to UI components.

## Tasks

- [x] 1. Database Schema Setup
  - [x] 1.1 Create vendor_invoices and vendor_payments tables with migration
    - Create tables with all columns as specified in design
    - Add indexes for vendor_id, jo_id, bkk_id, status, due_date
    - Create sequence and trigger for auto-generating internal_ref (VI-YYYY-NNNNN)
    - Add vendor_invoice_id column to bukti_kas_keluar table
    - _Requirements: 1.1, 1.2, 7.1_
  - [x] 1.2 Create RLS policies for vendor_invoices and vendor_payments
    - View policies for owner, admin, manager, finance roles
    - Insert/update policies for owner, admin, finance roles
    - Delete policies for owner, admin roles
    - _Requirements: 9.3, 9.4, 9.5, 9.6, 9.7_

- [x] 2. Types and Utilities
  - [x] 2.1 Create types/vendor-invoices.ts with all type definitions
    - VendorInvoiceStatus, ExpenseCategory types
    - VendorInvoice, VendorInvoiceWithRelations interfaces
    - VendorPayment, VendorPaymentWithRecorder interfaces
    - Form data types, APSummary, APAgingBuckets, VerificationResult
    - Filter state interface
    - _Requirements: 8.1_
  - [x] 2.2 Create lib/vendor-invoice-utils.ts with utility functions
    - generateInternalRef, parseInternalRef, isValidInternalRef
    - calculateDefaultDueDate (30 days from invoice date)
    - isOverdue, isDueSoon, getDaysUntilDue
    - calculateVariance, isWithinTolerance (2% threshold)
    - calculateRemainingBalance, calculateTotalPaid
    - determineVendorInvoiceStatus
    - validatePaymentAmount, isValidPaymentMethod
    - getStatusDisplayInfo, getExpenseCategoryLabel
    - calculateAgingBucket
    - _Requirements: 1.3, 3.6, 3.7, 5.1, 5.2, 5.3, 7.3, 7.4, 12.3_
  - [x] 2.3 Write property tests for vendor-invoice-utils
    - **Property 1: Internal Reference Format Validity**
    - **Property 2: Default Due Date Calculation**
    - **Property 3: Total Amount Calculation Invariant**
    - **Property 8: Overdue Detection**
    - **Property 9: Due Soon Detection**
    - **Property 11: Variance Calculation**
    - **Property 12: Verification Status Determination**
    - **Property 20: Aging Bucket Calculation**
    - **Validates: Requirements 1.2, 1.3, 1.4, 3.6, 3.7, 5.1, 5.2, 5.3, 12.3**

- [x] 3. Checkpoint - Database and utilities ready
  - Ensure migration applied successfully
  - Ensure all utility tests pass
  - Ask the user if questions arise

- [x] 4. Server Actions - Core CRUD
  - [x] 4.1 Create app/(main)/finance/vendor-invoices/actions.ts with CRUD operations
    - generateInternalRefAction - generate unique reference
    - createVendorInvoice - create with validation, auto-generate ref, link BKK
    - updateVendorInvoice - update with validation
    - deleteVendorInvoice - only if status is 'received'
    - getVendorInvoices - with filters (status, vendor, pjo, jo, aging, date range)
    - getVendorInvoiceById - with relations
    - _Requirements: 1.1, 1.2, 1.4, 1.5, 1.6, 1.7, 3.1, 3.3, 3.4, 3.5, 11.1, 11.2_
  - [x] 4.2 Write property tests for CRUD actions (32 tests passing)
    - **Property 4: Invoice Creation Data Integrity**
    - **Property 5: BKK Bidirectional Linking**
    - **Property 6: Invoice List Ordering**
    - **Property 7: Filter Results Correctness**
    - **Property 18: Flexible Job Reference Linking**
    - **Property 21: Aging Filter Correctness**
    - **Validates: Requirements 1.1, 1.5, 1.6, 1.7, 2.1, 3.1, 3.3, 3.4, 3.5, 10.2, 11.1, 11.2, 12.5**

- [x] 5. Server Actions - Verification and Approval
  - [x] 5.1 Add verification and approval actions
    - verifyVendorInvoice - 3-way match, set verified/disputed status
    - approveVendorInvoice - only from verified status
    - disputeVendorInvoice - flag for review with reason
    - getMatchingBKKs - find BKKs for vendor and JO/PJO
    - _Requirements: 5.2, 5.3, 5.4, 6.1, 6.2, 6.3, 10.1_
  - [x] 5.2 Write property tests for verification and approval
    - **Property 13: Verification Metadata Recording**
    - **Property 14: Approval Status Transition**
    - **Property 16: Matching BKK Query**
    - **Validates: Requirements 5.4, 6.1, 6.2, 6.3, 10.1**

- [x] 6. Server Actions - Payments and Summary
  - [x] 6.1 Add payment and summary actions
    - recordVendorPayment - create payment, update invoice amount_paid and status
    - getVendorPayments - get payments for invoice with recorder details
    - deleteVendorPayment - delete and recalculate invoice status
    - getAPSummary - calculate summary statistics
    - getAPSummaryWithAging - summary with aging buckets
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 4.1, 4.2, 4.3, 4.4, 4.5, 12.3_
  - [x] 6.2 Write property tests for payments and summary
    - **Property 10: AP Summary Calculation**
    - **Property 15: Payment Recording and Status Update**
    - **Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5, 7.1, 7.2, 7.3, 7.4**

- [x] 7. Server Actions - PJO Conversion Integration
  - [x] 7.1 Add updateVendorInvoiceJOReference action
    - Update jo_id for all vendor invoices linked to a PJO when converted to JO
    - Maintain pjo_id reference
    - _Requirements: 11.3_
  - [x] 7.2 Integrate with PJO conversion flow
    - Call updateVendorInvoiceJOReference in conversion-actions.ts
    - _Requirements: 11.3_
  - [x] 7.3 Write property test for PJO conversion linkage
    - **Property 19: PJO to JO Conversion Linkage**
    - **Validates: Requirements 11.3**

- [x] 8. Checkpoint - Server actions complete
  - Ensure all server action tests pass
  - Verify RLS policies work correctly
  - Ask the user if questions arise

- [x] 9. UI Components - Status Badge and Summary
  - [x] 9.1 Create components/ui/vendor-invoice-status-badge.tsx
    - Display status with appropriate colors
    - Handle all status values
    - _Requirements: 8.1_
  - [x] 9.2 Create components/vendor-invoices/vendor-invoice-summary.tsx
    - Summary cards: total unpaid, due today, overdue, paid MTD, pending verification
    - Aging buckets display
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 12.3_

- [x] 10. UI Components - List and Filters
  - [x] 10.1 Create components/vendor-invoices/vendor-invoice-filters.tsx
    - Status filter dropdown
    - Vendor filter dropdown
    - PJO/JO filter dropdowns
    - Aging bucket filter
    - Date range picker
    - Search input
    - _Requirements: 3.3, 3.4, 3.5, 11.5, 12.5_
  - [x] 10.2 Create components/vendor-invoices/vendor-invoice-table.tsx
    - Display internal ref, vendor, invoice number, description, amount, due date, status
    - Overdue and due soon indicators
    - Action buttons (view, verify, pay)
    - Pagination
    - _Requirements: 3.1, 3.2, 3.6, 3.7_
  - [x] 10.3 Create components/vendor-invoices/vendor-invoice-list.tsx
    - Combine summary, filters, and table
    - Handle loading and empty states
    - _Requirements: 3.1_

- [x] 11. UI Components - Forms
  - [x] 11.1 Create components/vendor-invoices/vendor-invoice-form.tsx
    - Vendor selection with search
    - Invoice details (number, dates, amounts)
    - JO/PJO selection with BKK matching
    - Document upload
    - Expense category selection
    - _Requirements: 1.1, 1.6, 1.7, 2.1, 10.1, 11.1_
  - [x] 11.2 Create components/vendor-invoices/vendor-payment-form.tsx
    - Payment amount, date, method
    - Reference number, bank details
    - Payment proof upload
    - _Requirements: 7.1, 7.5_

- [x] 12. UI Components - Detail View
  - [x] 12.1 Create components/vendor-invoices/verification-section.tsx
    - 3-way match display (BKK amount vs invoice amount)
    - Variance calculation and display
    - Verify/Dispute buttons
    - _Requirements: 5.1, 5.5_
  - [x] 12.2 Create components/vendor-invoices/vendor-payment-history.tsx
    - List of payments with details
    - Delete payment option
    - _Requirements: 7.6_
  - [x] 12.3 Create components/vendor-invoices/vendor-invoice-detail-view.tsx
    - Invoice details section
    - Verification section
    - Payment status and history
    - Action buttons (edit, approve, record payment)
    - _Requirements: 2.3, 5.5, 7.6, 10.3_

- [x] 13. Checkpoint - UI components ready
  - Ensure all components render correctly
  - Test form validation
  - Ask the user if questions arise

- [x] 14. Pages and Navigation
  - [x] 14.1 Create app/(main)/finance/vendor-invoices/page.tsx
    - List page with summary, filters, table
    - "Record Invoice" button
    - _Requirements: 3.1, 4.1_
  - [x] 14.2 Create app/(main)/finance/vendor-invoices/new/page.tsx
    - New vendor invoice form page
    - _Requirements: 1.1_
  - [x] 14.3 Create app/(main)/finance/vendor-invoices/[id]/page.tsx
    - Detail view page
    - _Requirements: 2.3, 5.5, 7.6_
  - [x] 14.4 Update navigation to include Vendor Invoices under Finance
    - Add menu item with badge for pending verification count
    - _Requirements: 9.1, 9.2_

- [x] 15. Permission Integration
  - [x] 15.1 Add vendor invoice permissions to lib/permissions.ts
    - canViewVendorInvoices
    - canCreateVendorInvoice
    - canEditVendorInvoice
    - canApproveVendorInvoice
    - canRecordVendorPayment
    - canDeleteVendorInvoice
    - _Requirements: 9.3, 9.4, 9.5, 9.6, 9.7_
  - [x] 15.2 Apply permission gates in UI components
    - Hide/show actions based on user role
    - _Requirements: 9.7_
  - [x] 15.3 Write property tests for role-based access control
    - **Property 17: Role-Based Access Control**
    - **Validates: Requirements 9.3, 9.4, 9.5, 9.6, 9.7**

- [x] 16. Final Checkpoint - Feature complete
  - Ensure all tests pass (102 tests passing)
  - Verify end-to-end flow works
  - Test permission restrictions
  - Ask the user if questions arise

## Notes

- All tasks including tests are required for comprehensive coverage
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- The implementation follows existing patterns from BKK, payments, and vendors modules
