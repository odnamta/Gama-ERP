// =====================================================
// v0.47: HSE - SAFETY DOCUMENTATION TYPES
// =====================================================

// Document status workflow
export type DocumentStatus = 'draft' | 'pending_review' | 'approved' | 'expired' | 'superseded' | 'archived';

// Permit status workflow
export type PermitStatus = 'pending' | 'approved' | 'active' | 'completed' | 'cancelled' | 'expired';

// Permit types
export type PermitType = 'hot_work' | 'confined_space' | 'height_work' | 'excavation' | 'electrical' | 'lifting';

// Permit type labels (Indonesian)
export const PERMIT_TYPE_LABELS: Record<PermitType, string> = {
  hot_work: 'Pekerjaan Panas',
  confined_space: 'Ruang Terbatas',
  height_work: 'Pekerjaan Ketinggian',
  excavation: 'Penggalian',
  electrical: 'Kelistrikan',
  lifting: 'Pengangkatan',
};

// Risk levels for JSA
export type RiskLevel = 'low' | 'medium' | 'high' | 'extreme';

// Validity status
export type ValidityStatus = 'valid' | 'expiring_soon' | 'expired';

// =====================================================
// INTERFACES
// =====================================================

// Document category
export interface DocumentCategory {
  id: string;
  categoryCode: string;
  categoryName: string;
  description?: string;
  requiresExpiry: boolean;
  defaultValidityDays?: number;
  requiresApproval: boolean;
  isActive: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

// Safety document
export interface SafetyDocument {
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
  categoryCode?: string;
  categoryName?: string;
  preparedByName?: string;
  reviewedByName?: string;
  approvedByName?: string;
  validityStatus?: ValidityStatus;
  daysUntilExpiry?: number;
}

// JSA hazard step
export interface JSAHazard {
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
  updatedAt: string;
}

// Document acknowledgment
export interface DocumentAcknowledgment {
  id: string;
  documentId: string;
  employeeId: string;
  acknowledgedAt: string;
  quizScore?: number;
  quizPassed?: boolean;
  createdAt: string;
  // Joined fields
  employeeName?: string;
}

// Safety permit
export interface SafetyPermit {
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
  updatedAt: string;
  // Joined fields
  requestedByName?: string;
  supervisorApprovedByName?: string;
  hseApprovedByName?: string;
  closedByName?: string;
  jobOrderNumber?: string;
  documentTitle?: string;
}

// =====================================================
// INPUT TYPES
// =====================================================

// Create document input
export interface CreateDocumentInput {
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

// Update document input
export interface UpdateDocumentInput {
  title?: string;
  description?: string;
  content?: string;
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  applicableLocations?: string[];
  applicableDepartments?: string[];
  applicableJobTypes?: string[];
  effectiveDate?: string;
  expiryDate?: string;
  relatedDocuments?: string[];
  requiresAcknowledgment?: boolean;
}

// Create permit input
export interface CreatePermitInput {
  documentId?: string;
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

// JSA hazard input
export interface JSAHazardInput {
  stepNumber: number;
  workStep: string;
  hazards: string;
  consequences?: string;
  riskLevel?: RiskLevel;
  controlMeasures: string;
  responsible?: string;
}

// =====================================================
// FILTER TYPES
// =====================================================

// Document filters
export interface DocumentFilters {
  categoryId?: string;
  status?: DocumentStatus | DocumentStatus[];
  search?: string;
  expiringWithinDays?: number;
}

// Permit filters
export interface PermitFilters {
  permitType?: PermitType;
  status?: PermitStatus | PermitStatus[];
  jobOrderId?: string;
  search?: string;
}

// =====================================================
// STATISTICS TYPES
// =====================================================

// Document statistics
export interface DocumentStatistics {
  totalDocuments: number;
  approvedDocuments: number;
  pendingReview: number;
  expiringWithin30Days: number;
  byCategory: Record<string, number>;
  byStatus: Record<DocumentStatus, number>;
}

// Permit statistics
export interface PermitStatistics {
  totalPermits: number;
  activePermits: number;
  pendingApproval: number;
  completedThisMonth: number;
  byType: Record<PermitType, number>;
  byStatus: Record<PermitStatus, number>;
}

// Acknowledgment statistics
export interface AcknowledgmentStats {
  totalRequired: number;
  totalAcknowledged: number;
  completionRate: number;
}

// =====================================================
// ROW TYPES (Database)
// =====================================================

export interface DocumentCategoryRow {
  id: string;
  category_code: string;
  category_name: string;
  description: string | null;
  requires_expiry: boolean;
  default_validity_days: number | null;
  requires_approval: boolean;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface SafetyDocumentRow {
  id: string;
  document_number: string;
  category_id: string;
  title: string;
  description: string | null;
  version: string;
  revision_number: number;
  previous_version_id: string | null;
  content: string | null;
  file_url: string | null;
  file_name: string | null;
  file_type: string | null;
  applicable_locations: string[];
  applicable_departments: string[];
  applicable_job_types: string[];
  effective_date: string;
  expiry_date: string | null;
  status: string;
  prepared_by: string | null;
  prepared_at: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  approved_by: string | null;
  approved_at: string | null;
  related_documents: string[];
  requires_acknowledgment: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface JSAHazardRow {
  id: string;
  document_id: string;
  step_number: number;
  work_step: string;
  hazards: string;
  consequences: string | null;
  risk_level: string | null;
  control_measures: string;
  responsible: string | null;
  created_at: string;
  updated_at: string;
}

export interface DocumentAcknowledgmentRow {
  id: string;
  document_id: string;
  employee_id: string;
  acknowledged_at: string;
  quiz_score: number | null;
  quiz_passed: boolean | null;
  created_at: string;
}

export interface SafetyPermitRow {
  id: string;
  permit_number: string;
  document_id: string | null;
  permit_type: string;
  work_description: string;
  work_location: string;
  job_order_id: string | null;
  valid_from: string;
  valid_to: string;
  special_precautions: string | null;
  required_ppe: string[];
  emergency_procedures: string | null;
  requested_by: string;
  requested_at: string;
  supervisor_approved_by: string | null;
  supervisor_approved_at: string | null;
  hse_approved_by: string | null;
  hse_approved_at: string | null;
  status: string;
  closed_by: string | null;
  closed_at: string | null;
  closure_notes: string | null;
  created_at: string;
  updated_at: string;
}

// =====================================================
// TRANSFORM FUNCTIONS
// =====================================================

export function transformCategoryRow(row: DocumentCategoryRow): DocumentCategory {
  return {
    id: row.id,
    categoryCode: row.category_code,
    categoryName: row.category_name,
    description: row.description ?? undefined,
    requiresExpiry: row.requires_expiry,
    defaultValidityDays: row.default_validity_days ?? undefined,
    requiresApproval: row.requires_approval,
    isActive: row.is_active,
    displayOrder: row.display_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function transformDocumentRow(row: SafetyDocumentRow): SafetyDocument {
  return {
    id: row.id,
    documentNumber: row.document_number,
    categoryId: row.category_id,
    title: row.title,
    description: row.description ?? undefined,
    version: row.version,
    revisionNumber: row.revision_number,
    previousVersionId: row.previous_version_id ?? undefined,
    content: row.content ?? undefined,
    fileUrl: row.file_url ?? undefined,
    fileName: row.file_name ?? undefined,
    fileType: row.file_type ?? undefined,
    applicableLocations: row.applicable_locations || [],
    applicableDepartments: row.applicable_departments || [],
    applicableJobTypes: row.applicable_job_types || [],
    effectiveDate: row.effective_date,
    expiryDate: row.expiry_date ?? undefined,
    status: row.status as DocumentStatus,
    preparedBy: row.prepared_by ?? undefined,
    preparedAt: row.prepared_at ?? undefined,
    reviewedBy: row.reviewed_by ?? undefined,
    reviewedAt: row.reviewed_at ?? undefined,
    approvedBy: row.approved_by ?? undefined,
    approvedAt: row.approved_at ?? undefined,
    relatedDocuments: row.related_documents || [],
    requiresAcknowledgment: row.requires_acknowledgment,
    createdBy: row.created_by ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function transformHazardRow(row: JSAHazardRow): JSAHazard {
  return {
    id: row.id,
    documentId: row.document_id,
    stepNumber: row.step_number,
    workStep: row.work_step,
    hazards: row.hazards,
    consequences: row.consequences ?? undefined,
    riskLevel: row.risk_level as RiskLevel | undefined,
    controlMeasures: row.control_measures,
    responsible: row.responsible ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function transformAcknowledgmentRow(row: DocumentAcknowledgmentRow): DocumentAcknowledgment {
  return {
    id: row.id,
    documentId: row.document_id,
    employeeId: row.employee_id,
    acknowledgedAt: row.acknowledged_at,
    quizScore: row.quiz_score ?? undefined,
    quizPassed: row.quiz_passed ?? undefined,
    createdAt: row.created_at,
  };
}

export function transformPermitRow(row: SafetyPermitRow): SafetyPermit {
  return {
    id: row.id,
    permitNumber: row.permit_number,
    documentId: row.document_id ?? undefined,
    permitType: row.permit_type as PermitType,
    workDescription: row.work_description,
    workLocation: row.work_location,
    jobOrderId: row.job_order_id ?? undefined,
    validFrom: row.valid_from,
    validTo: row.valid_to,
    specialPrecautions: row.special_precautions ?? undefined,
    requiredPPE: row.required_ppe || [],
    emergencyProcedures: row.emergency_procedures ?? undefined,
    requestedBy: row.requested_by,
    requestedAt: row.requested_at,
    supervisorApprovedBy: row.supervisor_approved_by ?? undefined,
    supervisorApprovedAt: row.supervisor_approved_at ?? undefined,
    hseApprovedBy: row.hse_approved_by ?? undefined,
    hseApprovedAt: row.hse_approved_at ?? undefined,
    status: row.status as PermitStatus,
    closedBy: row.closed_by ?? undefined,
    closedAt: row.closed_at ?? undefined,
    closureNotes: row.closure_notes ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// =====================================================
// VALIDATION RESULT TYPE
// =====================================================

export interface ValidationResult {
  valid: boolean;
  error?: string;
}
