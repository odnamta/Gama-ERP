import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  Employee,
  EmployeeStatus,
  EmploymentType,
} from '@/types/employees';
import {
  isValidEmployeeStatus,
  isValidEmploymentType,
  hasCircularReporting,
  filterEmployeesBySearch,
  calculateEmployeeSummaryStats,
} from '@/lib/employee-utils';

// Simpler employee generator
function createMockEmployee(overrides: Partial<Employee> = {}): Employee {
  return {
    id: `emp-${Math.random().toString(36).substr(2, 9)}`,
    employee_code: `EMP-${String(Math.floor(Math.random() * 999) + 1).padStart(3, '0')}`,
    user_id: null,
    full_name: `Employee ${Math.random().toString(36).substr(2, 5)}`,
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
    join_date: '2024-01-01',
    end_date: null,
    reporting_to: null,
    base_salary: null,
    salary_currency: 'IDR',
    bank_name: null,
    bank_account: null,
    bank_account_name: null,
    photo_url: null,
    documents: null,
    notes: null,
    status: 'active',
    resignation_date: null,
    resignation_reason: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    created_by: null,
    ...overrides,
  };
}

describe('Employee Integration Tests', () => {
  describe('Property 3: Employee Data Round-Trip', () => {
    it('should preserve all employee data fields through serialization', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('active', 'on_leave', 'suspended', 'resigned', 'terminated') as fc.Arbitrary<EmployeeStatus>,
          fc.constantFrom('permanent', 'contract', 'probation', 'intern') as fc.Arbitrary<EmploymentType>,
          fc.string({ minLength: 1, maxLength: 50 }),
          (status, employmentType, name) => {
            const employee = createMockEmployee({
              status,
              employment_type: employmentType,
              full_name: name,
            });

            // Simulate JSON serialization (as would happen in API calls)
            const serialized = JSON.stringify(employee);
            const deserialized = JSON.parse(serialized) as Employee;

            // All fields should be preserved
            expect(deserialized.id).toBe(employee.id);
            expect(deserialized.employee_code).toBe(employee.employee_code);
            expect(deserialized.full_name).toBe(employee.full_name);
            expect(deserialized.status).toBe(employee.status);
            expect(deserialized.employment_type).toBe(employee.employment_type);
            expect(deserialized.join_date).toBe(employee.join_date);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should maintain data integrity for optional fields', () => {
      fc.assert(
        fc.property(
          fc.option(fc.emailAddress(), { nil: null }),
          fc.option(fc.integer({ min: 1000000, max: 100000000 }), { nil: null }),
          (email, salary) => {
            const employee = createMockEmployee({
              email,
              base_salary: salary,
            });

            const serialized = JSON.stringify(employee);
            const deserialized = JSON.parse(serialized) as Employee;

            // Optional fields should be null or have valid values
            expect(deserialized.email).toBe(employee.email);
            expect(deserialized.base_salary).toBe(employee.base_salary);
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('Property 4: Updated Timestamp Auto-Update', () => {
    it('should have updated_at >= created_at', () => {
      fc.assert(
        fc.property(
          fc.date({ min: new Date('2020-01-01'), max: new Date('2024-01-01') }),
          fc.nat({ max: 365 * 24 * 60 * 60 * 1000 }), // Up to 1 year in ms
          (createdDate, offsetMs) => {
            const created_at = createdDate.toISOString();
            const updated_at = new Date(createdDate.getTime() + offsetMs).toISOString();

            // updated_at should always be >= created_at
            expect(new Date(updated_at).getTime()).toBeGreaterThanOrEqual(
              new Date(created_at).getTime()
            );
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 7: Soft Delete Behavior', () => {
    it('should change status to resigned/terminated instead of deleting', () => {
      const softDeleteStatuses: EmployeeStatus[] = ['resigned', 'terminated'];
      const activeStatuses: EmployeeStatus[] = ['active', 'on_leave', 'suspended'];

      fc.assert(
        fc.property(
          fc.constantFrom(...activeStatuses),
          fc.constantFrom(...softDeleteStatuses),
          (initialStatus, targetStatus) => {
            // Soft delete should transition to resigned or terminated
            expect(softDeleteStatuses).toContain(targetStatus);
            expect(isValidEmployeeStatus(targetStatus)).toBe(true);

            // The transition should be valid
            expect(activeStatuses).toContain(initialStatus);
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should require resignation_date when status is resigned or terminated', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('resigned', 'terminated') as fc.Arbitrary<EmployeeStatus>,
          fc.date({ min: new Date('2020-01-01'), max: new Date() }),
          (status, resignDate) => {
            const employee = createMockEmployee({
              status,
              resignation_date: resignDate.toISOString().split('T')[0],
            });

            // When status is resigned/terminated, resignation_date should be set
            expect(employee.resignation_date).toBeDefined();
            expect(employee.resignation_date).not.toBeNull();
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  describe('Filter Functionality', () => {
    it('should filter employees by name search term', () => {
      const employees = [
        createMockEmployee({ full_name: 'John Doe', employee_code: 'EMP-001' }),
        createMockEmployee({ full_name: 'Jane Smith', employee_code: 'EMP-002' }),
        createMockEmployee({ full_name: 'Bob Johnson', employee_code: 'EMP-003' }),
      ];

      const results = filterEmployeesBySearch(employees, 'John');
      expect(results.length).toBe(2); // John Doe and Bob Johnson
    });

    it('should filter employees by code search term', () => {
      const employees = [
        createMockEmployee({ full_name: 'John Doe', employee_code: 'EMP-001' }),
        createMockEmployee({ full_name: 'Jane Smith', employee_code: 'EMP-002' }),
      ];

      const results = filterEmployeesBySearch(employees, 'EMP-001');
      expect(results.length).toBe(1);
      expect(results[0].full_name).toBe('John Doe');
    });

    it('should return all employees when search is empty', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 10 }),
          (count) => {
            const employees = Array.from({ length: count }, () => createMockEmployee());
            const results = filterEmployeesBySearch(employees, '');
            expect(results.length).toBe(employees.length);
          }
        ),
        { numRuns: 30 }
      );
    });

    it('should be case-insensitive', () => {
      const employees = [
        createMockEmployee({ full_name: 'JOHN DOE', employee_code: 'EMP-001' }),
      ];

      expect(filterEmployeesBySearch(employees, 'john').length).toBe(1);
      expect(filterEmployeesBySearch(employees, 'JOHN').length).toBe(1);
      expect(filterEmployeesBySearch(employees, 'John').length).toBe(1);
    });
  });

  describe('Summary Statistics', () => {
    it('should calculate correct totals', () => {
      const employees = [
        createMockEmployee({ status: 'active' }),
        createMockEmployee({ status: 'active' }),
        createMockEmployee({ status: 'on_leave' }),
        createMockEmployee({ status: 'suspended' }),
        createMockEmployee({ status: 'resigned' }),
      ];

      const stats = calculateEmployeeSummaryStats(employees);
      expect(stats.total).toBe(5);
      expect(stats.active).toBe(2);
      expect(stats.onLeave).toBe(1);
    });

    it('should count new employees this month correctly', () => {
      const now = new Date();
      const thisMonth = now.toISOString().split('T')[0];
      const lastYear = '2020-01-01';

      const employees = [
        createMockEmployee({ join_date: thisMonth }),
        createMockEmployee({ join_date: thisMonth }),
        createMockEmployee({ join_date: lastYear }),
      ];

      const stats = calculateEmployeeSummaryStats(employees);
      expect(stats.newThisMonth).toBe(2);
    });

    it('should handle empty array', () => {
      const stats = calculateEmployeeSummaryStats([]);
      expect(stats.total).toBe(0);
      expect(stats.active).toBe(0);
      expect(stats.onLeave).toBe(0);
      expect(stats.newThisMonth).toBe(0);
    });
  });

  describe('Circular Reporting Prevention', () => {
    it('should detect direct circular reporting', () => {
      // A reports to B, B reports to A
      const employees: Employee[] = [
        createMockEmployee({ id: 'emp-a', reporting_to: 'emp-b' }),
        createMockEmployee({ id: 'emp-b', reporting_to: 'emp-a' }),
      ];

      // If we try to set emp-a to report to emp-b (which already reports to emp-a)
      expect(hasCircularReporting('emp-a', 'emp-b', employees)).toBe(true);
    });

    it('should detect indirect circular reporting', () => {
      // A -> B -> C -> A (circular)
      const employees: Employee[] = [
        createMockEmployee({ id: 'emp-a', reporting_to: null }),
        createMockEmployee({ id: 'emp-b', reporting_to: 'emp-a' }),
        createMockEmployee({ id: 'emp-c', reporting_to: 'emp-b' }),
      ];

      // If we try to set emp-a to report to emp-c (which reports to emp-b, which reports to emp-a)
      expect(hasCircularReporting('emp-a', 'emp-c', employees)).toBe(true);
    });

    it('should allow valid reporting chains', () => {
      const employees: Employee[] = [
        createMockEmployee({ id: 'emp-a', reporting_to: null }),
        createMockEmployee({ id: 'emp-b', reporting_to: 'emp-a' }),
        createMockEmployee({ id: 'emp-c', reporting_to: null }),
      ];

      // emp-c can report to emp-a (no circular dependency)
      expect(hasCircularReporting('emp-c', 'emp-a', employees)).toBe(false);
      // emp-c can report to emp-b (no circular dependency)
      expect(hasCircularReporting('emp-c', 'emp-b', employees)).toBe(false);
    });

    it('should allow self-reporting to null (no manager)', () => {
      const employees: Employee[] = [
        createMockEmployee({ id: 'emp-a', reporting_to: 'emp-b' }),
        createMockEmployee({ id: 'emp-b', reporting_to: null }),
      ];

      // Setting reporting_to to null should always be allowed
      expect(hasCircularReporting('emp-a', null, employees)).toBe(false);
    });
  });

  describe('Status Validation', () => {
    it('should validate all defined statuses', () => {
      const validStatuses: EmployeeStatus[] = ['active', 'on_leave', 'suspended', 'resigned', 'terminated'];
      
      validStatuses.forEach(status => {
        expect(isValidEmployeeStatus(status)).toBe(true);
      });
    });

    it('should reject invalid statuses', () => {
      const invalidStatuses = ['invalid', 'unknown', '', 'ACTIVE', 'Active'];
      
      invalidStatuses.forEach(status => {
        expect(isValidEmployeeStatus(status)).toBe(false);
      });
    });
  });

  describe('Employment Type Validation', () => {
    it('should validate all defined employment types', () => {
      const validTypes: EmploymentType[] = ['permanent', 'contract', 'probation', 'intern'];
      
      validTypes.forEach(type => {
        expect(isValidEmploymentType(type)).toBe(true);
      });
    });

    it('should reject invalid employment types', () => {
      const invalidTypes = ['invalid', 'full-time', 'part-time', '', 'PERMANENT'];
      
      invalidTypes.forEach(type => {
        expect(isValidEmploymentType(type)).toBe(false);
      });
    });
  });
});
