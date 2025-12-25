// =====================================================
// v0.70: DEPRECIATION RUN UTILS PROPERTY TESTS
// =====================================================
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  calculateStraightLineDepreciation,
  calculateDecliningBalanceDepreciation,
  calculateDepreciation,
  isFullyDepreciated,
  calculateNewBookValue,
  validateDepreciationInputs,
  processDepreciationBatch,
  calculateTotalDepreciation,
  getMonthlyPeriodDate,
} from '@/lib/depreciation-run-utils';
import {
  DepreciableAsset,
  DepreciationMethod,
} from '@/types/depreciation-run';

// =====================================================
// GENERATORS
// =====================================================

/**
 * Generator for depreciation methods
 */
const depreciationMethodArb = fc.constantFrom<DepreciationMethod>('straight_line', 'declining_balance');

/**
 * Generator for valid depreciable assets
 * Ensures purchase_cost >= salvage_value and book_value >= salvage_value
 */
const depreciableAssetArb = fc.record({
  id: fc.uuid(),
  asset_code: fc.stringMatching(/^[A-Z]{2,4}-\d{4}$/),
  asset_name: fc.string({ minLength: 1, maxLength: 100 }),
  purchase_cost: fc.integer({ min: 1000, max: 10000000 }),
  salvage_value: fc.integer({ min: 0, max: 500000 }),
  useful_life_months: fc.integer({ min: 12, max: 240 }), // 1-20 years
  depreciation_method: depreciationMethodArb,
}).chain(base => {
  // Ensure salvage_value <= purchase_cost
  const adjustedSalvage = Math.min(base.salvage_value, base.purchase_cost - 1);
  // Book value between salvage and purchase cost
  return fc.integer({ min: adjustedSalvage, max: base.purchase_cost }).map(bookValue => ({
    ...base,
    salvage_value: adjustedSalvage,
    book_value: bookValue,
    accumulated_depreciation: base.purchase_cost - bookValue,
  }));
});

/**
 * Generator for fully depreciated assets
 */
const fullyDepreciatedAssetArb = depreciableAssetArb.map(asset => ({
  ...asset,
  book_value: asset.salvage_value,
  accumulated_depreciation: asset.purchase_cost - asset.salvage_value,
}));

/**
 * Generator for assets with remaining depreciation
 */
const partiallyDepreciatedAssetArb = depreciableAssetArb.filter(
  asset => asset.book_value > asset.salvage_value
);

// =====================================================
// PROPERTY TESTS
// =====================================================

describe('Depreciation Run Utils Property Tests', () => {
  /**
   * **Feature: n8n-scheduled-tasks, Property 14: Depreciation Calculation Correctness**
   * *For any* depreciable asset with book_value > 0, the calculated depreciation SHALL be:
   * (purchase_cost - salvage_value) / useful_life_months for straight_line method, or
   * book_value * (2 / useful_life_months) for declining_balance method,
   * capped at (book_value - salvage_value).
   * **Validates: Requirements 7.2, 7.3**
   */
  describe('Property 14: Depreciation Calculation Correctness', () => {
    it('should calculate straight-line depreciation correctly', () => {
      fc.assert(
        fc.property(partiallyDepreciatedAssetArb, (asset) => {
          const straightLineAsset = { ...asset, depreciation_method: 'straight_line' as const };
          const depreciation = calculateStraightLineDepreciation(straightLineAsset);
          
          // Expected formula: (purchase_cost - salvage_value) / useful_life_months
          const expectedMonthly = (asset.purchase_cost - asset.salvage_value) / asset.useful_life_months;
          const maxDepreciation = asset.book_value - asset.salvage_value;
          const expected = Math.min(
            Math.round(expectedMonthly * 100) / 100,
            Math.round(maxDepreciation * 100) / 100
          );
          
          // Depreciation should match expected (within rounding tolerance)
          return Math.abs(depreciation - expected) <= 0.01;
        }),
        { numRuns: 100 }
      );
    });

    it('should calculate declining-balance depreciation correctly', () => {
      fc.assert(
        fc.property(partiallyDepreciatedAssetArb, (asset) => {
          const decliningAsset = { ...asset, depreciation_method: 'declining_balance' as const };
          const depreciation = calculateDecliningBalanceDepreciation(decliningAsset);
          
          // Expected formula: book_value * (2 / useful_life_months)
          const monthlyRate = 2 / asset.useful_life_months;
          const expectedMonthly = asset.book_value * monthlyRate;
          const maxDepreciation = asset.book_value - asset.salvage_value;
          const expected = Math.min(
            Math.round(expectedMonthly * 100) / 100,
            Math.round(maxDepreciation * 100) / 100
          );
          
          // Depreciation should match expected (within rounding tolerance)
          return Math.abs(depreciation - expected) <= 0.01;
        }),
        { numRuns: 100 }
      );
    });

    it('should cap depreciation at book_value minus salvage_value', () => {
      fc.assert(
        fc.property(partiallyDepreciatedAssetArb, (asset) => {
          const depreciation = calculateDepreciation(asset);
          const maxAllowed = asset.book_value - asset.salvage_value;
          
          // Depreciation should never exceed the remaining depreciable amount
          return depreciation <= maxAllowed + 0.01; // Allow small rounding tolerance
        }),
        { numRuns: 100 }
      );
    });

    it('should return non-negative depreciation for valid assets', () => {
      fc.assert(
        fc.property(depreciableAssetArb, (asset) => {
          const depreciation = calculateDepreciation(asset);
          return depreciation >= 0;
        }),
        { numRuns: 100 }
      );
    });

    it('should use correct method based on asset configuration', () => {
      fc.assert(
        fc.property(partiallyDepreciatedAssetArb, (asset) => {
          const depreciation = calculateDepreciation(asset);
          
          let expectedDepreciation: number;
          if (asset.depreciation_method === 'straight_line') {
            expectedDepreciation = calculateStraightLineDepreciation(asset);
          } else {
            expectedDepreciation = calculateDecliningBalanceDepreciation(asset);
          }
          
          return Math.abs(depreciation - expectedDepreciation) <= 0.01;
        }),
        { numRuns: 100 }
      );
    });

    it('should return zero for assets with zero useful life', () => {
      fc.assert(
        fc.property(depreciableAssetArb, (asset) => {
          const zeroLifeAsset = { ...asset, useful_life_months: 0 };
          const depreciation = calculateDepreciation(zeroLifeAsset);
          return depreciation === 0;
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: n8n-scheduled-tasks, Property 15: Book Value Update Invariant**
   * *For any* asset after depreciation processing, the new book_value SHALL equal
   * the previous book_value minus the depreciation_amount, and SHALL never be
   * less than salvage_value.
   * **Validates: Requirements 7.4**
   */
  describe('Property 15: Book Value Update Invariant', () => {
    it('should calculate new book value correctly', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1000, max: 1000000 }),
          fc.integer({ min: 0, max: 100000 }),
          fc.integer({ min: 0, max: 50000 }),
          (currentBookValue, depreciationAmount, salvageValue) => {
            // Ensure valid inputs
            const adjustedSalvage = Math.min(salvageValue, currentBookValue);
            const adjustedDepreciation = Math.min(depreciationAmount, currentBookValue);
            
            const newBookValue = calculateNewBookValue(
              currentBookValue,
              adjustedDepreciation,
              adjustedSalvage
            );
            
            // New book value should be current - depreciation, but not below salvage
            const expectedValue = Math.max(
              currentBookValue - adjustedDepreciation,
              adjustedSalvage
            );
            
            return Math.abs(newBookValue - Math.round(expectedValue * 100) / 100) <= 0.01;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should never reduce book value below salvage value', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1000, max: 1000000 }),
          fc.integer({ min: 0, max: 2000000 }), // Can be larger than book value
          fc.integer({ min: 0, max: 500000 }),
          (currentBookValue, depreciationAmount, salvageValue) => {
            const adjustedSalvage = Math.min(salvageValue, currentBookValue);
            
            const newBookValue = calculateNewBookValue(
              currentBookValue,
              depreciationAmount,
              adjustedSalvage
            );
            
            // New book value should never be less than salvage value
            return newBookValue >= adjustedSalvage;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain book value invariant after depreciation', () => {
      fc.assert(
        fc.property(partiallyDepreciatedAssetArb, (asset) => {
          const depreciation = calculateDepreciation(asset);
          const newBookValue = calculateNewBookValue(
            asset.book_value,
            depreciation,
            asset.salvage_value
          );
          
          // Invariant: new_book_value = old_book_value - depreciation (capped at salvage)
          const expectedNewValue = Math.max(
            asset.book_value - depreciation,
            asset.salvage_value
          );
          
          return (
            Math.abs(newBookValue - Math.round(expectedNewValue * 100) / 100) <= 0.01 &&
            newBookValue >= asset.salvage_value
          );
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: n8n-scheduled-tasks, Property 16: Fully Depreciated Asset Skip**
   * *For any* asset where book_value equals salvage_value (fully depreciated),
   * the depreciation run SHALL skip the asset and not create a depreciation record.
   * **Validates: Requirements 7.6**
   */
  describe('Property 16: Fully Depreciated Asset Skip', () => {
    it('should identify fully depreciated assets correctly', () => {
      fc.assert(
        fc.property(fullyDepreciatedAssetArb, (asset) => {
          return isFullyDepreciated(asset) === true;
        }),
        { numRuns: 100 }
      );
    });

    it('should identify partially depreciated assets correctly', () => {
      fc.assert(
        fc.property(partiallyDepreciatedAssetArb, (asset) => {
          return isFullyDepreciated(asset) === false;
        }),
        { numRuns: 100 }
      );
    });

    it('should return zero depreciation for fully depreciated assets', () => {
      fc.assert(
        fc.property(fullyDepreciatedAssetArb, (asset) => {
          const depreciation = calculateDepreciation(asset);
          return depreciation === 0;
        }),
        { numRuns: 100 }
      );
    });

    it('should skip fully depreciated assets in batch processing', () => {
      fc.assert(
        fc.property(
          fc.array(fullyDepreciatedAssetArb, { minLength: 1, maxLength: 10 }),
          (assets) => {
            const periodDate = getMonthlyPeriodDate();
            const result = processDepreciationBatch(assets, periodDate);
            
            // All fully depreciated assets should be skipped
            return (
              result.records.length === 0 &&
              result.skipped.length === assets.length &&
              result.skipped.every(s => s.reason === 'Fully depreciated')
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should process only non-fully-depreciated assets in mixed batch', () => {
      fc.assert(
        fc.property(
          fc.array(partiallyDepreciatedAssetArb, { minLength: 1, maxLength: 5 }),
          fc.array(fullyDepreciatedAssetArb, { minLength: 1, maxLength: 5 }),
          (partialAssets, fullyDepreciatedAssets) => {
            const allAssets = [...partialAssets, ...fullyDepreciatedAssets];
            const periodDate = getMonthlyPeriodDate();
            const result = processDepreciationBatch(allAssets, periodDate);
            
            // Count how many partial assets actually have depreciation > 0
            const assetsWithDepreciation = partialAssets.filter(asset => {
              const depreciation = calculateDepreciation(asset);
              return depreciation > 0;
            });
            
            // Should have records for assets with positive depreciation
            // and skip fully depreciated assets
            return (
              result.records.length === assetsWithDepreciation.length &&
              result.skipped.filter(s => s.reason === 'Fully depreciated').length === fullyDepreciatedAssets.length
            );
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Additional property tests for validation and batch processing
   */
  describe('Validation and Batch Processing', () => {
    it('should validate depreciation inputs correctly', () => {
      fc.assert(
        fc.property(depreciableAssetArb, (asset) => {
          const validation = validateDepreciationInputs(asset);
          return validation.valid === true;
        }),
        { numRuns: 100 }
      );
    });

    it('should reject negative purchase cost', () => {
      fc.assert(
        fc.property(depreciableAssetArb, (asset) => {
          const invalidAsset = { ...asset, purchase_cost: -1000 };
          const validation = validateDepreciationInputs(invalidAsset);
          return validation.valid === false && validation.error?.includes('Purchase cost');
        }),
        { numRuns: 100 }
      );
    });

    it('should reject salvage value greater than purchase cost', () => {
      fc.assert(
        fc.property(depreciableAssetArb, (asset) => {
          const invalidAsset = { ...asset, salvage_value: asset.purchase_cost + 1000 };
          const validation = validateDepreciationInputs(invalidAsset);
          return validation.valid === false && validation.error?.includes('Salvage value');
        }),
        { numRuns: 100 }
      );
    });

    it('should calculate total depreciation correctly', () => {
      fc.assert(
        fc.property(
          fc.array(partiallyDepreciatedAssetArb, { minLength: 1, maxLength: 10 }),
          (assets) => {
            const periodDate = getMonthlyPeriodDate();
            const result = processDepreciationBatch(assets, periodDate);
            const total = calculateTotalDepreciation(result.records);
            
            // Total should equal sum of individual depreciation amounts
            const expectedTotal = result.records.reduce(
              (sum, r) => sum + r.depreciation_amount,
              0
            );
            
            return Math.abs(total - Math.round(expectedTotal * 100) / 100) <= 0.01;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should generate valid period dates', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 2020, max: 2030 }),
          fc.integer({ min: 0, max: 11 }),
          fc.integer({ min: 1, max: 28 }),
          (year, month, day) => {
            const date = new Date(year, month, day);
            const periodDate = getMonthlyPeriodDate(date);
            
            // Period date should be in YYYY-MM-DD format
            const match = periodDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
            if (!match) return false;
            
            const [, pYear, pMonth, pDay] = match;
            
            // Should be first of the same month and year
            return (
              parseInt(pDay) === 1 &&
              parseInt(pMonth) === month + 1 && // months are 1-indexed in ISO format
              parseInt(pYear) === year
            );
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
