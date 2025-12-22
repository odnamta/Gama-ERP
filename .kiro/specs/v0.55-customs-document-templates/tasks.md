# Implementation Plan: Customs Document Templates

## Overview

This implementation plan covers the v0.55 Customs Document Templates feature, which provides customizable templates for generating customs-related documents with automatic data population from PIB/PEB records.

## Tasks

- [x] 1. Database Setup and Types
  - [x] 1.1 Create database migration for customs_document_templates and generated_customs_documents tables
    - Create tables with all columns as specified in design
    - Add sequence for auto-numbering
    - Create trigger for document number generation
    - Add indexes for performance
    - Insert default templates (PL-STD, CI-STD)
    - _Requirements: 6.1, 6.2, 6.3_
  - [x] 1.2 Create TypeScript types for templates and generated documents
    - Define DocumentType, PaperSize, Orientation, GeneratedDocumentStatus types
    - Define PlaceholderDefinition interface
    - Define CustomsDocumentTemplate and GeneratedCustomsDocument interfaces
    - Define form data types
    - _Requirements: 1.4, 2.3, 5.1_

- [x] 2. Template Utility Functions
  - [x] 2.1 Implement extractPlaceholders function
    - Parse HTML to find all {{key}} patterns
    - Handle array markers {{#items}}...{{/items}}
    - Return unique list of placeholder keys
    - _Requirements: 2.1_
  - [x] 2.2 Implement validatePlaceholders function
    - Compare placeholders in HTML with definitions
    - Return missing and unused placeholders
    - _Requirements: 7.4_
  - [x] 2.3 Implement fillTemplate function
    - Replace simple {{key}} placeholders with values
    - Expand array blocks for repeating items
    - Handle missing values with empty strings
    - _Requirements: 2.1, 2.5, 2.6_
  - [x] 2.4 Implement resolvePlaceholders function
    - Map placeholder sources to PIB/PEB fields
    - Handle pib_items and peb_items arrays
    - Support manual and current_date sources
    - _Requirements: 3.1_
  - [x] 2.5 Implement validation utility functions
    - validateTemplateHtml for HTML syntax
    - validateTemplateFormData for required fields
    - validatePlaceholderDefinition for placeholder fields
    - generateDocumentNumber for number format
    - _Requirements: 1.2, 2.2, 3.4, 7.6_
  - [x] 2.6 Write property tests for template utilities
    - Property 5: Template Filling Correctness**
    - Property 6: Placeholder Resolution from Source Data
    - Property 7: Document Number Format Compliance**
    - Property 11: Placeholder-Definition Consistency**
    - Validates: Requirements 2.1, 2.5, 2.6, 3.1, 3.4, 7.4**

- [x] 3. Checkpoint - Verify utility functions
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Server Actions for Templates
  - [x] 4.1 Implement createTemplate action
    - Validate required fields
    - Check unique template_code
    - Insert into database
    - _Requirements: 1.2, 1.6_
  - [x] 4.2 Implement updateTemplate action
    - Validate template exists
    - Update allowed fields
    - _Requirements: 1.3_
  - [x] 4.3 Implement deactivateTemplate action
    - Set is_active to false
    - _Requirements: 1.5_
  - [x] 4.4 Implement getTemplates and getTemplateById functions
    - Filter by document_type and is_active
    - Include placeholder definitions
    - _Requirements: 1.1, 1.5_
  - [x] 4.5 Write property tests for template actions
    - Property 1: Template Validation Requires All Mandatory Fields
    - Property 3: Valid Enum Values Enforcement** (document_type)
    - Property 4: Unique Template Codes**
    - Property 12: Deactivated Templates Hidden from Generation
    - Validates: Requirements 1.2, 1.4, 1.5, 1.6**

- [x] 5. Server Actions for Document Generation
  - [x] 5.1 Implement generateDocument action
    - Validate template exists and is active
    - Resolve placeholders from source
    - Create document with draft status
    - Auto-generate document number
    - _Requirements: 3.1, 3.4, 3.5, 5.2_
  - [x] 5.2 Implement updateDocumentStatus action
    - Validate status transitions
    - Prevent edits to finalized documents
    - _Requirements: 5.3, 5.4_
  - [x] 5.3 Implement getGeneratedDocuments function
    - Filter by status, template, source
    - Exclude archived from active list
    - Include relations
    - _Requirements: 5.5_
  - [x] 5.4 Write property tests for document actions
    - Property 8: Initial Document Status is Draft**
    - Property 9: Finalized Documents are Immutable**
    - Property 10: Archived Documents Excluded from Active List
    - _Requirements 5.2, 5.3, 5.5

- [x] 6. Checkpoint - Verify server actions
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Template Management UI Components
  - [x] 7.1 Create TemplateList component
    - Display templates in table/card format
    - Filter by document type
    - Show status badge (active/inactive)
    - Actions: edit, deactivate
    - _Requirements: 1.1_
  - [x] 7.2 Create TemplateForm component
    - Form fields for all template properties
    - Document type select
    - Paper size and orientation selects
    - _Requirements: 1.2, 1.3_
  - [x] 7.3 Create PlaceholderEditor component
    - Add/edit/remove placeholder definitions
    - Source type select with field mapping
    - Validate placeholder keys
    - _Requirements: 2.2, 2.3_
  - [x] 7.4 Create TemplateEditor component with preview
    - HTML code editor (textarea with monospace font)
    - Live preview panel with sample data
    - Placeholder validation indicator
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 8. Document Generation UI Components
  - [x] 8.1 Create DocumentGeneratorDialog component
    - Template selection dropdown
    - Source selection (PIB/PEB/JO)
    - Auto-fill preview
    - Manual override form
    - _Requirements: 3.1, 3.2, 3.3_
  - [x] 8.2 Create DocumentDataForm component
    - Dynamic form based on placeholder definitions
    - Pre-filled values from source
    - Editable fields for manual override
    - _Requirements: 2.4, 3.2_
  - [x] 8.3 Create DocumentPreview component
    - Render filled HTML template
    - Show in iframe or sanitized div
    - _Requirements: 3.3_

- [x] 9. Generated Document Management UI
  - [x] 9.1 Create GeneratedDocumentList component
    - Display documents with number, template, source, status
    - Filter by status and template type
    - Actions: view, finalize, download PDF
    - _Requirements: 5.1, 5.5_
  - [x] 9.2 Create DocumentDetailView component
    - Show document preview
    - Status badge and history
    - Action buttons based on status
    - _Requirements: 5.6_
  - [x] 9.3 Create DocumentStatusBadge component
    - Color-coded status display
    - _Requirements: 5.1_

- [x] 10. PDF Generation
  - [x] 10.1 Implement generatePdf server action
    - Use existing PDF infrastructure from lib/pdf
    - Render HTML with filled data
    - Apply paper size and orientation
    - Include company header if enabled
    - Upload to storage and save URL
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_
  - [x] 10.2 Create PDF download handler
    - Generate descriptive filename
    - Serve file for download
    - _Requirements: 4.6_

- [x] 11. Page Routes and Navigation
  - [x] 11.1 Create templates list page at /customs/templates
    - TemplateList with create button
    - _Requirements: 1.1_
  - [x] 11.2 Create template editor page at /customs/templates/[id]
    - TemplateEditor for new/edit
    - _Requirements: 7.1-7.6_
  - [x] 11.3 Create generated documents page at /customs/documents
    - GeneratedDocumentList
    - DocumentGeneratorDialog trigger
    - _Requirements: 5.1, 5.5_
  - [x] 11.4 Create document detail page at /customs/documents/[id]
    - DocumentDetailView
    - _Requirements: 5.6_
  - [x] 11.5 Add navigation links to customs menu
    - Templates and Documents sections
    - _Requirements: 1.1_

- [x] 12. Final Checkpoint
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- All tasks including property tests are required for comprehensive coverage
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- The existing PDF infrastructure in `lib/pdf` should be reused for PDF generation
