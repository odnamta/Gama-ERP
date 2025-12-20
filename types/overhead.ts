// types/overhead.ts
// TypeScript types for Overhead Allocation feature (v0.26)

export type AllocationMethod = 
  | 'revenue_percentage' 
  | 'fixed_per_job' 
  | 'manual' 
  | 'none';

export interface OverheadCategory {
  id: string;
  category_code: string;
  category_name: string;
  description: string | null;
  allocation_method: AllocationMethod;
  default_rate: number;
  is_active: boolean;
  display_order: number;
  created_at: string;
}

export interface CreateOverheadCategoryInput {
  category_code: string;
  category_name: string;
  description?: string;
  allocation_method: AllocationMethod;
  default_rate: number;
  is_active?: boolean;
  display_order?: number;
}

export interface UpdateOverheadCategoryInput {
  category_name?: string;
  description?: string;
  allocation_method?: AllocationMethod;
  default_rate?: number;
  is_active?: boolean;
  display_order?: number;
}

export interface OverheadActual {
  id: string;
  category_id: string;
  period_year: number;
  period_month: number;
  actual_amount: number;
  notes: string | null;
  created_by: string | null;
  created_at: string;
}

export interface JobOverheadAllocation {
  id: string;
  jo_id: string;
  category_id: string;
  allocation_method: string;
  allocation_rate: number;
  base_amount: number;
  allocated_amount: number;
  period_year: number | null;
  period_month: number | null;
  notes: string | null;
  created_at: string;
}

export interface JobOverheadAllocationWithCategory extends JobOverheadAllocation {
  category: OverheadCategory;
}

export interface OverheadAllocationResult {
  categoryId: string;
  categoryCode: string;
  categoryName: string;
  method: AllocationMethod;
  rate: number;
  baseAmount: number;
  allocatedAmount: number;
}

export interface JobProfitability {
  revenue: number;
  directCosts: number;
  grossProfit: number;
  grossMargin: number;
  totalOverhead: number;
  netProfit: number;
  netMargin: number;
  overheadBreakdown: OverheadAllocationResult[];
}

export interface FormattedOverheadAllocation {
  categoryName: string;
  rateDisplay: string;
  allocatedAmountDisplay: string;
}

export interface OverheadSettingsFormData {
  categories: OverheadCategory[];
  totalRate: number;
}

export interface BatchRecalculationResult {
  count: number;
  success: boolean;
  error: string | null;
}
