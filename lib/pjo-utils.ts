import { PJOWithRelations, PJORevenueItem, PJOCostItem, CostItemStatus, BudgetAnalysis } from '@/types'
import { format } from 'date-fns'

/**
 * Format a date as DD/MM/YYYY
 * @param date - Date string or Date object
 * @returns Formatted string like "14/12/2025"
 */
export function formatDate(date: string | Date): string {
  return format(new Date(date), 'dd/MM/yyyy')
}

/**
 * Format a date with time as DD/MM/YYYY HH:mm
 * @param date - Date string or Date object
 * @returns Formatted string like "14/12/2025 15:30"
 */
export function formatDateTime(date: string | Date): string {
  return format(new Date(date), 'dd/MM/yyyy HH:mm')
}

/**
 * Format a number as Indonesian Rupiah currency
 * @param amount - The number to format
 * @returns Formatted string like "Rp 30.000.000"
 */
export function formatIDR(amount: number): string {
  if (amount < 0) {
    return `-Rp ${Math.abs(amount).toLocaleString('id-ID')}`
  }
  return `Rp ${amount.toLocaleString('id-ID')}`
}

/**
 * Calculate profit from revenue and expenses
 * @param revenue - Total revenue
 * @param expenses - Total expenses
 * @returns Profit (revenue - expenses)
 */
export function calculateProfit(revenue: number, expenses: number): number {
  return revenue - expenses
}

/**
 * Calculate margin percentage
 * @param revenue - Total revenue
 * @param expenses - Total expenses
 * @returns Margin percentage (profit/revenue * 100), or 0 if revenue is 0
 */
export function calculateMargin(revenue: number, expenses: number): number {
  if (revenue === 0) return 0
  const profit = calculateProfit(revenue, expenses)
  return (profit / revenue) * 100
}

/**
 * Convert month number (1-12) to Roman numeral
 * @param month - Month number (1-12)
 * @returns Roman numeral representation
 */
export function toRomanMonth(month: number): string {
  const romanNumerals: Record<number, string> = {
    1: 'I',
    2: 'II',
    3: 'III',
    4: 'IV',
    5: 'V',
    6: 'VI',
    7: 'VII',
    8: 'VIII',
    9: 'IX',
    10: 'X',
    11: 'XI',
    12: 'XII',
  }
  return romanNumerals[month] || ''
}

/**
 * Filter PJOs by status and date range
 * @param pjos - List of PJOs to filter
 * @param statusFilter - Status to filter by (null or 'all' for no filter)
 * @param dateFrom - Start date for jo_date filter (null for no filter)
 * @param dateTo - End date for jo_date filter (null for no filter)
 * @returns Filtered list of PJOs
 */
export function filterPJOs(
  pjos: PJOWithRelations[],
  statusFilter: string | null,
  dateFrom: Date | null,
  dateTo: Date | null
): PJOWithRelations[] {
  return pjos.filter((pjo) => {
    // Status filter
    if (statusFilter && statusFilter !== 'all' && pjo.status !== statusFilter) {
      return false
    }

    // Date range filter
    if (pjo.jo_date) {
      const joDate = new Date(pjo.jo_date)
      if (dateFrom && joDate < dateFrom) {
        return false
      }
      if (dateTo) {
        const endOfDay = new Date(dateTo)
        endOfDay.setHours(23, 59, 59, 999)
        if (joDate > endOfDay) {
          return false
        }
      }
    }

    return true
  })
}

/**
 * Parse IDR formatted string back to number
 * @param value - Formatted string like "Rp 30.000.000" or "30.000.000"
 * @returns Numeric value
 */
export function parseIDR(value: string): number {
  // Remove "Rp", spaces, and dots
  const cleaned = value.replace(/Rp\s?/g, '').replace(/\./g, '').replace(/,/g, '.')
  return parseFloat(cleaned) || 0
}

/**
 * Format number for input display (with thousand separators)
 * @param value - Number to format
 * @returns Formatted string with dots as thousand separators
 */
export function formatNumberInput(value: number): string {
  return value.toLocaleString('id-ID')
}


/**
 * Calculate total revenue from line items
 * @param items - Array of revenue items
 * @returns Total revenue
 */
export function calculateRevenueTotal(items: PJORevenueItem[]): number {
  return items.reduce((sum, item) => sum + (item.subtotal || item.quantity * item.unit_price), 0)
}

/**
 * Calculate total cost from line items
 * @param items - Array of cost items
 * @param type - 'estimated' or 'actual'
 * @returns Total cost
 */
export function calculateCostTotal(items: PJOCostItem[], type: 'estimated' | 'actual'): number {
  return items.reduce((sum, item) => {
    if (type === 'estimated') {
      return sum + item.estimated_amount
    }
    return sum + (item.actual_amount ?? 0)
  }, 0)
}

/**
 * Determine cost item status based on estimated vs actual
 * @param estimated - Estimated amount
 * @param actual - Actual amount
 * @returns Cost item status
 */
export function determineCostStatus(estimated: number, actual: number): CostItemStatus {
  if (actual > estimated) {
    return 'exceeded'
  }
  if (actual < estimated) {
    return 'under_budget'
  }
  return 'confirmed'
}

/**
 * Analyze budget from cost items
 * @param costItems - Array of cost items
 * @returns Budget analysis object
 */
export function analyzeBudget(costItems: PJOCostItem[]): BudgetAnalysis {
  const total_estimated = calculateCostTotal(costItems, 'estimated')
  const confirmedItems = costItems.filter(item => item.actual_amount !== null && item.actual_amount !== undefined)
  const total_actual = confirmedItems.reduce((sum, item) => sum + (item.actual_amount ?? 0), 0)
  const total_variance = total_actual - total_estimated
  const variance_pct = total_estimated > 0 ? (total_variance / total_estimated) * 100 : 0
  
  const items_confirmed = confirmedItems.length
  const items_pending = costItems.length - items_confirmed
  const items_over_budget = costItems.filter(item => item.status === 'exceeded').length
  const items_under_budget = costItems.filter(item => item.status === 'under_budget').length
  
  return {
    total_estimated,
    total_actual,
    total_variance,
    variance_pct,
    items_confirmed,
    items_pending,
    items_over_budget,
    items_under_budget,
    all_confirmed: items_pending === 0 && costItems.length > 0,
    has_overruns: items_over_budget > 0,
  }
}

/**
 * Generate JO number
 * Format: JO-NNNN/CARGO/MM/YYYY where MM is Roman numeral
 * @param sequence - Sequence number
 * @param date - Date for month/year
 * @returns Formatted JO number
 */
export function generateJONumber(sequence: number, date: Date): string {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const romanMonth = toRomanMonth(month)
  const paddedSequence = sequence.toString().padStart(4, '0')
  return `JO-${paddedSequence}/CARGO/${romanMonth}/${year}`
}

/**
 * Cost category display labels
 */
export const COST_CATEGORY_LABELS: Record<string, string> = {
  trucking: 'Trucking',
  port_charges: 'Port Charges',
  documentation: 'Documentation',
  handling: 'Handling',
  customs: 'Customs',
  insurance: 'Insurance',
  storage: 'Storage',
  labor: 'Labor',
  fuel: 'Fuel',
  tolls: 'Tolls',
  other: 'Other',
}


/**
 * Validation result interface
 */
export interface ValidationResult {
  valid: boolean
  error?: string
}

/**
 * Validate that PJO has positive margin (revenue > cost)
 * @param totalRevenue - Total revenue from line items
 * @param totalCost - Total estimated cost from line items
 * @returns Validation result with error message if invalid
 */
export function validatePositiveMargin(totalRevenue: number, totalCost: number): ValidationResult {
  if (totalCost >= totalRevenue) {
    const margin = totalRevenue > 0 
      ? ((totalRevenue - totalCost) / totalRevenue * 100).toFixed(2)
      : '0.00'
    return {
      valid: false,
      error: `Cannot submit: Estimated cost (${formatIDR(totalCost)}) exceeds or equals revenue (${formatIDR(totalRevenue)}). Current margin: ${margin}%`
    }
  }
  return { valid: true }
}

/**
 * Budget warning level type
 */
export type BudgetWarningLevel = 'safe' | 'warning' | 'exceeded'

/**
 * Get budget warning level based on actual vs estimated
 * @param estimated - Estimated amount (budget)
 * @param actual - Actual amount entered
 * @returns Warning level: 'safe' (<90%), 'warning' (90-100%), 'exceeded' (>100%)
 */
export function getBudgetWarningLevel(estimated: number, actual: number): BudgetWarningLevel {
  if (actual > estimated) return 'exceeded'
  if (actual >= estimated * 0.9) return 'warning'
  return 'safe'
}

/**
 * Get budget usage percentage
 * @param estimated - Estimated amount (budget)
 * @param actual - Actual amount entered
 * @returns Percentage of budget used
 */
export function getBudgetUsagePercent(estimated: number, actual: number): number {
  if (estimated === 0) return 0
  return (actual / estimated) * 100
}

/**
 * Validate that ETA is on or after ETD
 * @param etd - Estimated Time of Departure
 * @param eta - Estimated Time of Arrival
 * @returns Validation result with error message if invalid
 */
export function validateDateOrder(etd: Date | null, eta: Date | null): ValidationResult {
  if (etd && eta) {
    if (eta < etd) {
      return {
        valid: false,
        error: 'ETA must be on or after ETD'
      }
    }
  }
  return { valid: true }
}
