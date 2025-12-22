# Requirements Document

## Introduction

This feature provides customizable templates for common customs-related documents including packing lists, commercial invoices, and certificates. Users can create, customize, and generate documents from templates with automatic data population from PIB/PEB records.

## Glossary

- **Template**: A reusable HTML document structure with placeholders for dynamic data
- **Placeholder**: A variable marker in templates (e.g., `{{shipper_name}}`) that gets replaced with actual data
- **PIB**: Pemberitahuan Impor Barang (Import Declaration Document)
- **PEB**: Pemberitahuan Ekspor Barang (Export Declaration Document)
- **Generated_Document**: A finalized document created from a template with filled data
- **Document_Type**: Category of customs document (packing_list, commercial_invoice, coo, insurance_cert, bill_of_lading, shipping_instruction, cargo_manifest)

## Requirements

### Requirement 1: Template Management

**User Story:** As an admin, I want to manage document templates, so that I can customize the format and content of customs documents.

#### Acceptance Criteria

1. THE Template_Manager SHALL display a list of all available document templates with name, type, and status
2. WHEN an admin creates a new template, THE Template_Manager SHALL require template code, name, document type, and HTML content
3. WHEN an admin edits a template, THE Template_Manager SHALL allow modification of HTML content, placeholders, and paper settings
4. THE Template_Manager SHALL support document types: packing_list, commercial_invoice, coo, insurance_cert, bill_of_lading, shipping_instruction, cargo_manifest
5. WHEN a template is deactivated, THE Template_Manager SHALL set is_active to false and hide it from generation options
6. THE Template_Manager SHALL enforce unique template codes across all templates

### Requirement 2: Placeholder System

**User Story:** As an admin, I want to define placeholders in templates, so that documents can be automatically populated with data from PIB/PEB records.

#### Acceptance Criteria

1. THE Placeholder_System SHALL support placeholder syntax using double curly braces (e.g., `{{field_name}}`)
2. WHEN defining a placeholder, THE Placeholder_System SHALL require key, label, and source specification
3. THE Placeholder_System SHALL support data sources: pib fields, peb fields, pib_items array, peb_items array, manual input, current_date
4. WHEN a placeholder source is 'manual', THE Document_Generator SHALL prompt the user to enter the value
5. THE Placeholder_System SHALL support array placeholders for repeating item rows using `{{#items}}...{{/items}}` syntax
6. WHEN a placeholder value is not found, THE Document_Generator SHALL display an empty string or placeholder indicator

### Requirement 3: Document Generation

**User Story:** As a user, I want to generate customs documents from templates, so that I can quickly create properly formatted documents with accurate data.

#### Acceptance Criteria

1. WHEN a user selects a template and source document (PIB/PEB), THE Document_Generator SHALL auto-fill placeholders from the source data
2. THE Document_Generator SHALL allow manual override of any auto-filled value before generation
3. WHEN generating a document, THE Document_Generator SHALL display a preview before finalizing
4. THE Document_Generator SHALL assign a unique document number using format: TYPE-YYYYMMDD-NNNN
5. WHEN a document is generated, THE Document_Generator SHALL store the filled data in document_data JSONB field
6. THE Document_Generator SHALL support linking generated documents to PIB, PEB, or Job Order records

### Requirement 4: PDF Output

**User Story:** As a user, I want to export generated documents as PDF, so that I can print or share them with external parties.

#### Acceptance Criteria

1. WHEN a user requests PDF export, THE PDF_Generator SHALL render the HTML template with filled data to PDF format
2. THE PDF_Generator SHALL respect paper size settings (A4, Letter) from the template
3. THE PDF_Generator SHALL respect orientation settings (portrait, landscape) from the template
4. WHEN include_company_header is true, THE PDF_Generator SHALL include the company logo and header in the output
5. THE PDF_Generator SHALL store the generated PDF URL in the pdf_url field
6. WHEN a user downloads a PDF, THE PDF_Generator SHALL provide the file with a descriptive filename

### Requirement 5: Document Status Management

**User Story:** As a user, I want to manage document status, so that I can track which documents are drafts, finalized, or archived.

#### Acceptance Criteria

1. THE Document_Manager SHALL support statuses: draft, final, sent, archived
2. WHEN a document is created, THE Document_Manager SHALL set initial status to 'draft'
3. WHEN a user finalizes a document, THE Document_Manager SHALL change status to 'final' and prevent further edits to document_data
4. WHEN a document is marked as sent, THE Document_Manager SHALL record the sent status
5. WHEN a document is archived, THE Document_Manager SHALL hide it from active document lists but retain for historical reference
6. THE Document_Manager SHALL display document history with status changes and timestamps

### Requirement 6: Default Templates

**User Story:** As a system administrator, I want pre-configured default templates, so that users can immediately generate common customs documents.

#### Acceptance Criteria

1. THE System SHALL provide a default Standard Packing List template (PL-STD) with shipper, consignee, items, and weight fields
2. THE System SHALL provide a default Standard Commercial Invoice template (CI-STD) with seller, buyer, items, and value fields
3. WHEN the system initializes, THE Migration SHALL insert default templates if they do not exist
4. THE Default_Templates SHALL include properly configured placeholders with source mappings to PIB/PEB fields
5. WHEN a default template is customized, THE System SHALL preserve the original as a separate template version

### Requirement 7: Template Editor

**User Story:** As an admin, I want a visual template editor, so that I can customize document layouts without writing raw HTML.

#### Acceptance Criteria

1. THE Template_Editor SHALL provide an HTML code editor with syntax highlighting
2. THE Template_Editor SHALL display a live preview of the template with sample data
3. WHEN editing placeholders, THE Template_Editor SHALL provide a form interface to add/edit/remove placeholders
4. THE Template_Editor SHALL validate that all placeholders in HTML have corresponding definitions
5. THE Template_Editor SHALL provide paper size and orientation selection controls
6. WHEN saving a template, THE Template_Editor SHALL validate HTML syntax before saving
