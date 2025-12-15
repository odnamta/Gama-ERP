// Budget Variance Report Utility Functions

import { BudgetVarianceItem, BudgetVarianceReportData, DateRange } from '@/types/reports'

// Warning threshold for variance percentage
const VARIANCE_WARNING_THRESHOLD = 10

interface PJOWithCosts {
  id: string
  pjo_number: string
  customers: { name: string } | null
  total_cost_estimated: number | null
  total_cost_actual: number | null
}

/**
 * Calculate variance between estimated and actual amounts
 */
export function calculateVariance(
  estimated: number,
  actual: number
): { varianceAmount: number; variancePercentage: number | null } {
  const varianceAmount = actual - estimated
  
  // Handle zero estimated edge case - return null for percentage
  const variancePercentage = estimated === 0 
    ? null 
    : (varianceAmount / estimated) * 100
  
  return { varianceAmount, variancePercentage }
}

/**
 * Check if variance exceeds warning threshold
 */
export function hasVarianceWarning(variancePercentage: number | null): boolean {
  if (variancePercentage === null) return false
  return variancePercentage > VARIANCE_WARNING_THRESHOLD
}

/**
 * Transform PJO data to variance items
 */
export function transformPJOsToVarianceItems(pjos: PJOWithCosts[]): BudgetVarianceItem[] {
  return pjos.map((pjo) => {
    const estimated = pjo.total_cost_estimated ?? 0
    const actual = pjo.total_cost_actual ?? 0
    const { varianceAmount, variancePercentage } = calculateVariance(estimated, actual)
    
    return {
      pjoId: pjo.id,
      pjoNumber: pjo.pjo_number,
      customerName: pjo.customers?.name ?? 'Unknown',
      estimatedTotal: estimated,
      actualTotal: actual,
      varianceAmount,
      variancePercentage,
      hasWarning: hasVarianceWarning(variancePercentage),
    }
  })
}

/**
 * Build complete budget variance report data
 */
export function buildBudgetVarianceReportData(
  pjos: PJOWithCosts[],
  period: DateRange
): BudgetVarianceReportData {
  const items = transformPJOsToVarianceItems(pjos)
  
  // Sort by variance percentage descending (highest overrun first)
  items.sort((a, b) => {
    // Items with null percentage go to the end
    if (a.variancePercentage === null && b.variancePercentage === null) return 0
    if (a.variancePercentage === null) return 1
    if (b.variancePercentage === null) return -1
    return b.variancePercentage - a.variancePercentage
  })
  
  const summary = {
    totalEstimated: items.reduce((sum, item) => sum + item.estimatedTotal, 0),
    totalActual: items.reduce((sum, item) => sum + item.actualTotal, 0),
    totalVariance: items.reduce((sum, item) => sum + item.varianceAmount, 0),
    itemsWithWarning: items.filter((item) => item.hasWarning).length,
  }
  
  return {
    period,
    items,
    summary,
  }
}

/**
 * Format variance percentage for display
 */
export function formatVariancePercentage(percentage: number | null): string {
  if (percentage === null) return 'N/A'
  const sign = percentage > 0 ? '+' : ''
  return `${sign}${percentage.toFixed(1)}%`
}

/**
 * Get variance status label
 */
export function getVarianceStatus(variancePercentage: number | null): string {
  if (variancePercentage === null) return 'N/A'
  if (variancePercentage > VARIANCE_WARNING_THRESHOLD) return 'Over Budget'
  if (variancePercentage < -5) return 'Under Budget'
  return 'On Track'
}
