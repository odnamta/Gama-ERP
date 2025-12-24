// =====================================================
// v0.51: CUSTOMS - IMPORT DOCUMENTATION (PIB) Property Tests
// Feature: customs-import-documentation
// =====================================================

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  calculateCIFValue,
  calculateItemTotalPrice,
  calculateItemDuties,
  aggregatePIBDuties,
  convertToIDR,
  generatePIBInternalRef,
  isValidPIBInternalRef,
  canTransitionStatus,
  getNextAllowedStatuses,
  filterPIBDocuments,
  searchPIBDocuments,
  validatePIBDocument,
  validatePIBItem,
  validateHSCode,
} from '@/lib/pib-utils';
import {
  PIBDocument,
  PIBItem,
  PIBStatus,
  PIB_STATUS_TRANSITIONS,
} from '@/types/pib';

// =====================================================
// Test Data Generators
// =====================================================

const positiveFloat = fc.float({ min: Math.fround(0.01), max: Math.fround(1000000), noNaN: true });
const nonNegativeFloat = fc.float({ min: Math.fround(0), max: Math.fround(1000000), noNaN: true });
const percentageRate = fc.float({ min: Math.fround(0), max: Math.fround(100), noNaN: true });
const exchangeRateArb = fc.float({ min: Math.fround(10000), max: Math.fround(20000), noNaN: true });
const sequenceNumber = fc.integer({ min: 1, max: 99999 });
const yearArb = fc.integer({ min: 2020, max: 2030 });

const pibStatusArb = fc.constantFrom<PIBStatus>(
  'draft',
  'submitted',
  'document_check',
  'physical_check',
  'duties_paid',
  'released',
  'completed',
  'cancelled'
);

const pibItemArb = fc.record({
  id: fc.uuid(),
  pib_id: fc.uuid(),
  item_number: fc.integer({ min: 1, max: 100 }),
  hs_code: fc.stringMatching(/^\d{8}$/),
  hs_description: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: null }),
  goods_description: fc.string({ minLength: 1, maxLength: 200 }),
  brand: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: null }),
  type_model: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: null }),
  specifications: fc.option(fc.string({ minLength: 1, maxLength: 200 }), { nil: null }),
  country_of_origin: fc.option(fc.string({ minLength: 2, maxLength: 50 }), { nil: null }),
  quantity: positiveFloat,
  unit: fc.constantFrom('PCS', 'KG', 'SET', 'UNIT'),
  net_weight_kg: fc.option(nonNegativeFloat, { nil: null }),
  gross_weight_kg: fc.option(nonNegativeFloat, { nil: null }),
  unit_price: fc.option(positiveFloat, { nil: null }),
  total_price: fc.option(positiveFloat, { nil: null }),
  currency: fc.constantFrom('USD', 'EUR', 'SGD'),
  bm_rate: fc.option(percentageRate, { nil: null }),
  ppn_rate: fc.float({ min: Math.fround(0), max: Math.fround(15), noNaN: true }),
  pph_rate: fc.option(percentageRate, { nil: null }),
  bea_masuk: fc.option(nonNegativeFloat, { nil: null }),
  ppn: fc.option(nonNegativeFloat, { nil: null }),
  pph_import: fc.option(nonNegativeFloat, { nil: null }),
  requires_permit: fc.boolean(),
  permit_type: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: null }),
  permit_number: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: null }),
  permit_date: fc.option(fc.date().map(d => d.toISOString().split('T')[0]), { nil: null }),
  created_at: fc.date().map(d => d.toISOString()),
});

// =====================================================
// Property 1: CIF Value Calculation
// Validates: Requirements 3.10
// =====================================================

describe('Property 1: CIF Value Calculation', () => {
  it('CIF value SHALL equal FOB + freight + insurance', () => {
    fc.assert(
      fc.property(
        nonNegativeFloat,
        nonNegativeFloat,
        nonNegativeFloat,
        (fob, freight, insurance) => {
          const cif = calculateCIFValue(fob, freight, insurance);
          const expected = fob + freight + insurance;
          
          // Allow for floating point precision
          expect(Math.abs(cif - expected)).toBeLessThan(0.01);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('CIF with zero freight and insurance equals FOB', () => {
    fc.assert(
      fc.property(positiveFloat, (fob) => {
        const cif = calculateCIFValue(fob, 0, 0);
        expect(Math.abs(cif - fob)).toBeLessThan(0.01);
      }),
      { numRuns: 100 }
    );
  });
});

// =====================================================
// Property 2: Item Total Price Calculation
// Validates: Requirements 4.5
// =====================================================

describe('Property 2: Item Total Price Calculation', () => {
  it('Total price SHALL equal quantity × unit price', () => {
    fc.assert(
      fc.property(positiveFloat, positiveFloat, (quantity, unitPrice) => {
        const totalPrice = calculateItemTotalPrice(quantity, unitPrice);
        const expected = quantity * unitPrice;
        
        expect(Math.abs(totalPrice - expected)).toBeLessThan(0.01);
      }),
      { numRuns: 100 }
    );
  });
});


// =====================================================
// Property 3: Item Duty Calculation
// Validates: Requirements 4.7
// =====================================================

describe('Property 3: Item Duty Calculation', () => {
  it('Bea Masuk SHALL equal total_price × (bm_rate / 100)', () => {
    fc.assert(
      fc.property(positiveFloat, percentageRate, (totalPrice, bmRate) => {
        const duties = calculateItemDuties(totalPrice, bmRate, 11, 0);
        const expectedBM = totalPrice * (bmRate / 100);
        
        expect(Math.abs(duties.bea_masuk - Math.round(expectedBM * 100) / 100)).toBeLessThan(0.01);
      }),
      { numRuns: 100 }
    );
  });

  it('PPN SHALL equal (total_price + Bea_Masuk) × (ppn_rate / 100)', () => {
    fc.assert(
      fc.property(
        positiveFloat,
        percentageRate,
        fc.float({ min: Math.fround(0), max: Math.fround(15), noNaN: true }),
        (totalPrice, bmRate, ppnRate) => {
          const duties = calculateItemDuties(totalPrice, bmRate, ppnRate, 0);
          const beaMasuk = totalPrice * (bmRate / 100);
          const taxBase = totalPrice + beaMasuk;
          const expectedPPN = taxBase * (ppnRate / 100);
          
          expect(Math.abs(duties.ppn - Math.round(expectedPPN * 100) / 100)).toBeLessThan(0.01);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('PPh Import SHALL equal (total_price + Bea_Masuk) × (pph_rate / 100)', () => {
    fc.assert(
      fc.property(
        positiveFloat,
        percentageRate,
        percentageRate,
        (totalPrice, bmRate, pphRate) => {
          const duties = calculateItemDuties(totalPrice, bmRate, 11, pphRate);
          const beaMasuk = totalPrice * (bmRate / 100);
          const taxBase = totalPrice + beaMasuk;
          const expectedPPh = taxBase * (pphRate / 100);
          
          expect(Math.abs(duties.pph_import - Math.round(expectedPPh * 100) / 100)).toBeLessThan(0.01);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Total duties SHALL equal sum of all duty components', () => {
    fc.assert(
      fc.property(
        positiveFloat,
        percentageRate,
        fc.float({ min: Math.fround(0), max: Math.fround(15), noNaN: true }),
        percentageRate,
        (totalPrice, bmRate, ppnRate, pphRate) => {
          const duties = calculateItemDuties(totalPrice, bmRate, ppnRate, pphRate);
          const expectedTotal = duties.bea_masuk + duties.ppn + duties.pph_import;
          
          // Allow for floating point precision (slightly higher tolerance for accumulated rounding)
          expect(Math.abs(duties.total - expectedTotal)).toBeLessThan(0.02);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// =====================================================
// Property 4: PIB Duty Aggregation
// Validates: Requirements 5.1, 5.2, 5.3
// =====================================================

describe('Property 4: PIB Duty Aggregation', () => {
  it('PIB totals SHALL equal sum of all item duties', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            bea_masuk: nonNegativeFloat,
            ppn: nonNegativeFloat,
            pph_import: nonNegativeFloat,
          }),
          { minLength: 1, maxLength: 10 }
        ),
        (itemDuties) => {
          // Create mock PIB items with the duty values
          const items: PIBItem[] = itemDuties.map((d, i) => ({
            id: `item-${i}`,
            pib_id: 'pib-1',
            item_number: i + 1,
            hs_code: '12345678',
            hs_description: null,
            goods_description: 'Test item',
            brand: null,
            type_model: null,
            specifications: null,
            country_of_origin: null,
            quantity: 1,
            unit: 'PCS',
            net_weight_kg: null,
            gross_weight_kg: null,
            unit_price: 100,
            total_price: 100,
            currency: 'USD',
            bm_rate: 10,
            ppn_rate: 11,
            pph_rate: 2.5,
            bea_masuk: d.bea_masuk,
            ppn: d.ppn,
            pph_import: d.pph_import,
            requires_permit: false,
            permit_type: null,
            permit_number: null,
            permit_date: null,
            created_at: new Date().toISOString(),
          }));

          const totals = aggregatePIBDuties(items);
          
          const expectedBM = itemDuties.reduce((sum, d) => sum + d.bea_masuk, 0);
          const expectedPPN = itemDuties.reduce((sum, d) => sum + d.ppn, 0);
          const expectedPPh = itemDuties.reduce((sum, d) => sum + d.pph_import, 0);
          
          expect(Math.abs(totals.bea_masuk - Math.round(expectedBM * 100) / 100)).toBeLessThan(0.1);
          expect(Math.abs(totals.ppn - Math.round(expectedPPN * 100) / 100)).toBeLessThan(0.1);
          expect(Math.abs(totals.pph_import - Math.round(expectedPPh * 100) / 100)).toBeLessThan(0.1);
          
          const expectedTotal = totals.bea_masuk + totals.ppn + totals.pph_import;
          // Allow for floating point precision (slightly higher tolerance for accumulated rounding)
          expect(Math.abs(totals.total_duties - expectedTotal)).toBeLessThan(0.02);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// =====================================================
// Property 5: Currency Conversion
// Validates: Requirements 5.4
// =====================================================

describe('Property 5: Currency Conversion', () => {
  it('CIF in IDR SHALL equal CIF × exchange_rate', () => {
    fc.assert(
      fc.property(positiveFloat, exchangeRateArb, (cifValue, exchangeRate) => {
        const cifIDR = convertToIDR(cifValue, exchangeRate);
        const expected = Math.round(cifValue * exchangeRate);
        
        expect(cifIDR).toBe(expected);
      }),
      { numRuns: 100 }
    );
  });
});


// =====================================================
// Property 11: Reference Format Validation
// Validates: Requirements 3.1
// =====================================================

describe('Property 11: Reference Format Validation', () => {
  it('Generated reference SHALL match format PIB-YYYY-NNNNN', () => {
    fc.assert(
      fc.property(sequenceNumber, yearArb, (sequence, year) => {
        const ref = generatePIBInternalRef(sequence, year);
        
        // Check format
        expect(ref).toMatch(/^PIB-\d{4}-\d{5}$/);
        
        // Validate with our validation function
        expect(isValidPIBInternalRef(ref)).toBe(true);
        
        // Check year is correct
        expect(ref.substring(4, 8)).toBe(String(year));
        
        // Check sequence is zero-padded
        const seqPart = ref.substring(9);
        expect(seqPart).toBe(String(sequence).padStart(5, '0'));
      }),
      { numRuns: 100 }
    );
  });

  it('Invalid references SHALL be rejected', () => {
    const invalidRefs = [
      'PIB-2025-123',      // Too short sequence
      'PIB-25-12345',      // Too short year
      'PIB-2025-123456',   // Too long sequence
      'PIB2025-12345',     // Missing dash
      'pib-2025-12345',    // Lowercase
      'INV-2025-12345',    // Wrong prefix
      '',                   // Empty
    ];

    invalidRefs.forEach((ref) => {
      expect(isValidPIBInternalRef(ref)).toBe(false);
    });
  });
});

// =====================================================
// Property 9: Document Filtering Correctness
// Validates: Requirements 7.3
// =====================================================

describe('Property 9: Document Filtering Correctness', () => {
  it('All returned documents SHALL match status filter', () => {
    fc.assert(
      fc.property(
        pibStatusArb,
        fc.array(pibStatusArb, { minLength: 1, maxLength: 20 }),
        (filterStatus, docStatuses) => {
          const documents: PIBDocument[] = docStatuses.map((status, i) => ({
            id: `doc-${i}`,
            internal_ref: `PIB-2025-${String(i + 1).padStart(5, '0')}`,
            pib_number: null,
            aju_number: null,
            job_order_id: null,
            customer_id: null,
            importer_name: `Importer ${i}`,
            importer_npwp: null,
            importer_address: null,
            supplier_name: null,
            supplier_country: null,
            import_type_id: null,
            customs_office_id: null,
            transport_mode: 'sea',
            vessel_name: null,
            voyage_number: null,
            bill_of_lading: null,
            awb_number: null,
            port_of_loading: null,
            port_of_discharge: null,
            eta_date: '2025-01-15',
            ata_date: null,
            total_packages: null,
            package_type: null,
            gross_weight_kg: null,
            currency: 'USD',
            fob_value: 1000,
            freight_value: 100,
            insurance_value: 50,
            cif_value: 1150,
            exchange_rate: 15000,
            cif_value_idr: 17250000,
            bea_masuk: 0,
            ppn: 0,
            pph_import: 0,
            total_duties: 0,
            status,
            submitted_at: null,
            duties_paid_at: null,
            released_at: null,
            sppb_number: null,
            sppb_date: null,
            documents: [],
            notes: null,
            created_by: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }));

          const filtered = filterPIBDocuments(documents, { status: filterStatus });
          
          // All returned documents must have the filtered status
          filtered.forEach((doc) => {
            expect(doc.status).toBe(filterStatus);
          });
          
          // Count should match expected
          const expectedCount = docStatuses.filter((s) => s === filterStatus).length;
          expect(filtered.length).toBe(expectedCount);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// =====================================================
// Property 10: Document Search Correctness
// Validates: Requirements 7.4
// =====================================================

describe('Property 10: Document Search Correctness', () => {
  it('All returned documents SHALL contain search term', () => {
    // Use alphanumeric search terms to avoid regex special characters
    const alphanumericArb = fc.stringMatching(/^[a-zA-Z0-9]{3,10}$/);
    fc.assert(
      fc.property(
        alphanumericArb,
        fc.array(fc.string({ minLength: 5, maxLength: 50 }), { minLength: 1, maxLength: 10 }),
        (searchTerm, importerNames) => {
          // Create documents with various importer names
          const documents: PIBDocument[] = importerNames.map((name, i) => ({
            id: `doc-${i}`,
            internal_ref: `PIB-2025-${String(i + 1).padStart(5, '0')}`,
            pib_number: null,
            aju_number: null,
            job_order_id: null,
            customer_id: null,
            importer_name: name,
            importer_npwp: null,
            importer_address: null,
            supplier_name: null,
            supplier_country: null,
            import_type_id: null,
            customs_office_id: null,
            transport_mode: 'sea',
            vessel_name: null,
            voyage_number: null,
            bill_of_lading: null,
            awb_number: null,
            port_of_loading: null,
            port_of_discharge: null,
            eta_date: '2025-01-15',
            ata_date: null,
            total_packages: null,
            package_type: null,
            gross_weight_kg: null,
            currency: 'USD',
            fob_value: 1000,
            freight_value: 100,
            insurance_value: 50,
            cif_value: 1150,
            exchange_rate: 15000,
            cif_value_idr: 17250000,
            bea_masuk: 0,
            ppn: 0,
            pph_import: 0,
            total_duties: 0,
            status: 'draft',
            submitted_at: null,
            duties_paid_at: null,
            released_at: null,
            sppb_number: null,
            sppb_date: null,
            documents: [],
            notes: null,
            created_by: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }));

          const results = searchPIBDocuments(documents, searchTerm);
          const termLower = searchTerm.toLowerCase();

          // All returned documents must contain the search term
          results.forEach((doc) => {
            const matchesRef = doc.internal_ref?.toLowerCase().includes(termLower);
            const matchesPIB = doc.pib_number?.toLowerCase().includes(termLower);
            const matchesImporter = doc.importer_name?.toLowerCase().includes(termLower);
            const matchesAJU = doc.aju_number?.toLowerCase().includes(termLower);
            
            expect(matchesRef || matchesPIB || matchesImporter || matchesAJU).toBe(true);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Empty search term SHALL return all documents', () => {
    fc.assert(
      fc.property(
        fc.array(fc.string({ minLength: 5, maxLength: 50 }), { minLength: 1, maxLength: 10 }),
        (importerNames) => {
          const documents: PIBDocument[] = importerNames.map((name, i) => ({
            id: `doc-${i}`,
            internal_ref: `PIB-2025-${String(i + 1).padStart(5, '0')}`,
            pib_number: null,
            aju_number: null,
            job_order_id: null,
            customer_id: null,
            importer_name: name,
            importer_npwp: null,
            importer_address: null,
            supplier_name: null,
            supplier_country: null,
            import_type_id: null,
            customs_office_id: null,
            transport_mode: 'sea',
            vessel_name: null,
            voyage_number: null,
            bill_of_lading: null,
            awb_number: null,
            port_of_loading: null,
            port_of_discharge: null,
            eta_date: '2025-01-15',
            ata_date: null,
            total_packages: null,
            package_type: null,
            gross_weight_kg: null,
            currency: 'USD',
            fob_value: 1000,
            freight_value: 100,
            insurance_value: 50,
            cif_value: 1150,
            exchange_rate: 15000,
            cif_value_idr: 17250000,
            bea_masuk: 0,
            ppn: 0,
            pph_import: 0,
            total_duties: 0,
            status: 'draft',
            submitted_at: null,
            duties_paid_at: null,
            released_at: null,
            sppb_number: null,
            sppb_date: null,
            documents: [],
            notes: null,
            created_by: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }));

          const results = searchPIBDocuments(documents, '');
          expect(results.length).toBe(documents.length);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// =====================================================
// Status Transition Tests
// =====================================================

describe('Status Transitions', () => {
  it('canTransitionStatus returns correct values for all status pairs', () => {
    const allStatuses: PIBStatus[] = [
      'draft', 'submitted', 'document_check', 'physical_check',
      'duties_paid', 'released', 'completed', 'cancelled'
    ];

    allStatuses.forEach((current) => {
      allStatuses.forEach((target) => {
        const allowed = PIB_STATUS_TRANSITIONS[current].includes(target);
        expect(canTransitionStatus(current, target)).toBe(allowed);
      });
    });
  });

  it('getNextAllowedStatuses returns correct transitions', () => {
    Object.entries(PIB_STATUS_TRANSITIONS).forEach(([status, allowed]) => {
      const result = getNextAllowedStatuses(status as PIBStatus);
      expect(result).toEqual(allowed);
    });
  });
});

// =====================================================
// Validation Tests
// =====================================================

describe('Validation Functions', () => {
  it('validateHSCode accepts valid HS codes', () => {
    const validCodes = ['12345678', '1234567890', '1234.5678', '12.34.56.78'];
    validCodes.forEach((code) => {
      expect(validateHSCode(code)).toBe(true);
    });
  });

  it('validateHSCode rejects invalid HS codes', () => {
    const invalidCodes = ['12345', 'ABCD1234', '12345678901', ''];
    invalidCodes.forEach((code) => {
      expect(validateHSCode(code)).toBe(false);
    });
  });

  it('validatePIBDocument catches missing required fields', () => {
    const result = validatePIBDocument({});
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    
    const fieldNames = result.errors.map((e) => e.field);
    expect(fieldNames).toContain('importer_name');
    expect(fieldNames).toContain('import_type_id');
    expect(fieldNames).toContain('customs_office_id');
  });

  it('validatePIBItem catches missing required fields', () => {
    const result = validatePIBItem({});
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    
    const fieldNames = result.errors.map((e) => e.field);
    expect(fieldNames).toContain('hs_code');
    expect(fieldNames).toContain('goods_description');
    expect(fieldNames).toContain('quantity');
    expect(fieldNames).toContain('unit');
  });
});
