# Requirements Document

## Introduction

This document specifies the requirements for PDF export functionality in Gama ERP. The feature enables users to generate professional PDF documents for Invoices, Surat Jalan, Berita Acara, and PJO Quotations. PDFs include company branding, proper formatting, and all relevant document data for printing and sharing with clients.

## Glossary

- **PDF Export**: The process of generating a downloadable/viewable PDF file from document data
- **Invoice PDF**: A formatted invoice document with company header, line items, totals, and bank details
- **Surat Jalan PDF**: A delivery note document with route, vehicle, driver, and cargo information
- **Berita Acara PDF**: A handover report with work description, cargo condition, and signature spaces
- **PJO Quotation PDF**: A quotation document with revenue items and pricing (future enhancement)
- **Company Settings**: Configuration data including company name, address, logo, and bank details

## Requirements

### Requirement 1

**User Story:** As an admin user, I want to generate Invoice PDFs, so that I can send professional invoices to clients for payment.

#### Acceptance Criteria

1. WHEN viewing an invoice detail page THEN the System SHALL display "View PDF" and "Download PDF" buttons
2. WHEN a user clicks "View PDF" THEN the System SHALL open the generated PDF in a new browser tab
3. WHEN a user clicks "Download PDF" THEN the System SHALL download the PDF file with filename format `{invoice_number}.pdf`
4. WHEN generating an Invoice PDF THEN the System SHALL include company header with logo (if configured), company name, and address
5. WHEN generating an Invoice PDF THEN the System SHALL include invoice number, invoice date, and due date
6. WHEN generating an Invoice PDF THEN the System SHALL include customer billing information (name, address)
7. WHEN generating an Invoice PDF THEN the System SHALL include JO reference number and term description
8. WHEN generating an Invoice PDF THEN the System SHALL include a table of line items with description, quantity, unit, unit price, and subtotal
9. WHEN generating an Invoice PDF THEN the System SHALL include subtotal, VAT amount (11%), and grand total
10. WHEN generating an Invoice PDF THEN the System SHALL include bank payment details (bank name, account number, account name)

### Requirement 2

**User Story:** As an operations user, I want to generate Surat Jalan PDFs, so that I can provide delivery notes to drivers and recipients.

#### Acceptance Criteria

1. WHEN viewing a Surat Jalan detail page THEN the System SHALL display "View PDF" and "Download PDF" buttons
2. WHEN a user clicks "View PDF" THEN the System SHALL open the generated PDF in a new browser tab
3. WHEN a user clicks "Download PDF" THEN the System SHALL download the PDF file with filename format `{sj_number}.pdf`
4. WHEN generating a Surat Jalan PDF THEN the System SHALL include company header with logo and company information
5. WHEN generating a Surat Jalan PDF THEN the System SHALL include SJ number and delivery date
6. WHEN generating a Surat Jalan PDF THEN the System SHALL include origin and destination addresses
7. WHEN generating a Surat Jalan PDF THEN the System SHALL include vehicle plate number, driver name, and driver phone
8. WHEN generating a Surat Jalan PDF THEN the System SHALL include cargo description, quantity, unit, and weight
9. WHEN generating a Surat Jalan PDF THEN the System SHALL include signature spaces for sender and receiver

### Requirement 3

**User Story:** As an operations user, I want to generate Berita Acara PDFs, so that I can provide formal handover reports to clients.

#### Acceptance Criteria

1. WHEN viewing a Berita Acara detail page THEN the System SHALL display "View PDF" and "Download PDF" buttons
2. WHEN a user clicks "View PDF" THEN the System SHALL open the generated PDF in a new browser tab
3. WHEN a user clicks "Download PDF" THEN the System SHALL download the PDF file with filename format `{ba_number}.pdf`
4. WHEN generating a Berita Acara PDF THEN the System SHALL include company header with logo and company information
5. WHEN generating a Berita Acara PDF THEN the System SHALL include BA number and handover date
6. WHEN generating a Berita Acara PDF THEN the System SHALL include location and work description
7. WHEN generating a Berita Acara PDF THEN the System SHALL include cargo condition status and condition notes
8. WHEN generating a Berita Acara PDF THEN the System SHALL include signature spaces for company and client representatives
9. WHEN generating a Berita Acara PDF THEN the System SHALL include attached photos (if any) in a gallery section

### Requirement 4

**User Story:** As a developer, I want PDF generation to use company settings, so that all documents have consistent branding.

#### Acceptance Criteria

1. WHEN generating any PDF THEN the System SHALL fetch company settings from the company_settings table
2. WHEN company logo is configured THEN the System SHALL display the logo in the PDF header
3. WHEN company logo is not configured THEN the System SHALL display only the company name in the header
4. WHEN generating Invoice PDFs THEN the System SHALL use bank details from company settings

### Requirement 5

**User Story:** As a developer, I want PDF generation to be server-side, so that PDFs can be generated reliably without client-side dependencies.

#### Acceptance Criteria

1. WHEN a PDF is requested THEN the System SHALL generate the PDF on the server using @react-pdf/renderer
2. WHEN a PDF is generated THEN the System SHALL return the PDF with appropriate Content-Type header (application/pdf)
3. WHEN viewing a PDF THEN the System SHALL set Content-Disposition to inline for browser display
4. WHEN downloading a PDF THEN the System SHALL set Content-Disposition to attachment with the filename

### Requirement 6

**User Story:** As a user, I want PDF documents to be properly formatted, so that they look professional when printed.

#### Acceptance Criteria

1. WHEN generating any PDF THEN the System SHALL use A4 page size (210mm x 297mm)
2. WHEN generating any PDF THEN the System SHALL use consistent margins (40pt)
3. WHEN generating any PDF THEN the System SHALL use readable font sizes (10pt body, 12pt headers, 24pt titles)
4. WHEN generating tables THEN the System SHALL use alternating row backgrounds for readability
5. WHEN generating any PDF THEN the System SHALL include page footer with "Thank you for your business" or similar message
