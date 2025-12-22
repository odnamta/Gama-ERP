# Design Document: v0.47 HSE - Safety Documentation

## Overview

This design document describes the implementation of the HSE Safety Documentation system for managing safety-related documents including JSAs, SOPs, safety permits, and MSDS. The system provides version control, expiry tracking, approval workflows, and employee acknowledgment tracking.

## Architecture

The system follows the existing Gama ERP architecture:

```
┌─────────────────────────────────────────────────────────────────┐
│                        Next.js App Router                        │
├─────────────────────────────────────────────────────────────────┤
│  Pages                    │  Components                          │
│  - /hse/documents         │  - DocumentSummaryCards              │
│  - /hse/documents/new     │  - DocumentList                      │
│  - /hse/documents/[id]    │  - DocumentForm                      │
│  - /hse/permits           │  - JSAHazardTable                    │
│  - /hse/permits/new       │  - PermitForm                        │
│  - /hse/permits/[id]      │  - AcknowledgmentList                │
├─────────────────────────────────────────────────────────────────┤
│  Server Actions           │  Utilities                           │
│  - safety-document-       │  - safety-document-utils.ts          │
│    actions.ts             │  - Validation functions              │
│  - safety-permit-         │  - Status/color helpers              │
│    actions.ts             │  - Expiry calculations               │
├─────────────────────────────────────────────────────────────────┤
│                         Supabase                                 │
│  - safety_document_categories                                    │
│  - safety_documents                                              │
│  - safety_document_acknowledgments                               │
│  - jsa_hazards                                                   │
│  - safety_permits                                                │
└─────────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### Server Actions

#### safety-document-actions.ts

```typescript
// Document CRUD
async function createSafetyDocument(input: CreateDocumentInput): Promise<Result<SafetyDocument>>
async function getSafetyDocument(id: string): Promise<Result<SafetyDocument>>
async function getSafetyDocuments(filters: DocumentFilters): Promise<Result<SafetyDocument[]>>
async function updateSafetyDocument(id: string, input: UpdateDocumentInput): Promise<Result<void>>

// Version control
async function createNewVersion(documentId: string, input: CreateDocumentInput): Promise<Result<SafetyDocument>>

// Approval workflow
async function submitForReview(documentId: string): Promise<Result<void>>
async function approveDocument(documentId: string): Promise<Result<void>>
async function rejectDocument(documentId: string, reason: string): Promise<Result<void>>

// Acknowledgments
async function acknowledgeDocument(documentId: string, quizScore?: number): Promise<Result<void>>
async function getDocumentAcknowledgments(documentId: string): Promise<Result<Acknowledgment[]>>

// JSA Hazards
async function addJSAHazard(documentId: string, hazard: JSAHazardInput): Promise<Result<JSAHazard>>
async function updateJSAHazard(hazardId: string, hazard: JSAHazardInput): Promise<Result<void>>
async function deleteJSAHazard(hazardId: string): Promise<Result<void>>
async function getJSAHazards(documentId: string): Promise<Result<JSAHazard[]>>

// Statistics
async function getDocumentStatistics(): Promise<Result<DocumentStatistics>>
async function getExpiringDocuments(days: number): Promise<Result<SafetyDocument[]>>
```

#### safety-permit-actions.ts

```typescript
// Permit CRUD
async function createSafetyPermit(input: CreatePermitInput): Promise<Result<SafetyPermit>>
async function getSafetyPermit(id: string): Promise<Result<SafetyPermit>>
async function getSafetyPermits(filters: PermitFilters): Promise<Result<SafetyPermit[]>>

// Approval workflow
async function approveBySupervisor(permitId: string): Promise<Result<void>>
async function approveByHSE(permitId: string): Promise<Result<void>>
async function activatePermit(permitId: string): Promise<Result<void>>
async function closePermit(permitId: string, notes: string): Promise<Result<void>>
async function cancelPermit(permitId: string, reason: string): Promise<Result<void>>

// Statistics
async function getPermitStatistics(): Promise<Result<PermitStatistics>>
```

### Utility Functions

#### safety-document-utils.ts

```typescript
// Validation
function validateDocumentInput(input: CreateDocumentInput, category: DocumentCategory): ValidationResult
function validatePermitInput(input: CreatePermitInput): ValidationResult
function validateJSAHazardInput(input: JSAHazardInput): ValidationResult

// Expiry calculations
function calculateExpiryDate(effectiveDate: Date, defaultValidityDays: number): Date
function getValidityStatus(expiryDate: Date | null): 'valid' | 'expiring_soon' | 'expired'
function getDaysUntilExpiry(expiryDate: Date): number
function isExpiringSoon(expiryDate: Date, thresholdDays: number): boolean

// Status helpers
function getDocumentStatusColor(status: DocumentStatus): string
function getDocumentStatusLabel(status: DocumentStatus): string
function getPermitStatusColor(status: PermitStatus): string
function getPermitStatusLabel(status: PermitStatus): string
function getRiskLevelColor(level: RiskLevel): string
function getRiskLevelLabel(level: RiskLevel): string

// Statistics
function countByStatus(documents: SafetyDocument[]): Record<DocumentStatus, number>
function countByCategory(documents: SafetyDocument[]): Record<string, number>
function countExpiringDocuments(documents: SafetyDocument[], days: number): number
function calculateAcknowledgmentRate(total: number, acknowledged: number): number

// Category helpers
function getCategoryLabel(categoryCode: string): string
function getPermitTypeLabel(permitType: PermitType): string
```

## Data Models

### TypeScript Interfaces

```typescript
// Enums
type DocumentStatus = 'draft' | 'pending_review' | 'approved' | 'expired' | 'superseded' | 'archived';
type PermitStatus = 'pending' | 'approved' | 'active' | 'completed' | 'cancelled' | 'expired';
type PermitType = 'hot_work' | 'confined_space' | 'height_work' | 'excavation' | 'electrical' | 'lifting';
type RiskLevel = 'low' | 'medium' | 'high' | 'extreme';

// Document Category
interface DocumentCategory {
  id: string;
  categoryCode: string;
  categoryName: string;
  description?: string;
  requiresExpiry: boolean;
  defaultValidityDays?: number;
  requiresApproval: boolean;
  isActive: boolean;
  displayOrder: number;
}

// Safety Document
interface SafetyDocument {
  id: string;
  documentNumber: string;
  categoryId: string;
  title: string;
  description?: string;
  version: string;
  revisionNumber: number;
  previousVersionId?: string;
  content?: string;
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  applicableLocations: string[];
  applicableDepartments: string[];
  applicableJobTypes: string[];
  effectiveDate: string;
  expiryDate?: string;
  status: DocumentStatus;
  preparedBy?: string;
  preparedAt?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  approvedBy?: string;
  approvedAt?: string;
  relatedDocuments: string[];
  requiresAcknowledgment: boolean;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
  // Joined fields
  categoryName?: string;
  categoryCode?: string;
  preparedByName?: string;
  reviewedByName?: string;
  approvedByName?: string;
  validityStatus?: 'valid' | 'expiring_soon' | 'expired';
  daysUntilExpiry?: number;
}

// JSA Hazard
interface JSAHazard {
  id: string;
  documentId: string;
  stepNumber: number;
  workStep: string;
  hazards: string;
  consequences?: string;
  riskLevel?: RiskLevel;
  controlMeasures: string;
  responsible?: string;
  createdAt: string;
}

// Acknowledgment
interface DocumentAcknowledgment {
  id: string;
  documentId: string;
  employeeId: string;
  acknowledgedAt: string;
  quizScore?: number;
  quizPassed?: boolean;
  // Joined fields
  employeeName?: string;
}

// Safety Permit
interface SafetyPermit {
  id: string;
  permitNumber: string;
  documentId?: string;
  permitType: PermitType;
  workDescription: string;
  workLocation: string;
  jobOrderId?: string;
  validFrom: string;
  validTo: string;
  specialPrecautions?: string;
  requiredPPE: string[];
  emergencyProcedures?: string;
  requestedBy: string;
  requestedAt: string;
  supervisorApprovedBy?: string;
  supervisorApprovedAt?: string;
  hseApprovedBy?: string;
  hseApprovedAt?: string;
  status: PermitStatus;
  closedBy?: string;
  closedAt?: string;
  closureNotes?: string;
  createdAt: string;
  // Joined fields
  requestedByName?: string;
  supervisorApprovedByName?: string;
  hseApprovedByName?: string;
  closedByName?: string;
  jobOrderNumber?: string;
}

// Input types
interface CreateDocumentInput {
  categoryId: string;
  title: string;
  description?: string;
  content?: string;
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  applicableLocations?: string[];
  applicableDepartments?: string[];
  applicableJobTypes?: string[];
  effectiveDate: string;
  expiryDate?: string;
  relatedDocuments?: string[];
  requiresAcknowledgment?: boolean;
}

interface CreatePermitInput {
  permitType: PermitType;
  workDescription: string;
  workLocation: string;
  jobOrderId?: string;
  validFrom: string;
  validTo: string;
  specialPrecautions?: string;
  requiredPPE?: string[];
  emergencyProcedures?: string;
}

interface JSAHazardInput {
  stepNumber: number;
  workStep: string;
  hazards: string;
  consequences?: string;
  riskLevel?: RiskLevel;
  controlMeasures: string;
  responsible?: string;
}

// Statistics
interface DocumentStatistics {
  totalDocuments: number;
  approvedDocuments: number;
  pendingReview: number;
  expiringWithin30Days: number;
  byCategory: Record<string, number>;
  byStatus: Record<DocumentStatus, number>;
}

interface PermitStatistics {
  totalPermits: number;
  activePermits: number;
  pendingApproval: number;
  completedThisMonth: number;
  byType: Record<PermitType, number>;
  byStatus: Record<PermitStatus, number>;
}

// Filters
interface DocumentFilters {
  categoryId?: string;
  status?: DocumentStatus | DocumentStatus[];
  search?: string;
  expiringWithinDays?: number;
}

interface PermitFilters {
  permitType?: PermitType;
  status?: PermitStatus | PermitStatus[];
  jobOrderId?: string;
  search?: string;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Category Settings Enforcement

*For any* document created in a category with `requiresExpiry=true`, the document SHALL have a non-null expiry date. *For any* category with `defaultValidityDays` set, the calculated expiry date SHALL equal `effectiveDate + defaultValidityDays`.

**Validates: Requirements 1.2, 1.3, 1.4**

### Property 2: Document Number Format

*For any* newly created document, the document number SHALL match the pattern `{CATEGORY_CODE}-{YYYY}-{NNNN}` where CATEGORY_CODE is uppercase, YYYY is the current year, and NNNN is a zero-padded sequence number.

**Validates: Requirements 2.1**

### Property 3: Document Creation Validation

*For any* document creation attempt, if title, categoryId, or effectiveDate is missing or empty, the creation SHALL be rejected. *For any* successfully created document, version SHALL be "1.0" and revisionNumber SHALL be 1.

**Validates: Requirements 2.2, 2.6**

### Property 4: Version Control Consistency

*For any* document revision, the new revision number SHALL be greater than the previous revision number. *For any* new version created from an existing document, the previous version SHALL be marked as "superseded" and the new document SHALL have `previousVersionId` set to the old document's ID.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4**

### Property 5: Approval Workflow Integrity

*For any* document status transition, the status SHALL only change to valid next states (draft→pending_review→approved). *For any* approved document, `approvedBy` and `approvedAt` SHALL be non-null. *For any* document in a category with `requiresApproval=true`, the document SHALL not have status "approved" without going through the approval workflow.

**Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5**

### Property 6: Expiry Tracking Accuracy

*For any* document with an expiry date in the past, the validity status SHALL be "expired". *For any* document with an expiry date within 30 days, the validity status SHALL be "expiring_soon". *For any* document, `daysUntilExpiry` SHALL equal `expiryDate - currentDate` in days.

**Validates: Requirements 5.1, 5.2, 5.3, 5.4**

### Property 7: Acknowledgment Tracking

*For any* acknowledgment recorded, the `acknowledgedAt` timestamp SHALL be set. *For any* document and employee pair, there SHALL be at most one acknowledgment record. *For any* document, the acknowledgment count SHALL equal the number of unique employee acknowledgments.

**Validates: Requirements 6.1, 6.2, 6.4, 6.5**

### Property 8: JSA Hazard Management

*For any* JSA document, it SHALL support zero or more hazard entries. *For any* hazard entry, stepNumber, workStep, hazards, and controlMeasures SHALL be non-empty. *For any* hazard entry, riskLevel SHALL be one of: low, medium, high, extreme. *For any* deleted JSA document, all associated hazard entries SHALL be deleted.

**Validates: Requirements 7.1, 7.2, 7.3, 7.5**

### Property 9: Permit Lifecycle Management

*For any* permit, permitType SHALL be one of: hot_work, confined_space, height_work, excavation, electrical, lifting. *For any* permit creation, workDescription, workLocation, validFrom, and validTo SHALL be non-empty. *For any* permit with both supervisor and HSE approval, the status SHALL be "approved" or later. *For any* closed permit, closedBy, closedAt, and closureNotes SHALL be set. *For any* permit with validTo in the past and status not "completed" or "cancelled", the status SHALL be "expired".

**Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.7, 8.8**

### Property 10: Dashboard Statistics Accuracy

*For any* set of documents, the total count SHALL equal the sum of counts by status. *For any* filter applied, the returned documents SHALL all match the filter criteria. *For any* search query, the returned documents SHALL contain the search term in documentNumber or title.

**Validates: Requirements 9.1, 9.2, 9.3, 9.4, 9.5, 9.6**

## Error Handling

### Document Errors
- `CATEGORY_NOT_FOUND`: Category ID does not exist
- `DOCUMENT_NOT_FOUND`: Document ID does not exist
- `INVALID_STATUS_TRANSITION`: Attempted invalid status change
- `EXPIRY_REQUIRED`: Category requires expiry date but none provided
- `APPROVAL_REQUIRED`: Document requires approval before activation
- `DUPLICATE_ACKNOWLEDGMENT`: Employee already acknowledged document

### Permit Errors
- `PERMIT_NOT_FOUND`: Permit ID does not exist
- `INVALID_PERMIT_TYPE`: Invalid permit type value
- `INVALID_DATE_RANGE`: validTo is before validFrom
- `SUPERVISOR_APPROVAL_REQUIRED`: HSE approval attempted before supervisor
- `PERMIT_ALREADY_CLOSED`: Attempted to close already closed permit

## Testing Strategy

### Unit Tests
- Test validation functions for documents, permits, and JSA hazards
- Test status/color helper functions
- Test expiry calculation functions
- Test statistics calculation functions

### Property-Based Tests
Using fast-check library with minimum 100 iterations per property:

1. **Category Settings Enforcement**: Generate random documents with various category settings, verify expiry enforcement
2. **Document Number Format**: Generate documents, verify number format matches pattern
3. **Document Creation Validation**: Generate random inputs, verify validation catches missing fields
4. **Version Control Consistency**: Generate revision sequences, verify version/revision increments
5. **Approval Workflow Integrity**: Generate status transitions, verify only valid transitions allowed
6. **Expiry Tracking Accuracy**: Generate documents with various expiry dates, verify status classification
7. **Acknowledgment Tracking**: Generate acknowledgments, verify uniqueness and counting
8. **JSA Hazard Management**: Generate JSA documents with hazards, verify CRUD operations
9. **Permit Lifecycle Management**: Generate permits, verify status transitions and closure
10. **Dashboard Statistics Accuracy**: Generate document sets, verify statistics calculations

### Integration Tests
- Test document creation with file upload
- Test approval workflow end-to-end
- Test permit approval chain
- Test acknowledgment recording
