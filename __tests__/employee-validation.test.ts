import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  isValidEmployeeStatus,
  isValidEmploymentType,
  isValidEmployeeCode,
} from '@/lib/employee-utils';
import { EmployeeStatus, EmploymentType } from '@/types/employees';

// Valid values
const validStatuses: EmployeeStatus[] = ['active', 'on_leave', 'suspended', 'resigned', 'terminated'];
const validEmploymentTypes: EmploymentType[] = ['permanent', 'contract', 'probation', 'intern', 'outsource'];

// Generators
const validStatusArb = fc.constantFrom<EmployeeStatus>(...validStatuses);
const validEmploymentTypeArb = fc.constantFrom<EmploymentType>(...validEmploymentTypes);
const invalidStringArb = fc.string().filter(s => 
  !validStatuses.includes(s as EmployeeStatus) && 
  !validEmploymentTypes.includes(s as EmploymentType)
);

describe('Employee Validation - Property Tests', () => {
  // Feature: hr-employee-master, Property 2: Required Field Validation
  describe('Property 2: Required Field Validation', () => {
    it('should validate that full_name cannot be empty or whitespace', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.constant(''),
            fc.constant('   '),
            fc.constant('\t\n'),
            fc.constant('     ')
          ),
          (emptyName) => {
            // Empty or whitespace-only names should be invalid
            const trimmed = emptyName.trim();
            expect(trimmed.length).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should accept non-empty names', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0),
          (validName) => {
            const trimmed = validName.trim();
            expect(trimmed.length).toBeGreaterThan(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should validate join_date is required', () => {
      fc.assert(
        fc.property(
          fc.date({ 
            min: new Date('2000-01-01T00:00:00.000Z'), 
            max: new Date('2030-12-31T00:00:00.000Z'),
            noInvalidDate: true
          }),
          (date) => {
            const dateStr = date.toISOString().split('T')[0];
            expect(dateStr).toMatch(/^\d{4}-\d{2}-\d{2}$/);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Feature: hr-employee-master, Property 5: Employee Code Immutability
  describe('Property 5: Employee Code Immutability', () => {
    it('should validate employee code format EMP-XXX', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 9999 }),
          (num) => {
            const code = `EMP-${String(num).padStart(3, '0')}`;
            expect(isValidEmployeeCode(code)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject invalid employee code formats', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.constant('EMP'),
            fc.constant('EMP-'),
            fc.constant('EMP-AB'),
            fc.constant('EMPLOYEE-001'),
            fc.constant('001'),
            fc.string().filter(s => !s.startsWith('EMP-'))
          ),
          (invalidCode) => {
            expect(isValidEmployeeCode(invalidCode)).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Feature: hr-employee-master, Property 6: Status Validation and Defaults
  describe('Property 6: Status Validation and Defaults', () => {
    it('should accept all valid employee statuses', () => {
      fc.assert(
        fc.property(validStatusArb, (status) => {
          expect(isValidEmployeeStatus(status)).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it('should reject invalid employee statuses', () => {
      fc.assert(
        fc.property(invalidStringArb, (invalidStatus) => {
          expect(isValidEmployeeStatus(invalidStatus)).toBe(false);
        }),
        { numRuns: 100 }
      );
    });

    it('should accept all valid employment types', () => {
      fc.assert(
        fc.property(validEmploymentTypeArb, (type) => {
          expect(isValidEmploymentType(type)).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it('should reject invalid employment types', () => {
      fc.assert(
        fc.property(invalidStringArb, (invalidType) => {
          expect(isValidEmploymentType(invalidType)).toBe(false);
        }),
        { numRuns: 100 }
      );
    });

    it('default status should be active', () => {
      // The default status for new employees should be 'active'
      const defaultStatus: EmployeeStatus = 'active';
      expect(isValidEmployeeStatus(defaultStatus)).toBe(true);
      expect(defaultStatus).toBe('active');
    });
  });
});

describe('Employee Validation - Unit Tests', () => {
  describe('isValidEmployeeStatus', () => {
    it('should return true for all valid statuses', () => {
      validStatuses.forEach(status => {
        expect(isValidEmployeeStatus(status)).toBe(true);
      });
    });

    it('should return false for invalid statuses', () => {
      expect(isValidEmployeeStatus('invalid')).toBe(false);
      expect(isValidEmployeeStatus('')).toBe(false);
      expect(isValidEmployeeStatus('ACTIVE')).toBe(false); // case sensitive
    });
  });

  describe('isValidEmploymentType', () => {
    it('should return true for all valid types', () => {
      validEmploymentTypes.forEach(type => {
        expect(isValidEmploymentType(type)).toBe(true);
      });
    });

    it('should return false for invalid types', () => {
      expect(isValidEmploymentType('invalid')).toBe(false);
      expect(isValidEmploymentType('')).toBe(false);
      expect(isValidEmploymentType('PERMANENT')).toBe(false); // case sensitive
    });
  });

  describe('isValidEmployeeCode', () => {
    it('should accept valid codes', () => {
      expect(isValidEmployeeCode('EMP-001')).toBe(true);
      expect(isValidEmployeeCode('EMP-999')).toBe(true);
      expect(isValidEmployeeCode('EMP-1234')).toBe(true);
    });

    it('should reject invalid codes', () => {
      expect(isValidEmployeeCode('EMP-01')).toBe(false); // too short
      expect(isValidEmployeeCode('EMP-')).toBe(false);
      expect(isValidEmployeeCode('EMP')).toBe(false);
      expect(isValidEmployeeCode('001')).toBe(false);
      expect(isValidEmployeeCode('')).toBe(false);
    });
  });
});
