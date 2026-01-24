/**
 * Property-Based Tests for PEB Utilities
 * Feature: customs-export-documentation
 * 
 * These tests validate the correctness properties defined in the design document
 * using fast-check for property-based testing.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  calculateItemTotalPrice,
  generatePEBInternalRef,
  validatePEBInternalRef,
  filterPEBDocuments,
  searchPEBDocuments,
  calculatePEBStatistics,
  canViewPEB,
  canEditPEB,
  canDeletePEB,
} from '@/lib/peb-utils';
import { PEBDocument, PEBStatus, UserRole } from '@/types/peb';

// =====================================================
// Test Data Generators
// =====================================================

const pebStatusGenerator = fc.constantFrom<PEBStatus>(
  'draft', 'submitted', 'approved', 'loaded', 'departed', 'completed', 'cancelled'
);

const roleGenerator = fc.constantFrom<UserRole>(
  'owner', 'admin', 'manager', 'customs', 'ops', 'finance'
);

// Helper to generate a valid date string
const dateStringGenerator = fc.integer({ min: 2020, max: 2030 })
  .chain(year => fc.integer({ min: 1, max: 12 })
    .chain(month => fc.integer({ min: 1, max: 28 })
      .map(day => `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`)));

const timestampGenerator = dateStringGenerator.map(d => `${d}T12:00:00.000Z`);

const pebDocumentGenerator = (status?: PEBStatus): fc.Arbitrary<PEBDocument> =>
  fc.record({
    id: fc.uuid(),
    internal_ref: fc.integer({ min: 1, max: 99999 }).map(seq => generatePEBInternalRef(seq)),
    peb_number: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: null }),
    aju_number: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: null }),
    job_order_id: fc.option(fc.uuid(), { nil: null }),
    customer_id: fc.option(fc.uuid(), { nil: null }),
    exporter_name: fc.string({ minLength: 1, maxLength: 200 }),
    exporter_npwp: fc.option(fc.string({ minLength: 1, maxLength: 30 }), { nil: null }),
    exporter_address: fc.option(fc.string({ minLength: 1, maxLength: 500 }), { nil: null }),
    consignee_name: fc.option(fc.string({ minLength: 1, maxLength: 200 }), { nil: null }),
    consignee_country: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: null }),
    consignee_address: fc.option(fc.string({ minLength: 1, maxLength: 500 }), { nil: null }),
    export_type_id: fc.option(fc.uuid(), { nil: null }),
    customs_office_id: fc.option(fc.uuid(), { nil: null }),
    transport_mode: fc.option(fc.constantFrom('sea', 'air', 'land') as fc.Arbitrary<'sea' | 'air' | 'land'>, { nil: null }),
    vessel_name: fc.option(fc.string({ minLength: 1, maxLength: 200 }), { nil: null }),
    voyage_number: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: null }),
    bill_of_lading: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: null }),
    awb_number: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: null }),
    port_of_loading: fc.option(fc.string({ minLength: 1, maxLength: 200 }), { nil: null }),
    port_of_discharge: fc.option(fc.string({ minLength: 1, maxLength: 200 }), { nil: null }),
    final_destination: fc.option(fc.string({ minLength: 1, maxLength: 200 }), { nil: null }),
    etd_date: fc.option(dateStringGenerator, { nil: null }),
    atd_date: fc.option(dateStringGenerator, { nil: null }),
    total_packages: fc.option(fc.integer({ min: 1, max: 10000 }), { nil: null }),
    package_type: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: null }),
    gross_weight_kg: fc.option(fc.integer({ min: 1, max: 1000000 }).map(n => n / 1000), { nil: null }),
    currency: fc.constantFrom('USD', 'EUR', 'IDR'),
    fob_value: fc.option(fc.integer({ min: 0, max: 10000000 }).map(n => n / 100), { nil: null }),
    status: status ? fc.constant(status) : pebStatusGenerator,
    submitted_at: fc.option(timestampGenerator, { nil: null }),
    approved_at: fc.option(timestampGenerator, { nil: null }),
    loaded_at: fc.option(timestampGenerator, { nil: null }),
    npe_number: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: null }),
    npe_date: fc.option(dateStringGenerator, { nil: null }),
    documents: fc.constant([]),
    notes: fc.option(fc.string({ minLength: 1, maxLength: 1000 }), { nil: null }),
    created_by: fc.option(fc.uuid(), { nil: null }),
    created_at: timestampGenerator,
    updated_at: timestampGenerator,
  });

// =====================================================
// Property 1: Reference Format Validation
// =====================================================

describe('Property 1: Reference Format Validation', () => {
  /**
   * Feature: customs-export-documentation
   * Property 1: Reference Format Validation
   * For any generated PEB internal reference, it SHALL match the format 
   * 'PEB-YYYY-NNNNN' where YYYY is a 4-digit year and NNNNN is a 5-digit 
   * zero-padded sequence number.
   * Validates: Requirements 2.1
   */
  it('should generate valid PEB internal references', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 99999 }),
        fc.integer({ min: 2020, max: 2030 }),
        (sequence, year) => {
          const ref = generatePEBInternalRef(sequence, year);
          
          // Must match format PEB-YYYY-NNNNN
          expect(validatePEBInternalRef(ref)).toBe(true);
          
          // Must contain correct year
          expect(ref).toContain(`PEB-${year}-`);
          
          // Must have 5-digit padded sequence
          const parts = ref.split('-');
          expect(parts[2]).toHaveLength(5);
          expect(parseInt(parts[2], 10)).toBe(sequence);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should reject invalid reference formats', () => {
    const invalidRefs = [
      'PIB-2024-00001', // Wrong prefix
      'PEB-24-00001',   // 2-digit year
      'PEB-2024-0001',  // 4-digit sequence
      'PEB-2024-000001', // 6-digit sequence
      'PEB202400001',   // No dashes
      '',               // Empty
    ];

    invalidRefs.forEach(ref => {
      expect(validatePEBInternalRef(ref)).toBe(false);
    });
  });
});

// =====================================================
// Property 5: Item Total Price Calculation
// =====================================================

describe('Property 5: Item Total Price Calculation', () => {
  /**
   * Feature: customs-export-documentation
   * Property 5: Item Total Price Calculation
   * For any PEB item with quantity and unit price, the total price 
   * SHALL equal quantity × unit price.
   * Validates: Requirements 3.5
   */
  it('should calculate total price as quantity × unit price', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10000 }).map(n => n / 1000),
        fc.integer({ min: 1, max: 1000000 }).map(n => n / 100),
        (quantity, unitPrice) => {
          const totalPrice = calculateItemTotalPrice(quantity, unitPrice);
          const expected = Math.round(quantity * unitPrice * 100) / 100;
          
          expect(totalPrice).toBeCloseTo(expected, 2);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return 0 for negative values', () => {
    expect(calculateItemTotalPrice(-1, 100)).toBe(0);
    expect(calculateItemTotalPrice(10, -100)).toBe(0);
    expect(calculateItemTotalPrice(-1, -100)).toBe(0);
  });
});

// =====================================================
// Property 8: Statistics Calculation Correctness
// =====================================================

describe('Property 8: Statistics Calculation Correctness', () => {
  /**
   * Feature: customs-export-documentation
   * Property 8: Statistics Calculation Correctness
   * For any collection of PEB documents, the statistics SHALL correctly count:
   * - Active PEBs: documents with status in ['draft', 'submitted', 'approved', 'loaded']
   * - Pending Approval: documents with status 'submitted'
   * - Loaded: documents with status 'loaded'
   * - Departed MTD: documents with status 'departed' or 'completed' within current month
   * Validates: Requirements 5.1
   */
  it('should correctly count active PEBs', () => {
    fc.assert(
      fc.property(
        fc.array(pebDocumentGenerator(), { minLength: 0, maxLength: 50 }),
        (documents) => {
          const stats = calculatePEBStatistics(documents);
          const activeStatuses: PEBStatus[] = ['draft', 'submitted', 'approved', 'loaded'];
          const expectedActive = documents.filter(d => activeStatuses.includes(d.status)).length;
          
          expect(stats.active_pebs).toBe(expectedActive);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should correctly count pending approval', () => {
    fc.assert(
      fc.property(
        fc.array(pebDocumentGenerator(), { minLength: 0, maxLength: 50 }),
        (documents) => {
          const stats = calculatePEBStatistics(documents);
          const expectedPending = documents.filter(d => d.status === 'submitted').length;
          
          expect(stats.pending_approval).toBe(expectedPending);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should correctly count loaded', () => {
    fc.assert(
      fc.property(
        fc.array(pebDocumentGenerator(), { minLength: 0, maxLength: 50 }),
        (documents) => {
          const stats = calculatePEBStatistics(documents);
          const expectedLoaded = documents.filter(d => d.status === 'loaded').length;
          
          expect(stats.loaded).toBe(expectedLoaded);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// =====================================================
// Property 9: Filter Correctness
// =====================================================

describe('Property 9: Filter Correctness', () => {
  /**
   * Feature: customs-export-documentation
   * Property 9: Filter Correctness
   * For any filter criteria (status, customs office, date range) applied to 
   * a list of PEB documents, all returned documents SHALL match all specified 
   * filter criteria.
   * Validates: Requirements 5.3
   */
  it('should filter by status correctly', () => {
    fc.assert(
      fc.property(
        fc.array(pebDocumentGenerator(), { minLength: 0, maxLength: 50 }),
        pebStatusGenerator,
        (documents, filterStatus) => {
          const filtered = filterPEBDocuments(documents, { status: filterStatus });
          
          // All filtered documents must have the specified status
          filtered.forEach(doc => {
            expect(doc.status).toBe(filterStatus);
          });
          
          // Count should match manual filter
          const expectedCount = documents.filter(d => d.status === filterStatus).length;
          expect(filtered.length).toBe(expectedCount);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should filter by customs office correctly', () => {
    fc.assert(
      fc.property(
        fc.array(pebDocumentGenerator(), { minLength: 0, maxLength: 50 }),
        fc.uuid(),
        (documents, officeId) => {
          const filtered = filterPEBDocuments(documents, { customs_office_id: officeId });
          
          // All filtered documents must have the specified customs office
          filtered.forEach(doc => {
            expect(doc.customs_office_id).toBe(officeId);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return all documents when no filters applied', () => {
    fc.assert(
      fc.property(
        fc.array(pebDocumentGenerator(), { minLength: 0, maxLength: 50 }),
        (documents) => {
          const filtered = filterPEBDocuments(documents, {});
          expect(filtered.length).toBe(documents.length);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// =====================================================
// Property 10: Search Correctness
// =====================================================

describe('Property 10: Search Correctness', () => {
  /**
   * Feature: customs-export-documentation
   * Property 10: Search Correctness
   * For any search term applied to PEB documents, all returned documents 
   * SHALL contain the search term in at least one of: internal reference, 
   * PEB number, exporter name, or goods description.
   * Validates: Requirements 5.4
   */
  it('should find documents by internal reference', () => {
    fc.assert(
      fc.property(
        fc.array(pebDocumentGenerator(), { minLength: 1, maxLength: 50 }),
        (documents) => {
          // Pick a random document and search for part of its internal_ref
          const targetDoc = documents[0];
          const searchTerm = targetDoc.internal_ref.substring(0, 8); // "PEB-2024"
          
          const results = searchPEBDocuments(documents, searchTerm);
          
          // Target document should be in results
          expect(results.some(d => d.id === targetDoc.id)).toBe(true);
          
          // All results should contain the search term
          results.forEach(doc => {
            const matchesRef = doc.internal_ref.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesPeb = doc.peb_number?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesExporter = doc.exporter_name.toLowerCase().includes(searchTerm.toLowerCase());
            
            expect(matchesRef || matchesPeb || matchesExporter).toBe(true);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return all documents for empty search term', () => {
    fc.assert(
      fc.property(
        fc.array(pebDocumentGenerator(), { minLength: 0, maxLength: 50 }),
        (documents) => {
          const results = searchPEBDocuments(documents, '');
          expect(results.length).toBe(documents.length);
          
          const resultsWhitespace = searchPEBDocuments(documents, '   ');
          expect(resultsWhitespace.length).toBe(documents.length);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// =====================================================
// Property 11: Role-Based Permission Consistency
// =====================================================

describe('Property 11: Role-Based Permission Consistency', () => {
  /**
   * Feature: customs-export-documentation
   * Property 11: Role-Based Permission Consistency
   * For any user role and PEB action:
   * - View: Owner, Director, Sysadmin, Customs, Finance SHALL have access
   * - Create/Edit: Owner, Director, Sysadmin, Customs SHALL have access
   * - Delete: Owner, Director, Sysadmin SHALL have access
   * Validates: Requirements 8.1, 8.2, 8.4
   */
  it('should grant view access to correct roles', () => {
    const viewAllowedRoles: UserRole[] = ['owner', 'director', 'sysadmin', 'customs', 'finance', 'finance_manager'];
    const viewDeniedRoles: UserRole[] = ['ops', 'marketing', 'hr', 'hse', 'engineer'];

    viewAllowedRoles.forEach(role => {
      expect(canViewPEB(role)).toBe(true);
    });

    viewDeniedRoles.forEach(role => {
      expect(canViewPEB(role)).toBe(false);
    });
  });

  it('should grant edit access to correct roles', () => {
    const editAllowedRoles: UserRole[] = ['owner', 'director', 'sysadmin', 'customs'];
    const editDeniedRoles: UserRole[] = ['ops', 'finance', 'marketing', 'hr', 'hse', 'engineer'];

    editAllowedRoles.forEach(role => {
      expect(canEditPEB(role)).toBe(true);
    });

    editDeniedRoles.forEach(role => {
      expect(canEditPEB(role)).toBe(false);
    });
  });

  it('should grant delete access only to owner, director, and sysadmin', () => {
    const deleteAllowedRoles: UserRole[] = ['owner', 'director', 'sysadmin'];
    const deleteDeniedRoles: UserRole[] = ['customs', 'ops', 'finance', 'marketing', 'hr', 'hse', 'engineer'];

    deleteAllowedRoles.forEach(role => {
      expect(canDeletePEB(role)).toBe(true);
    });

    deleteDeniedRoles.forEach(role => {
      expect(canDeletePEB(role)).toBe(false);
    });
  });

  it('should be consistent across all roles', () => {
    fc.assert(
      fc.property(roleGenerator, (role) => {
        const canView = canViewPEB(role);
        const canEdit = canEditPEB(role);
        const canDelete = canDeletePEB(role);

        // If can delete, must be able to edit
        if (canDelete) {
          expect(canEdit).toBe(true);
        }

        // If can edit, must be able to view
        if (canEdit) {
          expect(canView).toBe(true);
        }
      }),
      { numRuns: 100 }
    );
  });
});
