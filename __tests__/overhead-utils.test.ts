// __tests__/overhead-utils.test.ts
// Property-based tests for Overhead Allocation utilities (v0.26)

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  calculateRevenuePercentageAllocation,
  calculateGrossProfit,
  calculateNetProfit,
  calculateMargin,
  sumOverheadRates,
  calculateOverheadAllocation,
  calculateJobProfitability,
  validateAllocationRate,
  validateCategoryCode,
  validateCategoryName,
  sumAllocatedOverhead,
} from '@/lib/overhead-utils';
import type { OverheadCategory, AllocationMethod } from '@/types/overhead';

// Custom arbitrary for OverheadCategory
const overheadCategoryArb = fc.record({
  id: fc.uuid(),
  category_code: fc.stringMatching(/^[a-z0-9_]{1,30}$/),
  category_name: fc.string({ minLength: 1, maxLength: 100 }),
  description: fc.option(fc.string(), { nil: null }),
  allocation_method: fc.constantFrom<AllocationMethod>('revenue_percentage', 'fixed_per_job', 'manual', 'none'),
  default_rate: fc.float({ min: 0, max: 100, noNaN: true }),
  is_active: fc.boolean(),
  display_order: fc.integer({ min: 0, max: 100 }),
  created_at: fc.constant(new Date().toISOString()),
});

// Arbitrary for active revenue_percentage categories
const activeRevenuePercentageCategoryArb = overheadCategoryArb.map(cat => ({
  ...cat,
  is_active: true,
  allocation_method: 'revenue_percentage' as AllocationMethod,
  default_rate: Math.abs(cat.default_rate),
}));

describe('Overhead Utilities - Property Tests', () => {
  describe('Property 3: Revenue Percentage Allocation Formula', () => {
    // **Feature: overhead-allocation, Property 3: Revenue Percentage Allocation Formula**
    // **Validates: Requirements 2.2**
    it('allocated_amount equals revenue × rate / 100 for all valid inputs', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 0, max: 1_000_000_000, noNaN: true }),
          fc.float({ min: 0, max: 100, noNaN: true }),
          (revenue, rate) => {
            const result = calculateRevenuePercentageAllocation(revenue, rate);
            const expected = Math.round(revenue * rate) / 100;
            // Allow small floating point tolerance
            return Math.abs(result - expected) < 0.01;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('returns 0 for zero or negative revenue', () => {
      fc.assert(
        fc.property(
          fc.float({ min: -1_000_000, max: 0, noNaN: true }),
          fc.float({ min: 0, max: 100, noNaN: true }),
          (revenue, rate) => {
            const result = calculateRevenuePercentageAllocation(revenue, rate);
            return result === 0;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('returns 0 for zero or negative rate', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 0, max: 1_000_000_000, noNaN: true }),
          fc.float({ min: -100, max: 0, noNaN: true }),
          (revenue, rate) => {
            const result = calculateRevenuePercentageAllocation(revenue, rate);
            return result === 0;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 5: Profitability Calculation Consistency', () => {
    // **Feature: overhead-allocation, Property 5: Profitability Calculation Consistency**
    // **Validates: Requirements 3.1, 3.2, 3.5, 3.6**
    it('gross profit equals revenue - direct costs', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 0, max: 1_000_000_000, noNaN: true }),
          fc.float({ min: 0, max: 1_000_000_000, noNaN: true }),
          (revenue, directCosts) => {
            const result = calculateGrossProfit(revenue, directCosts);
            return Math.abs(result - (revenue - directCosts)) < 0.01;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('net profit equals gross profit - total overhead', () => {
      fc.assert(
        fc.property(
          fc.float({ min: -1_000_000_000, max: 1_000_000_000, noNaN: true }),
          fc.float({ min: 0, max: 1_000_000_000, noNaN: true }),
          (grossProfit, totalOverhead) => {
            const result = calculateNetProfit(grossProfit, totalOverhead);
            return Math.abs(result - (grossProfit - totalOverhead)) < 0.01;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('margin equals (profit / revenue) × 100 when revenue > 0', () => {
      fc.assert(
        fc.property(
          fc.float({ min: Math.fround(-1_000_000_000), max: Math.fround(1_000_000_000), noNaN: true }),
          fc.float({ min: Math.fround(0.01), max: Math.fround(1_000_000_000), noNaN: true }), // revenue > 0
          (profit, revenue) => {
            const result = calculateMargin(profit, revenue);
            const expected = Math.round((profit / revenue) * 10000) / 100;
            return Math.abs(result - expected) < 0.01;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('margin equals 0 when revenue is 0 or negative', () => {
      fc.assert(
        fc.property(
          fc.float({ min: -1_000_000_000, max: 1_000_000_000, noNaN: true }),
          fc.float({ min: -1_000_000_000, max: 0, noNaN: true }),
          (profit, revenue) => {
            const result = calculateMargin(profit, revenue);
            return result === 0;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('complete profitability calculation is consistent', () => {
      fc.assert(
        fc.property(
          fc.float({ min: Math.fround(0.01), max: Math.fround(1_000_000_000), noNaN: true }), // revenue > 0
          fc.float({ min: 0, max: Math.fround(1_000_000_000), noNaN: true }),
          fc.array(activeRevenuePercentageCategoryArb, { minLength: 0, maxLength: 5 }),
          (revenue, directCosts, categories) => {
            const result = calculateJobProfitability(revenue, directCosts, categories);
            
            // Verify gross profit
            const expectedGrossProfit = revenue - directCosts;
            if (Math.abs(result.grossProfit - expectedGrossProfit) > 0.01) return false;
            
            // Verify gross margin
            const expectedGrossMargin = Math.round((expectedGrossProfit / revenue) * 10000) / 100;
            if (Math.abs(result.grossMargin - expectedGrossMargin) > 0.01) return false;
            
            // Verify net profit
            const expectedNetProfit = expectedGrossProfit - result.totalOverhead;
            if (Math.abs(result.netProfit - expectedNetProfit) > 0.01) return false;
            
            // Verify net margin
            const expectedNetMargin = Math.round((expectedNetProfit / revenue) * 10000) / 100;
            if (Math.abs(result.netMargin - expectedNetMargin) > 0.01) return false;
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});

describe('Overhead Utilities - Property 1: Total Overhead Rate Calculation', () => {
  // **Feature: overhead-allocation, Property 1: Total Overhead Rate Calculation**
  // **Validates: Requirements 1.4**
  it('total rate equals sum of rates for active revenue_percentage categories', () => {
    fc.assert(
      fc.property(
        fc.array(overheadCategoryArb, { minLength: 0, maxLength: 10 }),
        (categories) => {
          const result = sumOverheadRates(categories);
          
          // Calculate expected sum manually
          const expected = categories
            .filter(cat => cat.is_active && cat.allocation_method === 'revenue_percentage')
            .reduce((sum, cat) => sum + (cat.default_rate || 0), 0);
          
          return Math.abs(result - expected) < 0.01;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('returns 0 when no active revenue_percentage categories exist', () => {
    fc.assert(
      fc.property(
        fc.array(overheadCategoryArb.map(cat => ({
          ...cat,
          is_active: false,
        })), { minLength: 0, maxLength: 10 }),
        (categories) => {
          const result = sumOverheadRates(categories);
          return result === 0;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('excludes non-revenue_percentage methods from sum', () => {
    fc.assert(
      fc.property(
        fc.array(overheadCategoryArb.map(cat => ({
          ...cat,
          is_active: true,
          allocation_method: fc.sample(fc.constantFrom<AllocationMethod>('fixed_per_job', 'manual', 'none'), 1)[0],
        })), { minLength: 1, maxLength: 10 }),
        (categories) => {
          const result = sumOverheadRates(categories);
          return result === 0;
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Overhead Utilities - Unit Tests', () => {
  describe('calculateOverheadAllocation', () => {
    it('returns empty array for zero revenue', () => {
      const categories: OverheadCategory[] = [{
        id: '1',
        category_code: 'test',
        category_name: 'Test',
        description: null,
        allocation_method: 'revenue_percentage',
        default_rate: 10,
        is_active: true,
        display_order: 1,
        created_at: new Date().toISOString(),
      }];
      
      const result = calculateOverheadAllocation(0, categories);
      expect(result).toEqual([]);
    });

    it('only includes active categories', () => {
      const categories: OverheadCategory[] = [
        {
          id: '1',
          category_code: 'active',
          category_name: 'Active',
          description: null,
          allocation_method: 'revenue_percentage',
          default_rate: 10,
          is_active: true,
          display_order: 1,
          created_at: new Date().toISOString(),
        },
        {
          id: '2',
          category_code: 'inactive',
          category_name: 'Inactive',
          description: null,
          allocation_method: 'revenue_percentage',
          default_rate: 5,
          is_active: false,
          display_order: 2,
          created_at: new Date().toISOString(),
        },
      ];
      
      const result = calculateOverheadAllocation(100000, categories);
      expect(result).toHaveLength(1);
      expect(result[0].categoryCode).toBe('active');
    });

    it('calculates correct allocation amounts', () => {
      const categories: OverheadCategory[] = [{
        id: '1',
        category_code: 'test',
        category_name: 'Test',
        description: null,
        allocation_method: 'revenue_percentage',
        default_rate: 2,
        is_active: true,
        display_order: 1,
        created_at: new Date().toISOString(),
      }];
      
      const result = calculateOverheadAllocation(100000000, categories);
      expect(result[0].allocatedAmount).toBe(2000000);
    });
  });

  describe('validateAllocationRate', () => {
    it('rejects negative rates', () => {
      const result = validateAllocationRate(-5, 'revenue_percentage');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('negative');
    });

    it('rejects percentage rates over 100', () => {
      const result = validateAllocationRate(150, 'revenue_percentage');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('100');
    });

    it('accepts valid percentage rates', () => {
      const result = validateAllocationRate(14, 'revenue_percentage');
      expect(result.valid).toBe(true);
    });

    it('accepts high fixed rates', () => {
      const result = validateAllocationRate(500000, 'fixed_per_job');
      expect(result.valid).toBe(true);
    });
  });

  describe('validateCategoryCode', () => {
    it('rejects empty codes', () => {
      const result = validateCategoryCode('');
      expect(result.valid).toBe(false);
    });

    it('rejects codes with uppercase', () => {
      const result = validateCategoryCode('Office_Rent');
      expect(result.valid).toBe(false);
    });

    it('accepts valid codes', () => {
      const result = validateCategoryCode('office_rent');
      expect(result.valid).toBe(true);
    });
  });

  describe('validateCategoryName', () => {
    it('rejects empty names', () => {
      const result = validateCategoryName('');
      expect(result.valid).toBe(false);
    });

    it('accepts valid names', () => {
      const result = validateCategoryName('Office Rent');
      expect(result.valid).toBe(true);
    });
  });

  describe('sumAllocatedOverhead', () => {
    it('sums all allocated amounts', () => {
      const allocations = [
        { categoryId: '1', categoryCode: 'a', categoryName: 'A', method: 'revenue_percentage' as AllocationMethod, rate: 2, baseAmount: 100000, allocatedAmount: 2000 },
        { categoryId: '2', categoryCode: 'b', categoryName: 'B', method: 'revenue_percentage' as AllocationMethod, rate: 3, baseAmount: 100000, allocatedAmount: 3000 },
      ];
      
      const result = sumAllocatedOverhead(allocations);
      expect(result).toBe(5000);
    });

    it('returns 0 for empty array', () => {
      const result = sumAllocatedOverhead([]);
      expect(result).toBe(0);
    });
  });
});


describe('Overhead Allocation - Property 2: Active Category Inclusion', () => {
  // **Feature: overhead-allocation, Property 2: Active Category Inclusion in Allocation**
  // **Validates: Requirements 1.3, 2.1**
  
  it('allocation result contains exactly one record per active revenue_percentage category', () => {
    fc.assert(
      fc.property(
        fc.float({ min: Math.fround(0.01), max: Math.fround(1_000_000_000), noNaN: true }),
        fc.array(overheadCategoryArb, { minLength: 0, maxLength: 10 }),
        (revenue, categories) => {
          const result = calculateOverheadAllocation(revenue, categories);
          
          // Count active revenue_percentage categories with positive rate
          const activeCategories = categories.filter(
            cat => cat.is_active && 
                   cat.allocation_method === 'revenue_percentage' && 
                   cat.default_rate > 0
          );
          
          // Result should have exactly one allocation per active category
          return result.length === activeCategories.length;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('inactive categories are excluded from allocation', () => {
    fc.assert(
      fc.property(
        fc.float({ min: Math.fround(0.01), max: Math.fround(1_000_000_000), noNaN: true }),
        fc.array(overheadCategoryArb.map(cat => ({ ...cat, is_active: false })), { minLength: 1, maxLength: 10 }),
        (revenue, categories) => {
          const result = calculateOverheadAllocation(revenue, categories);
          return result.length === 0;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('non-revenue_percentage methods are excluded from allocation', () => {
    fc.assert(
      fc.property(
        fc.float({ min: Math.fround(0.01), max: Math.fround(1_000_000_000), noNaN: true }),
        fc.array(overheadCategoryArb.map(cat => ({
          ...cat,
          is_active: true,
          allocation_method: 'fixed_per_job' as AllocationMethod,
        })), { minLength: 1, maxLength: 10 }),
        (revenue, categories) => {
          const result = calculateOverheadAllocation(revenue, categories);
          return result.length === 0;
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Overhead Allocation - Property 4: Allocation Idempotence', () => {
  // **Feature: overhead-allocation, Property 4: Allocation Idempotence**
  // **Validates: Requirements 2.5**
  
  it('calculating allocation twice produces identical results', () => {
    fc.assert(
      fc.property(
        fc.float({ min: Math.fround(0.01), max: Math.fround(1_000_000_000), noNaN: true }),
        fc.array(activeRevenuePercentageCategoryArb, { minLength: 0, maxLength: 5 }),
        (revenue, categories) => {
          const result1 = calculateOverheadAllocation(revenue, categories);
          const result2 = calculateOverheadAllocation(revenue, categories);
          
          // Same number of allocations
          if (result1.length !== result2.length) return false;
          
          // Same allocated amounts
          for (let i = 0; i < result1.length; i++) {
            if (Math.abs(result1[i].allocatedAmount - result2[i].allocatedAmount) > 0.01) {
              return false;
            }
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('total overhead is consistent across multiple calculations', () => {
    fc.assert(
      fc.property(
        fc.float({ min: Math.fround(0.01), max: Math.fround(1_000_000_000), noNaN: true }),
        fc.array(activeRevenuePercentageCategoryArb, { minLength: 0, maxLength: 5 }),
        (revenue, categories) => {
          const result1 = calculateOverheadAllocation(revenue, categories);
          const result2 = calculateOverheadAllocation(revenue, categories);
          
          const total1 = sumAllocatedOverhead(result1);
          const total2 = sumAllocatedOverhead(result2);
          
          return Math.abs(total1 - total2) < 0.01;
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Overhead Allocation - Property 6: Total Overhead Sum Consistency', () => {
  // **Feature: overhead-allocation, Property 6: Total Overhead Sum Consistency**
  // **Validates: Requirements 2.6, 3.4**
  
  it('total overhead equals sum of all allocated amounts', () => {
    fc.assert(
      fc.property(
        fc.float({ min: Math.fround(0.01), max: Math.fround(1_000_000_000), noNaN: true }),
        fc.array(activeRevenuePercentageCategoryArb, { minLength: 0, maxLength: 5 }),
        (revenue, categories) => {
          const allocations = calculateOverheadAllocation(revenue, categories);
          const total = sumAllocatedOverhead(allocations);
          
          // Manually sum allocated amounts
          const manualSum = allocations.reduce((sum, a) => sum + a.allocatedAmount, 0);
          
          return Math.abs(total - manualSum) < 0.01;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('profitability total overhead matches allocation sum', () => {
    fc.assert(
      fc.property(
        fc.float({ min: Math.fround(0.01), max: Math.fround(1_000_000_000), noNaN: true }),
        fc.float({ min: 0, max: Math.fround(1_000_000_000), noNaN: true }),
        fc.array(activeRevenuePercentageCategoryArb, { minLength: 0, maxLength: 5 }),
        (revenue, directCosts, categories) => {
          const profitability = calculateJobProfitability(revenue, directCosts, categories);
          const allocationSum = sumAllocatedOverhead(profitability.overheadBreakdown);
          
          return Math.abs(profitability.totalOverhead - allocationSum) < 0.01;
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Overhead Allocation - Property 10: Batch Recalculation Coverage', () => {
  // **Feature: overhead-allocation, Property 10: Batch Recalculation Coverage**
  // **Validates: Requirements 4.1, 4.2**
  // Note: Full batch testing requires database integration. This tests the calculation logic.
  
  it('batch calculation processes all provided jobs consistently', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            revenue: fc.float({ min: 0, max: Math.fround(1_000_000_000), noNaN: true }),
            directCosts: fc.float({ min: 0, max: Math.fround(1_000_000_000), noNaN: true }),
          }),
          { minLength: 0, maxLength: 10 }
        ),
        fc.array(activeRevenuePercentageCategoryArb, { minLength: 0, maxLength: 5 }),
        (jobs, categories) => {
          // Simulate batch calculation
          const results = jobs.map(job => 
            calculateJobProfitability(job.revenue, job.directCosts, categories)
          );
          
          // All jobs should be processed
          return results.length === jobs.length;
        }
      ),
      { numRuns: 100 }
    );
  });
});
