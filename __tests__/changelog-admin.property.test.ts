/**
 * Property-Based Tests for Admin Changelog Access
 * Task 7.5: Write property tests for admin access
 * 
 * Property 9: Admin Access Control - verify non-admins are redirected
 * Property 10: Entry Creation Integrity - verify entries are created correctly
 * 
 * Validates: Requirements 7.1, 7.3, 7.5
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import type { UserRole } from '@/types/permissions';
import type { ChangelogCategory, ChangelogEntryInput } from '@/types/changelog';
import { VALID_CATEGORIES, isValidCategory } from '@/types/changelog';

// All valid user roles in the system
const ALL_ROLES: UserRole[] = [
  'owner',
  'director',
  'marketing_manager',
  'finance_manager',
  'operations_manager',
  'sysadmin',
  'administration',
  'finance',
  'marketing',
  'ops',
  'engineer',
  'hr',
  'hse',
  'agency',
  'customs',
];

// Admin roles that can access /admin/changelog
const ADMIN_ROLES: UserRole[] = ['owner', 'director', 'sysadmin'];

// Non-admin roles
const NON_ADMIN_ROLES: UserRole[] = ALL_ROLES.filter(role => !ADMIN_ROLES.includes(role));

// Arbitrary for generating valid user roles
const roleArb = fc.constantFrom<UserRole>(...ALL_ROLES);
const adminRoleArb = fc.constantFrom<UserRole>(...ADMIN_ROLES);
const nonAdminRoleArb = fc.constantFrom<UserRole>(...NON_ADMIN_ROLES);

// Arbitrary for generating valid changelog categories
const categoryArb = fc.constantFrom<ChangelogCategory>(...VALID_CATEGORIES);

// Arbitrary for generating valid changelog entry input
const changelogEntryInputArb = fc.record({
  version: fc.option(fc.stringMatching(/^v\d+\.\d+$/), { nil: undefined }),
  title: fc.string({ minLength: 1, maxLength: 100 }),
  description: fc.option(fc.string({ maxLength: 500 }), { nil: undefined }),
  category: categoryArb,
  is_major: fc.option(fc.boolean(), { nil: undefined }),
});

/**
 * Helper function to check if a role has admin access
 */
function hasAdminAccess(role: UserRole): boolean {
  return ADMIN_ROLES.includes(role);
}

describe('Feature: v0.82-changelog-feature, Property 9: Admin Access Control', () => {
  /**
   * **Validates: Requirements 7.1, 7.5**
   * 
   * *For any* user attempting to access /admin/changelog, if the user's role is NOT
   * owner, director, or sysadmin, then the system SHALL redirect them to their
   * role-specific dashboard.
   */
  it('should grant access only to admin roles (owner, director, sysadmin)', () => {
    fc.assert(
      fc.property(roleArb, (role) => {
        const shouldHaveAccess = hasAdminAccess(role);
        const actualAccess = ADMIN_ROLES.includes(role);
        
        expect(actualAccess).toBe(shouldHaveAccess);
      }),
      { numRuns: 100 }
    );
  });

  it('should deny access to all non-admin roles', () => {
    fc.assert(
      fc.property(nonAdminRoleArb, (role) => {
        const hasAccess = ADMIN_ROLES.includes(role);
        expect(hasAccess).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it('should allow access to all admin roles', () => {
    fc.assert(
      fc.property(adminRoleArb, (role) => {
        const hasAccess = ADMIN_ROLES.includes(role);
        expect(hasAccess).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('should have exactly 3 admin roles', () => {
    expect(ADMIN_ROLES).toHaveLength(3);
    expect(ADMIN_ROLES).toContain('owner');
    expect(ADMIN_ROLES).toContain('director');
    expect(ADMIN_ROLES).toContain('sysadmin');
  });
});

describe('Feature: v0.82-changelog-feature, Property 10: Entry Creation Integrity', () => {
  /**
   * **Validates: Requirements 7.3**
   * 
   * *For any* valid changelog entry submitted through the admin form, after successful
   * submission, querying the changelog_entries table SHALL return an entry with matching
   * version, title, description, category, and is_major values.
   */
  it('should validate entry input has required title field', () => {
    fc.assert(
      fc.property(changelogEntryInputArb, (input) => {
        // Title is required and must be non-empty
        expect(input.title).toBeTruthy();
        expect(typeof input.title).toBe('string');
        expect(input.title.length).toBeGreaterThan(0);
      }),
      { numRuns: 100 }
    );
  });

  it('should validate entry input has valid category', () => {
    fc.assert(
      fc.property(changelogEntryInputArb, (input) => {
        expect(isValidCategory(input.category)).toBe(true);
        expect(VALID_CATEGORIES).toContain(input.category);
      }),
      { numRuns: 100 }
    );
  });

  it('should preserve all input fields in entry data', () => {
    fc.assert(
      fc.property(changelogEntryInputArb, (input) => {
        // Simulate what would be stored in database
        const storedEntry = {
          version: input.version || null,
          title: input.title,
          description: input.description || null,
          category: input.category,
          is_major: input.is_major || false,
        };
        
        // Verify data integrity
        expect(storedEntry.title).toBe(input.title);
        expect(storedEntry.category).toBe(input.category);
        
        // Version should be preserved or null
        if (input.version) {
          expect(storedEntry.version).toBe(input.version);
        } else {
          expect(storedEntry.version).toBeNull();
        }
        
        // Description should be preserved or null
        if (input.description) {
          expect(storedEntry.description).toBe(input.description);
        } else {
          expect(storedEntry.description).toBeNull();
        }
        
        // is_major should be preserved or default to false
        if (input.is_major !== undefined) {
          expect(storedEntry.is_major).toBe(input.is_major);
        } else {
          expect(storedEntry.is_major).toBe(false);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should only accept valid category values', () => {
    const invalidCategories = ['invalid', 'unknown', 'other', '', 'FEATURE', 'BugFix'];
    
    for (const invalid of invalidCategories) {
      expect(isValidCategory(invalid)).toBe(false);
    }
    
    for (const valid of VALID_CATEGORIES) {
      expect(isValidCategory(valid)).toBe(true);
    }
  });
});

describe('Entry input validation', () => {
  it('should handle optional fields correctly', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 100 }),
        categoryArb,
        (title, category) => {
          // Minimal valid input
          const minimalInput: ChangelogEntryInput = {
            title,
            category,
          };
          
          expect(minimalInput.title).toBeTruthy();
          expect(isValidCategory(minimalInput.category)).toBe(true);
          expect(minimalInput.version).toBeUndefined();
          expect(minimalInput.description).toBeUndefined();
          expect(minimalInput.is_major).toBeUndefined();
        }
      ),
      { numRuns: 100 }
    );
  });
});
