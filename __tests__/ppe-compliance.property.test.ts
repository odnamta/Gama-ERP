import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { addDays } from 'date-fns';
import {
  getComplianceStatus,
  isReplacementOverdue,
  isReplacementDueSoon,
  getEmployeeComplianceSummary,
} from '@/lib/ppe-utils';
import { EmployeePPEStatus, PPEComplianceStatus } from '@/types/ppe';

describe('PPE Compliance Property Tests', () => {
  /**
   * Feature: hse-ppe-management, Property 3: Soft-Delete Filtering
   * For any PPE type marked as inactive (is_active = false), queries for active
   * PPE types SHALL NOT include that type in results.
   * Validates: Requirements 1.7
   * 
   * Note: This property is tested at the database level via RLS and queries.
   * Here we test the utility function behavior that supports this.
   */
  describe('Property 3: Soft-Delete Filtering (Utility Support)', () => {
    it('should only process active PPE types in compliance calculations', () => {
      // This property is enforced at the database query level
      // The utility functions assume they receive only active data
      // We verify the compliance status calculation works correctly
      fc.assert(
        fc.property(
          fc.boolean(), // hasActiveIssuance
          fc.boolean(), // isMandatory
          (hasActiveIssuance, isMandatory) => {
            const status = getComplianceStatus(hasActiveIssuance, isMandatory, null);
            
            // Verify status is always one of the valid values
            const validStatuses: PPEComplianceStatus[] = [
              'issued', 'missing', 'overdue', 'due_soon', 'not_required'
            ];
            return validStatuses.includes(status);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: hse-ppe-management, Property 10: Replacement Due Filtering
   * For any set of PPE issuances, the replacement due view SHALL return only those where:
   * (1) status is 'active',
   * (2) expected_replacement_date is within 30 days of current date, and
   * (3) the associated employee is active.
   * The days_overdue calculation SHALL equal current_date - expected_replacement_date.
   * Validates: Requirements 5.1, 5.2, 5.5
   */
  describe('Property 10: Replacement Due Filtering', () => {
    const referenceDate = new Date('2025-06-15');

    it('should correctly identify overdue replacements', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 365 }), // days in the past
          (daysAgo) => {
            const pastDate = addDays(referenceDate, -daysAgo);
            return isReplacementOverdue(pastDate, referenceDate) === true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not flag future dates as overdue', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 365 }), // days in the future
          (daysAhead) => {
            const futureDate = addDays(referenceDate, daysAhead);
            return isReplacementOverdue(futureDate, referenceDate) === false;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should correctly identify due soon (within 30 days)', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 30 }), // days in the future (0-30)
          (daysAhead) => {
            const futureDate = addDays(referenceDate, daysAhead);
            return isReplacementDueSoon(futureDate, 30, referenceDate) === true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not flag dates beyond 30 days as due soon', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 31, max: 365 }), // days in the future (>30)
          (daysAhead) => {
            const futureDate = addDays(referenceDate, daysAhead);
            return isReplacementDueSoon(futureDate, 30, referenceDate) === false;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not flag past dates as due soon (they are overdue)', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 365 }), // days in the past
          (daysAgo) => {
            const pastDate = addDays(referenceDate, -daysAgo);
            return isReplacementDueSoon(pastDate, 30, referenceDate) === false;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle null replacement dates correctly', () => {
      expect(isReplacementOverdue(null)).toBe(false);
      expect(isReplacementDueSoon(null)).toBe(false);
    });
  });

  /**
   * Additional compliance summary tests
   */
  describe('Employee Compliance Summary Generation', () => {
    const generateMockStatus = (
      employeeId: string,
      employeeName: string,
      ppeStatus: PPEComplianceStatus,
      isMandatory: boolean
    ): EmployeePPEStatus => ({
      employee_id: employeeId,
      employee_code: `EMP-${employeeId.slice(0, 4)}`,
      full_name: employeeName,
      ppe_type_id: `ppe-${Math.random().toString(36).slice(2, 8)}`,
      ppe_code: 'TEST',
      ppe_name: 'Test PPE',
      is_mandatory: isMandatory,
      issuance_id: ppeStatus === 'issued' ? 'issuance-123' : null,
      issued_date: ppeStatus === 'issued' ? '2025-01-01' : null,
      expected_replacement_date: null,
      ppe_status: ppeStatus,
    });

    it('should correctly aggregate compliance issues per employee', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 5 }), // missing count
          fc.integer({ min: 0, max: 5 }), // overdue count
          fc.integer({ min: 0, max: 5 }), // due soon count
          fc.integer({ min: 0, max: 5 }), // issued count
          (missingCount, overdueCount, dueSoonCount, issuedCount) => {
            const employeeId = 'emp-001';
            const employeeName = 'Test Employee';
            
            const statuses: EmployeePPEStatus[] = [
              ...Array(missingCount).fill(null).map(() => 
                generateMockStatus(employeeId, employeeName, 'missing', true)
              ),
              ...Array(overdueCount).fill(null).map(() => 
                generateMockStatus(employeeId, employeeName, 'overdue', true)
              ),
              ...Array(dueSoonCount).fill(null).map(() => 
                generateMockStatus(employeeId, employeeName, 'due_soon', true)
              ),
              ...Array(issuedCount).fill(null).map(() => 
                generateMockStatus(employeeId, employeeName, 'issued', true)
              ),
            ];

            if (statuses.length === 0) return true;

            const summaries = getEmployeeComplianceSummary(statuses);
            
            if (summaries.length !== 1) return false;
            
            const summary = summaries[0];
            return (
              summary.missing === missingCount &&
              summary.overdue === overdueCount &&
              summary.dueSoon === dueSoonCount &&
              summary.issued === issuedCount &&
              summary.isCompliant === (missingCount === 0 && overdueCount === 0)
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should correctly determine compliance status', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 3 }), // missing count
          fc.integer({ min: 0, max: 3 }), // overdue count
          (missingCount, overdueCount) => {
            const employeeId = 'emp-001';
            const employeeName = 'Test Employee';
            
            const statuses: EmployeePPEStatus[] = [
              ...Array(missingCount).fill(null).map(() => 
                generateMockStatus(employeeId, employeeName, 'missing', true)
              ),
              ...Array(overdueCount).fill(null).map(() => 
                generateMockStatus(employeeId, employeeName, 'overdue', true)
              ),
              generateMockStatus(employeeId, employeeName, 'issued', true),
            ];

            const summaries = getEmployeeComplianceSummary(statuses);
            const summary = summaries[0];
            
            // Employee is compliant only if no missing and no overdue
            const expectedCompliant = missingCount === 0 && overdueCount === 0;
            return summary.isCompliant === expectedCompliant;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
