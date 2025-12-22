// =====================================================
// v0.47: HSE - SAFETY DOCUMENTATION UTILITIES
// =====================================================

import {
  DocumentStatus,
  PermitStatus,
  PermitType,
  RiskLevel,
  ValidityStatus,
  SafetyDocument,
  SafetyPermit,
  DocumentCategory,
  CreateDocumentInput,
  CreatePermitInput,
  JSAHazardInput,
  ValidationResult,
  DocumentStatistics,
  PermitStatistics,
} from '@/types/safety-document';

// =====================================================
// VALIDATION FUNCTIONS
// =====================================================

/**
 * Validate document input
 */
export function validateDocumentInput(
  input: CreateDocumentInput,
  category?: DocumentCategory
): ValidationResult {
  // Required fields
  if (!input.categoryId || input.categoryId.trim() === '') {
    return { valid: false, error: 'Kategori dokumen wajib diisi' };
  }

  if (!input.title || input.title.trim() === '') {
    return { valid: false, error: 'Judul dokumen wajib diisi' };
  }

  if (!input.effectiveDate || input.effectiveDate.trim() === '') {
    return { valid: false, error: 'Tanggal efektif wajib diisi' };
  }

  // Validate effective date format
  const effectiveDate = new Date(input.effectiveDate);
  if (isNaN(effectiveDate.getTime())) {
    return { valid: false, error: 'Format tanggal efektif tidak valid' };
  }

  // Category-specific validation
  if (category) {
    // Check expiry requirement
    if (category.requiresExpiry && !input.expiryDate) {
      return { valid: false, error: `Kategori ${category.categoryName} memerlukan tanggal kadaluarsa` };
    }

    // Validate expiry date if provided
    if (input.expiryDate) {
      const expiryDate = new Date(input.expiryDate);
      if (isNaN(expiryDate.getTime())) {
        return { valid: false, error: 'Format tanggal kadaluarsa tidak valid' };
      }
      if (expiryDate <= effectiveDate) {
        return { valid: false, error: 'Tanggal kadaluarsa harus setelah tanggal efektif' };
      }
    }
  }

  return { valid: true };
}

/**
 * Validate permit input
 */
export function validatePermitInput(input: CreatePermitInput): ValidationResult {
  const validPermitTypes: PermitType[] = ['hot_work', 'confined_space', 'height_work', 'excavation', 'electrical', 'lifting'];

  if (!input.permitType || !validPermitTypes.includes(input.permitType)) {
    return { valid: false, error: 'Jenis izin tidak valid' };
  }

  if (!input.workDescription || input.workDescription.trim() === '') {
    return { valid: false, error: 'Deskripsi pekerjaan wajib diisi' };
  }

  if (!input.workLocation || input.workLocation.trim() === '') {
    return { valid: false, error: 'Lokasi pekerjaan wajib diisi' };
  }

  if (!input.validFrom || input.validFrom.trim() === '') {
    return { valid: false, error: 'Waktu mulai berlaku wajib diisi' };
  }

  if (!input.validTo || input.validTo.trim() === '') {
    return { valid: false, error: 'Waktu berakhir wajib diisi' };
  }

  const validFrom = new Date(input.validFrom);
  const validTo = new Date(input.validTo);

  if (isNaN(validFrom.getTime())) {
    return { valid: false, error: 'Format waktu mulai tidak valid' };
  }

  if (isNaN(validTo.getTime())) {
    return { valid: false, error: 'Format waktu berakhir tidak valid' };
  }

  if (validTo <= validFrom) {
    return { valid: false, error: 'Waktu berakhir harus setelah waktu mulai' };
  }

  return { valid: true };
}

/**
 * Validate JSA hazard input
 */
export function validateJSAHazardInput(input: JSAHazardInput): ValidationResult {
  if (typeof input.stepNumber !== 'number' || input.stepNumber < 1) {
    return { valid: false, error: 'Nomor langkah harus angka positif' };
  }

  if (!input.workStep || input.workStep.trim() === '') {
    return { valid: false, error: 'Langkah kerja wajib diisi' };
  }

  if (!input.hazards || input.hazards.trim() === '') {
    return { valid: false, error: 'Bahaya wajib diisi' };
  }

  if (!input.controlMeasures || input.controlMeasures.trim() === '') {
    return { valid: false, error: 'Tindakan pengendalian wajib diisi' };
  }

  const validRiskLevels: RiskLevel[] = ['low', 'medium', 'high', 'extreme'];
  if (input.riskLevel && !validRiskLevels.includes(input.riskLevel)) {
    return { valid: false, error: 'Tingkat risiko tidak valid' };
  }

  return { valid: true };
}

// =====================================================
// EXPIRY CALCULATION FUNCTIONS
// =====================================================

/**
 * Calculate expiry date from effective date and validity days
 */
export function calculateExpiryDate(effectiveDate: Date, defaultValidityDays: number): Date {
  const expiry = new Date(effectiveDate);
  expiry.setDate(expiry.getDate() + defaultValidityDays);
  return expiry;
}

/**
 * Get validity status based on expiry date
 */
export function getValidityStatus(expiryDate: Date | string | null | undefined): ValidityStatus {
  if (!expiryDate) {
    return 'valid';
  }

  const expiry = typeof expiryDate === 'string' ? new Date(expiryDate) : expiryDate;
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  if (isNaN(expiry.getTime())) {
    return 'valid';
  }

  const expiryNormalized = new Date(expiry);
  expiryNormalized.setHours(0, 0, 0, 0);

  if (expiryNormalized < now) {
    return 'expired';
  }

  const thirtyDaysFromNow = new Date(now);
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  if (expiryNormalized <= thirtyDaysFromNow) {
    return 'expiring_soon';
  }

  return 'valid';
}

/**
 * Get days until expiry
 */
export function getDaysUntilExpiry(expiryDate: Date | string | null | undefined): number | null {
  if (!expiryDate) {
    return null;
  }

  const expiry = typeof expiryDate === 'string' ? new Date(expiryDate) : expiryDate;
  
  if (isNaN(expiry.getTime())) {
    return null;
  }

  const now = new Date();
  now.setHours(0, 0, 0, 0);
  
  const expiryNormalized = new Date(expiry);
  expiryNormalized.setHours(0, 0, 0, 0);

  const diffTime = expiryNormalized.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
}

/**
 * Check if document is expiring soon
 */
export function isExpiringSoon(expiryDate: Date | string | null | undefined, thresholdDays: number = 30): boolean {
  const days = getDaysUntilExpiry(expiryDate);
  if (days === null) {
    return false;
  }
  return days >= 0 && days <= thresholdDays;
}

// =====================================================
// STATUS HELPER FUNCTIONS
// =====================================================

/**
 * Get document status color
 */
export function getDocumentStatusColor(status: DocumentStatus): string {
  const colors: Record<DocumentStatus, string> = {
    draft: 'bg-gray-100 text-gray-800',
    pending_review: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    expired: 'bg-red-100 text-red-800',
    superseded: 'bg-purple-100 text-purple-800',
    archived: 'bg-slate-100 text-slate-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

/**
 * Get document status label (Indonesian)
 */
export function getDocumentStatusLabel(status: DocumentStatus): string {
  const labels: Record<DocumentStatus, string> = {
    draft: 'Draft',
    pending_review: 'Menunggu Review',
    approved: 'Disetujui',
    expired: 'Kadaluarsa',
    superseded: 'Digantikan',
    archived: 'Diarsipkan',
  };
  return labels[status] || status;
}

/**
 * Get permit status color
 */
export function getPermitStatusColor(status: PermitStatus): string {
  const colors: Record<PermitStatus, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-blue-100 text-blue-800',
    active: 'bg-green-100 text-green-800',
    completed: 'bg-gray-100 text-gray-800',
    cancelled: 'bg-red-100 text-red-800',
    expired: 'bg-orange-100 text-orange-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

/**
 * Get permit status label (Indonesian)
 */
export function getPermitStatusLabel(status: PermitStatus): string {
  const labels: Record<PermitStatus, string> = {
    pending: 'Menunggu Persetujuan',
    approved: 'Disetujui',
    active: 'Aktif',
    completed: 'Selesai',
    cancelled: 'Dibatalkan',
    expired: 'Kadaluarsa',
  };
  return labels[status] || status;
}

/**
 * Get risk level color
 */
export function getRiskLevelColor(level: RiskLevel): string {
  const colors: Record<RiskLevel, string> = {
    low: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-orange-100 text-orange-800',
    extreme: 'bg-red-100 text-red-800',
  };
  return colors[level] || 'bg-gray-100 text-gray-800';
}

/**
 * Get risk level label (Indonesian)
 */
export function getRiskLevelLabel(level: RiskLevel): string {
  const labels: Record<RiskLevel, string> = {
    low: 'Rendah',
    medium: 'Sedang',
    high: 'Tinggi',
    extreme: 'Ekstrem',
  };
  return labels[level] || level;
}

/**
 * Get validity status color
 */
export function getValidityStatusColor(status: ValidityStatus): string {
  const colors: Record<ValidityStatus, string> = {
    valid: 'bg-green-100 text-green-800',
    expiring_soon: 'bg-yellow-100 text-yellow-800',
    expired: 'bg-red-100 text-red-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

/**
 * Get validity status label (Indonesian)
 */
export function getValidityStatusLabel(status: ValidityStatus): string {
  const labels: Record<ValidityStatus, string> = {
    valid: 'Berlaku',
    expiring_soon: 'Segera Kadaluarsa',
    expired: 'Kadaluarsa',
  };
  return labels[status] || status;
}

// =====================================================
// CATEGORY & TYPE HELPERS
// =====================================================

/**
 * Get category label (Indonesian)
 */
export function getCategoryLabel(categoryCode: string): string {
  const labels: Record<string, string> = {
    jsa: 'Job Safety Analysis',
    sop: 'Standard Operating Procedure',
    permit: 'Template Izin Kerja',
    msds: 'Material Safety Data Sheet',
    risk_assessment: 'Penilaian Risiko',
    toolbox_talk: 'Toolbox Talk',
    inspection: 'Daftar Periksa Inspeksi',
    emergency: 'Prosedur Darurat',
    training_material: 'Materi Pelatihan',
  };
  return labels[categoryCode.toLowerCase()] || categoryCode;
}

/**
 * Get permit type label (Indonesian)
 */
export function getPermitTypeLabel(permitType: PermitType): string {
  const labels: Record<PermitType, string> = {
    hot_work: 'Pekerjaan Panas',
    confined_space: 'Ruang Terbatas',
    height_work: 'Bekerja di Ketinggian',
    excavation: 'Penggalian',
    electrical: 'Pekerjaan Listrik',
    lifting: 'Pengangkatan',
  };
  return labels[permitType] || permitType;
}

// =====================================================
// STATISTICS FUNCTIONS
// =====================================================

/**
 * Count documents by status
 */
export function countByStatus(documents: SafetyDocument[]): Record<DocumentStatus, number> {
  const counts: Record<DocumentStatus, number> = {
    draft: 0,
    pending_review: 0,
    approved: 0,
    expired: 0,
    superseded: 0,
    archived: 0,
  };

  for (const doc of documents) {
    if (doc.status in counts) {
      counts[doc.status]++;
    }
  }

  return counts;
}

/**
 * Count documents by category
 */
export function countByCategory(documents: SafetyDocument[]): Record<string, number> {
  const counts: Record<string, number> = {};

  for (const doc of documents) {
    const key = doc.categoryCode || doc.categoryId;
    counts[key] = (counts[key] || 0) + 1;
  }

  return counts;
}

/**
 * Count expiring documents within specified days
 */
export function countExpiringDocuments(documents: SafetyDocument[], days: number = 30): number {
  return documents.filter(doc => {
    if (!doc.expiryDate) return false;
    if (doc.status === 'archived' || doc.status === 'superseded') return false;
    return isExpiringSoon(doc.expiryDate, days);
  }).length;
}

/**
 * Count permits by status
 */
export function countPermitsByStatus(permits: SafetyPermit[]): Record<PermitStatus, number> {
  const counts: Record<PermitStatus, number> = {
    pending: 0,
    approved: 0,
    active: 0,
    completed: 0,
    cancelled: 0,
    expired: 0,
  };

  for (const permit of permits) {
    if (permit.status in counts) {
      counts[permit.status]++;
    }
  }

  return counts;
}

/**
 * Count permits by type
 */
export function countPermitsByType(permits: SafetyPermit[]): Record<PermitType, number> {
  const counts: Record<PermitType, number> = {
    hot_work: 0,
    confined_space: 0,
    height_work: 0,
    excavation: 0,
    electrical: 0,
    lifting: 0,
  };

  for (const permit of permits) {
    if (permit.permitType in counts) {
      counts[permit.permitType]++;
    }
  }

  return counts;
}

/**
 * Calculate acknowledgment completion rate
 */
export function calculateAcknowledgmentRate(totalRequired: number, totalAcknowledged: number): number {
  if (totalRequired <= 0) return 0;
  const rate = (totalAcknowledged / totalRequired) * 100;
  return Math.min(100, Math.max(0, Math.round(rate * 100) / 100));
}

/**
 * Calculate document statistics
 */
export function calculateDocumentStatistics(documents: SafetyDocument[]): DocumentStatistics {
  const byStatus = countByStatus(documents);
  const byCategory = countByCategory(documents);

  return {
    totalDocuments: documents.length,
    approvedDocuments: byStatus.approved,
    pendingReview: byStatus.pending_review,
    expiringWithin30Days: countExpiringDocuments(documents, 30),
    byCategory,
    byStatus,
  };
}

/**
 * Calculate permit statistics
 */
export function calculatePermitStatistics(permits: SafetyPermit[]): PermitStatistics {
  const byStatus = countPermitsByStatus(permits);
  const byType = countPermitsByType(permits);

  // Count completed this month
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const completedThisMonth = permits.filter(p => {
    if (p.status !== 'completed' || !p.closedAt) return false;
    const closedDate = new Date(p.closedAt);
    return closedDate >= startOfMonth;
  }).length;

  return {
    totalPermits: permits.length,
    activePermits: byStatus.active,
    pendingApproval: byStatus.pending,
    completedThisMonth,
    byType,
    byStatus,
  };
}

// =====================================================
// WORKFLOW HELPERS
// =====================================================

/**
 * Check if document can be submitted for review
 */
export function canSubmitForReview(document: SafetyDocument): boolean {
  return document.status === 'draft';
}

/**
 * Check if document can be approved
 */
export function canApproveDocument(document: SafetyDocument): boolean {
  return document.status === 'pending_review';
}

/**
 * Check if permit can be approved by supervisor
 */
export function canApproveBySupervisor(permit: SafetyPermit): boolean {
  return permit.status === 'pending' && !permit.supervisorApprovedBy;
}

/**
 * Check if permit can be approved by HSE
 */
export function canApproveByHSE(permit: SafetyPermit): boolean {
  return permit.status === 'pending' && !!permit.supervisorApprovedBy && !permit.hseApprovedBy;
}

/**
 * Check if permit can be activated
 */
export function canActivatePermit(permit: SafetyPermit): boolean {
  return permit.status === 'approved';
}

/**
 * Check if permit can be closed
 */
export function canClosePermit(permit: SafetyPermit): boolean {
  return permit.status === 'active';
}

/**
 * Get next valid document statuses
 */
export function getNextDocumentStatuses(currentStatus: DocumentStatus): DocumentStatus[] {
  const transitions: Record<DocumentStatus, DocumentStatus[]> = {
    draft: ['pending_review'],
    pending_review: ['approved', 'draft'],
    approved: ['superseded', 'archived', 'expired'],
    expired: ['archived'],
    superseded: ['archived'],
    archived: [],
  };
  return transitions[currentStatus] || [];
}

/**
 * Get next valid permit statuses
 */
export function getNextPermitStatuses(currentStatus: PermitStatus): PermitStatus[] {
  const transitions: Record<PermitStatus, PermitStatus[]> = {
    pending: ['approved', 'cancelled'],
    approved: ['active', 'cancelled'],
    active: ['completed', 'cancelled', 'expired'],
    completed: [],
    cancelled: [],
    expired: [],
  };
  return transitions[currentStatus] || [];
}
