import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { addDays, parseISO, differenceInDays } from 'date-fns';
import {
  isValidPPECategory,
  isStockLow,
  calculateReplacementDate,
  getComplianceStatus,
  countComplianceIssues,
  isReplacementOverdue,
  isReplacementDueSoon,
  isValidIssuanceStatus,
  isValidPPECondition,
  isValidInspectionAction,
} from '@/lib/ppe-utils';
import {
  PPE_CATEGORIES,
  ISSUANCE_STATUSES,
  PPE_CONDITIONS,
  INSPECTION_ACTIONS,
  PPEComplianceStatus,
} from '@/types/ppe';

describe('PPE Utils Property Tests', () => {
  /**
   * Feature: hse-ppe-management, Property 2: PPE Category Validation
   * For any string value provided as a PPE category, the system SHALL accept
   * only values from the set {head, eye, ear, respiratory, hand, body, foot, fall_protection}
   * and reject all others.
   * Validates: Requirements 1.2
   */
  describe('Property 2: PPE Category Validation', () => {
    it('should accept all valid PPE categories', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...PPE_CATEGORIES),
          (category) => {
            return isValidPPECategory(category) === true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject invalid PPE categories', () => {
      fc.assert(
        fc.property(
          fc.string().filter(s => !PPE_CATEGORIES.includes(s as any)),
          (invalidCategory) => {
            return isValidPPECategory(invalidCategory) === false;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: hse-ppe-management, Property 4: Low Stock Detection
   * For any inventory item where quantity_in_stock < reorder_level,
   * the isStockLow function SHALL return true; otherwise it SHALL return false.
   * Validates: Requirements 2.3
   */
  describe('Property 4: Low Stock Detection', () => {
    it('should correctly detect low stock for any quantity/reorder combination', () => {
      fc.assert(
        fc.property(
          fc.nat({ max: 1000 }), // quantity
          fc.nat({ max: 1000 }), // reorderLevel
          (quantity, reorderLevel) => {
            const result = isStockLow(quantity, reorderLevel);
            return result === (quantity < reorderLevel);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return true when quantity is zero and reorder level is positive', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 1000 }), // positive reorder level
          (reorderLevel) => {
            return isStockLow(0, reorderLevel) === true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return false when quantity equals reorder level', () => {
      fc.assert(
        fc.property(
          fc.nat({ max: 1000 }),
          (level) => {
            return isStockLow(level, level) === false;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: hse-ppe-management, Property 7: Replacement Date Calculation
   * For any PPE issuance with issue_date D and PPE type with replacement_interval_days I
   * (where I is not null), the expected_replacement_date SHALL equal D + I days.
   * Validates: Requirements 3.3
   */
  describe('Property 7: Replacement Date Calculation', () => {
    it('should calculate replacement date as issue date plus interval days', () => {
      fc.assert(
        fc.property(
          fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }),
          fc.integer({ min: 1, max: 3650 }), // 1 day to 10 years
          (issueDate, intervalDays) => {
            const result = calculateReplacementDate(issueDate, intervalDays);
            if (result === null) return false;
            
            const expectedDate = addDays(issueDate, intervalDays);
            return differenceInDays(result, expectedDate) === 0;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return null when interval is null', () => {
      fc.assert(
        fc.property(
          fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }),
          (issueDate) => {
            return calculateReplacementDate(issueDate, null) === null;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle string dates correctly', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 2020, max: 2030 }),
          fc.integer({ min: 1, max: 12 }),
          fc.integer({ min: 1, max: 28 }),
          fc.integer({ min: 1, max: 365 }),
          (year, month, day, intervalDays) => {
            const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const result = calculateReplacementDate(dateStr, intervalDays);
            if (result === null) return false;
            
            const expectedDate = addDays(parseISO(dateStr), intervalDays);
            return differenceInDays(result, expectedDate) === 0;
          }
        ),
        { numRuns: 100 }
      );
    });
  });


  /**
   * Feature: hse-ppe-management, Property 11: Compliance Status Calculation
   * For any employee and mandatory PPE type combination:
   * - If no active issuance exists, status SHALL be 'missing'
   * - If active issuance exists and expected_replacement_date < current_date, status SHALL be 'overdue'
   * - If active issuance exists and expected_replacement_date is within 30 days, status SHALL be 'due_soon'
   * - If active issuance exists and not overdue or due_soon, status SHALL be 'issued'
   * Validates: Requirements 6.2, 6.3, 6.4, 6.5
   */
  describe('Property 11: Compliance Status Calculation', () => {
    const referenceDate = new Date('2025-06-15');

    it('should return "missing" when no active issuance and mandatory', () => {
      fc.assert(
        fc.property(
          fc.constant(false), // hasActiveIssuance
          fc.constant(true),  // isMandatory
          (hasActiveIssuance, isMandatory) => {
            const result = getComplianceStatus(hasActiveIssuance, isMandatory, null, referenceDate);
            return result === 'missing';
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return "not_required" when no active issuance and not mandatory', () => {
      fc.assert(
        fc.property(
          fc.constant(false), // hasActiveIssuance
          fc.constant(false), // isMandatory
          (hasActiveIssuance, isMandatory) => {
            const result = getComplianceStatus(hasActiveIssuance, isMandatory, null, referenceDate);
            return result === 'not_required';
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return "overdue" when replacement date is in the past', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 365 }), // days in the past
          fc.boolean(), // isMandatory (doesn't matter when has issuance)
          (daysAgo, isMandatory) => {
            const pastDate = addDays(referenceDate, -daysAgo);
            const result = getComplianceStatus(true, isMandatory, pastDate, referenceDate);
            return result === 'overdue';
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return "due_soon" when replacement date is within 30 days', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 30 }), // days in the future (0-30)
          fc.boolean(),
          (daysAhead, isMandatory) => {
            const futureDate = addDays(referenceDate, daysAhead);
            const result = getComplianceStatus(true, isMandatory, futureDate, referenceDate);
            return result === 'due_soon';
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return "issued" when replacement date is more than 30 days away', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 31, max: 365 }), // days in the future (>30)
          fc.boolean(),
          (daysAhead, isMandatory) => {
            const futureDate = addDays(referenceDate, daysAhead);
            const result = getComplianceStatus(true, isMandatory, futureDate, referenceDate);
            return result === 'issued';
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return "issued" when has active issuance with no replacement date', () => {
      fc.assert(
        fc.property(
          fc.boolean(),
          (isMandatory) => {
            const result = getComplianceStatus(true, isMandatory, null, referenceDate);
            return result === 'issued';
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: hse-ppe-management, Property 12: Compliance Issue Counting
   * For any employee's PPE status records, the compliance issue count SHALL equal
   * the sum of statuses that are 'missing', 'overdue', or 'due_soon'.
   * Validates: Requirements 6.6
   */
  describe('Property 12: Compliance Issue Counting', () => {
    const allStatuses: PPEComplianceStatus[] = ['issued', 'missing', 'overdue', 'due_soon', 'not_required'];

    it('should correctly count each status type', () => {
      fc.assert(
        fc.property(
          fc.array(fc.constantFrom(...allStatuses), { minLength: 0, maxLength: 50 }),
          (statuses) => {
            const result = countComplianceIssues(statuses);
            
            const expectedMissing = statuses.filter(s => s === 'missing').length;
            const expectedOverdue = statuses.filter(s => s === 'overdue').length;
            const expectedDueSoon = statuses.filter(s => s === 'due_soon').length;
            const expectedIssued = statuses.filter(s => s === 'issued').length;
            
            return (
              result.missing === expectedMissing &&
              result.overdue === expectedOverdue &&
              result.dueSoon === expectedDueSoon &&
              result.issued === expectedIssued
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return zero counts for empty array', () => {
      const result = countComplianceIssues([]);
      expect(result).toEqual({ missing: 0, overdue: 0, dueSoon: 0, issued: 0 });
    });

    it('should not count "not_required" status in any category', () => {
      fc.assert(
        fc.property(
          fc.array(fc.constant('not_required' as PPEComplianceStatus), { minLength: 1, maxLength: 20 }),
          (statuses) => {
            const result = countComplianceIssues(statuses);
            return (
              result.missing === 0 &&
              result.overdue === 0 &&
              result.dueSoon === 0 &&
              result.issued === 0
            );
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: hse-ppe-management, Property 8: Issuance Status Validation
   * For any string value provided as an issuance status, the system SHALL accept
   * only values from the set {active, returned, replaced, lost, damaged} and reject all others.
   * Validates: Requirements 3.6
   */
  describe('Property 8: Issuance Status Validation', () => {
    it('should accept all valid issuance statuses', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...ISSUANCE_STATUSES),
          (status) => {
            return isValidIssuanceStatus(status) === true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject invalid issuance statuses', () => {
      fc.assert(
        fc.property(
          fc.string().filter(s => !ISSUANCE_STATUSES.includes(s as any)),
          (invalidStatus) => {
            return isValidIssuanceStatus(invalidStatus) === false;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: hse-ppe-management, Property 9: Inspection Enum Validation
   * For any inspection record, the condition field SHALL only accept values from
   * {new, good, fair, poor, failed} and the action_required field SHALL only accept
   * values from {none, clean, repair, replace}.
   * Validates: Requirements 4.2, 4.4
   */
  describe('Property 9: Inspection Enum Validation', () => {
    it('should accept all valid PPE conditions', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...PPE_CONDITIONS),
          (condition) => {
            return isValidPPECondition(condition) === true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject invalid PPE conditions', () => {
      fc.assert(
        fc.property(
          fc.string().filter(s => !PPE_CONDITIONS.includes(s as any)),
          (invalidCondition) => {
            return isValidPPECondition(invalidCondition) === false;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should accept all valid inspection actions', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...INSPECTION_ACTIONS),
          (action) => {
            return isValidInspectionAction(action) === true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject invalid inspection actions', () => {
      fc.assert(
        fc.property(
          fc.string().filter(s => !INSPECTION_ACTIONS.includes(s as any)),
          (invalidAction) => {
            return isValidInspectionAction(invalidAction) === false;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
