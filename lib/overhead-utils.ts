// lib/overhead-utils.ts
// Utility functions for Overhead Allocation feature (v0.26)

import type {
  OverheadCategory,
  AllocationMethod,
  OverheadAllocationResult,
  JobProfitability,
  FormattedOverheadAllocation,
} from '@/types/overhead';

/**
 * Format currency for display (Indonesian Rupiah)
 */
export function formatCurrency(amount: number): string {
  if (amount < 0) {
    return `-Rp ${Math.abs(amount).toLocaleString('id-ID')}`;
  }
  return `Rp ${amount.toLocaleString('id-ID')}`;
}

/**
 * Calculate overhead allocation for a job based on revenue and categories
 * Property 3: Revenue Percentage Allocation Formula
 */
export function calculateOverheadAllocation(
  revenue: number,
  categories: OverheadCategory[]
): OverheadAllocationResult[] {
  if (revenue <= 0) {
    return [];
  }

  return categories
    .filter(cat => cat.is_active && cat.allocation_method === 'revenue_percentage' && cat.default_rate > 0)
    .map(cat => ({
      categoryId: cat.id,
      categoryCode: cat.category_code,
      categoryName: cat.category_name,
      method: cat.allocation_method,
      rate: cat.default_rate,
      baseAmount: revenue,
      allocatedAmount: calculateRevenuePercentageAllocation(revenue, cat.default_rate),
    }));
}

/**
 * Calculate allocated amount using revenue percentage method
 * Formula: revenue × rate / 100
 */
export function calculateRevenuePercentageAllocation(
  revenue: number,
  rate: number
): number {
  if (revenue <= 0 || rate <= 0) {
    return 0;
  }
  // Round to 2 decimal places to avoid floating point issues
  return Math.round(revenue * rate) / 100;
}

/**
 * Calculate gross profit (Revenue - Direct Costs)
 */
export function calculateGrossProfit(
  revenue: number,
  directCosts: number
): number {
  return revenue - directCosts;
}

/**
 * Calculate net profit (Gross Profit - Total Overhead)
 */
export function calculateNetProfit(
  grossProfit: number,
  totalOverhead: number
): number {
  return grossProfit - totalOverhead;
}

/**
 * Calculate margin percentage
 * Returns 0 if revenue is 0 to avoid division by zero
 */
export function calculateMargin(
  profit: number,
  revenue: number
): number {
  if (revenue <= 0) {
    return 0;
  }
  // Round to 2 decimal places
  return Math.round((profit / revenue) * 10000) / 100;
}

/**
 * Sum overhead rates from active revenue_percentage categories
 * Property 1: Total Overhead Rate Calculation
 */
export function sumOverheadRates(categories: OverheadCategory[]): number {
  return categories
    .filter(cat => cat.is_active && cat.allocation_method === 'revenue_percentage')
    .reduce((sum, cat) => sum + (cat.default_rate || 0), 0);
}

/**
 * Calculate total allocated overhead from allocation results
 */
export function sumAllocatedOverhead(allocations: OverheadAllocationResult[]): number {
  return allocations.reduce((sum, alloc) => sum + alloc.allocatedAmount, 0);
}

/**
 * Validate allocation rate based on method
 */
export function validateAllocationRate(
  rate: number,
  method: AllocationMethod
): { valid: boolean; error?: string } {
  if (rate < 0) {
    return { valid: false, error: 'Allocation rate cannot be negative' };
  }

  if (method === 'revenue_percentage' && rate > 100) {
    return { valid: false, error: 'Percentage rate cannot exceed 100%' };
  }

  return { valid: true };
}

/**
 * Calculate complete job profitability
 * Property 5: Profitability Calculation Consistency
 */
export function calculateJobProfitability(
  revenue: number,
  directCosts: number,
  categories: OverheadCategory[]
): JobProfitability {
  const grossProfit = calculateGrossProfit(revenue, directCosts);
  const grossMargin = calculateMargin(grossProfit, revenue);
  
  const overheadBreakdown = calculateOverheadAllocation(revenue, categories);
  const totalOverhead = sumAllocatedOverhead(overheadBreakdown);
  
  const netProfit = calculateNetProfit(grossProfit, totalOverhead);
  const netMargin = calculateMargin(netProfit, revenue);

  return {
    revenue,
    directCosts,
    grossProfit,
    grossMargin,
    totalOverhead,
    netProfit,
    netMargin,
    overheadBreakdown,
  };
}

/**
 * Format overhead allocation for display
 */
export function formatOverheadAllocation(
  allocation: OverheadAllocationResult
): FormattedOverheadAllocation {
  return {
    categoryName: allocation.categoryName,
    rateDisplay: `${allocation.rate.toFixed(1)}%`,
    allocatedAmountDisplay: formatCurrency(allocation.allocatedAmount),
  };
}

/**
 * Get allocation method display name
 */
export function getAllocationMethodDisplay(method: AllocationMethod): string {
  const methodNames: Record<AllocationMethod, string> = {
    revenue_percentage: '% of Revenue',
    fixed_per_job: 'Fixed per Job',
    manual: 'Manual',
    none: 'None',
  };
  return methodNames[method] || method;
}

/**
 * Validate category code format (alphanumeric with underscores)
 */
export function validateCategoryCode(code: string): { valid: boolean; error?: string } {
  if (!code || code.trim().length === 0) {
    return { valid: false, error: 'Category code is required' };
  }

  if (code.length > 30) {
    return { valid: false, error: 'Category code must be 30 characters or less' };
  }

  if (!/^[a-z0-9_]+$/.test(code)) {
    return { valid: false, error: 'Category code must contain only lowercase letters, numbers, and underscores' };
  }

  return { valid: true };
}

/**
 * Validate category name
 */
export function validateCategoryName(name: string): { valid: boolean; error?: string } {
  if (!name || name.trim().length === 0) {
    return { valid: false, error: 'Category name is required' };
  }

  if (name.length > 100) {
    return { valid: false, error: 'Category name must be 100 characters or less' };
  }

  return { valid: true };
}
