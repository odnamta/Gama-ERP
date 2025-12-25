// =====================================================
// v0.70: n8n SCHEDULED TASKS - DEPRECIATION RUN TYPES
// =====================================================

/**
 * Depreciation method for scheduled task processing
 * Re-exported from assets for convenience
 */
export type DepreciationMethod = 'straight_line' | 'declining_balance';

/**
 * Asset eligible for depreciation processing in scheduled task
 * Simplified view of asset data needed for depreciation calculation
 */
export interface DepreciableAsset {
  id: string;
  asset_code: string;
  asset_name: string;
  purchase_cost: number;
  salvage_value: number;
  useful_life_months: number;
  depreciation_method: DepreciationMethod;
  book_value: number;
  accumulated_depreciation: number;
}

/**
 * Record created for each depreciation calculation
 */
export interface DepreciationRecord {
  id: string;
  asset_id: string;
  period_date: string;
  depreciation_amount: number;
  book_value_before: number;
  book_value_after: number;
  method_used: DepreciationMethod;
  created_at: string;
}

/**
 * Result of a monthly depreciation run
 */
export interface DepreciationRunResult {
  assets_processed: number;
  assets_skipped: number;
  total_depreciation_amount: number;
  records_created: DepreciationRecord[];
  errors: DepreciationError[];
}

/**
 * Error during depreciation processing
 */
export interface DepreciationError {
  asset_id: string;
  asset_code: string;
  error_message: string;
}

/**
 * Input for creating a depreciation record
 */
export interface CreateDepreciationRecordInput {
  asset_id: string;
  period_date: string;
  depreciation_amount: number;
  book_value_before: number;
  book_value_after: number;
  method_used: DepreciationMethod;
}

/**
 * Database row format for depreciation records (scheduled task context)
 */
export interface DepreciationRecordRow {
  id: string;
  asset_id: string;
  period_date: string;
  depreciation_amount: number;
  book_value_before: number;
  book_value_after: number;
  method_used: string;
  created_at: string;
}

/**
 * Transform database row to DepreciationRecord interface
 */
export function transformDepreciationRecordRow(row: DepreciationRecordRow): DepreciationRecord {
  return {
    id: row.id,
    asset_id: row.asset_id,
    period_date: row.period_date,
    depreciation_amount: row.depreciation_amount,
    book_value_before: row.book_value_before,
    book_value_after: row.book_value_after,
    method_used: row.method_used as DepreciationMethod,
    created_at: row.created_at,
  };
}

/**
 * Database row format for depreciable assets query
 */
export interface DepreciableAssetRow {
  id: string;
  asset_code: string;
  asset_name: string;
  purchase_price: number | null;
  salvage_value: number | null;
  useful_life_years: number | null;
  depreciation_method: string;
  book_value: number | null;
  accumulated_depreciation: number | null;
}

/**
 * Transform database row to DepreciableAsset interface
 */
export function transformDepreciableAssetRow(row: DepreciableAssetRow): DepreciableAsset {
  const purchaseCost = row.purchase_price ?? 0;
  const salvageValue = row.salvage_value ?? 0;
  const usefulLifeYears = row.useful_life_years ?? 0;
  const bookValue = row.book_value ?? purchaseCost;
  
  return {
    id: row.id,
    asset_code: row.asset_code,
    asset_name: row.asset_name,
    purchase_cost: purchaseCost,
    salvage_value: salvageValue,
    useful_life_months: usefulLifeYears * 12,
    depreciation_method: row.depreciation_method as DepreciationMethod,
    book_value: bookValue,
    accumulated_depreciation: row.accumulated_depreciation ?? 0,
  };
}
