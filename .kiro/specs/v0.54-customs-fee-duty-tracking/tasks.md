# Implementation Plan: Customs Fee & Duty Tracking

## Overview

This implementation plan covers the development of the Customs Fee & Duty Tracking module (v0.54) for Gama ERP. The module enables tracking of customs-related fees, duties, and container demurrage with integration to existing PIB/PEB documents and job orders.

## Tasks

- [x] 1. Database Schema Setup
  - [x] 1.1 Create customs_fee_types table with default fee types
    - Create table with fee_code, fee_name, description, fee_category, is_government_fee, is_active, display_order
    - Insert default fee types (BM, PPN, PPH, PPNBM, BK, STORAGE, HANDLING, TRUCKING, FUMIGATION, SURVEYOR, PPJK, PENALTY, DEMURRAGE)
    - Enable RLS with read policy for authenticated users
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [x] 1.2 Create customs_fees table
    - Create table with document_type, pib_id, peb_id, job_order_id, fee_type_id, amount, currency, payment fields
    - Add check constraint for valid document link
    - Create indexes on pib_id, peb_id, job_order_id, payment_status, fee_type_id
    - Enable RLS with CRUD policies for authenticated users
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 3.1-3.6, 4.1-4.5_

  - [x] 1.3 Create container_tracking table
    - Create table with container details, dates, storage calculations
    - Add generated column for free_time_end
    - Create indexes on pib_id, peb_id, job_order_id, status
    - Enable RLS with CRUD policies for authenticated users
    - _Requirements: 5.1-5.9_

  - [x] 1.4 Create database views
    - Create job_customs_costs view for cost aggregation by job
    - Create pending_customs_payments view for pending fees
    - _Requirements: 7.1-7.5, 8.1-8.5_

- [x] 2. TypeScript Types and Utilities
  - [x] 2.1 Create TypeScript type definitions
    - Create types/customs-fees.ts with all interfaces and types
    - Define FeeCategory, PaymentStatus, ContainerStatus enums
    - Define CustomsFeeType, CustomsFee, ContainerTracking interfaces
    - Define form data and filter types
    - _Requirements: 1.2, 3.6, 5.9_

  - [x] 2.2 Implement fee utility functions
    - Implement formatFeeAmount for currency formatting
    - Implement getPaymentStatusVariant for UI badges
    - Implement validateFeeForm for form validation
    - Implement aggregateFeesByCategory for cost breakdown
    - Implement filterFees for list filtering
    - _Requirements: 2.4, 9.2-9.6_

  - [x] 2.3 Write property tests for fee utilities
    - **Property 1: Fee Category Validation**
    - **Property 2: Fee Document Link Validation**
    - **Property 3: Fee Amount Validation**
    - **Property 9: Fee Filtering Correctness**
    - **Validates: Requirements 1.2, 2.1, 2.4, 9.2-9.5**

  - [x] 2.4 Implement container utility functions
    - Implement calculateFreeTimeEnd for date calculation
    - Implement calculateStorageDays for storage calculation
    - Implement calculateStorageFee for fee calculation
    - Implement getFreeTimeStatus for status determination
    - Implement getDaysUntilFreeTimeExpires for countdown
    - Implement validateContainerForm for form validation
    - Implement filterContainers for list filtering
    - _Requirements: 5.5, 5.7, 5.8, 10.2-10.6_

  - [x] 2.5 Write property tests for container utilities
    - **Property 4: Free Time End Calculation**
    - **Property 5: Storage Days Calculation**
    - **Property 6: Storage Fee Calculation**
    - **Property 7: Free Time Status Determination**
    - **Property 12: Container Status Validation**
    - **Validates: Requirements 5.5, 5.7, 5.8, 5.9, 10.3, 10.4**

- [x] 3. Server Actions
  - [x] 3.1 Implement fee type actions
    - Implement getFeeTypes to fetch all active fee types
    - Implement getFeeTypesByCategory for filtered fetch
    - _Requirements: 1.5, 1.6_

  - [x] 3.2 Implement fee CRUD actions
    - Implement createFee with validation and permission check
    - Implement updateFee with validation and permission check
    - Implement deleteFee with permission check
    - Implement getFee for single fee fetch with relations
    - Implement getFees for list fetch with filtering
    - Implement getFeesByDocument for document-specific fees
    - Implement getFeesByJob for job-specific fees
    - _Requirements: 2.1-2.6, 9.1-9.6, 11.1-11.6_

  - [x] 3.3 Implement payment actions
    - Implement markFeePaid with payment data capture
    - Implement markFeeWaived for waived fees
    - Implement cancelFee for cancelled fees
    - _Requirements: 6.1-6.6_

  - [x] 3.4 Write property tests for fee aggregation
    - **Property 8: Job Cost Aggregation Consistency**
    - **Property 10: Pending Payments View Correctness**
    - **Property 11: Payment Status Transition**
    - **Validates: Requirements 6.1, 6.5, 7.1, 7.2, 7.4, 8.1, 8.4**

  - [x] 3.5 Implement container CRUD actions
    - Implement createContainer with validation
    - Implement updateContainer with validation
    - Implement deleteContainer with permission check
    - Implement getContainer for single container fetch
    - Implement getContainers for list fetch with filtering
    - Implement getContainersByDocument for document-specific containers
    - _Requirements: 5.1-5.6, 10.1, 10.5_

  - [x] 3.6 Implement container status actions
    - Implement updateContainerStatus for status transitions
    - Implement calculateContainerStorage for storage calculation
    - _Requirements: 5.7, 5.8, 5.9_

  - [x] 3.7 Implement summary actions
    - Implement getJobCustomsCosts for single job summary
    - Implement getAllJobCustomsCosts for all jobs summary
    - Implement getPendingPayments for pending fees list
    - Implement getFeeStatistics for dashboard stats
    - Implement getContainerStatistics for container stats
    - _Requirements: 7.1-7.5, 8.1-8.5_

- [x] 4. Checkpoint - Core functionality complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. UI Components - Fee Management
  - [x] 5.1 Create fee type select component
    - Create fee-type-select.tsx dropdown component
    - Fetch fee types and group by category
    - Support filtering by category
    - _Requirements: 1.5, 2.3_

  - [x] 5.2 Create fee form component
    - Create fee-form.tsx for creating/editing fees
    - Include document type selection (PIB/PEB)
    - Include document selector based on type
    - Include fee type selector
    - Include amount and currency fields
    - Include vendor selector for service fees
    - Include notes field
    - _Requirements: 2.1-2.6, 4.1, 4.2_

  - [x] 5.3 Create fee list component
    - Create fee-list.tsx for displaying fees
    - Show fee type, amount, status, linked document
    - Include action buttons (edit, delete, mark paid)
    - Support sorting and pagination
    - _Requirements: 9.1_

  - [x] 5.4 Create fee filters component
    - Create fee-filters.tsx for filter controls
    - Include document type filter
    - Include fee category filter
    - Include payment status filter
    - Include date range filter
    - Include search input
    - _Requirements: 9.2-9.6_

  - [x] 5.5 Create payment dialog component
    - Create payment-dialog.tsx for recording payments
    - Include payment date picker
    - Include payment reference input
    - Include payment method selector
    - Include NTPN/NTB fields for government fees
    - Include receipt upload
    - _Requirements: 3.1-3.5, 6.1-6.5_

  - [x] 5.6 Create fee summary cards component
    - Create fee-summary-cards.tsx for statistics
    - Show total fees count
    - Show pending amount
    - Show paid amount
    - _Requirements: 8.2_

- [x] 6. UI Components - Container Tracking
  - [x] 6.1 Create container form component
    - Create container-form.tsx for creating/editing containers
    - Include container number, size, type fields
    - Include document selector (PIB/PEB)
    - Include terminal and dates fields
    - Include free time days and daily rate
    - _Requirements: 5.1-5.4, 5.6_

  - [x] 6.2 Create container list component
    - Create container-list.tsx for displaying containers
    - Show container number, status, location, dates
    - Show free time remaining with visual indicator
    - Show storage fees for containers past free time
    - Include action buttons (edit, delete, update status)
    - _Requirements: 10.1, 10.2, 10.6_

  - [x] 6.3 Create free time indicator component
    - Create free-time-indicator.tsx for visual status
    - Show days remaining or days overdue
    - Use color coding (green/yellow/red)
    - _Requirements: 10.2, 10.3, 10.4_

  - [x] 6.4 Create container status badge component
    - Create container-status-badge.tsx for status display
    - Support all container statuses with appropriate colors
    - _Requirements: 5.9_

  - [x] 6.5 Create storage calculator component
    - Create storage-calculator.tsx for fee calculation
    - Show storage days calculation
    - Show daily rate and total fee
    - _Requirements: 5.7, 5.8_

- [x] 7. UI Components - Cost Summary
  - [x] 7.1 Create job cost summary component
    - Create job-cost-summary.tsx for cost breakdown
    - Show costs by category (duties, taxes, services, storage, penalties)
    - Show total customs cost
    - Show paid vs pending breakdown
    - _Requirements: 7.1-7.5_

  - [x] 7.2 Create pending payments list component
    - Create pending-payments-list.tsx for pending fees
    - Show fee type, amount, linked document
    - Include quick action to mark as paid
    - Order by creation date
    - _Requirements: 8.1-8.5_

  - [x] 7.3 Create cost breakdown chart component
    - Create cost-breakdown-chart.tsx for visual breakdown
    - Show pie/bar chart of costs by category
    - _Requirements: 12.1_

- [x] 8. Page Implementation
  - [x] 8.1 Create customs fees list page
    - Create app/(main)/customs/fees/page.tsx
    - Include summary cards at top
    - Include filters and fee list
    - Include "Add Fee" button
    - _Requirements: 9.1-9.6_

  - [x] 8.2 Create new fee page
    - Create app/(main)/customs/fees/new/page.tsx
    - Include fee form component
    - Handle form submission and redirect
    - _Requirements: 2.1-2.6_

  - [x] 8.3 Create fee detail/edit page
    - Create app/(main)/customs/fees/[id]/page.tsx
    - Show fee details with edit capability
    - Include payment dialog for pending fees
    - _Requirements: 6.1-6.6_

  - [x] 8.4 Create containers list page
    - Create app/(main)/customs/containers/page.tsx
    - Include container statistics cards
    - Include filters and container list
    - Highlight containers approaching/past free time
    - _Requirements: 10.1-10.6_

  - [x] 8.5 Create pending payments page
    - Create app/(main)/customs/fees/pending/page.tsx
    - Show all pending payments
    - Include quick payment actions
    - _Requirements: 8.1-8.5_

- [x] 9. Integration with Existing Modules
  - [x] 9.1 Add fees section to PIB detail view
    - Add fees tab/section to PIB detail page
    - Show fees linked to the PIB
    - Allow adding new fees from PIB context
    - _Requirements: 2.1_

  - [x] 9.2 Add fees section to PEB detail view
    - Add fees tab/section to PEB detail page
    - Show fees linked to the PEB
    - Allow adding new fees from PEB context
    - _Requirements: 2.1_

  - [x] 9.3 Add containers section to PIB detail view
    - Add containers tab/section to PIB detail page
    - Show containers linked to the PIB
    - Allow adding new containers from PIB context
    - _Requirements: 5.2_

  - [x] 9.4 Add customs costs to job order view
    - Add customs cost summary to job order detail
    - Show breakdown by category
    - Link to full fee list for the job
    - _Requirements: 7.1-7.5_

  - [x] 9.5 Update navigation
    - Add "Fees" and "Containers" links under Customs menu
    - Add "Pending Payments" link for finance users
    - _Requirements: 11.1-11.6_

- [x] 10. Final Checkpoint
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- All tasks including property tests are required for comprehensive coverage
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
