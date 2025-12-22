# Design Document: Customs Import Documentation (PIB)

## Overview

This design document describes the architecture and implementation of the Customs Import Documentation (PIB) module for Gama ERP. The module manages Indonesian import declarations (Pemberitahuan Impor Barang), including document creation, line item management with HS code classification, automatic duty calculations, status workflow tracking, and integration with job orders.

The system follows the existing Gama ERP patterns using Next.js App Router, TypeScript, Supabase, and shadcn/ui components.

## Architecture

```mermaid
graph TB
    subgraph "Frontend Layer"
        LP[List Page<br/>/customs/import]
        DP[Detail Page<br/>/customs/import/[id]]
        NP[New PIB Page<br/>/customs/import/new]
    end
    
    subgraph "Components"
        LC[PIBList]
        SC[SummaryCards]
        DF[PIBDetailView]
        PF[PIBForm]
        IF[PIBItemForm]
        IT[PIBItemsTable]
        DC[DutiesCalculator]
        ST[StatusTimeline]
        SU[StatusUpdateDialog]
    end
    
    subgraph "Business Logic"
        UA[pib-actions.ts<br/>Server Actions]
        UU[pib-utils.ts<br/>Utilities]
    end
    
    subgraph "Data Layer"
        SB[(Supabase)]
        CO[customs_offices]
        IT2[import_types]
        PD[pib_documents]
        PI[pib_items]
        PH[pib_status_history]
    end
    
    LP --> LC
    LP --> SC
    DP --> DF
    DP --> ST
    DP --> IT
    NP --> PF
    
    LC --> UA
    DF --> UA
    PF --> UA
    IF --> UA
    
    UA --> UU
    UA --> SB
    
    SB --> CO
    SB --> IT2
    SB --> PD
    SB --> PI
    SB --> PH
```

## Components and Interfaces

### Page Components

#### PIB List Page (`/customs/import`)
- Displays summary cards with PIB statistics
- Shows filterable, searchable list of PIB documents
- Provides navigation to create new PIB or view details

#### PIB Detail Page (`/customs/import/[id]`)
- Shows status timeline with workflow progress
- Tabbed interface: Details, Items, Duties, Documents, History
- Allows status updates and document management

#### New PIB Page (`/customs/import/new`)
- Multi-step form for creating PIB documents
- Supports linking to job orders and customers
- Auto-populates data from linked entities

### UI Components

```typescript
// Summary Cards Component
interface PIBSummaryCardsProps {
  activePIBs: number;
  pendingClearance: number;
  inTransit: number;
  releasedMTD: number;
}

// PIB List Component
interface PIBListProps {
  initialData: PIBDocumentWithRelations[];
  filters: PIBFilters;
}

interface PIBFilters {
  status?: PIBStatus;
  customsOfficeId?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

// PIB Detail View Component
interface PIBDetailViewProps {
  pib: PIBDocumentWithRelations;
  items: PIBItem[];
  history: PIBStatusHistory[];
}

// PIB Form Component
interface PIBFormProps {
  initialData?: Partial<PIBDocument>;
  jobOrders?: JobOrder[];
  customers?: Customer[];
  customsOffices?: CustomsOffice[];
  importTypes?: ImportType[];
  onSubmit: (data: PIBFormData) => Promise<void>;
}

// PIB Items Table Component
interface PIBItemsTableProps {
  pibId: string;
  items: PIBItem[];
  editable: boolean;
  onItemAdd?: (item: PIBItemFormData) => Promise<void>;
  onItemUpdate?: (id: string, item: Partial<PIBItemFormData>) => Promise<void>;
  onItemDelete?: (id: string) => Promise<void>;
}

// Status Timeline Component
interface StatusTimelineProps {
  currentStatus: PIBStatus;
  statusHistory: PIBStatusHistory[];
}

// Status Update Dialog Component
interface StatusUpdateDialogProps {
  pibId: string;
  currentStatus: PIBStatus;
  onStatusUpdate: (newStatus: PIBStatus, data?: StatusUpdateData) => Promise<void>;
}

interface StatusUpdateData {
  pibNumber?: string;
  ajuNumber?: string;
  sppbNumber?: string;
  sppbDate?: string;
  notes?: string;
}

// Duties Summary Component
interface DutiesSummaryProps {
  fobValue: number;
  freightValue: number;
  insuranceValue: number;
  cifValue: number;
  exchangeRate: number;
  cifValueIdr: number;
  beaMasuk: number;
  ppn: number;
  pphImport: number;
  totalDuties: number;
  currency: string;
}
```

### Server Actions

```typescript
// lib/pib-actions.ts

// PIB Document CRUD
async function createPIBDocument(data: PIBFormData): Promise<PIBDocument>;
async function updatePIBDocument(id: string, data: Partial<PIBFormData>): Promise<PIBDocument>;
async function deletePIBDocument(id: string): Promise<void>;
async function getPIBDocument(id: string): Promise<PIBDocumentWithRelations>;
async function getPIBDocuments(filters: PIBFilters): Promise<PIBDocumentWithRelations[]>;

// PIB Items CRUD
async function addPIBItem(pibId: string, data: PIBItemFormData): Promise<PIBItem>;
async function updatePIBItem(id: string, data: Partial<PIBItemFormData>): Promise<PIBItem>;
async function deletePIBItem(id: string): Promise<void>;
async function getPIBItems(pibId: string): Promise<PIBItem[]>;

// Status Management
async function updatePIBStatus(
  pibId: string, 
  newStatus: PIBStatus, 
  data?: StatusUpdateData
): Promise<void>;
async function getPIBStatusHistory(pibId: string): Promise<PIBStatusHistory[]>;

// Reference Data
async function getCustomsOffices(): Promise<CustomsOffice[]>;
async function getImportTypes(): Promise<ImportType[]>;

// Statistics
async function getPIBStatistics(): Promise<PIBStatistics>;
```

### Utility Functions

```typescript
// lib/pib-utils.ts

// Duty Calculations
function calculateItemDuties(
  totalPrice: number,
  bmRate: number,
  ppnRate: number,
  pphRate: number
): ItemDuties;

function calculateCIFValue(
  fobValue: number,
  freightValue: number,
  insuranceValue: number
): number;

function convertToIDR(value: number, exchangeRate: number): number;

function aggregatePIBDuties(items: PIBItem[]): PIBDutiesTotals;

// Reference Number Generation
function generatePIBInternalRef(sequence: number): string;

// Status Validation
function canTransitionStatus(currentStatus: PIBStatus, newStatus: PIBStatus): boolean;
function getNextAllowedStatuses(currentStatus: PIBStatus): PIBStatus[];

// Formatting
function formatPIBReference(internalRef: string, pibNumber?: string): string;
function formatCurrency(value: number, currency: string): string;
function formatDutyAmount(value: number): string;

// Validation
function validatePIBDocument(data: PIBFormData): ValidationResult;
function validatePIBItem(data: PIBItemFormData): ValidationResult;
function validateHSCode(hsCode: string): boolean;

// Filtering
function filterPIBDocuments(
  documents: PIBDocument[],
  filters: PIBFilters
): PIBDocument[];

function searchPIBDocuments(
  documents: PIBDocument[],
  searchTerm: string
): PIBDocument[];
```

## Data Models

### TypeScript Types

```typescript
// types/pib.ts

// Enums
type PIBStatus = 
  | 'draft' 
  | 'submitted' 
  | 'document_check' 
  | 'physical_check' 
  | 'duties_paid' 
  | 'released' 
  | 'completed' 
  | 'cancelled';

type TransportMode = 'sea' | 'air' | 'land';

type CustomsOfficeType = 'kppbc' | 'kpu';

// Reference Data Types
interface CustomsOffice {
  id: string;
  officeCode: string;
  officeName: string;
  officeType: CustomsOfficeType;
  city?: string;
  address?: string;
  phone?: string;
  isActive: boolean;
  createdAt: string;
}

interface ImportType {
  id: string;
  typeCode: string;
  typeName: string;
  description?: string;
  defaultBmRate?: number;
  defaultPpnRate: number;
  defaultPphRate?: number;
  requiresPermit: boolean;
  permitType?: string;
  isActive: boolean;
  createdAt: string;
}

// Main Document Type
interface PIBDocument {
  id: string;
  internalRef: string;
  pibNumber?: string;
  ajuNumber?: string;
  
  // Relations
  jobOrderId?: string;
  customerId?: string;
  
  // Importer
  importerName: string;
  importerNpwp?: string;
  importerAddress?: string;
  
  // Supplier
  supplierName?: string;
  supplierCountry?: string;
  
  // Classification
  importTypeId: string;
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
  
  // Dates
  etaDate?: string;
  ataDate?: string;
  
  // Cargo
  totalPackages?: number;
  packageType?: string;
  grossWeightKg?: number;
  
  // Values
  currency: string;
  fobValue: number;
  freightValue?: number;
  insuranceValue?: number;
  cifValue: number;
  
  // Exchange
  exchangeRate?: number;
  cifValueIdr?: number;
  
  // Duties
  beaMasuk: number;
  ppn: number;
  pphImport: number;
  totalDuties: number;
  
  // Status
  status: PIBStatus;
  submittedAt?: string;
  dutiesPaidAt?: string;
  releasedAt?: string;
  
  // SPPB
  sppbNumber?: string;
  sppbDate?: string;
  
  // Documents
  documents: PIBAttachment[];
  notes?: string;
  
  // Audit
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

interface PIBDocumentWithRelations extends PIBDocument {
  importType?: ImportType;
  customsOffice?: CustomsOffice;
  customer?: Customer;
  jobOrder?: JobOrder;
  itemCount?: number;
}

// Line Item Type
interface PIBItem {
  id: string;
  pibId: string;
  itemNumber: number;
  
  // Classification
  hsCode: string;
  hsDescription?: string;
  
  // Description
  goodsDescription: string;
  brand?: string;
  typeModel?: string;
  specifications?: string;
  
  // Origin
  countryOfOrigin?: string;
  
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
  
  // Duty Rates
  bmRate: number;
  ppnRate: number;
  pphRate: number;
  
  // Calculated Duties
  beaMasuk: number;
  ppn: number;
  pphImport: number;
  
  // Permits
  requiresPermit: boolean;
  permitType?: string;
  permitNumber?: string;
  permitDate?: string;
  
  createdAt: string;
}

// Status History Type
interface PIBStatusHistory {
  id: string;
  pibId: string;
  previousStatus?: PIBStatus;
  newStatus: PIBStatus;
  notes?: string;
  changedBy?: string;
  changedAt: string;
}

// Attachment Type
interface PIBAttachment {
  id: string;
  name: string;
  type: string;
  url: string;
  uploadedAt: string;
}

// Form Data Types
interface PIBFormData {
  jobOrderId?: string;
  customerId?: string;
  importerName: string;
  importerNpwp?: string;
  importerAddress?: string;
  supplierName?: string;
  supplierCountry?: string;
  importTypeId: string;
  customsOfficeId: string;
  transportMode: TransportMode;
  vesselName?: string;
  voyageNumber?: string;
  billOfLading?: string;
  awbNumber?: string;
  portOfLoading?: string;
  portOfDischarge?: string;
  etaDate?: string;
  totalPackages?: number;
  packageType?: string;
  grossWeightKg?: number;
  currency: string;
  fobValue: number;
  freightValue?: number;
  insuranceValue?: number;
  exchangeRate?: number;
  notes?: string;
}

interface PIBItemFormData {
  hsCode: string;
  hsDescription?: string;
  goodsDescription: string;
  brand?: string;
  typeModel?: string;
  specifications?: string;
  countryOfOrigin?: string;
  quantity: number;
  unit: string;
  netWeightKg?: number;
  grossWeightKg?: number;
  unitPrice: number;
  currency?: string;
  bmRate?: number;
  ppnRate?: number;
  pphRate?: number;
  requiresPermit?: boolean;
  permitType?: string;
  permitNumber?: string;
  permitDate?: string;
}

// Calculation Types
interface ItemDuties {
  beaMasuk: number;
  ppn: number;
  pphImport: number;
  total: number;
}

interface PIBDutiesTotals {
  beaMasuk: number;
  ppn: number;
  pphImport: number;
  totalDuties: number;
}

interface PIBStatistics {
  activePIBs: number;
  pendingClearance: number;
  inTransit: number;
  releasedMTD: number;
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
-- customs_offices: Reference table for customs offices
-- import_types: Reference table for import categories with default rates
-- pib_documents: Main PIB document table with all fields
-- pib_items: Line items with HS codes and duty calculations
-- pib_status_history: Audit trail for status changes
-- active_pib_documents: View for active documents with relations
```

Key relationships:
- `pib_documents` → `job_orders` (optional, many-to-one)
- `pib_documents` → `customers` (optional, many-to-one)
- `pib_documents` → `import_types` (required, many-to-one)
- `pib_documents` → `customs_offices` (required, many-to-one)
- `pib_items` → `pib_documents` (required, many-to-one, cascade delete)
- `pib_status_history` → `pib_documents` (required, many-to-one)



## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: CIF Value Calculation

*For any* PIB document with FOB value, freight value, and insurance value, the CIF value SHALL equal FOB + freight + insurance.

**Validates: Requirements 3.10**

### Property 2: Item Total Price Calculation

*For any* PIB item with quantity and unit price, the total price SHALL equal quantity × unit price.

**Validates: Requirements 4.5**

### Property 3: Item Duty Calculation

*For any* PIB item with total price and duty rates (bm_rate, ppn_rate, pph_rate):
- Bea Masuk SHALL equal total_price × (bm_rate / 100)
- PPN SHALL equal (total_price + Bea_Masuk) × (ppn_rate / 100)
- PPh Import SHALL equal (total_price + Bea_Masuk) × (pph_rate / 100)

**Validates: Requirements 4.7**

### Property 4: PIB Duty Aggregation

*For any* PIB document with multiple items, the PIB's total duties SHALL equal the sum of all item duties:
- PIB.beaMasuk = Σ(item.beaMasuk)
- PIB.ppn = Σ(item.ppn)
- PIB.pphImport = Σ(item.pphImport)
- PIB.totalDuties = PIB.beaMasuk + PIB.ppn + PIB.pphImport

**Validates: Requirements 5.1, 5.2, 5.3**

### Property 5: Currency Conversion

*For any* PIB document with CIF value and exchange rate, the CIF value in IDR SHALL equal CIF × exchange_rate.

**Validates: Requirements 5.4**

### Property 6: Sequential Item Numbers

*For any* PIB document, when items are added sequentially, item numbers SHALL be assigned in ascending order starting from 1 with no gaps.

**Validates: Requirements 4.1**

### Property 7: Initial Status Invariant

*For any* newly created PIB document, the initial status SHALL be 'draft'.

**Validates: Requirements 6.2**

### Property 8: Status History Completeness

*For any* status change on a PIB document, a status history record SHALL be created containing the previous status, new status, timestamp, and user who made the change.

**Validates: Requirements 6.6**

### Property 9: Document Filtering Correctness

*For any* filter criteria (status, customs office, date range) applied to a list of PIB documents, all returned documents SHALL match all specified filter criteria.

**Validates: Requirements 7.3**

### Property 10: Document Search Correctness

*For any* search term applied to PIB documents, all returned documents SHALL contain the search term in at least one of: internal reference, PIB number, importer name, or goods description.

**Validates: Requirements 7.4**

### Property 11: Reference Format Validation

*For any* generated PIB internal reference, it SHALL match the format 'PIB-YYYY-NNNNN' where YYYY is a 4-digit year and NNNNN is a 5-digit zero-padded sequence number.

**Validates: Requirements 3.1**

### Property 12: Role-Based Permission Consistency

*For any* user role and PIB action:
- View: Owner, Admin, Manager, Customs, Ops, Finance SHALL have access
- Create/Edit: Owner, Admin, Manager, Customs SHALL have access; Ops, Finance SHALL NOT
- Delete: Owner, Admin SHALL have access; Manager, Customs, Ops, Finance SHALL NOT
- View Duties: Owner, Admin, Manager, Customs, Finance SHALL have access; Ops SHALL NOT

**Validates: Requirements 10.1, 10.2, 10.3, 10.4, 10.5, 10.6**

## Error Handling

### Validation Errors

| Error Condition | Error Message | Recovery Action |
|----------------|---------------|-----------------|
| Missing importer name | "Importer name is required" | Highlight field, prevent submission |
| Missing import type | "Import type must be selected" | Highlight field, prevent submission |
| Missing customs office | "Customs office must be selected" | Highlight field, prevent submission |
| Invalid FOB value | "FOB value must be a positive number" | Highlight field, show valid format |
| Missing HS code on item | "HS code is required for all items" | Highlight field, prevent submission |
| Missing goods description | "Goods description is required" | Highlight field, prevent submission |
| Invalid quantity | "Quantity must be a positive number" | Highlight field, show valid format |
| Invalid unit price | "Unit price must be a positive number" | Highlight field, show valid format |
| Invalid exchange rate | "Exchange rate must be a positive number" | Highlight field, show valid format |

### Status Transition Errors

| Error Condition | Error Message | Recovery Action |
|----------------|---------------|-----------------|
| Invalid status transition | "Cannot transition from {current} to {target}" | Show allowed transitions |
| Missing AJU number for submit | "AJU number required for submission" | Prompt for AJU number |
| Missing PIB number for duties_paid | "PIB number required" | Prompt for PIB number |
| Missing SPPB for release | "SPPB number and date required" | Prompt for SPPB details |

### Permission Errors

| Error Condition | Error Message | Recovery Action |
|----------------|---------------|-----------------|
| Unauthorized view | "You don't have permission to view PIB documents" | Redirect to dashboard |
| Unauthorized create | "You don't have permission to create PIB documents" | Hide create button, show message |
| Unauthorized edit | "You don't have permission to edit this document" | Disable edit controls |
| Unauthorized delete | "You don't have permission to delete PIB documents" | Hide delete option |

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
   - CIF calculation with zero freight/insurance
   - Duty calculation with zero rates
   - Reference format generation
   - Status transition validation

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
- **Feature: customs-import-documentation**
- **Property {number}: {property_text}**
- **Validates: Requirements {X.Y}**

Property tests will cover:
1. CIF value calculation invariant
2. Item total price calculation
3. Item duty calculation formulas
4. PIB duty aggregation
5. Currency conversion
6. Sequential item numbering
7. Initial status invariant
8. Status history completeness
9. Filter correctness
10. Search correctness
11. Reference format validation
12. Role-based permissions

### Integration Tests

Integration tests will verify:
1. PIB document CRUD operations with database
2. Item management with automatic recalculation
3. Status workflow transitions
4. Document attachment handling
5. Permission enforcement across roles

### Test Data Generators

```typescript
// Generators for property-based testing
const pibDocumentGenerator = fc.record({
  fobValue: fc.float({ min: 0, max: 10000000 }),
  freightValue: fc.float({ min: 0, max: 1000000 }),
  insuranceValue: fc.float({ min: 0, max: 500000 }),
  exchangeRate: fc.float({ min: 10000, max: 20000 }),
});

const pibItemGenerator = fc.record({
  quantity: fc.float({ min: 0.001, max: 10000 }),
  unitPrice: fc.float({ min: 0.01, max: 1000000 }),
  bmRate: fc.float({ min: 0, max: 50 }),
  ppnRate: fc.float({ min: 0, max: 15 }),
  pphRate: fc.float({ min: 0, max: 10 }),
});

const roleGenerator = fc.constantFrom(
  'owner', 'admin', 'manager', 'customs', 'ops', 'finance'
);

const pibStatusGenerator = fc.constantFrom(
  'draft', 'submitted', 'document_check', 'physical_check',
  'duties_paid', 'released', 'completed', 'cancelled'
);
```
