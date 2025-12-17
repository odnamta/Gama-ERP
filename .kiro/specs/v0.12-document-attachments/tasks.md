# Implementation Plan

- [x] 1. Set up database and storage infrastructure
  - [x] 1.1 Create document_attachments table migration
    - Create migration with table schema, indexes, and constraints
    - Add RLS policies for authenticated users
    - _Requirements: 12.1, 12.4_
  - [x] 1.2 Create Supabase Storage bucket
    - Create private 'documents' bucket via Supabase Dashboard or migration
    - Configure allowed MIME types: application/pdf, image/jpeg, image/png
    - _Requirements: 12.1, 12.2_
  - [x] 1.3 Add TypeScript types for attachments
    - Create types/attachments.ts with DocumentAttachment, EntityType, and constants
    - Update types/database.ts with document_attachments table types
    - _Requirements: 11.1_

- [x] 2. Implement attachment utility functions
  - [x] 2.1 Create attachment-utils.ts with core functions
    - Implement generateStoragePath(entityType, entityId, fileName)
    - Implement validateFile(file, allowedTypes, maxSizeMB)
    - Implement validateFiles(files, allowedTypes, maxSizeMB)
    - Implement getFileIcon(mimeType)
    - Implement formatFileSize(bytes)
    - _Requirements: 1.4, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 5.3, 5.4_
  - [x] 2.2 Write property test for storage path generation
    - **Property 1: Storage path generation follows consistent format**
    - **Validates: Requirements 1.4, 2.3, 2.4, 3.3, 3.4**
  - [x] 2.3 Write property test for file type validation
    - **Property 2: File type validation correctly identifies allowed types**
    - **Validates: Requirements 4.1, 4.2**
  - [x] 2.4 Write property test for file size validation
    - **Property 3: File size validation correctly enforces limits**
    - **Validates: Requirements 4.3, 4.4**
  - [x] 2.5 Write property test for batch validation
    - **Property 4: Batch validation validates each file independently**
    - **Validates: Requirements 4.6**
  - [x] 2.6 Write property test for icon selection
    - **Property 5: File icon selection returns correct icon for MIME type**
    - **Validates: Requirements 5.3, 5.4**

- [x] 3. Implement server actions for attachments
  - [x] 3.1 Create attachment server actions
    - Implement uploadAttachment(entityType, entityId, file, description)
    - Implement deleteAttachment(attachmentId)
    - Implement getAttachments(entityType, entityId)
    - Implement getSignedUrl(storagePath, expiresIn)
    - _Requirements: 1.3, 1.5, 6.1, 7.1, 8.2, 8.3_
  - [x] 3.2 Write property test for signed URL expiry
    - **Property 7: Signed URL generation uses correct expiry**
    - **Validates: Requirements 6.4**
  - [x] 3.3 Write property test for upload record creation
    - **Property 8: Upload creates record with correct entity reference**
    - **Validates: Requirements 1.5, 2.5, 12.3**
  - [x] 3.4 Write property test for delete cascade
    - **Property 9: Delete removes both storage file and database record**
    - **Validates: Requirements 8.2, 8.3**

- [x] 4. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Implement DocumentUploader component
  - [x] 5.1 Create DocumentUploader component
    - Accept entityType, entityId, maxFiles, maxSizeMB, allowedTypes props
    - Implement file input with drag-and-drop support
    - Show upload progress indicator
    - Handle validation errors with clear messages
    - Call onUploadComplete callback on success
    - _Requirements: 1.1, 1.2, 1.6, 4.5, 10.1, 10.2, 10.3, 10.4, 11.1, 11.2, 11.3, 11.4_
  - [x] 5.2 Write property test for max files limit
    - **Property 10: Max files limit disables upload when reached**
    - **Validates: Requirements 11.5**

- [x] 6. Implement AttachmentList component
  - [x] 6.1 Create AttachmentList component
    - Display file name, icon, size, upload date, uploader name
    - Show description if provided
    - Include preview, download, and delete action buttons
    - Handle empty state with message
    - Handle loading state with skeleton
    - _Requirements: 5.1, 5.2, 5.5, 5.6, 9.2, 9.3_
  - [x] 6.2 Write property test for attachment display
    - **Property 6: Attachment display includes all required fields**
    - **Validates: Requirements 5.1, 5.2, 9.2**

- [x] 7. Implement PreviewModal component
  - [x] 7.1 Create PreviewModal component
    - Display images in modal with signed URL
    - Open PDFs in new browser tab
    - Handle loading and error states
    - _Requirements: 6.2, 6.3, 6.5_

- [x] 8. Implement delete confirmation dialog
  - [x] 8.1 Create delete confirmation flow
    - Show confirmation dialog on delete click
    - Call deleteAttachment on confirm
    - Update UI on success
    - Show error message on failure
    - _Requirements: 8.1, 8.4, 8.5_

- [x] 9. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Integrate attachments into PJO detail page
  - [x] 10.1 Add attachments section to PJO detail view
    - Add DocumentUploader and AttachmentList to PJO detail page
    - Fetch attachments on page load
    - Handle upload and delete callbacks
    - _Requirements: 1.1, 1.3, 1.4, 1.5, 1.6_

- [x] 11. Integrate attachments into JO detail page
  - [x] 11.1 Add attachments section to JO detail view
    - Add DocumentUploader and AttachmentList to JO detail page
    - Configure entityType as 'jo'
    - _Requirements: 2.1, 2.3, 2.5_

- [x] 12. Integrate attachments into Invoice detail page
  - [x] 12.1 Add attachments section to Invoice detail view
    - Add DocumentUploader and AttachmentList to Invoice detail page
    - Configure entityType as 'invoice'
    - _Requirements: 2.2, 2.4, 2.5_

- [x] 13. Integrate attachments into Customer detail page
  - [x] 13.1 Add attachments section to Customer detail view
    - Add DocumentUploader and AttachmentList to Customer detail page
    - Configure entityType as 'customer'
    - _Requirements: 3.1, 3.3_

- [x] 14. Integrate attachments into Project detail page
  - [x] 14.1 Add attachments section to Project detail view
    - Add DocumentUploader and AttachmentList to Project detail page
    - Configure entityType as 'project'
    - _Requirements: 3.2, 3.4_

- [x] 15. Final Checkpoint - Ensure all tests pass
  - All attachment tests pass (31/31 tests)
