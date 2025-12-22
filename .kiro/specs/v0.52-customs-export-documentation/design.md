# Design Document: Customs Export Documentation (PEB)

## Overview

This design document describes the architecture and implementation of the Customs Export Documentation (PEB) module for Gama ERP. The module manages Indonesian export declarations (Pemberitahuan Ekspor Barang), including document creation, line item management with HS code classification, status workflow tracking, and integration with job orders.

The system follows the existing Gama ERP patterns using Next.js App Router, TypeScript, Supabase, and shadcn/ui components. It mirrors the structure of the PIB (import) module for consistency.

## Architecture

```mermaid
graph TB
    subgraph "Frontend Layer"
        LP[List Page<br/>/customs/export]
        DP[Detail Page<br/>/customs/export/[id]]
        NP[New PEB Page<br/>/customs/export/new]
        EP[Edit PEB Page<br/>/customs/export/[id]/edit]
    end
    
    subgraph "Components"
        LC[PEBList]
        SC[SummaryCards]
        DF[PEBDetailView]
        PF[PEBForm]
        IF[PEBItemForm]
        IT[PEBItemsTable]
        ST[StatusTimeline]
        SU[StatusUpdateDialog]
        SH[StatusHistory]
    end
    
    subgraph "Business Logic"
        UA[peb-actions.ts<br/>Server Actions]
        UU[peb-utils.ts<br/>Utilities]
    end
    
    subgraph "Data Layer"
        SB[(Supabase)]
        ET[export_types]
        CO[customs_offices]
        PD[peb_documents]
        PI[peb_items]
        PH[peb_status_history]
    end
    
    LP --> LC
    LP --> SC
    DP --> DF
    DP --> ST
    DP --> IT
    DP --> SH
    NP --> PF
    EP --> PF
    
    LC --> UA
    DF --> UA
    PF --> UA
    IF --> UA
    
    UA --> UU
    UA --> SB
    
    SB --> ET
    SB --> CO
    SB --> PD
    SB --> PI
    SB --> PH
```

## Components and Interfaces

### Page Components

#### PEB List Page (`/customs/export`)
- Displays summary cards with PEB statistics
- Shows filterable, searchable list of PEB documents
- Provides navigation to create new PEB or view details

#### PEB Detail Page (`/customs/export/[id]`)
- Shows status timeline with workflow progress
- Tabbed interface: Details, Items, Documents, History
- Allows status updates and document management

#### New PEB Page (`/customs/export/new`)
- Form for creating PEB documents
- Supports linking to job orders and customers
- Auto-populates data from linked entities

#### Edit PEB Page (`/customs/export/[id]/edit`)
- Form for editing existing PEB documents
- Pre-populated with current document data

### UI Components

```typescript
// Summary Cards Component
interface PEBSummaryCardsProps {
  activePEBs: number;
  pendingApproval: number;
  loaded: number;
  departedMTD: number;
}

// PEB List Component
interface PEBListProps {
  initialData: PEBDocumentWithRelations[];
  filters: PEBFilters;
}

interface PEBFilters {
  status?: PEBStatus;
  customsOfficeId?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

// PEB Detail View Component
interface PEBDetailViewProps {
  peb: PEBDocumentWithRelations;
  items: PEBItem[];
  history: PEBStatusHistory[];
}

// PEB Form Component
interface PEBFormProps {
  initialData?: Partial<PEBDocument>;
  jobOrders?: JobOrder[];
  customers?: Customer[];
  customsOffices?: CustomsOffice[];
  exportTypes?: ExportType[];
  onSubmit: (data: PEBFormData) => Promise<void>;
}

// PEB Items Table Component
interface PEBItemsTableProps {
  pebId: string;
  items: PEBItem[];
  editable: boolean;
  onItemAdd?: (item: PEBItemFormData) => Promise<void>;
  onItemUpdate?: (id: string, item: Partial<PEBItemFormData>) => Promise<void>;
  onItemDelete?: (id: string) => Promise<void>;
}

// Status Timeline Component
interface StatusTimelineProps {
  currentStatus: PEBStatus;
  statusHistory: PEBStatusHistory[];
}

// Status Update Dialog Component
interface StatusUpdateDialogProps {
  pebId: string;
  currentStatus: PEBStatus;
  onStatusUpdate: (newStatus: PEBStatus, data?: StatusUpdateData) => Promise<void>;
}

interface StatusUpdateData {
  pebNumber?: string;
  ajuNumber?: string;
  npeNumber?: string;
  npeDate?: string;
  notes?: string;
}

// Status History Component
interface StatusHistoryProps {
  history: PEBStatusHistory[];
}
```

### Server Actions

```typescript
// lib/peb-actions.ts

// PEB Document CRUD
async function createPEBDocument(data: PEBFormData): Promise<PEBDocument>;
async function updatePEBDocument(id: string, data: Partial<PEBFormData>): Promise<PEBDocument>;
async function deletePEBDocument(id: string): Promise<void>;
async function getPEBDocument(id: string): Promise<PEBDocumentWithRelations>;
async function getPEBDocuments(filters: PEBFilters): Promise<PEBDocumentWithRelations[]>;

// PEB Items CRUD
async function addPEBItem(pebId: string, data: PEBItemFormData): Promise<PEBItem>;
async function updatePEBItem(id: string, data: Partial<PEBItemFormData>): Promise<PEBItem>;
async function deletePEBItem(id: string): Promise<void>;
async function getPEBItems(pebId: string): Promise<PEBItem[]>;

// Status Management
async function updatePEBStatus(
  pebId: string, 
  newStatus: PEBStatus, 
  data?: StatusUpdateData
): Promise<void>;
async function getPEBStatusHistory(pebId: string): Promise<PEBStatusHistory[]>;

// Reference Data
async function getExportTypes(): Promise<ExportType[]>;

// Statistics
async function getPEBStatistics(): Promise<PEBStatistics>;
```

### Utility Functions

```typescript
// lib/peb-utils.ts

// Item Calculations
function calculateItemTotalPrice(quantity: number, unitPrice: number): number;

// Reference Number Generation
function generatePEBInternalRef(sequence: number): string;

// Status Validation
function canTransitionStatus(currentStatus: PEBStatus, newStatus: PEBStatus): boolean;
function getNextAllowedStatuses(currentStatus: PEBStatus): PEBStatus[];

// Formatting
function formatPEBReference(internalRef: string, pebNumber?: string): string;
function formatCurrency(value: number, currency: string): string;

// Validation
function validatePEBDocument(data: PEBFormData): ValidationResult;
function validatePEBItem(data: PEBItemFormData): ValidationResult;
function validateHSCode(hsCode: string): boolean;

// Filtering
function filterPEBDocuments(
  documents: PEBDocument[],
  filters: PEBFilters
): PEBDocument[];

function searchPEBDocuments(
  documents: PEBDocument[],
  searchTerm: string
): PEBDocument[];

// Statistics
function calculatePEBStatistics(documents: PEBDocument[]): PEBStatistics;

// Permissions
function canViewPEB(role: UserRole): boolean;
function canEditPEB(role: UserRole): boolean;
function canDeletePEB(role: UserRole): boolean;
```

## Data Models

### TypeScript Types

```typescript
// types/peb.ts

// Enums
type PEBStatus = 
  | 'draft' 
  | 'submitted' 
  | 'approved' 
  | 'loaded' 
  | 'departed' 
  | 'completed' 
  | 'cancelled';

type TransportMode = 'sea' | 'air' | 'land';

// Reference Data Types
interface ExportType {
  id: string;
  typeCode: string;
  typeName: string;
  description?: string;
  requiresExportDuty: boolean;
  requiresPermit: boolean;
  permitType?: string;
  isActive: boolean;
  createdAt: string;
}

// Main Document Type
interface PEBDocument {
  id: string;
  internalRef: string;
  pebNumber?: string;
  ajuNumber?: string;
  
  // Relations
  jobOrderId?: string;
  customerId?: string;
  
  // Exporter
  exporterName: string;
  exporterNpwp?: string;
  exporterAddress?: string;
  
  // Consignee
  consigneeName?: string;
  consigneeCountry?: string;
  consigneeAddress?: string;
  
  // Classification
  exportTypeId: string;
  customsOfficeId: string;
  
  // Transport
  transportMode: TransportMode;
  vesselName?: string;
  voyageNumber?: string;
  billOfLading?: string;
  awbNumber?: string;
  
  // Ports
  portOfLoading?: string;
  portOfDischarge?: string;
  finalDestination?: string;
  
  // Dates
  etdDate?: string;
  atdDate?: string;
  
  // Cargo
  totalPackages?: number;
  packageType?: string;
  grossWeightKg?: number;
  
  // Values
  currency: string;
  fobValue: number;
  
  // Status
  status: PEBStatus;
  submittedAt?: string;
  approvedAt?: string;
  loadedAt?: string;
  
  // NPE (Export Approval)
  npeNumber?: string;
  npeDate?: string;
  
  // Documents
  documents: PEBAttachment[];
  notes?: string;
  
  // Audit
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

interface PEBDocumentWithRelations extends PEBDocument {
  exportType?: ExportType;
  customsOffice?: CustomsOffice;
  customer?: Customer;
  jobOrder?: JobOrder;
  itemCount?: number;
}

// Line Item Type
interface PEBItem {
  id: string;
  pebId: string;
  itemNumber: number;
  
  // Classification
  hsCode: string;
  hsDescription?: string;
  
  // Description
  goodsDescription: string;
  brand?: string;
  specifications?: string;
  
  // Quantity
  quantity: number;
  unit: string;
  
  // Weight
  netWeightKg?: number;
  grossWeightKg?: number;
  
  // Value
  unitPrice: number;
  totalPrice: number;
  currency: string;
  
  createdAt: string;
}

// Status History Type
interface PEBStatusHistory {
  id: string;
  pebId: string;
  previousStatus?: PEBStatus;
  newStatus: PEBStatus;
  notes?: string;
  changedBy?: string;
  changedAt: string;
}

// Attachment Type
interface PEBAttachment {
  id: string;
  name: string;
  type: string;
  url: string;
  uploadedAt: string;
}

// Form Data Types
interface PEBFormData {
  jobOrderId?: string;
  customerId?: string;
  exporterName: string;
  exporterNpwp?: string;
  exporterAddress?: string;
  consigneeName?: string;
  consigneeCountry?: string;
  consigneeAddress?: string;
  exportTypeId: string;
  customsOfficeId: string;
  transportMode: TransportMode;
  vesselName?: string;
  voyageNumber?: string;
  billOfLading?: string;
  awbNumber?: string;
  portOfLoading?: string;
  portOfDischarge?: string;
  finalDestination?: string;
  etdDate?: string;
  totalPackages?: number;
  packageType?: string;
  grossWeightKg?: number;
  currency: string;
  fobValue: number;
  notes?: string;
}

interface PEBItemFormData {
  hsCode: string;
  hsDescription?: string;
  goodsDescription: string;
  brand?: string;
  specifications?: string;
  quantity: number;
  unit: string;
  netWeightKg?: number;
  grossWeightKg?: number;
  unitPrice: number;
  currency?: string;
}

// Statistics Type
interface PEBStatistics {
  activePEBs: number;
  pendingApproval: number;
  loaded: number;
  departedMTD: number;
}

// Validation Types
interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

interface ValidationError {
  field: string;
  message: string;
}
```

### Database Schema

The database schema follows the specification provided:

```sql
-- export_types: Reference table for export categories
-- peb_documents: Main PEB document table with all fields
-- peb_items: Line items with HS codes and values
-- peb_status_history: Audit trail for status changes
```

Key relationships:
- `peb_documents` → `job_orders` (optional, many-to-one)
- `peb_documents` → `customers` (optional, many-to-one)
- `peb_documents` → `export_types` (required, many-to-one)
- `peb_documents` → `customs_offices` (required, many-to-one)
- `peb_items` → `peb_documents` (required, many-to-one, cascade delete)
- `peb_status_history` → `peb_documents` (required, many-to-one)


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Reference Format Validation

*For any* generated PEB internal reference, it SHALL match the format 'PEB-YYYY-NNNNN' where YYYY is a 4-digit year and NNNNN is a 5-digit zero-padded sequence number.

**Validates: Requirements 2.1**

### Property 2: Required Field Validation

*For any* PEB document submission, if exporter name, export type, or customs office is missing, the validation SHALL fail and return appropriate error messages.

**Validates: Requirements 2.5**

### Property 3: Sequential Item Numbers

*For any* PEB document, when items are added sequentially, item numbers SHALL be assigned in ascending order starting from 1 with no gaps.

**Validates: Requirements 3.1**

### Property 4: Item Required Fields Validation

*For any* PEB item submission, if HS code or goods description is missing, the validation SHALL fail and return appropriate error messages.

**Validates: Requirements 3.2**

### Property 5: Item Total Price Calculation

*For any* PEB item with quantity and unit price, the total price SHALL equal quantity × unit price.

**Validates: Requirements 3.5**

### Property 6: Initial Status Invariant

*For any* newly created PEB document, the initial status SHALL be 'draft'.

**Validates: Requirements 4.2**

### Property 7: Status History Completeness

*For any* status change on a PEB document, a status history record SHALL be created containing the previous status, new status, timestamp, and user who made the change.

**Validates: Requirements 4.6**

### Property 8: Statistics Calculation Correctness

*For any* collection of PEB documents, the statistics SHALL correctly count:
- Active PEBs: documents with status in ['draft', 'submitted', 'approved', 'loaded']
- Pending Approval: documents with status 'submitted'
- Loaded: documents with status 'loaded'
- Departed MTD: documents with status 'departed' or 'completed' within current month

**Validates: Requirements 5.1**

### Property 9: Filter Correctness

*For any* filter criteria (status, customs office, date range) applied to a list of PEB documents, all returned documents SHALL match all specified filter criteria.

**Validates: Requirements 5.3**

### Property 10: Search Correctness

*For any* search term applied to PEB documents, all returned documents SHALL contain the search term in at least one of: internal reference, PEB number, exporter name, or goods description.

**Validates: Requirements 5.4**

### Property 11: Role-Based Permission Consistency

*For any* user role and PEB action:
- View: Owner, Admin, Manager, Customs SHALL have access
- Create/Edit: Owner, Admin, Manager, Customs SHALL have access; Ops, Finance SHALL NOT
- Delete: Owner, Admin SHALL have access; Manager, Customs, Ops, Finance SHALL NOT

**Validates: Requirements 8.1, 8.2, 8.4**

## Error Handling

### Validation Errors

| Error Condition | Error Message | Recovery Action |
|----------------|---------------|-----------------|
| Missing exporter name | "Exporter name is required" | Highlight field, prevent submission |
| Missing export type | "Export type must be selected" | Highlight field, prevent submission |
| Missing customs office | "Customs office must be selected" | Highlight field, prevent submission |
| Invalid FOB value | "FOB value must be a positive number" | Highlight field, show valid format |
| Missing HS code on item | "HS code is required for all items" | Highlight field, prevent submission |
| Missing goods description | "Goods description is required" | Highlight field, prevent submission |
| Invalid quantity | "Quantity must be a positive number" | Highlight field, show valid format |
| Invalid unit price | "Unit price must be a positive number" | Highlight field, show valid format |

### Status Transition Errors

| Error Condition | Error Message | Recovery Action |
|----------------|---------------|-----------------|
| Invalid status transition | "Cannot transition from {current} to {target}" | Show allowed transitions |
| Missing AJU number for submit | "AJU number required for submission" | Prompt for AJU number |
| Missing NPE number for approval | "NPE number and date required" | Prompt for NPE details |

### Permission Errors

| Error Condition | Error Message | Recovery Action |
|----------------|---------------|-----------------|
| Unauthorized view | "You don't have permission to view PEB documents" | Redirect to dashboard |
| Unauthorized create | "You don't have permission to create PEB documents" | Hide create button, show message |
| Unauthorized edit | "You don't have permission to edit this document" | Disable edit controls |
| Unauthorized delete | "You don't have permission to delete PEB documents" | Hide delete option |

### Database Errors

| Error Condition | Error Message | Recovery Action |
|----------------|---------------|-----------------|
| Duplicate reference | "Internal reference already exists" | Retry with new sequence |
| Foreign key violation | "Referenced record not found" | Validate references before save |
| Connection error | "Unable to connect to database" | Show retry option |

## Testing Strategy

### Unit Tests

Unit tests will cover specific examples and edge cases:

1. **Utility Functions**
   - Reference format generation
   - Status transition validation
   - Item total price calculation

2. **Validation Functions**
   - Required field validation
   - Numeric field validation
   - HS code format validation

3. **Filter and Search Functions**
   - Empty filter criteria
   - Multiple filter combinations
   - Search with special characters

### Property-Based Tests

Property-based tests will use `fast-check` library with minimum 100 iterations per test.

Each property test will be tagged with:
- **Feature: customs-export-documentation**
- **Property {number}: {property_text}**
- **Validates: Requirements {X.Y}**

Property tests will cover:
1. Reference format validation
2. Required field validation
3. Sequential item numbering
4. Item required fields validation
5. Item total price calculation
6. Initial status invariant
7. Status history completeness
8. Statistics calculation correctness
9. Filter correctness
10. Search correctness
11. Role-based permissions

### Integration Tests

Integration tests will verify:
1. PEB document CRUD operations with database
2. Item management with automatic calculations
3. Status workflow transitions
4. Document attachment handling
5. Permission enforcement across roles

### Test Data Generators

```typescript
// Generators for property-based testing
const pebDocumentGenerator = fc.record({
  exporterName: fc.string({ minLength: 1, maxLength: 200 }),
  fobValue: fc.float({ min: 0, max: 10000000 }),
  currency: fc.constantFrom('USD', 'EUR', 'IDR'),
});

const pebItemGenerator = fc.record({
  hsCode: fc.stringMatching(/^\d{4}\.\d{2}\.\d{2}$/),
  goodsDescription: fc.string({ minLength: 1, maxLength: 500 }),
  quantity: fc.float({ min: 0.001, max: 10000 }),
  unitPrice: fc.float({ min: 0.01, max: 1000000 }),
});

const roleGenerator = fc.constantFrom(
  'owner', 'admin', 'manager', 'customs', 'ops', 'finance'
);

const pebStatusGenerator = fc.constantFrom(
  'draft', 'submitted', 'approved', 'loaded',
  'departed', 'completed', 'cancelled'
);
```
