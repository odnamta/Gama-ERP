import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  canViewEmployees,
  canCreateEmployee,
  canEditEmployee,
  canDeleteEmployee,
  canViewEmployeeSalary,
  canEditEmployeeSalary,
  canSeeEmployeesNav,
  canAccessFeature,
} from '@/lib/permissions';
import { UserProfile, UserRole } from '@/types/permissions';

// Generator for user roles
const userRoleArb = fc.constantFrom<UserRole>(
  'owner', 'admin', 'manager', 'ops', 'finance', 'sales', 'viewer'
);

// Roles that can view employees
const viewEmployeesRoles: UserRole[] = ['owner', 'admin', 'manager'];

// Roles that can create/edit/delete employees
const manageEmployeesRoles: UserRole[] = ['owner', 'admin'];

// Roles that can view salary
const viewSalaryRoles: UserRole[] = ['owner', 'admin', 'finance'];

// Roles that can edit salary
const editSalaryRoles: UserRole[] = ['owner', 'admin'];

// Roles that see employees in nav
const navEmployeesRoles: UserRole[] = ['owner', 'admin', 'manager'];

// Generate a mock user profile
function createMockProfile(role: UserRole): UserProfile {
  return {
    id: 'test-id',
    user_id: 'test-user-id',
    email: 'test@example.com',
    full_name: 'Test User',
    avatar_url: null,
    role,
    custom_dashboard: 'default',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    last_login_at: null,
    can_see_revenue: ['owner', 'admin', 'manager', 'finance', 'sales'].includes(role),
    can_see_profit: ['owner', 'admin', 'manager', 'finance'].includes(role),
    can_approve_pjo: ['owner', 'admin', 'manager'].includes(role),
    can_manage_invoices: ['owner', 'admin', 'finance'].includes(role),
    can_manage_users: ['owner', 'admin'].includes(role),
    can_create_pjo: ['owner', 'admin', 'manager', 'finance', 'sales'].includes(role),
    can_fill_costs: ['owner', 'admin', 'manager', 'ops'].includes(role),
  };
}

describe('Employee Permissions - Property Tests', () => {
  // Feature: hr-employee-master, Property 10: Salary Visibility Based on Permissions
  describe('Property 10: Salary Visibility Based on Permissions', () => {
    it('should allow salary view only for owner, admin, finance roles', () => {
      fc.assert(
        fc.property(userRoleArb, (role) => {
          const profile = createMockProfile(role);
          const canView = canViewEmployeeSalary(profile);
          const shouldBeAbleToView = viewSalaryRoles.includes(role);
          
          expect(canView).toBe(shouldBeAbleToView);
        }),
        { numRuns: 100 }
      );
    });

    it('should allow salary edit only for owner, admin roles', () => {
      fc.assert(
        fc.property(userRoleArb, (role) => {
          const profile = createMockProfile(role);
          const canEdit = canEditEmployeeSalary(profile);
          const shouldBeAbleToEdit = editSalaryRoles.includes(role);
          
          expect(canEdit).toBe(shouldBeAbleToEdit);
        }),
        { numRuns: 100 }
      );
    });

    it('should deny salary view for ops, sales, viewer roles', () => {
      const deniedRoles: UserRole[] = ['ops', 'sales', 'viewer'];
      
      deniedRoles.forEach(role => {
        const profile = createMockProfile(role);
        expect(canViewEmployeeSalary(profile)).toBe(false);
      });
    });

    it('should return false for null profile', () => {
      expect(canViewEmployeeSalary(null)).toBe(false);
      expect(canEditEmployeeSalary(null)).toBe(false);
    });
  });

  describe('Employee View Permissions', () => {
    it('should allow view only for owner, admin, manager roles', () => {
      fc.assert(
        fc.property(userRoleArb, (role) => {
          const profile = createMockProfile(role);
          const canView = canViewEmployees(profile);
          const shouldBeAbleToView = viewEmployeesRoles.includes(role);
          
          expect(canView).toBe(shouldBeAbleToView);
        }),
        { numRuns: 100 }
      );
    });

    it('should deny view for ops, finance, sales, viewer roles', () => {
      const deniedRoles: UserRole[] = ['ops', 'finance', 'sales', 'viewer'];
      
      deniedRoles.forEach(role => {
        const profile = createMockProfile(role);
        expect(canViewEmployees(profile)).toBe(false);
      });
    });
  });

  describe('Employee Create/Edit/Delete Permissions', () => {
    it('should allow create only for owner, admin roles', () => {
      fc.assert(
        fc.property(userRoleArb, (role) => {
          const profile = createMockProfile(role);
          const canCreate = canCreateEmployee(profile);
          const shouldBeAbleToCreate = manageEmployeesRoles.includes(role);
          
          expect(canCreate).toBe(shouldBeAbleToCreate);
        }),
        { numRuns: 100 }
      );
    });

    it('should allow edit only for owner, admin roles', () => {
      fc.assert(
        fc.property(userRoleArb, (role) => {
          const profile = createMockProfile(role);
          const canEdit = canEditEmployee(profile);
          const shouldBeAbleToEdit = manageEmployeesRoles.includes(role);
          
          expect(canEdit).toBe(shouldBeAbleToEdit);
        }),
        { numRuns: 100 }
      );
    });

    it('should allow delete only for owner, admin roles', () => {
      fc.assert(
        fc.property(userRoleArb, (role) => {
          const profile = createMockProfile(role);
          const canDelete = canDeleteEmployee(profile);
          const shouldBeAbleToDelete = manageEmployeesRoles.includes(role);
          
          expect(canDelete).toBe(shouldBeAbleToDelete);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Employee Navigation Permissions', () => {
    it('should show nav for owner, admin, manager roles', () => {
      fc.assert(
        fc.property(userRoleArb, (role) => {
          const profile = createMockProfile(role);
          const canSeeNav = canSeeEmployeesNav(profile);
          const shouldSeeNav = navEmployeesRoles.includes(role);
          
          expect(canSeeNav).toBe(shouldSeeNav);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Permission Hierarchy', () => {
    it('edit salary permission implies view salary permission', () => {
      fc.assert(
        fc.property(userRoleArb, (role) => {
          const profile = createMockProfile(role);
          const canEdit = canEditEmployeeSalary(profile);
          const canView = canViewEmployeeSalary(profile);
          
          // If can edit, must be able to view
          if (canEdit) {
            expect(canView).toBe(true);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('delete permission implies edit permission', () => {
      fc.assert(
        fc.property(userRoleArb, (role) => {
          const profile = createMockProfile(role);
          const canDelete = canDeleteEmployee(profile);
          const canEdit = canEditEmployee(profile);
          
          // If can delete, must be able to edit
          if (canDelete) {
            expect(canEdit).toBe(true);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('create permission implies view permission', () => {
      fc.assert(
        fc.property(userRoleArb, (role) => {
          const profile = createMockProfile(role);
          const canCreate = canCreateEmployee(profile);
          const canView = canViewEmployees(profile);
          
          // If can create, must be able to view
          if (canCreate) {
            expect(canView).toBe(true);
          }
        }),
        { numRuns: 100 }
      );
    });
  });
});

describe('Employee Permissions - Unit Tests', () => {
  describe('canAccessFeature for employees', () => {
    it('should return correct values for employees.view', () => {
      expect(canAccessFeature(createMockProfile('owner'), 'employees.view')).toBe(true);
      expect(canAccessFeature(createMockProfile('admin'), 'employees.view')).toBe(true);
      expect(canAccessFeature(createMockProfile('manager'), 'employees.view')).toBe(true);
      expect(canAccessFeature(createMockProfile('ops'), 'employees.view')).toBe(false);
      expect(canAccessFeature(createMockProfile('finance'), 'employees.view')).toBe(false);
      expect(canAccessFeature(createMockProfile('sales'), 'employees.view')).toBe(false);
      expect(canAccessFeature(createMockProfile('viewer'), 'employees.view')).toBe(false);
    });

    it('should return correct values for employees.view_salary', () => {
      expect(canAccessFeature(createMockProfile('owner'), 'employees.view_salary')).toBe(true);
      expect(canAccessFeature(createMockProfile('admin'), 'employees.view_salary')).toBe(true);
      expect(canAccessFeature(createMockProfile('finance'), 'employees.view_salary')).toBe(true);
      expect(canAccessFeature(createMockProfile('manager'), 'employees.view_salary')).toBe(false);
      expect(canAccessFeature(createMockProfile('ops'), 'employees.view_salary')).toBe(false);
    });
  });
});
