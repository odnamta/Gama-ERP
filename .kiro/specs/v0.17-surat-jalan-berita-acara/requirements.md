# Requirements Document

## Introduction

This document specifies the requirements for the Surat Jalan (Delivery Note) and Berita Acara (Handover Report) document management feature in Gama ERP. These documents are essential for logistics operations - Surat Jalan is mandatory for all deliveries while Berita Acara is conditional based on contract requirements. The feature integrates with the existing Job Orders module and triggers invoice term unlocking based on document status changes.

## Glossary

- **Surat Jalan (SJ)**: A delivery note document that accompanies cargo during transport, containing delivery details, route information, and cargo specifications. Mandatory for all deliveries.
- **Berita Acara (BA)**: A handover report document that formally records the completion of work and cargo condition upon delivery. Required based on contract terms.
- **Job Order (JO)**: An active work order linked to a PJO that tracks actual operations and costs.
- **Invoice Term**: A billing milestone that can be triggered by document completion (e.g., delivery confirmation).
- **Cargo Condition**: The state of delivered goods - can be 'good', 'minor_damage', or 'major_damage'.

## Requirements

### Requirement 1

**User Story:** As an operations user, I want to create Surat Jalan documents for job orders, so that I can formally document cargo deliveries with all required information.

#### Acceptance Criteria

1. WHEN an operations user navigates to a job order detail page THEN the System SHALL display a "Create Surat Jalan" button in the Surat Jalan section
2. WHEN a user creates a new Surat Jalan THEN the System SHALL auto-generate a unique SJ number in format SJ-YYYY-NNNN where YYYY is the current year and NNNN is a zero-padded sequential number
3. WHEN a user opens the Surat Jalan form THEN the System SHALL auto-fill route and cargo information from the associated Job Order
4. WHEN a user submits a Surat Jalan form THEN the System SHALL validate that delivery_date, vehicle_plate, driver_name, origin, destination, and cargo_description fields contain values
5. WHEN a Surat Jalan is created THEN the System SHALL store the document with status 'issued' and record the created_by user and timestamp

### Requirement 2

**User Story:** As an operations user, I want to track Surat Jalan delivery status, so that I can monitor cargo movement from origin to destination.

#### Acceptance Criteria

1. WHEN a Surat Jalan exists THEN the System SHALL allow status transitions only in the sequence: issued → in_transit → delivered OR issued → in_transit → returned
2. WHEN a Surat Jalan status changes to 'delivered' THEN the System SHALL record the delivered_at timestamp and update the job order has_surat_jalan flag to true
3. WHEN viewing a job order detail page THEN the System SHALL display a list of all associated Surat Jalan documents with SJ number, date, status, driver name, and action buttons
4. WHEN a Surat Jalan has status 'delivered' THEN the System SHALL check for invoice terms with trigger 'surat_jalan' and unlock those terms for invoice generation

### Requirement 3

**User Story:** As an operations user, I want to create Berita Acara documents for job orders, so that I can formally record work completion and cargo handover with client acknowledgment.

#### Acceptance Criteria

1. WHEN an operations user navigates to a job order that requires Berita Acara THEN the System SHALL display a "Create Berita Acara" button in the Berita Acara section
2. WHEN a user creates a new Berita Acara THEN the System SHALL auto-generate a unique BA number in format BA-YYYY-NNNN where YYYY is the current year and NNNN is a zero-padded sequential number
3. WHEN a user submits a Berita Acara form THEN the System SHALL validate that handover_date, location, work_description, cargo_condition, company_representative, and client_representative fields contain values
4. WHEN a Berita Acara is created THEN the System SHALL store the document with status 'draft' and record the created_by user and timestamp
5. WHEN recording cargo condition THEN the System SHALL accept only values 'good', 'minor_damage', or 'major_damage'

### Requirement 4

**User Story:** As an operations user, I want to track Berita Acara signature status, so that I can ensure proper client acknowledgment of work completion.

#### Acceptance Criteria

1. WHEN a Berita Acara exists THEN the System SHALL allow status transitions only in the sequence: draft → pending_signature → signed OR draft → pending_signature → archived
2. WHEN a Berita Acara status changes to 'signed' THEN the System SHALL record the signed_at timestamp and update the job order has_berita_acara flag to true
3. WHEN a Berita Acara has status 'signed' THEN the System SHALL check for invoice terms with trigger 'berita_acara' and unlock those terms for invoice generation
4. WHEN viewing a job order detail page THEN the System SHALL display a list of all associated Berita Acara documents with BA number, date, status, cargo condition, and action buttons

### Requirement 5

**User Story:** As an operations user, I want to attach photos to Berita Acara documents, so that I can provide visual evidence of cargo condition at handover.

#### Acceptance Criteria

1. WHEN creating or editing a Berita Acara THEN the System SHALL provide a photo upload interface that accepts image files
2. WHEN photos are uploaded THEN the System SHALL store the photo URLs in the photo_urls JSONB field as an array
3. WHEN viewing a Berita Acara THEN the System SHALL display all attached photos in a gallery format

### Requirement 6

**User Story:** As an admin user, I want to view and print Surat Jalan and Berita Acara documents, so that I can provide physical copies for drivers and clients.

#### Acceptance Criteria

1. WHEN viewing a Surat Jalan detail THEN the System SHALL display all document information including delivery details, route, cargo, sender information, and notes
2. WHEN viewing a Berita Acara detail THEN the System SHALL display all document information including handover details, work summary, cargo condition, representatives, and attached photos
3. WHEN a user clicks the print button on a document THEN the System SHALL generate a printer-friendly view of the document

### Requirement 7

**User Story:** As a system administrator, I want the database to properly store and index Surat Jalan and Berita Acara data, so that document retrieval and reporting are efficient.

#### Acceptance Criteria

1. WHEN the database schema is created THEN the System SHALL create the surat_jalan table with all specified columns and a foreign key reference to job_orders
2. WHEN the database schema is created THEN the System SHALL create the berita_acara table with all specified columns and a foreign key reference to job_orders
3. WHEN the database schema is created THEN the System SHALL create indexes on jo_id columns for both tables to optimize queries
4. WHEN the job_orders table is updated THEN the System SHALL include has_surat_jalan, has_berita_acara, and requires_berita_acara boolean columns

### Requirement 8

**User Story:** As a developer, I want document number generation to be reliable and consistent, so that each document has a unique identifier that follows the company format.

#### Acceptance Criteria

1. WHEN generating an SJ number THEN the System SHALL count existing Surat Jalan records for the current year and increment by one
2. WHEN generating a BA number THEN the System SHALL count existing Berita Acara records for the current year and increment by one
3. WHEN multiple users create documents simultaneously THEN the System SHALL ensure unique numbers through database constraints
