import { addDays, differenceInDays, isBefore, isEqual, parseISO } from 'date-fns';
import {
  PPECategory,
  PPE_CATEGORIES,
  IssuanceStatus,
  ISSUANCE_STATUSES,
  PPECondition,
  PPE_CONDITIONS,
  InspectionAction,
  INSPECTION_ACTIONS,
  PPEComplianceStatus,
  ComplianceIssueCounts,
  EmployeePPEStatus,
  EmployeeComplianceSummary,
} from '@/types/ppe';

// ============================================
// PPE Category Utilities
// ============================================

/**
 * Get all valid PPE categories
 */
export function getPPECategories(): PPECategory[] {
  return [...PPE_CATEGORIES];
}

/**
 * Check if a string is a valid PPE category
 */
export function isValidPPECategory(category: string): category is PPECategory {
  return PPE_CATEGORIES.includes(category as PPECategory);
}

/**
 * Format PPE category for display
 */
export function formatPPECategory(category: string): string {
  const categoryLabels: Record<PPECategory, string> = {
    head: 'Head Protection',
    eye: 'Eye Protection',
    ear: 'Ear Protection',
    respiratory: 'Respiratory Protection',
    hand: 'Hand Protection',
    body: 'Body Protection',
    foot: 'Foot Protection',
    fall_protection: 'Fall Protection',
  };
  return categoryLabels[category as PPECategory] || category;
}

// ============================================
// Issuance Status Utilities
// ============================================

/**
 * Check if a string is a valid issuance status
 */
export function isValidIssuanceStatus(status: string): status is IssuanceStatus {
  return ISSUANCE_STATUSES.includes(status as IssuanceStatus);
}

/**
 * Format issuance status for display
 */
export function formatIssuanceStatus(status: string): string {
  const statusLabels: Record<IssuanceStatus, string> = {
    active: 'Active',
    returned: 'Returned',
    replaced: 'Replaced',
    lost: 'Lost',
    damaged: 'Damaged',
  };
  return statusLabels[status as IssuanceStatus] || status;
}

/**
 * Get status badge color
 */
export function getIssuanceStatusColor(status: string): string {
  const statusColors: Record<IssuanceStatus, string> = {
    active: 'bg-green-100 text-green-800',
    returned: 'bg-gray-100 text-gray-800',
    replaced: 'bg-blue-100 text-blue-800',
    lost: 'bg-red-100 text-red-800',
    damaged: 'bg-orange-100 text-orange-800',
  };
  return statusColors[status as IssuanceStatus] || 'bg-gray-100 text-gray-800';
}

// ============================================
// Condition Utilities
// ============================================

/**
 * Check if a string is a valid PPE condition
 */
export function isValidPPECondition(condition: string): condition is PPECondition {
  return PPE_CONDITIONS.includes(condition as PPECondition);
}

/**
 * Format condition for display
 */
export function formatCondition(condition: string): string {
  const conditionLabels: Record<PPECondition, string> = {
    new: 'New',
    good: 'Good',
    fair: 'Fair',
    poor: 'Poor',
    failed: 'Failed',
  };
  return conditionLabels[condition as PPECondition] || condition;
}

/**
 * Get condition severity level
 */
export function getConditionSeverity(condition: string): 'good' | 'warning' | 'danger' {
  if (condition === 'new' || condition === 'good') return 'good';
  if (condition === 'fair') return 'warning';
  return 'danger';
}

/**
 * Check if PPE should be replaced based on condition
 */
export function shouldReplaceBasedOnCondition(condition: string): boolean {
  return condition === 'poor' || condition === 'failed';
}

/**
 * Check if condition is reusable (for returns)
 */
export function isReusableCondition(condition: string): boolean {
  return condition === 'new' || condition === 'good' || condition === 'fair';
}


// ============================================
// Inspection Action Utilities
// ============================================

/**
 * Check if a string is a valid inspection action
 */
export function isValidInspectionAction(action: string): action is InspectionAction {
  return INSPECTION_ACTIONS.includes(action as InspectionAction);
}

/**
 * Format inspection action for display
 */
export function formatInspectionAction(action: string): string {
  const actionLabels: Record<InspectionAction, string> = {
    none: 'No Action Required',
    clean: 'Clean',
    repair: 'Repair',
    replace: 'Replace',
  };
  return actionLabels[action as InspectionAction] || action;
}

// ============================================
// Replacement Date Utilities
// ============================================

/**
 * Calculate expected replacement date based on issue date and interval
 * Property 7: Replacement Date Calculation
 */
export function calculateReplacementDate(
  issueDate: Date | string,
  intervalDays: number | null
): Date | null {
  if (intervalDays === null || intervalDays === undefined) {
    return null;
  }
  const date = typeof issueDate === 'string' ? parseISO(issueDate) : issueDate;
  return addDays(date, intervalDays);
}

/**
 * Get days until replacement (negative if overdue)
 */
export function getDaysUntilReplacement(
  replacementDate: Date | string | null,
  referenceDate: Date = new Date()
): number | null {
  if (!replacementDate) return null;
  const date = typeof replacementDate === 'string' ? parseISO(replacementDate) : replacementDate;
  return differenceInDays(date, referenceDate);
}

/**
 * Check if PPE is overdue for replacement
 */
export function isReplacementOverdue(
  replacementDate: Date | string | null,
  referenceDate: Date = new Date()
): boolean {
  if (!replacementDate) return false;
  const date = typeof replacementDate === 'string' ? parseISO(replacementDate) : replacementDate;
  return isBefore(date, referenceDate);
}

/**
 * Check if PPE replacement is due soon (within threshold days)
 */
export function isReplacementDueSoon(
  replacementDate: Date | string | null,
  thresholdDays: number = 30,
  referenceDate: Date = new Date()
): boolean {
  if (!replacementDate) return false;
  const date = typeof replacementDate === 'string' ? parseISO(replacementDate) : replacementDate;
  const thresholdDate = addDays(referenceDate, thresholdDays);
  
  // Due soon if: not overdue AND within threshold
  return !isBefore(date, referenceDate) && 
         (isBefore(date, thresholdDate) || isEqual(date, thresholdDate));
}

// ============================================
// Stock/Inventory Utilities
// ============================================

/**
 * Check if stock is below reorder level
 * Property 4: Low Stock Detection
 */
export function isStockLow(quantity: number, reorderLevel: number): boolean {
  return quantity < reorderLevel;
}

/**
 * Get stock status
 */
export function getStockStatus(
  quantity: number,
  reorderLevel: number
): 'adequate' | 'low' | 'critical' {
  if (quantity === 0) return 'critical';
  if (quantity < reorderLevel) return 'low';
  return 'adequate';
}

/**
 * Get stock status color
 */
export function getStockStatusColor(status: 'adequate' | 'low' | 'critical'): string {
  const colors = {
    adequate: 'bg-green-100 text-green-800',
    low: 'bg-yellow-100 text-yellow-800',
    critical: 'bg-red-100 text-red-800',
  };
  return colors[status];
}

// ============================================
// Compliance Utilities
// ============================================

/**
 * Calculate compliance status for a single PPE type
 * Property 11: Compliance Status Calculation
 */
export function getComplianceStatus(
  hasActiveIssuance: boolean,
  isMandatory: boolean,
  replacementDate: Date | string | null,
  referenceDate: Date = new Date()
): PPEComplianceStatus {
  // If no active issuance and mandatory, it's missing
  if (!hasActiveIssuance && isMandatory) {
    return 'missing';
  }
  
  // If no active issuance and not mandatory, not required
  if (!hasActiveIssuance && !isMandatory) {
    return 'not_required';
  }
  
  // Has active issuance - check replacement status
  if (replacementDate) {
    if (isReplacementOverdue(replacementDate, referenceDate)) {
      return 'overdue';
    }
    if (isReplacementDueSoon(replacementDate, 30, referenceDate)) {
      return 'due_soon';
    }
  }
  
  return 'issued';
}

/**
 * Format compliance status for display
 */
export function formatComplianceStatus(status: PPEComplianceStatus): string {
  const statusLabels: Record<PPEComplianceStatus, string> = {
    issued: 'Issued',
    missing: 'Missing',
    overdue: 'Overdue',
    due_soon: 'Due Soon',
    not_required: 'Not Required',
  };
  return statusLabels[status];
}

/**
 * Get compliance status color
 */
export function getComplianceStatusColor(status: PPEComplianceStatus): string {
  const colors: Record<PPEComplianceStatus, string> = {
    issued: 'bg-green-100 text-green-800',
    missing: 'bg-red-100 text-red-800',
    overdue: 'bg-red-100 text-red-800',
    due_soon: 'bg-yellow-100 text-yellow-800',
    not_required: 'bg-gray-100 text-gray-800',
  };
  return colors[status];
}

/**
 * Count compliance issues from a list of statuses
 * Property 12: Compliance Issue Counting
 */
export function countComplianceIssues(statuses: PPEComplianceStatus[]): ComplianceIssueCounts {
  return statuses.reduce(
    (counts, status) => {
      switch (status) {
        case 'missing':
          counts.missing++;
          break;
        case 'overdue':
          counts.overdue++;
          break;
        case 'due_soon':
          counts.dueSoon++;
          break;
        case 'issued':
          counts.issued++;
          break;
      }
      return counts;
    },
    { missing: 0, overdue: 0, dueSoon: 0, issued: 0 }
  );
}

/**
 * Get total compliance issues (missing + overdue + due_soon)
 */
export function getTotalComplianceIssues(counts: ComplianceIssueCounts): number {
  return counts.missing + counts.overdue + counts.dueSoon;
}

/**
 * Generate employee compliance summary from PPE status records
 */
export function getEmployeeComplianceSummary(
  employeeStatuses: EmployeePPEStatus[]
): EmployeeComplianceSummary[] {
  // Group by employee
  const employeeMap = new Map<string, EmployeePPEStatus[]>();
  
  for (const status of employeeStatuses) {
    const existing = employeeMap.get(status.employee_id) || [];
    existing.push(status);
    employeeMap.set(status.employee_id, existing);
  }
  
  // Generate summaries
  const summaries: EmployeeComplianceSummary[] = [];
  
  for (const [employeeId, statuses] of employeeMap) {
    const mandatoryStatuses = statuses.filter(s => s.is_mandatory);
    const counts = countComplianceIssues(
      mandatoryStatuses.map(s => s.ppe_status)
    );
    
    summaries.push({
      employeeId,
      employeeName: statuses[0]?.full_name || '',
      totalMandatory: mandatoryStatuses.length,
      issued: counts.issued,
      missing: counts.missing,
      overdue: counts.overdue,
      dueSoon: counts.dueSoon,
      isCompliant: counts.missing === 0 && counts.overdue === 0,
    });
  }
  
  return summaries;
}

// ============================================
// Formatting Utilities
// ============================================

/**
 * Format date for display (DD/MM/YYYY)
 */
export function formatPPEDate(date: Date | string | null): string {
  if (!date) return '-';
  const d = typeof date === 'string' ? parseISO(date) : date;
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/**
 * Format currency for PPE costs
 */
export function formatPPECost(amount: number | null): string {
  if (amount === null || amount === undefined) return '-';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
