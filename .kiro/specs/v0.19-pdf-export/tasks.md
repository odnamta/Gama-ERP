# Implementation Plan: PDF Export for Documents

## Overview

This implementation plan covers PDF export functionality for Invoices, Surat Jalan, and Berita Acara documents. Tasks are ordered to build incrementally: utilities first, then reusable components, then document-specific templates, and finally API routes and UI integration.

## Tasks

- [x] 1. Setup and Utilities
  - [x] 1.1 Install @react-pdf/renderer dependency
    - Run `npm install @react-pdf/renderer`
    - _Requirements: 5.1_

  - [x] 1.2 Create lib/pdf/pdf-utils.ts with utility functions
    - Implement getCompanySettings() to fetch company_settings from database
    - Implement formatCurrencyForPDF(amount) for Indonesian Rupiah format
    - Implement formatDateForPDF(dateString) for DD/MM/YYYY format
    - _Requirements: 4.1, 6.3_

  - [x] 1.3 Write unit tests for PDF utility functions
    - Test formatCurrencyForPDF with various amounts
    - Test formatDateForPDF with various date strings
    - **Property 6: Currency Formatting**
    - **Property 7: Date Formatting**
    - **Validates: Requirements 1.8, 1.9, 6.3**

- [x] 2. Reusable PDF Components
  - [x] 2.1 Create lib/pdf/components/pdf-header.tsx
    - Company logo display (if configured)
    - Company name and address
    - Conditional rendering based on logo_url presence
    - _Requirements: 4.2, 4.3_

  - [x] 2.2 Create lib/pdf/components/pdf-footer.tsx
    - "Thank you for your business" message
    - Positioned at bottom of page
    - _Requirements: 6.5_

  - [x] 2.3 Create lib/pdf/components/signature-block.tsx
    - Signature line with label
    - Configurable width and label text
    - _Requirements: 2.9, 3.8_

  - [x] 2.4 Create lib/pdf/styles/common-styles.ts
    - Define shared StyleSheet for all PDF templates
    - Page, header, table, footer styles as per design
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [x] 3. Checkpoint - Reusable components complete
  - Ensure all reusable PDF components are created and styled correctly.

- [x] 4. Invoice PDF Template
  - [x] 4.1 Create lib/pdf/invoice-pdf.tsx
    - Company header with logo
    - Invoice details (number, date, due date)
    - Customer billing information
    - JO reference and term description
    - Line items table with columns: Description, Qty, Unit, Price, Amount
    - Totals section: Subtotal, VAT (11%), Grand Total
    - Bank payment details
    - Footer message
    - _Requirements: 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 1.10_

  - [x] 4.2 Write property test for invoice total calculation
    - **Property 3: Invoice Total Calculation**
    - Verify grand_total = subtotal + tax_amount
    - Verify tax_amount = subtotal × 0.11
    - **Validates: Requirements 1.9**

- [x] 5. Invoice PDF API Route
  - [x] 5.1 Create app/api/pdf/invoice/[id]/route.ts
    - Fetch invoice with customer, job_order, and line_items relations
    - Fetch company settings
    - Generate PDF using renderToBuffer
    - Handle download query parameter for Content-Disposition
    - Return 404 if invoice not found
    - _Requirements: 1.2, 1.3, 5.1, 5.2, 5.3, 5.4_

  - [x] 5.2 Write property test for PDF response headers
    - **Property 1: PDF Content-Type Header**
    - **Property 2: PDF Disposition Header**
    - **Validates: Requirements 5.2, 5.3, 5.4**

- [x] 6. Checkpoint - Invoice PDF complete
  - Test invoice PDF generation manually, verify all content displays correctly.

- [x] 7. Surat Jalan PDF Template
  - [x] 7.1 Create lib/pdf/surat-jalan-pdf.tsx
    - Company header with logo
    - SJ number and delivery date
    - Origin and destination addresses
    - Vehicle and driver information (plate, name, phone)
    - Cargo details (description, quantity, unit, weight)
    - Signature blocks for sender and receiver
    - Footer message
    - _Requirements: 2.4, 2.5, 2.6, 2.7, 2.8, 2.9_

- [x] 8. Surat Jalan PDF API Route
  - [x] 8.1 Create app/api/pdf/surat-jalan/[id]/route.ts
    - Fetch surat_jalan with job_order relation
    - Fetch company settings
    - Generate PDF using renderToBuffer
    - Handle download query parameter
    - Return 404 if not found
    - _Requirements: 2.2, 2.3_

- [x] 9. Berita Acara PDF Template
  - [x] 9.1 Create lib/pdf/berita-acara-pdf.tsx
    - Company header with logo
    - BA number and handover date
    - Location and work description
    - Cargo condition status and notes
    - Signature blocks for company and client representatives
    - Photo gallery section (if photos exist)
    - Footer message
    - _Requirements: 3.4, 3.5, 3.6, 3.7, 3.8, 3.9_

- [x] 10. Berita Acara PDF API Route
  - [x] 10.1 Create app/api/pdf/berita-acara/[id]/route.ts
    - Fetch berita_acara with job_order and customer relations
    - Fetch company settings
    - Generate PDF using renderToBuffer
    - Handle download query parameter
    - Return 404 if not found
    - _Requirements: 3.2, 3.3_

- [x] 11. Checkpoint - All PDF templates complete
  - Test all three PDF types manually, verify content and formatting.

- [x] 12. UI Integration
  - [x] 12.1 Create components/pdf/pdf-buttons.tsx
    - View PDF button (opens in new tab)
    - Download PDF button (triggers download)
    - Accept documentType and documentId props
    - _Requirements: 1.1, 2.1, 3.1_

  - [x] 12.2 Add PDF buttons to Invoice detail page
    - Import and add PDFButtons component to invoice detail view
    - _Requirements: 1.1_

  - [x] 12.3 Add PDF buttons to Surat Jalan detail page
    - Import and add PDFButtons component to surat-jalan-detail-view.tsx
    - _Requirements: 2.1_

  - [x] 12.4 Add PDF buttons to Berita Acara detail page
    - Import and add PDFButtons component to berita-acara-detail-view.tsx
    - _Requirements: 3.1_

- [x] 13. Write property test for required fields presence
  - **Property 5: Required Fields Presence**
  - Verify Invoice PDF contains all required fields
  - Verify Surat Jalan PDF contains all required fields
  - Verify Berita Acara PDF contains all required fields
  - **Validates: Requirements 1.5-1.10, 2.5-2.9, 3.5-3.9**

- [x] 14. Write property test for company header
  - **Property 4: Company Header Presence**
  - Verify company_name is always present
  - Verify logo is included when logo_url is configured
  - **Validates: Requirements 4.1, 4.2, 4.3**

- [x] 15. Final Checkpoint
  - All PDF types generate correctly
  - View and Download buttons work on all detail pages
  - Company branding displays correctly
  - All tests pass

## Notes

- All tasks are required for completion
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- @react-pdf/renderer is used for server-side PDF generation
- API routes use Next.js App Router route handlers
