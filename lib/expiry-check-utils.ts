// =====================================================
// v0.70: EXPIRY CHECK UTILITY FUNCTIONS
// =====================================================

import {
  ExpiryUrgency,
  ExpiryItemType,
  ExpiringItem,
  ExpiryCheckResult,
  ExpiringDocument,
  ExpiringPermit,
  ExpiringCertification,
  ExpiryCheckSummary,
  EXPIRY_URGENCY_THRESHOLDS,
  DEFAULT_EXPIRY_LOOKAHEAD_DAYS,
} from '@/types/expiry-check';

// =====================================================
// DATE CALCULATION FUNCTIONS
// =====================================================

/**
 * Calculates the number of days until an expiry date.
 * Negative values indicate the item has already expired.
 * 
 * @param expiryDate - The expiry date (ISO string or Date)
 * @param referenceDate - The reference date to calculate from (default: today)
 * @returns Number of days until expiry (negative if expired)
 */
export function calculateDaysUntilExpiry(
  expiryDate: string | Date,
  referenceDate: Date = new Date()
): number {
  const expiry = new Date(expiryDate);
  const ref = new Date(referenceDate);
  
  // Normalize to start of day for accurate day calculation
  expiry.setHours(0, 0, 0, 0);
  ref.setHours(0, 0, 0, 0);
  
  const diffMs = expiry.getTime() - ref.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  
  return diffDays;
}

/**
 * Checks if an item is within the expiry window.
 * 
 * @param expiryDate - The expiry date
 * @param withinDays - Number of days to look ahead
 * @param referenceDate - Reference date (default: today)
 * @returns True if the item expires within the specified days
 */
export function isWithinExpiryWindow(
  expiryDate: string | Date,
  withinDays: number,
  referenceDate: Date = new Date()
): boolean {
  const daysUntilExpiry = calculateDaysUntilExpiry(expiryDate, referenceDate);
  return daysUntilExpiry <= withinDays;
}

// =====================================================
// CLASSIFICATION FUNCTIONS
// =====================================================

/**
 * Classifies the urgency of an expiring item based on days until expiry.
 * - expired: daysUntilExpiry < 0
 * - expiring_this_week: 0 <= daysUntilExpiry <= 7
 * - expiring_this_month: 7 < daysUntilExpiry <= 30
 * 
 * @param daysUntilExpiry - Number of days until the item expires
 * @returns The urgency classification
 */
export function classifyExpiryUrgency(daysUntilExpiry: number): ExpiryUrgency {
  if (daysUntilExpiry < 0) {
    return 'expired';
  }
  if (daysUntilExpiry <= EXPIRY_URGENCY_THRESHOLDS.expiring_this_week) {
    return 'expiring_this_week';
  }
  return 'expiring_this_month';
}

/**
 * Groups expiring items by urgency level.
 * 
 * @param items - Array of expiring items to group
 * @returns Grouped result with totals
 */
export function groupExpiringItems(items: ExpiringItem[]): ExpiryCheckResult {
  const result: ExpiryCheckResult = {
    expired: [],
    expiring_this_week: [],
    expiring_this_month: [],
    total_count: 0,
  };
  
  for (const item of items) {
    result[item.urgency].push(item);
    result.total_count++;
  }
  
  return result;
}

// =====================================================
// DOCUMENT EXPIRY FUNCTIONS
// =====================================================

/**
 * Creates an ExpiringDocument from raw document data.
 * 
 * @param doc - Raw document data
 * @param referenceDate - Reference date for calculating days until expiry
 * @returns ExpiringDocument object or null if not expiring
 */
export function createExpiringDocument(
  doc: {
    id: string;
    document_name: string;
    document_type: string;
    expiry_date: string;
    asset_id: string | null;
    asset_code?: string | null;
    asset_name?: string | null;
    uploaded_by?: string | null;
  },
  referenceDate: Date = new Date()
): ExpiringDocument | null {
  const daysUntilExpiry = calculateDaysUntilExpiry(doc.expiry_date, referenceDate);
  
  // Only include items within the lookahead window
  if (daysUntilExpiry > DEFAULT_EXPIRY_LOOKAHEAD_DAYS) {
    return null;
  }
  
  return {
    id: doc.id,
    item_type: 'document',
    name: doc.document_name,
    description: null,
    expiry_date: doc.expiry_date,
    days_until_expiry: daysUntilExpiry,
    urgency: classifyExpiryUrgency(daysUntilExpiry),
    responsible_user_id: doc.uploaded_by || null,
    responsible_user_name: null,
    parent_id: doc.asset_id,
    parent_name: doc.asset_name || null,
    document_type: doc.document_type,
    asset_id: doc.asset_id,
    asset_code: doc.asset_code || null,
  };
}

/**
 * Filters and transforms raw document data into expiring documents.
 * 
 * @param documents - Array of raw document data
 * @param withinDays - Number of days to look ahead (default: 30)
 * @param referenceDate - Reference date for calculating days until expiry
 * @returns Array of expiring documents
 */
export function filterExpiringDocuments(
  documents: Array<{
    id: string;
    document_name: string;
    document_type: string;
    expiry_date: string | null;
    asset_id: string | null;
    asset_code?: string | null;
    asset_name?: string | null;
    uploaded_by?: string | null;
  }>,
  withinDays: number = DEFAULT_EXPIRY_LOOKAHEAD_DAYS,
  referenceDate: Date = new Date()
): ExpiringDocument[] {
  const expiringDocs: ExpiringDocument[] = [];
  
  for (const doc of documents) {
    // Skip documents without expiry date
    if (!doc.expiry_date) {
      continue;
    }
    
    const daysUntilExpiry = calculateDaysUntilExpiry(doc.expiry_date, referenceDate);
    
    // Only include items within the lookahead window
    if (daysUntilExpiry > withinDays) {
      continue;
    }
    
    expiringDocs.push({
      id: doc.id,
      item_type: 'document',
      name: doc.document_name,
      description: null,
      expiry_date: doc.expiry_date,
      days_until_expiry: daysUntilExpiry,
      urgency: classifyExpiryUrgency(daysUntilExpiry),
      responsible_user_id: doc.uploaded_by || null,
      responsible_user_name: null,
      parent_id: doc.asset_id,
      parent_name: doc.asset_name || null,
      document_type: doc.document_type,
      asset_id: doc.asset_id,
      asset_code: doc.asset_code || null,
    });
  }
  
  return expiringDocs;
}

// =====================================================
// PERMIT EXPIRY FUNCTIONS
// =====================================================

/**
 * Creates an ExpiringPermit from raw permit data.
 * 
 * @param permit - Raw permit data
 * @param referenceDate - Reference date for calculating days until expiry
 * @returns ExpiringPermit object or null if not expiring
 */
export function createExpiringPermit(
  permit: {
    id: string;
    permit_number?: string | null;
    permit_type: string;
    work_description: string;
    work_location: string;
    valid_to: string;
    requested_by?: string | null;
    requester_name?: string | null;
  },
  referenceDate: Date = new Date()
): ExpiringPermit | null {
  const daysUntilExpiry = calculateDaysUntilExpiry(permit.valid_to, referenceDate);
  
  // Only include items within the lookahead window
  if (daysUntilExpiry > DEFAULT_EXPIRY_LOOKAHEAD_DAYS) {
    return null;
  }
  
  return {
    id: permit.id,
    item_type: 'permit',
    name: permit.work_description,
    description: `${permit.permit_type} at ${permit.work_location}`,
    expiry_date: permit.valid_to,
    days_until_expiry: daysUntilExpiry,
    urgency: classifyExpiryUrgency(daysUntilExpiry),
    responsible_user_id: permit.requested_by || null,
    responsible_user_name: permit.requester_name || null,
    parent_id: null,
    parent_name: null,
    permit_type: permit.permit_type,
    permit_number: permit.permit_number || null,
    work_location: permit.work_location,
  };
}

/**
 * Filters and transforms raw permit data into expiring permits.
 * 
 * @param permits - Array of raw permit data
 * @param withinDays - Number of days to look ahead (default: 30)
 * @param referenceDate - Reference date for calculating days until expiry
 * @returns Array of expiring permits
 */
export function filterExpiringPermits(
  permits: Array<{
    id: string;
    permit_number?: string | null;
    permit_type: string;
    work_description: string;
    work_location: string;
    valid_to: string;
    status: string;
    requested_by?: string | null;
    requester_name?: string | null;
  }>,
  withinDays: number = DEFAULT_EXPIRY_LOOKAHEAD_DAYS,
  referenceDate: Date = new Date()
): ExpiringPermit[] {
  const expiringPermits: ExpiringPermit[] = [];
  
  // Only check active or approved permits
  const activeStatuses = ['active', 'approved'];
  
  for (const permit of permits) {
    // Skip non-active permits
    if (!activeStatuses.includes(permit.status)) {
      continue;
    }
    
    const daysUntilExpiry = calculateDaysUntilExpiry(permit.valid_to, referenceDate);
    
    // Only include items within the lookahead window
    if (daysUntilExpiry > withinDays) {
      continue;
    }
    
    expiringPermits.push({
      id: permit.id,
      item_type: 'permit',
      name: permit.work_description,
      description: `${permit.permit_type} at ${permit.work_location}`,
      expiry_date: permit.valid_to,
      days_until_expiry: daysUntilExpiry,
      urgency: classifyExpiryUrgency(daysUntilExpiry),
      responsible_user_id: permit.requested_by || null,
      responsible_user_name: permit.requester_name || null,
      parent_id: null,
      parent_name: null,
      permit_type: permit.permit_type,
      permit_number: permit.permit_number || null,
      work_location: permit.work_location,
    });
  }
  
  return expiringPermits;
}

// =====================================================
// CERTIFICATION EXPIRY FUNCTIONS
// =====================================================

/**
 * Creates an ExpiringCertification from raw certification data.
 * 
 * @param cert - Raw certification data
 * @param referenceDate - Reference date for calculating days until expiry
 * @returns ExpiringCertification object or null if not expiring
 */
export function createExpiringCertification(
  cert: {
    id: string;
    employee_id: string;
    employee_name: string;
    skill_id: string;
    skill_name: string;
    skill_code: string;
    certification_number?: string | null;
    expiry_date: string;
  },
  referenceDate: Date = new Date()
): ExpiringCertification | null {
  const daysUntilExpiry = calculateDaysUntilExpiry(cert.expiry_date, referenceDate);
  
  // Only include items within the lookahead window
  if (daysUntilExpiry > DEFAULT_EXPIRY_LOOKAHEAD_DAYS) {
    return null;
  }
  
  return {
    id: cert.id,
    item_type: 'certification',
    name: `${cert.skill_name} - ${cert.employee_name}`,
    description: `Certification for ${cert.skill_name}`,
    expiry_date: cert.expiry_date,
    days_until_expiry: daysUntilExpiry,
    urgency: classifyExpiryUrgency(daysUntilExpiry),
    responsible_user_id: cert.employee_id,
    responsible_user_name: cert.employee_name,
    parent_id: cert.employee_id,
    parent_name: cert.employee_name,
    skill_name: cert.skill_name,
    skill_code: cert.skill_code,
    employee_id: cert.employee_id,
    employee_name: cert.employee_name,
    certification_number: cert.certification_number || null,
  };
}

/**
 * Filters and transforms raw certification data into expiring certifications.
 * 
 * @param certifications - Array of raw certification data
 * @param withinDays - Number of days to look ahead (default: 30)
 * @param referenceDate - Reference date for calculating days until expiry
 * @returns Array of expiring certifications
 */
export function filterExpiringCertifications(
  certifications: Array<{
    id: string;
    employee_id: string;
    employee_name: string;
    skill_id: string;
    skill_name: string;
    skill_code: string;
    certification_number?: string | null;
    expiry_date: string | null;
    is_certified: boolean;
  }>,
  withinDays: number = DEFAULT_EXPIRY_LOOKAHEAD_DAYS,
  referenceDate: Date = new Date()
): ExpiringCertification[] {
  const expiringCerts: ExpiringCertification[] = [];
  
  for (const cert of certifications) {
    // Skip non-certified or items without expiry date
    if (!cert.is_certified || !cert.expiry_date) {
      continue;
    }
    
    const daysUntilExpiry = calculateDaysUntilExpiry(cert.expiry_date, referenceDate);
    
    // Only include items within the lookahead window
    if (daysUntilExpiry > withinDays) {
      continue;
    }
    
    expiringCerts.push({
      id: cert.id,
      item_type: 'certification',
      name: `${cert.skill_name} - ${cert.employee_name}`,
      description: `Certification for ${cert.skill_name}`,
      expiry_date: cert.expiry_date,
      days_until_expiry: daysUntilExpiry,
      urgency: classifyExpiryUrgency(daysUntilExpiry),
      responsible_user_id: cert.employee_id,
      responsible_user_name: cert.employee_name,
      parent_id: cert.employee_id,
      parent_name: cert.employee_name,
      skill_name: cert.skill_name,
      skill_code: cert.skill_code,
      employee_id: cert.employee_id,
      employee_name: cert.employee_name,
      certification_number: cert.certification_number || null,
    });
  }
  
  return expiringCerts;
}

// =====================================================
// SUMMARY AND REPORTING FUNCTIONS
// =====================================================

/**
 * Generates a summary of the expiry check result.
 * 
 * @param result - The expiry check result
 * @param lookaheadDays - Number of days used for the check
 * @returns Summary object for logging/reporting
 */
export function generateExpirySummary(
  result: ExpiryCheckResult,
  lookaheadDays: number = DEFAULT_EXPIRY_LOOKAHEAD_DAYS
): ExpiryCheckSummary {
  const allItems = [
    ...result.expired,
    ...result.expiring_this_week,
    ...result.expiring_this_month,
  ];
  
  // Count by type
  const byType: Record<ExpiryItemType, { count: number }> = {
    document: { count: 0 },
    permit: { count: 0 },
    certification: { count: 0 },
  };
  
  for (const item of allItems) {
    byType[item.item_type].count++;
  }
  
  return {
    total_count: result.total_count,
    by_urgency: {
      expired: { count: result.expired.length },
      expiring_this_week: { count: result.expiring_this_week.length },
      expiring_this_month: { count: result.expiring_this_month.length },
    },
    by_type: byType,
    check_date: new Date().toISOString(),
    lookahead_days: lookaheadDays,
  };
}

/**
 * Checks if there are any expired items that need immediate attention.
 * 
 * @param result - The expiry check result
 * @returns True if there are expired items
 */
export function hasExpiredItems(result: ExpiryCheckResult): boolean {
  return result.expired.length > 0;
}

/**
 * Checks if there are any items expiring this week.
 * 
 * @param result - The expiry check result
 * @returns True if there are items expiring this week
 */
export function hasItemsExpiringThisWeek(result: ExpiryCheckResult): boolean {
  return result.expiring_this_week.length > 0;
}

/**
 * Gets the most urgent items that need immediate attention.
 * 
 * @param result - The expiry check result
 * @param limit - Maximum number of items to return
 * @returns Array of the most urgent items
 */
export function getMostUrgentItems(
  result: ExpiryCheckResult,
  limit: number = 10
): ExpiringItem[] {
  // Combine all items and sort by days until expiry (ascending - most urgent first)
  const allItems = [
    ...result.expired,
    ...result.expiring_this_week,
    ...result.expiring_this_month,
  ];
  
  return allItems
    .sort((a, b) => a.days_until_expiry - b.days_until_expiry)
    .slice(0, limit);
}

/**
 * Filters items by type.
 * 
 * @param result - The expiry check result
 * @param itemType - The type of items to filter
 * @returns Filtered expiry check result
 */
export function filterByItemType(
  result: ExpiryCheckResult,
  itemType: ExpiryItemType
): ExpiryCheckResult {
  const filterFn = (item: ExpiringItem) => item.item_type === itemType;
  
  const filtered: ExpiryCheckResult = {
    expired: result.expired.filter(filterFn),
    expiring_this_week: result.expiring_this_week.filter(filterFn),
    expiring_this_month: result.expiring_this_month.filter(filterFn),
    total_count: 0,
  };
  
  filtered.total_count = 
    filtered.expired.length + 
    filtered.expiring_this_week.length + 
    filtered.expiring_this_month.length;
  
  return filtered;
}

/**
 * Combines multiple expiry check results into one.
 * 
 * @param results - Array of expiry check results to combine
 * @returns Combined expiry check result
 */
export function combineExpiryResults(results: ExpiryCheckResult[]): ExpiryCheckResult {
  const combined: ExpiryCheckResult = {
    expired: [],
    expiring_this_week: [],
    expiring_this_month: [],
    total_count: 0,
  };
  
  for (const result of results) {
    combined.expired.push(...result.expired);
    combined.expiring_this_week.push(...result.expiring_this_week);
    combined.expiring_this_month.push(...result.expiring_this_month);
    combined.total_count += result.total_count;
  }
  
  return combined;
}
