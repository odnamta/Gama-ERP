// lib/assessment-utils.ts
// Utility functions for Engineering Technical Assessments module (v0.58)

import {
  AssessmentStatus,
  ConclusionType,
  CargoDimensions,
  AxleLoad,
  ValidationResult,
  ValidationError,
  CreateAssessmentInput,
  CreateLiftingPlanInput,
  CreateAxleCalcInput,
  VALID_CONCLUSIONS,
  VALID_STATUSES,
  STATUS_TRANSITIONS,
  AXLE_LIMITS,
  TechnicalAssessment,
  AssessmentFilters,
  AssessmentStatusCounts,
} from '@/types/assessment';

// ============================================
// Lifting Plan Calculations
// ============================================

/**
 * Calculate total lifted weight (load + rigging)
 */
export function calculateTotalLiftedWeight(
  loadWeightTons: number,
  riggingWeightTons: number = 0
): number {
  return loadWeightTons + riggingWeightTons;
}

/**
 * Calculate crane utilization percentage
 */
export function calculateUtilizationPercentage(
  totalLiftedWeight: number,
  craneCapacityAtRadius: number
): number {
  if (craneCapacityAtRadius <= 0) return 0;
  return (totalLiftedWeight / craneCapacityAtRadius) * 100;
}

/**
 * Check if utilization is within safe limits (default 80%)
 */
export function isUtilizationSafe(
  utilizationPct: number,
  threshold: number = 80
): boolean {
  return utilizationPct <= threshold;
}

/**
 * Calculate ground bearing pressure in kPa
 */
export function calculateGroundBearing(
  totalWeightTons: number,
  outriggerAreaM2: number
): number {
  if (outriggerAreaM2 <= 0) return 0;
  // Convert tons to kN (1 ton ≈ 9.81 kN) and divide by area
  const weightKN = totalWeightTons * 9.81;
  return weightKN / outriggerAreaM2;
}

/**
 * Check if lift requires additional review (utilization > 80%)
 */
export function requiresAdditionalReview(utilizationPct: number): boolean {
  return utilizationPct > 80;
}


// ============================================
// Axle Load Calculations
// ============================================

export interface AxleLoadConfig {
  cargoWeightTons: number;
  trailerTareWeightTons: number;
  primeMoverWeightTons: number;
  trailerAxleCount: number;
  primeMoverAxleCount: number;
  cogFromFrontM?: number;
  trailerLengthM?: number;
}

export interface AxleLoadResult {
  axle_number: number;
  axle_type: 'single' | 'tandem' | 'tridem';
  load_tons: number;
  max_allowed_tons: number;
  utilization_pct: number;
}

/**
 * Calculate axle loads based on configuration
 * Simplified calculation - distributes weight across axles
 */
export function calculateAxleLoads(config: AxleLoadConfig): AxleLoadResult[] {
  const {
    cargoWeightTons,
    trailerTareWeightTons,
    primeMoverWeightTons,
    trailerAxleCount,
    primeMoverAxleCount,
  } = config;

  const results: AxleLoadResult[] = [];
  
  // Total weight on trailer (cargo + trailer tare)
  const trailerTotalWeight = cargoWeightTons + trailerTareWeightTons;
  
  // Distribute trailer weight across trailer axles
  const weightPerTrailerAxle = trailerAxleCount > 0 
    ? trailerTotalWeight / trailerAxleCount 
    : 0;
  
  // Distribute prime mover weight across prime mover axles
  const weightPerPrimeMoverAxle = primeMoverAxleCount > 0 
    ? primeMoverWeightTons / primeMoverAxleCount 
    : 0;

  // Add prime mover axles
  for (let i = 1; i <= primeMoverAxleCount; i++) {
    const axleType = i === 1 ? 'single' : 'tandem';
    const maxAllowed = axleType === 'single' ? AXLE_LIMITS.single : AXLE_LIMITS.tandem;
    const loadTons = weightPerPrimeMoverAxle;
    
    results.push({
      axle_number: i,
      axle_type: axleType,
      load_tons: Math.round(loadTons * 100) / 100,
      max_allowed_tons: maxAllowed,
      utilization_pct: Math.round((loadTons / maxAllowed) * 100 * 100) / 100,
    });
  }

  // Add trailer axles
  for (let i = 1; i <= trailerAxleCount; i++) {
    const axleNumber = primeMoverAxleCount + i;
    const axleType = trailerAxleCount >= 3 ? 'tridem' : 'tandem';
    const maxAllowed = axleType === 'tridem' ? AXLE_LIMITS.tridem : AXLE_LIMITS.tandem;
    const loadTons = weightPerTrailerAxle;
    
    results.push({
      axle_number: axleNumber,
      axle_type: axleType,
      load_tons: Math.round(loadTons * 100) / 100,
      max_allowed_tons: maxAllowed,
      utilization_pct: Math.round((loadTons / maxAllowed) * 100 * 100) / 100,
    });
  }

  return results;
}

/**
 * Calculate total weight from all components
 */
export function calculateTotalWeight(
  cargoWeightTons: number,
  trailerTareWeightTons: number,
  primeMoverWeightTons: number
): number {
  return cargoWeightTons + trailerTareWeightTons + primeMoverWeightTons;
}

/**
 * Check if all axle loads are within legal limits
 */
export function isWithinLegalLimits(axleLoads: AxleLoad[]): boolean {
  return axleLoads.every(axle => axle.load_tons <= axle.max_allowed_tons);
}

/**
 * Determine if permit is required based on axle loads
 */
export function determinePermitRequired(axleLoads: AxleLoad[]): boolean {
  return axleLoads.some(axle => axle.load_tons > axle.max_allowed_tons);
}

/**
 * Get maximum single axle load from results
 */
export function getMaxSingleAxleLoad(axleLoads: AxleLoad[]): number {
  const singleAxles = axleLoads.filter(a => a.axle_type === 'single');
  if (singleAxles.length === 0) return 0;
  return Math.max(...singleAxles.map(a => a.load_tons));
}

/**
 * Get maximum tandem axle load from results
 */
export function getMaxTandemAxleLoad(axleLoads: AxleLoad[]): number {
  const tandemAxles = axleLoads.filter(a => a.axle_type === 'tandem');
  if (tandemAxles.length === 0) return 0;
  return Math.max(...tandemAxles.map(a => a.load_tons));
}


// ============================================
// Status Helpers
// ============================================

/**
 * Get status badge color
 */
export function getStatusColor(status: AssessmentStatus): string {
  const colors: Record<AssessmentStatus, string> = {
    draft: 'bg-gray-100 text-gray-800',
    in_progress: 'bg-blue-100 text-blue-800',
    pending_review: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    superseded: 'bg-purple-100 text-purple-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

/**
 * Get human-readable status label
 */
export function getStatusLabel(status: AssessmentStatus): string {
  const labels: Record<AssessmentStatus, string> = {
    draft: 'Draft',
    in_progress: 'In Progress',
    pending_review: 'Pending Review',
    approved: 'Approved',
    rejected: 'Rejected',
    superseded: 'Superseded',
  };
  return labels[status] || status;
}

/**
 * Check if status transition is valid
 */
export function canTransitionTo(
  currentStatus: AssessmentStatus,
  targetStatus: AssessmentStatus
): boolean {
  const allowedTransitions = STATUS_TRANSITIONS[currentStatus] || [];
  return allowedTransitions.includes(targetStatus);
}

/**
 * Get conclusion badge color
 */
export function getConclusionColor(conclusion: ConclusionType | null): string {
  if (!conclusion) return 'bg-gray-100 text-gray-800';
  
  const colors: Record<ConclusionType, string> = {
    approved: 'bg-green-100 text-green-800',
    approved_with_conditions: 'bg-yellow-100 text-yellow-800',
    not_approved: 'bg-red-100 text-red-800',
    further_study: 'bg-blue-100 text-blue-800',
  };
  return colors[conclusion] || 'bg-gray-100 text-gray-800';
}

/**
 * Get human-readable conclusion label
 */
export function getConclusionLabel(conclusion: ConclusionType | null): string {
  if (!conclusion) return 'Not Set';
  
  const labels: Record<ConclusionType, string> = {
    approved: 'Approved',
    approved_with_conditions: 'Approved with Conditions',
    not_approved: 'Not Approved',
    further_study: 'Further Study Required',
  };
  return labels[conclusion] || conclusion;
}

// ============================================
// Validation Functions
// ============================================

/**
 * Validate conclusion value
 */
export function isValidConclusion(conclusion: string): conclusion is ConclusionType {
  return VALID_CONCLUSIONS.includes(conclusion as ConclusionType);
}

/**
 * Validate status value
 */
export function isValidStatus(status: string): status is AssessmentStatus {
  return VALID_STATUSES.includes(status as AssessmentStatus);
}

/**
 * Validate assessment input data
 */
export function validateAssessmentData(data: CreateAssessmentInput): ValidationResult {
  const errors: ValidationError[] = [];

  if (!data.assessment_type_id) {
    errors.push({ field: 'assessment_type_id', message: 'Assessment type is required' });
  }

  if (!data.title || data.title.trim() === '') {
    errors.push({ field: 'title', message: 'Title is required' });
  }

  if (data.cargo_weight_tons !== undefined && data.cargo_weight_tons < 0) {
    errors.push({ field: 'cargo_weight_tons', message: 'Cargo weight must be non-negative' });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate lifting plan input data
 */
export function validateLiftingPlan(data: CreateLiftingPlanInput): ValidationResult {
  const errors: ValidationError[] = [];

  if (!data.assessment_id) {
    errors.push({ field: 'assessment_id', message: 'Assessment ID is required' });
  }

  if (data.load_weight_tons === undefined || data.load_weight_tons <= 0) {
    errors.push({ field: 'load_weight_tons', message: 'Load weight is required and must be positive' });
  }

  if (data.rigging_weight_tons !== undefined && data.rigging_weight_tons < 0) {
    errors.push({ field: 'rigging_weight_tons', message: 'Rigging weight must be non-negative' });
  }

  if (data.crane_capacity_at_radius_tons !== undefined && data.crane_capacity_at_radius_tons <= 0) {
    errors.push({ field: 'crane_capacity_at_radius_tons', message: 'Crane capacity must be positive' });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate axle calculation input data
 */
export function validateAxleCalculation(data: CreateAxleCalcInput): ValidationResult {
  const errors: ValidationError[] = [];

  if (!data.assessment_id) {
    errors.push({ field: 'assessment_id', message: 'Assessment ID is required' });
  }

  if (data.cargo_weight_tons === undefined || data.cargo_weight_tons <= 0) {
    errors.push({ field: 'cargo_weight_tons', message: 'Cargo weight is required and must be positive' });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}


// ============================================
// Formatting Functions
// ============================================

/**
 * Format weight in tons with unit
 */
export function formatWeight(tons: number | null | undefined): string {
  if (tons === null || tons === undefined) return '-';
  return `${tons.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} t`;
}

/**
 * Format percentage with symbol
 */
export function formatPercentage(value: number | null | undefined): string {
  if (value === null || value === undefined) return '-';
  return `${value.toFixed(1)}%`;
}

/**
 * Format cargo dimensions
 */
export function formatDimensions(dims: CargoDimensions | null): string {
  if (!dims) return '-';
  return `${dims.length}m × ${dims.width}m × ${dims.height}m`;
}

/**
 * Format COG (Center of Gravity) data
 */
export function formatCOG(dims: CargoDimensions | null): string {
  if (!dims) return '-';
  return `X: ${dims.cog_x}m, Y: ${dims.cog_y}m, Z: ${dims.cog_z}m`;
}

/**
 * Format assessment number for display
 */
export function formatAssessmentNumber(number: string): string {
  return number;
}

/**
 * Format date for display (DD/MM/YYYY)
 */
export function formatDate(dateString: string | null): string {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/**
 * Format datetime for display
 */
export function formatDateTime(dateString: string | null): string {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ============================================
// Filter and Sort Functions
// ============================================

/**
 * Filter assessments based on criteria
 */
export function filterAssessments(
  assessments: TechnicalAssessment[],
  filters: AssessmentFilters
): TechnicalAssessment[] {
  return assessments.filter(assessment => {
    // Filter by assessment type
    if (filters.assessment_type_id && assessment.assessment_type_id !== filters.assessment_type_id) {
      return false;
    }

    // Filter by status
    if (filters.status && assessment.status !== filters.status) {
      return false;
    }

    // Filter by customer
    if (filters.customer_id && assessment.customer_id !== filters.customer_id) {
      return false;
    }

    // Filter by project
    if (filters.project_id && assessment.project_id !== filters.project_id) {
      return false;
    }

    // Filter by quotation
    if (filters.quotation_id && assessment.quotation_id !== filters.quotation_id) {
      return false;
    }

    // Filter by date range
    if (filters.date_from) {
      const fromDate = new Date(filters.date_from);
      const assessmentDate = new Date(assessment.created_at);
      if (assessmentDate < fromDate) return false;
    }

    if (filters.date_to) {
      const toDate = new Date(filters.date_to);
      const assessmentDate = new Date(assessment.created_at);
      if (assessmentDate > toDate) return false;
    }

    // Filter by search term
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const matchesNumber = assessment.assessment_number.toLowerCase().includes(searchLower);
      const matchesTitle = assessment.title.toLowerCase().includes(searchLower);
      const matchesDescription = assessment.description?.toLowerCase().includes(searchLower) || false;
      if (!matchesNumber && !matchesTitle && !matchesDescription) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Calculate status counts from assessments
 */
export function calculateStatusCounts(assessments: TechnicalAssessment[]): AssessmentStatusCounts {
  const counts: AssessmentStatusCounts = {
    draft: 0,
    in_progress: 0,
    pending_review: 0,
    approved: 0,
    rejected: 0,
    superseded: 0,
    total: assessments.length,
  };

  assessments.forEach(assessment => {
    if (assessment.status in counts) {
      counts[assessment.status as keyof Omit<AssessmentStatusCounts, 'total'>]++;
    }
  });

  return counts;
}

/**
 * Sort assessments by field
 */
export function sortAssessments(
  assessments: TechnicalAssessment[],
  sortBy: 'assessment_number' | 'created_at' | 'status' | 'title',
  sortOrder: 'asc' | 'desc' = 'desc'
): TechnicalAssessment[] {
  return [...assessments].sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case 'assessment_number':
        comparison = a.assessment_number.localeCompare(b.assessment_number);
        break;
      case 'created_at':
        comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        break;
      case 'status':
        comparison = a.status.localeCompare(b.status);
        break;
      case 'title':
        comparison = a.title.localeCompare(b.title);
        break;
    }

    return sortOrder === 'asc' ? comparison : -comparison;
  });
}

// ============================================
// Utility Helpers
// ============================================

/**
 * Get next lift number for an assessment
 */
export function getNextLiftNumber(existingPlans: { lift_number: number }[]): number {
  if (existingPlans.length === 0) return 1;
  return Math.max(...existingPlans.map(p => p.lift_number)) + 1;
}

/**
 * Check if assessment can be edited
 */
export function canEditAssessment(status: AssessmentStatus): boolean {
  return ['draft', 'in_progress', 'rejected'].includes(status);
}

/**
 * Check if assessment can be submitted for review
 */
export function canSubmitForReview(status: AssessmentStatus): boolean {
  return ['draft', 'in_progress'].includes(status);
}

/**
 * Check if assessment can be approved/rejected
 */
export function canApproveOrReject(status: AssessmentStatus): boolean {
  return status === 'pending_review';
}

/**
 * Check if revision can be created
 */
export function canCreateRevision(status: AssessmentStatus): boolean {
  return status === 'approved';
}
