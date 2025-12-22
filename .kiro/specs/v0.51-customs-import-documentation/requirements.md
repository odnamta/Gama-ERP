# Requirements Document

## Introduction

This document defines the requirements for the Customs Import Documentation (PIB - Pemberitahuan Impor Barang) module in Gama ERP. The system will manage import customs documentation including document generation, status tracking, duty calculations, and integration with job orders. Heavy-haul logistics often involves imported machinery and equipment, and proper customs documentation is legally required - delays can cost significant money.

## Glossary

- **PIB**: Pemberitahuan Impor Barang - Indonesian Import Declaration document
- **PIB_System**: The customs import documentation management system
- **KPPBC**: Kantor Pengawasan dan Pelayanan Bea dan Cukai - Customs Supervision and Service Office
- **KPU**: Kantor Pelayanan Utama - Main Service Office
- **HS_Code**: Harmonized System Code - international nomenclature for classifying traded products
- **CIF**: Cost, Insurance, and Freight - total value of imported goods
- **FOB**: Free On Board - value of goods at port of origin
- **Bea_Masuk**: Import duty (customs duty)
- **PPN**: Pajak Pertambahan Nilai - Value Added Tax (11%)
- **PPh_Import**: Pajak Penghasilan Import - Import Income Tax
- **SPPB**: Surat Persetujuan Pengeluaran Barang - Goods Release Approval Letter
- **AJU**: Nomor Pengajuan - Submission Number
- **B/L**: Bill of Lading - shipping document
- **AWB**: Air Waybill - air cargo shipping document
- **Lartas**: Larangan dan Pembatasan - Restrictions and Prohibitions (permits required)

## Requirements

### Requirement 1: Customs Office Management

**User Story:** As an admin, I want to manage customs offices, so that I can select the appropriate office when creating PIB documents.

#### Acceptance Criteria

1. THE PIB_System SHALL store customs offices with office_code, office_name, office_type, city, address, and phone
2. THE PIB_System SHALL support office types of 'kppbc' and 'kpu'
3. WHEN the system initializes, THE PIB_System SHALL provide default customs offices for major Indonesian ports (Tanjung Perak, Tanjung Priok, Balikpapan, Makassar, Belawan)
4. THE PIB_System SHALL allow filtering customs offices by active status

### Requirement 2: Import Type Management

**User Story:** As an admin, I want to manage import types with their default duty rates, so that duty calculations are automated based on import category.

#### Acceptance Criteria

1. THE PIB_System SHALL store import types with type_code, type_name, description, and default duty rates
2. THE PIB_System SHALL support default rates for Bea_Masuk, PPN (default 11%), and PPh_Import
3. THE PIB_System SHALL track whether an import type requires permits and the permit type
4. WHEN the system initializes, THE PIB_System SHALL provide default import types: General Import, Machinery & Equipment, Temporary Import, Re-import, Bonded Zone Import, and Project Import (Masterlist)

### Requirement 3: PIB Document Creation

**User Story:** As a customs officer, I want to create PIB documents with all required information, so that I can properly declare imports to customs authorities.

#### Acceptance Criteria

1. WHEN a user creates a PIB document, THE PIB_System SHALL generate a unique internal reference in format 'PIB-YYYY-NNNNN'
2. THE PIB_System SHALL allow linking PIB documents to job orders and customers
3. THE PIB_System SHALL capture importer details including name, NPWP, and address
4. THE PIB_System SHALL capture supplier details including name and country
5. THE PIB_System SHALL require selection of import type and customs office
6. THE PIB_System SHALL capture transport details including mode (sea/air/land), vessel name, voyage number, and bill of lading or AWB
7. THE PIB_System SHALL capture port details including port of loading and port of discharge
8. THE PIB_System SHALL capture cargo summary including total packages, package type, and gross weight
9. THE PIB_System SHALL capture value information including FOB value, freight, insurance, and currency
10. THE PIB_System SHALL automatically calculate CIF value as FOB + Freight + Insurance

### Requirement 4: PIB Line Items Management

**User Story:** As a customs officer, I want to add detailed line items to PIB documents with HS codes, so that each imported good is properly classified and duties calculated.

#### Acceptance Criteria

1. WHEN a user adds an item to a PIB, THE PIB_System SHALL assign sequential item numbers
2. THE PIB_System SHALL require HS code and goods description for each item
3. THE PIB_System SHALL capture item details including brand, type/model, specifications, and country of origin
4. THE PIB_System SHALL capture quantity, unit, and weight (net and gross) for each item
5. THE PIB_System SHALL capture unit price and calculate total price per item
6. WHEN an item is added, THE PIB_System SHALL apply duty rates (Bea_Masuk, PPN, PPh) based on HS code or import type defaults
7. THE PIB_System SHALL calculate per-item duties: Bea_Masuk = total_price × bm_rate, PPN = (total_price + Bea_Masuk) × ppn_rate, PPh = (total_price + Bea_Masuk) × pph_rate
8. THE PIB_System SHALL track permit requirements (Lartas) for items that need special permits

### Requirement 5: Duty Calculation and Totals

**User Story:** As a customs officer, I want automatic duty calculations, so that I can accurately determine total duties payable.

#### Acceptance Criteria

1. WHEN items are added or modified, THE PIB_System SHALL recalculate PIB totals automatically
2. THE PIB_System SHALL aggregate Bea_Masuk, PPN, and PPh_Import from all items
3. THE PIB_System SHALL calculate total_duties as Bea_Masuk + PPN + PPh_Import
4. THE PIB_System SHALL convert CIF value to IDR using the specified exchange rate
5. THE PIB_System SHALL display duty breakdown showing each component and total

### Requirement 6: PIB Status Workflow

**User Story:** As a customs officer, I want to track PIB status through the clearance process, so that I can monitor progress and take appropriate actions.

#### Acceptance Criteria

1. THE PIB_System SHALL support statuses: draft, submitted, document_check, physical_check, duties_paid, released, completed, cancelled
2. WHEN a PIB is created, THE PIB_System SHALL set initial status to 'draft'
3. WHEN status changes to 'submitted', THE PIB_System SHALL record submitted_at timestamp and allow entry of AJU number
4. WHEN status changes to 'duties_paid', THE PIB_System SHALL record duties_paid_at timestamp and allow entry of PIB number
5. WHEN status changes to 'released', THE PIB_System SHALL record released_at timestamp and allow entry of SPPB number and date
6. WHEN any status change occurs, THE PIB_System SHALL log the change in status history with previous status, new status, timestamp, and user

### Requirement 7: PIB Document List View

**User Story:** As a user, I want to view and filter PIB documents, so that I can quickly find and manage import declarations.

#### Acceptance Criteria

1. THE PIB_System SHALL display summary cards showing counts of Active PIBs, Pending Clearance, In Transit, and Released (MTD)
2. THE PIB_System SHALL display PIB list with reference numbers, importer/cargo info, ETA, CIF value, and status
3. THE PIB_System SHALL allow filtering by status, customs office, and date range
4. THE PIB_System SHALL allow searching PIB documents by reference number, importer name, or cargo description
5. THE PIB_System SHALL display status with visual indicators (icons/colors)
6. THE PIB_System SHALL show linked job order number when available

### Requirement 8: PIB Detail View

**User Story:** As a user, I want to view complete PIB details, so that I can review all information and take actions.

#### Acceptance Criteria

1. THE PIB_System SHALL display a status timeline showing progress through workflow stages
2. THE PIB_System SHALL organize information in tabs: Details, Items, Duties, Documents, History
3. THE PIB_System SHALL display document details including all reference numbers, import type, and customs office
4. THE PIB_System SHALL display importer and supplier information
5. THE PIB_System SHALL display transport and cargo summary information
6. THE PIB_System SHALL display value and duties summary with breakdown
7. THE PIB_System SHALL allow status updates with appropriate data entry (PIB number, SPPB number, etc.)

### Requirement 9: Supporting Documents

**User Story:** As a customs officer, I want to attach supporting documents to PIB records, so that all required documentation is organized together.

#### Acceptance Criteria

1. THE PIB_System SHALL allow uploading supporting documents (B/L, commercial invoice, packing list, etc.)
2. THE PIB_System SHALL store document metadata in JSONB format
3. THE PIB_System SHALL allow viewing and downloading attached documents

### Requirement 10: Role-Based Access Control

**User Story:** As a system administrator, I want to control access to PIB functions by role, so that users can only perform authorized actions.

#### Acceptance Criteria

1. THE PIB_System SHALL allow Owner, Admin, Manager, and Customs roles to view PIB documents
2. THE PIB_System SHALL allow Owner, Admin, Manager, and Customs roles to create and edit PIB documents
3. THE PIB_System SHALL allow Owner, Admin, Manager, and Customs roles to update PIB status
4. THE PIB_System SHALL allow Owner, Admin, Manager, Customs, and Finance roles to view duty information
5. THE PIB_System SHALL restrict PIB deletion to Owner and Admin roles only
6. THE PIB_System SHALL restrict Ops role from creating or editing PIB documents
