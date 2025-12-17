# Requirements Document

## Introduction

This document specifies the requirements for the Document Attachments feature (v0.12) in Gama ERP. The system enables users to upload, view, download, and manage file attachments (PDFs, images) on business entities including PJOs, Job Orders, Invoices, Customers, and Projects. Files are stored securely in Supabase Storage with proper access controls.

## Glossary

- **Attachment_System**: The subsystem responsible for uploading, storing, and managing document attachments
- **Document_Uploader**: The reusable UI component for uploading files to any entity
- **Attachment_List**: The UI component displaying all attachments for an entity with preview/download/delete actions
- **Entity_Type**: The type of business object an attachment belongs to ('pjo', 'jo', 'invoice', 'customer', 'project')
- **Entity_ID**: The UUID of the specific business object the attachment is linked to
- **Storage_Path**: The path in Supabase Storage where the file is stored (format: `{entity_type}/{entity_id}/{filename}`)
- **Signed_URL**: A temporary URL with expiration for secure file access
- **MIME_Type**: The file format identifier (e.g., 'application/pdf', 'image/jpeg', 'image/png')

## Requirements

### Requirement 1

**User Story:** As a user, I want to upload documents to a PJO, so that I can attach supporting files like quotations, customer POs, and site photos.

#### Acceptance Criteria

1. WHEN viewing a PJO detail page THEN the Attachment_System SHALL display an attachments section with an upload button
2. WHEN a user clicks the upload button THEN the Attachment_System SHALL open a file picker dialog
3. WHEN a user selects valid files THEN the Attachment_System SHALL upload each file to Supabase Storage
4. WHEN uploading files THEN the Attachment_System SHALL store files at path `pjo/{entity_id}/{filename}`
5. WHEN upload completes THEN the Attachment_System SHALL create a record in document_attachments table
6. WHEN upload completes THEN the Attachment_System SHALL display the new attachment in the list without page refresh

### Requirement 2

**User Story:** As a user, I want to upload documents to Job Orders and Invoices, so that I can attach delivery receipts, proof of completion, and payment confirmations.

#### Acceptance Criteria

1. WHEN viewing a JO detail page THEN the Attachment_System SHALL display an attachments section
2. WHEN viewing an Invoice detail page THEN the Attachment_System SHALL display an attachments section
3. WHEN uploading to JO THEN the Attachment_System SHALL store files at path `jo/{entity_id}/{filename}`
4. WHEN uploading to Invoice THEN the Attachment_System SHALL store files at path `invoice/{entity_id}/{filename}`
5. WHEN uploading THEN the Attachment_System SHALL link the attachment record to the correct entity_type and entity_id

### Requirement 3

**User Story:** As a user, I want to upload documents to Customers and Projects, so that I can store contracts, agreements, and project documentation.

#### Acceptance Criteria

1. WHEN viewing a Customer detail page THEN the Attachment_System SHALL display an attachments section
2. WHEN viewing a Project detail page THEN the Attachment_System SHALL display an attachments section
3. WHEN uploading to Customer THEN the Attachment_System SHALL store files at path `customer/{entity_id}/{filename}`
4. WHEN uploading to Project THEN the Attachment_System SHALL store files at path `project/{entity_id}/{filename}`

### Requirement 4

**User Story:** As a user, I want file uploads to be validated, so that only allowed file types and sizes are accepted.

#### Acceptance Criteria

1. WHEN a user attempts to upload a file THEN the Attachment_System SHALL validate the file type against allowed MIME types
2. WHEN file type is not in ['application/pdf', 'image/jpeg', 'image/png'] THEN the Attachment_System SHALL reject the upload with an error message
3. WHEN a user attempts to upload a file THEN the Attachment_System SHALL validate the file size
4. WHEN file size exceeds 10MB THEN the Attachment_System SHALL reject the upload with an error message
5. WHEN validation fails THEN the Attachment_System SHALL display a clear error message indicating the reason
6. WHEN multiple files are selected THEN the Attachment_System SHALL validate each file individually

### Requirement 5

**User Story:** As a user, I want to see all attachments for an entity, so that I can review uploaded documents.

#### Acceptance Criteria

1. WHEN displaying attachments THEN the Attachment_System SHALL show file name, file type icon, and file size
2. WHEN displaying attachments THEN the Attachment_System SHALL show upload date and uploader name
3. WHEN displaying PDF files THEN the Attachment_System SHALL show a document icon
4. WHEN displaying image files THEN the Attachment_System SHALL show an image icon
5. WHEN no attachments exist THEN the Attachment_System SHALL display an empty state message
6. WHEN attachments are loading THEN the Attachment_System SHALL display a loading skeleton

### Requirement 6

**User Story:** As a user, I want to preview attachments, so that I can view documents without downloading.

#### Acceptance Criteria

1. WHEN a user clicks the preview button on an attachment THEN the Attachment_System SHALL generate a signed URL
2. WHEN previewing a PDF THEN the Attachment_System SHALL open the PDF in a new browser tab
3. WHEN previewing an image THEN the Attachment_System SHALL display the image in a modal dialog
4. WHEN generating signed URLs THEN the Attachment_System SHALL set expiration to 1 hour
5. IF signed URL generation fails THEN the Attachment_System SHALL display an error message

### Requirement 7

**User Story:** As a user, I want to download attachments, so that I can save documents locally.

#### Acceptance Criteria

1. WHEN a user clicks the download button THEN the Attachment_System SHALL generate a signed URL for download
2. WHEN download URL is generated THEN the Attachment_System SHALL trigger browser download with original filename
3. WHEN download fails THEN the Attachment_System SHALL display an error message

### Requirement 8

**User Story:** As a user, I want to delete attachments, so that I can remove outdated or incorrect documents.

#### Acceptance Criteria

1. WHEN a user clicks the delete button THEN the Attachment_System SHALL display a confirmation dialog
2. WHEN user confirms deletion THEN the Attachment_System SHALL delete the file from Supabase Storage
3. WHEN storage deletion succeeds THEN the Attachment_System SHALL delete the record from document_attachments table
4. WHEN deletion completes THEN the Attachment_System SHALL remove the attachment from the list without page refresh
5. IF deletion fails THEN the Attachment_System SHALL display an error message and retain the attachment

### Requirement 9

**User Story:** As a user, I want to add descriptions to attachments, so that I can provide context about each document.

#### Acceptance Criteria

1. WHEN uploading a file THEN the Attachment_System SHALL allow entering an optional description
2. WHEN displaying attachments THEN the Attachment_System SHALL show the description if provided
3. WHEN description is empty THEN the Attachment_System SHALL display only the filename

### Requirement 10

**User Story:** As a user, I want upload progress feedback, so that I know the status of my uploads.

#### Acceptance Criteria

1. WHEN upload starts THEN the Attachment_System SHALL display a progress indicator
2. WHILE upload is in progress THEN the Attachment_System SHALL show upload percentage
3. WHEN upload completes successfully THEN the Attachment_System SHALL display a success message
4. IF upload fails THEN the Attachment_System SHALL display an error message with retry option

### Requirement 11

**User Story:** As a developer, I want a reusable attachment component, so that I can easily add attachment functionality to any entity.

#### Acceptance Criteria

1. WHEN using the Document_Uploader component THEN the Attachment_System SHALL accept entityType and entityId as required props
2. WHEN using the Document_Uploader component THEN the Attachment_System SHALL accept optional maxFiles prop (default: 10)
3. WHEN using the Document_Uploader component THEN the Attachment_System SHALL accept optional maxSizeMB prop (default: 10)
4. WHEN using the Document_Uploader component THEN the Attachment_System SHALL accept optional allowedTypes prop
5. WHEN maxFiles limit is reached THEN the Attachment_System SHALL disable the upload button

### Requirement 12

**User Story:** As an admin, I want attachments to be secured, so that only authorized users can access files.

#### Acceptance Criteria

1. WHEN Supabase Storage bucket is created THEN the Attachment_System SHALL configure it as private (not public)
2. WHEN accessing files THEN the Attachment_System SHALL require authentication via signed URLs
3. WHEN creating attachment records THEN the Attachment_System SHALL store the uploaded_by user ID
4. WHEN RLS policies are applied THEN the Attachment_System SHALL allow authenticated users to read attachments for entities they can access

