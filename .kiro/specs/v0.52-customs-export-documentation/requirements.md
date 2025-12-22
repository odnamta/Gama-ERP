# Requirements Document

## Introduction

This document defines the requirements for the Customs Export Documentation (PEB - Pemberitahuan Ekspor Barang) module in Gama ERP. The system will manage export customs documentation including document generation, status tracking, and integration with job orders. Heavy-haul logistics often involves exporting machinery and equipment, and proper customs documentation is legally required for all exports from Indonesia.

## Glossary

- **PEB**: Pemberitahuan Ekspor Barang - Indonesian Export Declaration document
- **PEB_System**: The customs export documentation management system
- **NPE**: Nota Pelayanan Ekspor - Export Service Note (approval document)
- **AJU**: Nomor Pengajuan - Submission Number
- **HS_Code**: Harmonized System Code - international nomenclature for classifying traded products
- **FOB**: Free On Board - value of goods at port of export
- **Bea_Keluar**: Export duty (usually 0 except for certain goods like raw minerals)
- **B/L**: Bill of Lading - shipping document
- **AWB**: Air Waybill - air cargo shipping document
- **Exporter**: The Indonesian company exporting goods
- **Consignee**: The foreign party receiving the exported goods

## Requirements

### Requirement 1: Export Type Management

**User Story:** As an admin, I want to manage export types with their characteristics, so that I can properly classify exports and determine if permits or duties are required.

#### Acceptance Criteria

1. THE PEB_System SHALL store export types with type_code, type_name, description, requires_export_duty, requires_permit, and permit_type
2. WHEN the system initializes, THE PEB_System SHALL provide default export types: General Export, Temporary Export, Re-export, and Bonded Zone Export
3. THE PEB_System SHALL track whether an export type requires export duty (Bea Keluar)
4. THE PEB_System SHALL track whether an export type requires permits and the permit type
5. THE PEB_System SHALL allow filtering export types by active status

### Requirement 2: PEB Document Creation

**User Story:** As a customs officer, I want to create PEB documents with all required information, so that I can properly declare exports to customs authorities.

#### Acceptance Criteria

1. WHEN a user creates a PEB document, THE PEB_System SHALL generate a unique internal reference in format 'PEB-YYYY-NNNNN'
2. THE PEB_System SHALL allow linking PEB documents to job orders and customers
3. THE PEB_System SHALL capture exporter details including name, NPWP, and address
4. THE PEB_System SHALL capture consignee details including name, country, and address
5. THE PEB_System SHALL require selection of export type and customs office
6. THE PEB_System SHALL capture transport details including mode (sea/air/land), vessel name, voyage number, and bill of lading or AWB
7. THE PEB_System SHALL capture port details including port of loading, port of discharge, and final destination
8. THE PEB_System SHALL capture ETD (Estimated Time of Departure) and ATD (Actual Time of Departure) dates
9. THE PEB_System SHALL capture cargo summary including total packages, package type, and gross weight
10. THE PEB_System SHALL capture FOB value and currency

### Requirement 3: PEB Line Items Management

**User Story:** As a customs officer, I want to add detailed line items to PEB documents with HS codes, so that each exported good is properly classified.

#### Acceptance Criteria

1. WHEN a user adds an item to a PEB, THE PEB_System SHALL assign sequential item numbers
2. THE PEB_System SHALL require HS code and goods description for each item
3. THE PEB_System SHALL capture item details including brand and specifications
4. THE PEB_System SHALL capture quantity, unit, and weight (net and gross) for each item
5. THE PEB_System SHALL capture unit price and calculate total price per item
6. THE PEB_System SHALL store currency for each item (default USD)

### Requirement 4: PEB Status Workflow

**User Story:** As a customs officer, I want to track PEB status through the export process, so that I can monitor progress and take appropriate actions.

#### Acceptance Criteria

1. THE PEB_System SHALL support statuses: draft, submitted, approved, loaded, departed, completed, cancelled
2. WHEN a PEB is created, THE PEB_System SHALL set initial status to 'draft'
3. WHEN status changes to 'submitted', THE PEB_System SHALL record submitted_at timestamp and allow entry of AJU number
4. WHEN status changes to 'approved', THE PEB_System SHALL record approved_at timestamp and allow entry of NPE number and date
5. WHEN status changes to 'loaded', THE PEB_System SHALL record loaded_at timestamp
6. WHEN any status change occurs, THE PEB_System SHALL log the change in status history with previous status, new status, timestamp, and user

### Requirement 5: PEB Document List View

**User Story:** As a user, I want to view and filter PEB documents, so that I can quickly find and manage export declarations.

#### Acceptance Criteria

1. THE PEB_System SHALL display summary cards showing counts of Active PEBs, Pending Approval, Loaded (awaiting departure), and Departed (MTD)
2. THE PEB_System SHALL display PEB list with reference numbers, exporter/cargo info, ETD, FOB value, and status
3. THE PEB_System SHALL allow filtering by status, customs office, and date range
4. THE PEB_System SHALL allow searching PEB documents by reference number, exporter name, or cargo description
5. THE PEB_System SHALL display status with visual indicators (icons/colors)
6. THE PEB_System SHALL show linked job order number when available

### Requirement 6: PEB Detail View

**User Story:** As a user, I want to view complete PEB details, so that I can review all information and take actions.

#### Acceptance Criteria

1. THE PEB_System SHALL display a status timeline showing progress through workflow stages
2. THE PEB_System SHALL organize information in tabs: Details, Items, Documents, History
3. THE PEB_System SHALL display document details including all reference numbers, export type, and customs office
4. THE PEB_System SHALL display exporter and consignee information
5. THE PEB_System SHALL display transport and cargo summary information
6. THE PEB_System SHALL display FOB value summary
7. THE PEB_System SHALL allow status updates with appropriate data entry (NPE number, etc.)

### Requirement 7: Supporting Documents

**User Story:** As a customs officer, I want to attach supporting documents to PEB records, so that all required documentation is organized together.

#### Acceptance Criteria

1. THE PEB_System SHALL allow uploading supporting documents (B/L, commercial invoice, packing list, etc.)
2. THE PEB_System SHALL store document metadata in JSONB format
3. THE PEB_System SHALL allow viewing and downloading attached documents

### Requirement 8: Role-Based Access Control

**User Story:** As a system administrator, I want to control access to PEB functions by role, so that users can only perform authorized actions.

#### Acceptance Criteria

1. THE PEB_System SHALL allow Owner, Admin, Manager, and Customs roles to view PEB documents
2. THE PEB_System SHALL allow Owner, Admin, Manager, and Customs roles to create and edit PEB documents
3. THE PEB_System SHALL allow Owner, Admin, Manager, and Customs roles to update PEB status
4. THE PEB_System SHALL restrict PEB deletion to Owner and Admin roles only
5. THE PEB_System SHALL restrict Ops role from creating or editing PEB documents
