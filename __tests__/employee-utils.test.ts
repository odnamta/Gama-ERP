import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  generateEmployeeCode,
  isValidEmployeeCode,
  calculateEmployeeSummaryStats,
  filterEmployeesBySearch,
  hasCircularReporting,
  isValidPositionLevel,
  isValidEmployeeStatus,
  isValidEmploymentType,
  formatSalary,
  getEmploymentTypeLabel,
  getEmployeeStatusLabel,
  EMPLOYMENT_TYPES,
  EMPLOYEE_STATUSES,
} from '@/lib/employee-utils';
import { Employee, EmployeeStatus } from '@/types/employees';

// Generators for property-based testing
const employeeCodeCountArb = fc.integer({ min: 0, max: 9999 });

const employeeStatusArb = fc.constantFrom<EmployeeStatus>(
  'active', 'on_leave', 'suspended', 'resigned', 'terminated'
);

const positionLevelArb = fc.integer({ min: 1, max: 5 });
const invalidPositionLevelArb = fc.oneof(
  fc.integer({ min: -100, max: 0 }),
  fc.integer({ min: 6, max: 100 })
);

// Generate a valid date string
const dateArb = fc.date({ 
  min: new Date('2000-01-01T00:00:00.000Z'), 
  max: new Date('2025-12-31T00:00:00.000Z'),
  noInvalidDate: true
}).map(d => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
});

// Generate employee for testing
const employeeArb = fc.record({
  id: fc.uuid(),
  employee_code: fc.integer({ min: 1, max: 999 }).map(n => `EMP-${String(n).padStart(3, '0')}`),
  full_name: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
  status: employeeStatusArb,
  join_date: dateArb,
  user_id: fc.constant(null),
  nickname: fc.constant(null),
  id_number: fc.constant(null),
  tax_id: fc.constant(null),
  date_of_birth: fc.constant(null),
  place_of_birth: fc.constant(null),
  gender: fc.constant(null),
  religion: fc.constant(null),
  marital_status: fc.constant(null),
  phone: fc.constant(null),
  email: fc.constant(null),
  address: fc.constant(null),
  city: fc.constant(null),
  emergency_contact_name: fc.constant(null),
  emergency_contact_phone: fc.constant(null),
  emergency_contact_relation: fc.constant(null),
  department_id: fc.constant(null),
  position_id: fc.constant(null),
  employment_type: fc.constant('permanent' as const),
  end_date: fc.constant(null),
  reporting_to: fc.constant(null),
  base_salary: fc.constant(null),
  salary_currency: fc.constant('IDR'),
  bank_name: fc.constant(null),
  bank_account: fc.constant(null),
  bank_account_name: fc.constant(null),
  resignation_date: fc.constant(null),
  resignation_reason: fc.constant(null),
  photo_url: fc.constant(null),
  documents: fc.constant([]),
  notes: fc.constant(null),
  created_by: fc.constant(null),
  created_at: fc.constant(new Date().toISOString()),
  updated_at: fc.constant(new Date().toISOString()),
}) as fc.Arbitrary<Employee>;

describe('Employee Utilities - Property Tests', () => {
  // Feature: hr-employee-master, Property 1: Employee Code Generation and Uniqueness
  describe('Property 1: Employee Code Generation and Uniqueness', () => {
    it('should generate codes matching EMP-XXX format for any count', () => {
      fc.assert(
        fc.property(employeeCodeCountArb, (count) => {
          const code = generateEmployeeCode(count);
          expect(code).toMatch(/^EMP-\d{3,}$/);
          expect(isValidEmployeeCode(code)).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it('should generate sequential codes', () => {
      fc.assert(
        fc.property(employeeCodeCountArb, (count) => {
          const code = generateEmployeeCode(count);
          const expectedNumber = count + 1;
          const actualNumber = parseInt(code.replace('EMP-', ''), 10);
          expect(actualNumber).toBe(expectedNumber);
        }),
        { numRuns: 100 }
      );
    });
  });


  // Feature: hr-employee-master, Property 8: Summary Statistics Calculation
  describe('Property 8: Summary Statistics Calculation', () => {
    it('should calculate correct totals for any employee list', () => {
      fc.assert(
        fc.property(fc.array(employeeArb, { minLength: 0, maxLength: 50 }), (employees) => {
          const stats = calculateEmployeeSummaryStats(employees);
          
          // Total should equal array length
          expect(stats.total).toBe(employees.length);
          
          // Active count should match filtered count
          const activeCount = employees.filter(e => e.status === 'active').length;
          expect(stats.active).toBe(activeCount);
          
          // On leave count should match filtered count
          const onLeaveCount = employees.filter(e => e.status === 'on_leave').length;
          expect(stats.onLeave).toBe(onLeaveCount);
          
          // All counts should be non-negative
          expect(stats.total).toBeGreaterThanOrEqual(0);
          expect(stats.active).toBeGreaterThanOrEqual(0);
          expect(stats.onLeave).toBeGreaterThanOrEqual(0);
          expect(stats.newThisMonth).toBeGreaterThanOrEqual(0);
        }),
        { numRuns: 100 }
      );
    });

    it('should have active + onLeave <= total', () => {
      fc.assert(
        fc.property(fc.array(employeeArb, { minLength: 0, maxLength: 50 }), (employees) => {
          const stats = calculateEmployeeSummaryStats(employees);
          expect(stats.active + stats.onLeave).toBeLessThanOrEqual(stats.total);
        }),
        { numRuns: 100 }
      );
    });
  });

  // Feature: hr-employee-master, Property 9: Filter Correctness
  describe('Property 9: Filter Correctness', () => {
    it('should return all employees when search is empty', () => {
      fc.assert(
        fc.property(fc.array(employeeArb, { minLength: 0, maxLength: 20 }), (employees) => {
          const filtered = filterEmployeesBySearch(employees, '');
          expect(filtered.length).toBe(employees.length);
        }),
        { numRuns: 100 }
      );
    });

    it('should filter by name or code containing search term', () => {
      // Use alphanumeric strings to avoid whitespace-only search terms
      const searchTermArb = fc.stringMatching(/^[a-zA-Z0-9]{1,10}$/)
      fc.assert(
        fc.property(
          fc.array(employeeArb, { minLength: 1, maxLength: 20 }),
          searchTermArb,
          (employees, searchTerm) => {
            const filtered = filterEmployeesBySearch(employees, searchTerm);
            const searchLower = searchTerm.toLowerCase();
            
            // All filtered results should contain the search term
            filtered.forEach(emp => {
              const matchesName = emp.full_name.toLowerCase().includes(searchLower);
              const matchesCode = emp.employee_code.toLowerCase().includes(searchLower);
              expect(matchesName || matchesCode).toBe(true);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should be case-insensitive', () => {
      fc.assert(
        fc.property(fc.array(employeeArb, { minLength: 1, maxLength: 20 }), (employees) => {
          if (employees.length === 0) return;
          
          const firstEmployee = employees[0];
          const searchUpper = firstEmployee.full_name.toUpperCase();
          const searchLower = firstEmployee.full_name.toLowerCase();
          
          const filteredUpper = filterEmployeesBySearch(employees, searchUpper);
          const filteredLower = filterEmployeesBySearch(employees, searchLower);
          
          expect(filteredUpper.length).toBe(filteredLower.length);
        }),
        { numRuns: 100 }
      );
    });
  });

  // Feature: hr-employee-master, Property 11: Circular Reporting Prevention
  describe('Property 11: Circular Reporting Prevention', () => {
    it('should detect self-reference as circular', () => {
      fc.assert(
        fc.property(fc.uuid(), (employeeId) => {
          const employees: Employee[] = [];
          const isCircular = hasCircularReporting(employeeId, employeeId, employees);
          expect(isCircular).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it('should allow null reporting_to', () => {
      fc.assert(
        fc.property(fc.uuid(), (employeeId) => {
          const employees: Employee[] = [];
          const isCircular = hasCircularReporting(employeeId, null, employees);
          expect(isCircular).toBe(false);
        }),
        { numRuns: 100 }
      );
    });

    it('should detect two-level cycle', () => {
      // A reports to B, trying to set B reports to A
      const empA: Employee = {
        id: 'emp-a',
        employee_code: 'EMP-001',
        full_name: 'Employee A',
        status: 'active',
        join_date: '2024-01-01',
        reporting_to: 'emp-b',
        user_id: null,
        nickname: null,
        id_number: null,
        tax_id: null,
        date_of_birth: null,
        place_of_birth: null,
        gender: null,
        religion: null,
        marital_status: null,
        phone: null,
        email: null,
        address: null,
        city: null,
        emergency_contact_name: null,
        emergency_contact_phone: null,
        emergency_contact_relation: null,
        department_id: null,
        position_id: null,
        employment_type: 'permanent',
        end_date: null,
        base_salary: null,
        salary_currency: 'IDR',
        bank_name: null,
        bank_account: null,
        bank_account_name: null,
        resignation_date: null,
        resignation_reason: null,
        photo_url: null,
        documents: [],
        notes: null,
        created_by: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const empB: Employee = {
        ...empA,
        id: 'emp-b',
        employee_code: 'EMP-002',
        full_name: 'Employee B',
        reporting_to: null,
      };

      const employees = [empA, empB];
      
      // Trying to set B reports to A should be circular
      const isCircular = hasCircularReporting('emp-b', 'emp-a', employees);
      expect(isCircular).toBe(true);
    });
  });

  // Feature: hr-employee-master, Property 12: Position Level Bounds
  describe('Property 12: Position Level Bounds', () => {
    it('should accept levels 1-5 as valid', () => {
      fc.assert(
        fc.property(positionLevelArb, (level) => {
          expect(isValidPositionLevel(level)).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it('should reject levels outside 1-5', () => {
      fc.assert(
        fc.property(invalidPositionLevelArb, (level) => {
          expect(isValidPositionLevel(level)).toBe(false);
        }),
        { numRuns: 100 }
      );
    });
  });
});

describe('Employee Utilities - Unit Tests', () => {
  describe('getEmploymentTypeLabel', () => {
    it('should return correct labels for all employment types', () => {
      EMPLOYMENT_TYPES.forEach(({ value, label }) => {
        expect(getEmploymentTypeLabel(value)).toBe(label);
      });
    });
  });

  describe('getEmployeeStatusLabel', () => {
    it('should return correct labels for all statuses', () => {
      EMPLOYEE_STATUSES.forEach(({ value, label }) => {
        expect(getEmployeeStatusLabel(value)).toBe(label);
      });
    });
  });

  describe('formatSalary', () => {
    it('should return "-" for null', () => {
      expect(formatSalary(null)).toBe('-');
    });

    it('should format IDR correctly', () => {
      const result = formatSalary(5000000, 'IDR');
      expect(result).toContain('5.000.000');
    });
  });

  describe('isValidEmployeeStatus', () => {
    it('should accept valid statuses', () => {
      expect(isValidEmployeeStatus('active')).toBe(true);
      expect(isValidEmployeeStatus('on_leave')).toBe(true);
      expect(isValidEmployeeStatus('suspended')).toBe(true);
      expect(isValidEmployeeStatus('resigned')).toBe(true);
      expect(isValidEmployeeStatus('terminated')).toBe(true);
    });

    it('should reject invalid statuses', () => {
      expect(isValidEmployeeStatus('invalid')).toBe(false);
      expect(isValidEmployeeStatus('')).toBe(false);
    });
  });

  describe('isValidEmploymentType', () => {
    it('should accept valid types', () => {
      expect(isValidEmploymentType('permanent')).toBe(true);
      expect(isValidEmploymentType('contract')).toBe(true);
      expect(isValidEmploymentType('probation')).toBe(true);
      expect(isValidEmploymentType('intern')).toBe(true);
      expect(isValidEmploymentType('outsource')).toBe(true);
    });

    it('should reject invalid types', () => {
      expect(isValidEmploymentType('invalid')).toBe(false);
      expect(isValidEmploymentType('')).toBe(false);
    });
  });
});
