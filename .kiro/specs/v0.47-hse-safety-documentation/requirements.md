# Requirements Document

## Introduction

v0.47 HSE - Safety Documentation provides a comprehensive system for managing safety-related documents including Job Safety Analysis (JSA), Standard Operating Procedures (SOP), safety permits, and Material Safety Data Sheets (MSDS). The system includes version control, expiry tracking, approval workflows, and employee acknowledgment tracking.

## Glossary

- **Safety_Document_System**: The system responsible for managing safety documentation lifecycle
- **Document_Manager**: Component handling document CRUD operations and version control
- **Approval_Workflow**: Component managing document review and approval process
- **Expiry_Tracker**: Component monitoring document validity and expiration
- **Acknowledgment_System**: Component tracking employee document acknowledgments
- **Permit_Manager**: Component handling safety work permits
- **JSA_Manager**: Component managing Job Safety Analysis hazard steps
- **JSA**: Job Safety Analysis - systematic hazard identification for work tasks
- **SOP**: Standard Operating Procedure - documented work instructions
- **MSDS**: Material Safety Data Sheet - chemical safety information
- **Work_Permit**: Authorization document for hazardous work activities

## Requirements

### Requirement 1: Document Categories Management

**User Story:** As an HSE manager, I want to manage document categories with configurable settings, so that different document types can have appropriate validation rules.

#### Acceptance Criteria

1. THE Safety_Document_System SHALL provide predefined categories: JSA, SOP, Permit, MSDS, Risk Assessment, Toolbox Talk, Inspection, Emergency Procedure, Training Material
2. WHEN a category requires expiry tracking, THE Safety_Document_System SHALL enforce expiry date on documents of that category
3. WHEN a category has default validity days, THE Safety_Document_System SHALL auto-calculate expiry date from effective date
4. WHEN a category requires approval, THE Safety_Document_System SHALL enforce approval workflow for documents of that category

### Requirement 2: Document Creation and Management

**User Story:** As an HSE officer, I want to create and manage safety documents with file uploads, so that I can maintain a centralized document repository.

#### Acceptance Criteria

1. WHEN creating a new document, THE Document_Manager SHALL auto-generate a unique document number in format CATEGORY-YYYY-NNNN
2. THE Document_Manager SHALL require title, category, and effective date for all documents
3. WHEN a file is uploaded, THE Document_Manager SHALL store file URL, name, and type
4. THE Document_Manager SHALL support inline content for documents like toolbox talks
5. THE Document_Manager SHALL allow specifying applicable locations, departments, and job types
6. WHEN a document is created, THE Document_Manager SHALL set initial version to 1.0 and revision number to 1

### Requirement 3: Version Control

**User Story:** As an HSE manager, I want to track document versions and revisions, so that I can maintain document history and audit trail.

#### Acceptance Criteria

1. WHEN a document is revised, THE Document_Manager SHALL increment the revision number
2. WHEN a major update occurs, THE Document_Manager SHALL create a new version and link to previous version
3. WHEN a new version is created, THE Document_Manager SHALL mark the previous version as superseded
4. THE Document_Manager SHALL maintain reference to previous version via previous_version_id

### Requirement 4: Approval Workflow

**User Story:** As an HSE manager, I want documents to go through an approval workflow, so that only reviewed and approved documents are active.

#### Acceptance Criteria

1. THE Approval_Workflow SHALL support statuses: draft, pending_review, approved, expired, superseded, archived
2. WHEN a document is submitted for review, THE Approval_Workflow SHALL change status to pending_review
3. WHEN a document is approved, THE Approval_Workflow SHALL record approved_by and approved_at
4. THE Approval_Workflow SHALL track prepared_by, reviewed_by, and approved_by with timestamps
5. WHEN a document requires approval per category setting, THE Approval_Workflow SHALL prevent activation without approval

### Requirement 5: Expiry Tracking

**User Story:** As an HSE manager, I want to track document expiry dates, so that I can ensure documents are renewed before they expire.

#### Acceptance Criteria

1. WHEN a document's expiry date passes, THE Expiry_Tracker SHALL mark the document as expired
2. THE Expiry_Tracker SHALL identify documents expiring within 30 days as "expiring_soon"
3. THE Expiry_Tracker SHALL calculate days until expiry for each document
4. THE Expiry_Tracker SHALL provide a view of all expiring documents sorted by expiry date
5. WHEN a document is about to expire, THE Expiry_Tracker SHALL send notifications to relevant users

### Requirement 6: Employee Acknowledgment

**User Story:** As an HSE officer, I want to track which employees have acknowledged safety documents, so that I can ensure compliance and training completion.

#### Acceptance Criteria

1. WHEN a document requires acknowledgment, THE Acknowledgment_System SHALL track employee acknowledgments
2. THE Acknowledgment_System SHALL record acknowledged_at timestamp for each acknowledgment
3. THE Acknowledgment_System SHALL support optional quiz scores and pass/fail status
4. THE Acknowledgment_System SHALL prevent duplicate acknowledgments per employee per document
5. THE Acknowledgment_System SHALL provide acknowledgment completion statistics per document

### Requirement 7: Job Safety Analysis (JSA)

**User Story:** As a safety officer, I want to create detailed JSA documents with step-by-step hazard analysis, so that workers understand risks and controls for each work step.

#### Acceptance Criteria

1. THE JSA_Manager SHALL support multiple hazard entries per JSA document
2. WHEN adding a hazard entry, THE JSA_Manager SHALL require step number, work step, hazards, and control measures
3. THE JSA_Manager SHALL support risk levels: low, medium, high, extreme
4. THE JSA_Manager SHALL allow specifying consequences and responsible person per step
5. WHEN a JSA document is deleted, THE JSA_Manager SHALL cascade delete all hazard entries

### Requirement 8: Safety Work Permits

**User Story:** As an operations supervisor, I want to request and manage safety work permits, so that hazardous work is properly authorized and controlled.

#### Acceptance Criteria

1. THE Permit_Manager SHALL support permit types: hot_work, confined_space, height_work, excavation, electrical, lifting
2. WHEN creating a permit, THE Permit_Manager SHALL require work description, location, valid_from, and valid_to
3. THE Permit_Manager SHALL support multi-level approval: supervisor and HSE
4. THE Permit_Manager SHALL track permit statuses: pending, approved, active, completed, cancelled, expired
5. THE Permit_Manager SHALL allow linking permits to job orders
6. THE Permit_Manager SHALL track special precautions, required PPE, and emergency procedures
7. WHEN a permit is closed, THE Permit_Manager SHALL record closed_by, closed_at, and closure notes
8. WHEN a permit's valid_to date passes, THE Permit_Manager SHALL mark it as expired

### Requirement 9: Document Dashboard

**User Story:** As an HSE manager, I want a dashboard showing document statistics, so that I can monitor document status at a glance.

#### Acceptance Criteria

1. THE Safety_Document_System SHALL display total document count
2. THE Safety_Document_System SHALL display count of approved documents
3. THE Safety_Document_System SHALL display count of documents pending review
4. THE Safety_Document_System SHALL display count of documents expiring within 30 days
5. THE Safety_Document_System SHALL support filtering by category and status
6. THE Safety_Document_System SHALL support search by document number and title

### Requirement 10: Security and Access Control

**User Story:** As a system administrator, I want to control access to safety documents, so that only authorized users can view and modify documents.

#### Acceptance Criteria

1. THE Safety_Document_System SHALL enable RLS on all safety document tables
2. THE Safety_Document_System SHALL allow all authenticated users to view approved documents
3. THE Safety_Document_System SHALL restrict document creation to HSE roles and managers
4. THE Safety_Document_System SHALL restrict approval actions to managers and HSE officers

### Requirement 11: Notifications

**User Story:** As an HSE manager, I want to receive notifications about document events, so that I can take timely action.

#### Acceptance Criteria

1. WHEN a document is submitted for review, THE Safety_Document_System SHALL notify reviewers
2. WHEN a document is approved, THE Safety_Document_System SHALL notify the preparer
3. WHEN a document is expiring within 30 days, THE Safety_Document_System SHALL notify HSE team
4. WHEN a permit is requested, THE Safety_Document_System SHALL notify approvers
