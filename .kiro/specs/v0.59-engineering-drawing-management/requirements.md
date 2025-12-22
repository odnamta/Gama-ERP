# Requirements Document

## Introduction

This document defines the requirements for the Engineering Drawing Management module in Gama ERP. The system will manage engineering drawings including CAD files, revisions, approval workflows, and transmittals for heavy-haul logistics projects.

## Glossary

- **Drawing**: A technical document (CAD file, PDF) containing engineering specifications for projects
- **Drawing_Register**: The central repository tracking all drawings with their metadata and status
- **Drawing_Category**: Classification of drawings by type (GA, LP, TP, RP, SP, SD, FD, AS)
- **Revision**: A version of a drawing with tracked changes and approval history
- **Transmittal**: A formal document package for distributing drawings to external parties
- **Workflow**: The approval process from draft through review to issuance

## Requirements

### Requirement 1: Drawing Category Management

**User Story:** As an engineering manager, I want to manage drawing categories, so that drawings can be properly classified and numbered.

#### Acceptance Criteria

1. THE Drawing_Category_System SHALL provide default categories: GA (General Arrangement), LP (Lifting Plan), TP (Transport Plan), RP (Rigging Plan), SP (Site Plan), SD (Structural Detail), FD (Fabrication Drawing), AS (As-Built)
2. WHEN a category is created, THE Drawing_Category_System SHALL require a unique category code and name
3. WHEN displaying categories, THE Drawing_Category_System SHALL order them by display_order field
4. THE Drawing_Category_System SHALL allow categories to be activated or deactivated

### Requirement 2: Drawing Registration

**User Story:** As an engineer, I want to register and upload drawings, so that they are tracked in the central drawing register.

#### Acceptance Criteria

1. WHEN a drawing is created, THE Drawing_System SHALL auto-generate a unique drawing number using the category prefix
2. WHEN uploading a drawing, THE Drawing_System SHALL accept DWG, PDF, and DXF file formats
3. WHEN a drawing is created, THE Drawing_System SHALL require a title and category selection
4. THE Drawing_System SHALL allow linking drawings to projects, job orders, assessments, route surveys, or JMPs
5. WHEN a drawing is uploaded, THE Drawing_System SHALL store file metadata including size and type
6. THE Drawing_System SHALL support scale and paper size specifications (default A1)

### Requirement 3: Drawing Revision Management

**User Story:** As an engineer, I want to manage drawing revisions, so that changes are tracked and previous versions are preserved.

#### Acceptance Criteria

1. WHEN a new revision is created, THE Revision_System SHALL require a change description
2. WHEN a new revision is created, THE Revision_System SHALL increment the revision number (A, B, C, etc.)
3. WHEN a new revision is created, THE Revision_System SHALL archive the previous revision
4. THE Revision_System SHALL track change reasons: initial, client_request, design_change, correction, as_built
5. WHEN viewing a drawing, THE Revision_System SHALL display the complete revision history
6. THE Revision_System SHALL mark only one revision as current per drawing

### Requirement 4: Drawing Approval Workflow

**User Story:** As an engineering manager, I want to approve drawings through a formal workflow, so that quality is ensured before issuance.

#### Acceptance Criteria

1. THE Workflow_System SHALL support statuses: draft, for_review, for_approval, approved, issued, superseded
2. WHEN a drawing is submitted for review, THE Workflow_System SHALL record the drafter and timestamp
3. WHEN a drawing is checked, THE Workflow_System SHALL record the checker and timestamp
4. WHEN a drawing is approved, THE Workflow_System SHALL record the approver and timestamp
5. WHEN a drawing is issued, THE Workflow_System SHALL record the issuer and timestamp
6. IF a drawing is superseded, THEN THE Workflow_System SHALL mark it as superseded and exclude from active register

### Requirement 5: Drawing Transmittal Management

**User Story:** As an engineer, I want to create transmittals to send drawings to external parties, so that distribution is formally tracked.

#### Acceptance Criteria

1. WHEN a transmittal is created, THE Transmittal_System SHALL auto-generate a unique transmittal number
2. THE Transmittal_System SHALL require recipient company and purpose selection
3. THE Transmittal_System SHALL support purposes: for_approval, for_construction, for_information, for_review, as_built
4. WHEN creating a transmittal, THE Transmittal_System SHALL allow selecting multiple drawings with revision and copy count
5. THE Transmittal_System SHALL support adding a cover letter
6. WHEN a transmittal is sent, THE Transmittal_System SHALL record the sender and timestamp
7. THE Transmittal_System SHALL track acknowledgment status and timestamp

### Requirement 6: Drawing Search and Filtering

**User Story:** As a user, I want to search and filter drawings, so that I can quickly find the drawings I need.

#### Acceptance Criteria

1. WHEN searching drawings, THE Search_System SHALL support search by drawing number
2. WHEN searching drawings, THE Search_System SHALL support filtering by project
3. WHEN searching drawings, THE Search_System SHALL support filtering by category
4. WHEN searching drawings, THE Search_System SHALL support filtering by status
5. THE Search_System SHALL display results in a register view with key metadata

### Requirement 7: Drawing Register View

**User Story:** As an engineering manager, I want to view the drawing register, so that I can monitor all active drawings and their status.

#### Acceptance Criteria

1. THE Register_View SHALL display all non-superseded drawings
2. THE Register_View SHALL show drawing number, title, category, project, revision, and status
3. THE Register_View SHALL show drafter and approver names
4. WHEN clicking a drawing, THE Register_View SHALL navigate to the drawing detail page
5. THE Register_View SHALL support sorting by drawing number
