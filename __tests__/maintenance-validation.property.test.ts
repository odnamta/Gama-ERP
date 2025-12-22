// =====================================================
// v0.42: EQUIPMENT - MAINTENANCE TRACKING
// Property-Based Tests for Validation Functions
// =====================================================

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  validateMaintenanceRecordInput,
  validateMaintenanceScheduleInput,
} from '@/lib/maintenance-utils';
import {
  MaintenanceRecordInput,
  MaintenanceScheduleInput,
} from '@/types/maintenance';

// Helper to generate a valid date string
const dateStringArb = fc.integer({ min: 2020, max: 2030 }).chain(year =>
  fc.integer({ min: 1, max: 12 }).chain(month =>
    fc.integer({ min: 1, max: 28 }).map(day =>
      `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    )
  )
);

describe('Maintenance Validation Property Tests', () => {
  /**
   * Property 6: Schedule Input Validation
   * For any maintenance schedule input, validation should fail if required fields are missing.
   * Validates: Requirements 2.1
   */
  describe('Property 6: Schedule Input Validation', () => {
    it('should pass validation for valid km-based schedule input', () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          fc.uuid(),
          fc.integer({ min: 1000, max: 100000 }),
          (assetId, maintenanceTypeId, triggerValue) => {
            const input: MaintenanceScheduleInput = {
              assetId,
              maintenanceTypeId,
              triggerType: 'km',
              triggerValue,
            };
            const result = validateMaintenanceScheduleInput(input);
            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should pass validation for valid days-based schedule input', () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          fc.uuid(),
          fc.integer({ min: 1, max: 365 }),
          (assetId, maintenanceTypeId, triggerValue) => {
            const input: MaintenanceScheduleInput = {
              assetId,
              maintenanceTypeId,
              triggerType: 'days',
              triggerValue,
            };
            const result = validateMaintenanceScheduleInput(input);
            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should pass validation for valid date-based schedule input', () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          fc.uuid(),
          dateStringArb,
          (assetId, maintenanceTypeId, triggerDate) => {
            const input: MaintenanceScheduleInput = {
              assetId,
              maintenanceTypeId,
              triggerType: 'date',
              triggerDate,
            };
            const result = validateMaintenanceScheduleInput(input);
            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should fail validation when assetId is missing', () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          fc.integer({ min: 1000, max: 100000 }),
          (maintenanceTypeId, triggerValue) => {
            const input: MaintenanceScheduleInput = {
              assetId: '',
              maintenanceTypeId,
              triggerType: 'km',
              triggerValue,
            };
            const result = validateMaintenanceScheduleInput(input);
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Asset is required');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should fail validation when maintenanceTypeId is missing', () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          fc.integer({ min: 1000, max: 100000 }),
          (assetId, triggerValue) => {
            const input: MaintenanceScheduleInput = {
              assetId,
              maintenanceTypeId: '',
              triggerType: 'km',
              triggerValue,
            };
            const result = validateMaintenanceScheduleInput(input);
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Maintenance type is required');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should fail validation when km-based schedule has no triggerValue', () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          fc.uuid(),
          (assetId, maintenanceTypeId) => {
            const input: MaintenanceScheduleInput = {
              assetId,
              maintenanceTypeId,
              triggerType: 'km',
            };
            const result = validateMaintenanceScheduleInput(input);
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Interval (km) is required for km-based schedules');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should fail validation when days-based schedule has no triggerValue', () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          fc.uuid(),
          (assetId, maintenanceTypeId) => {
            const input: MaintenanceScheduleInput = {
              assetId,
              maintenanceTypeId,
              triggerType: 'days',
            };
            const result = validateMaintenanceScheduleInput(input);
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Interval (days) is required for time-based schedules');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should fail validation when date-based schedule has no triggerDate', () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          fc.uuid(),
          (assetId, maintenanceTypeId) => {
            const input: MaintenanceScheduleInput = {
              assetId,
              maintenanceTypeId,
              triggerType: 'date',
            };
            const result = validateMaintenanceScheduleInput(input);
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Due date is required for date-based schedules');
          }
        ),
        { numRuns: 100 }
      );
    });
  });


  /**
   * Property 7: Record Input Validation
   * For any maintenance record input, validation should fail if required fields are missing
   * or if values are invalid.
   * Validates: Requirements 4.1
   */
  describe('Property 7: Record Input Validation', () => {
    it('should pass validation for valid record input', () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          fc.uuid(),
          dateStringArb,
          fc.string({ minLength: 5, maxLength: 200 }),
          fc.integer({ min: 0, max: 1000000 }),
          fc.integer({ min: 0, max: 1000000 }),
          (assetId, maintenanceTypeId, maintenanceDate, description, laborCost, externalCost) => {
            const input: MaintenanceRecordInput = {
              assetId,
              maintenanceTypeId,
              maintenanceDate,
              description,
              performedAt: 'internal',
              laborCost,
              externalCost,
              parts: [],
            };
            const result = validateMaintenanceRecordInput(input);
            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should fail validation when assetId is missing', () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          fc.string({ minLength: 5, maxLength: 200 }),
          (maintenanceTypeId, description) => {
            const input: MaintenanceRecordInput = {
              assetId: '',
              maintenanceTypeId,
              maintenanceDate: '2025-01-15',
              description,
              performedAt: 'internal',
              laborCost: 0,
              externalCost: 0,
              parts: [],
            };
            const result = validateMaintenanceRecordInput(input);
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Asset is required');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should fail validation when maintenanceTypeId is missing', () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          fc.string({ minLength: 5, maxLength: 200 }),
          (assetId, description) => {
            const input: MaintenanceRecordInput = {
              assetId,
              maintenanceTypeId: '',
              maintenanceDate: '2025-01-15',
              description,
              performedAt: 'internal',
              laborCost: 0,
              externalCost: 0,
              parts: [],
            };
            const result = validateMaintenanceRecordInput(input);
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Maintenance type is required');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should fail validation when maintenanceDate is missing', () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          fc.uuid(),
          fc.string({ minLength: 5, maxLength: 200 }),
          (assetId, maintenanceTypeId, description) => {
            const input: MaintenanceRecordInput = {
              assetId,
              maintenanceTypeId,
              maintenanceDate: '',
              description,
              performedAt: 'internal',
              laborCost: 0,
              externalCost: 0,
              parts: [],
            };
            const result = validateMaintenanceRecordInput(input);
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Maintenance date is required');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should fail validation when description is empty or whitespace', () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          fc.uuid(),
          fc.constantFrom('', '   ', '\t', '\n'),
          (assetId, maintenanceTypeId, description) => {
            const input: MaintenanceRecordInput = {
              assetId,
              maintenanceTypeId,
              maintenanceDate: '2025-01-15',
              description,
              performedAt: 'internal',
              laborCost: 0,
              externalCost: 0,
              parts: [],
            };
            const result = validateMaintenanceRecordInput(input);
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Description is required');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should fail validation when laborCost is negative', () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          fc.uuid(),
          fc.string({ minLength: 5, maxLength: 200 }),
          fc.integer({ min: -1000000, max: -1 }),
          (assetId, maintenanceTypeId, description, laborCost) => {
            const input: MaintenanceRecordInput = {
              assetId,
              maintenanceTypeId,
              maintenanceDate: '2025-01-15',
              description,
              performedAt: 'internal',
              laborCost,
              externalCost: 0,
              parts: [],
            };
            const result = validateMaintenanceRecordInput(input);
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Labor cost cannot be negative');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should fail validation when externalCost is negative', () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          fc.uuid(),
          fc.string({ minLength: 5, maxLength: 200 }),
          fc.integer({ min: -1000000, max: -1 }),
          (assetId, maintenanceTypeId, description, externalCost) => {
            const input: MaintenanceRecordInput = {
              assetId,
              maintenanceTypeId,
              maintenanceDate: '2025-01-15',
              description,
              performedAt: 'internal',
              laborCost: 0,
              externalCost,
              parts: [],
            };
            const result = validateMaintenanceRecordInput(input);
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('External cost cannot be negative');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should fail validation when part has empty name', () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          fc.uuid(),
          fc.string({ minLength: 5, maxLength: 200 }),
          (assetId, maintenanceTypeId, description) => {
            const input: MaintenanceRecordInput = {
              assetId,
              maintenanceTypeId,
              maintenanceDate: '2025-01-15',
              description,
              performedAt: 'internal',
              laborCost: 0,
              externalCost: 0,
              parts: [
                { partName: '', quantity: 1, unit: 'pcs', unitPrice: 100 },
              ],
            };
            const result = validateMaintenanceRecordInput(input);
            expect(result.valid).toBe(false);
            expect(result.errors.some(e => e.includes('Part name is required'))).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should fail validation when part has non-positive quantity', () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          fc.uuid(),
          fc.string({ minLength: 5, maxLength: 200 }),
          fc.integer({ min: -100, max: 0 }),
          (assetId, maintenanceTypeId, description, quantity) => {
            const input: MaintenanceRecordInput = {
              assetId,
              maintenanceTypeId,
              maintenanceDate: '2025-01-15',
              description,
              performedAt: 'internal',
              laborCost: 0,
              externalCost: 0,
              parts: [
                { partName: 'Test Part', quantity, unit: 'pcs', unitPrice: 100 },
              ],
            };
            const result = validateMaintenanceRecordInput(input);
            expect(result.valid).toBe(false);
            expect(result.errors.some(e => e.includes('Quantity must be positive'))).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should fail validation when part has negative unit price', () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          fc.uuid(),
          fc.string({ minLength: 5, maxLength: 200 }),
          fc.integer({ min: -100000, max: -1 }),
          (assetId, maintenanceTypeId, description, unitPrice) => {
            const input: MaintenanceRecordInput = {
              assetId,
              maintenanceTypeId,
              maintenanceDate: '2025-01-15',
              description,
              performedAt: 'internal',
              laborCost: 0,
              externalCost: 0,
              parts: [
                { partName: 'Test Part', quantity: 1, unit: 'pcs', unitPrice },
              ],
            };
            const result = validateMaintenanceRecordInput(input);
            expect(result.valid).toBe(false);
            expect(result.errors.some(e => e.includes('Unit price cannot be negative'))).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
