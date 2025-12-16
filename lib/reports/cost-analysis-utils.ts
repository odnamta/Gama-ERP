// Cost Analysis by Category Report Utility Functions

import { DateRange } from '@/types/reports'

export interface CostAnalysisItem {
  category: string
  totalAmount: number
  percentageOfTotal: number
  averagePerJO: number
  joCount: number
  previousPeriodAmount?: number
  changePercentage?: number
}

export interface CostAnalysisReport {
  items: CostAnalysisItem[]
  totalCost: number
  period: DateRange
  comparisonPeriod?: DateRange
}

interface CostItemData {
  category: string
  amount: number
  joId: string
}

const CATEGORY_DISPLAY_NAMES: Record<string, string> = {
  trucking: 'Trucking & Vehicle',
  port_charges: 'Port Charges',
  labor: 'Crew & Allowances',
  fuel: 'Fuel',
  tolls: 'Tolls',
  documentation: 'Documentation',
  handling: 'Handling',
  customs: 'Customs',
  insurance: 'Insurance',
  storage: 'Storage',
  other: 'Other',
}

/**
 * Get display name for a cost category
 */
export function getCategoryDisplayName(category: string): string {
  return CATEGORY_DISPLAY_NAMES[category] || category
}

/**
 * Aggregate costs by category
 */
export function aggregateCostsByCategory(costItems: CostItemData[]): Map<string, { totalAmount: number; joIds: Set<string> }> {
  const categoryMap = new Map<string, { totalAmount: number; joIds: Set<string> }>()
  
  for (const item of costItems) {
    const existing = categoryMap.get(item.category)
    if (existing) {
      existing.totalAmount += item.amount
      existing.joIds.add(item.joId)
    } else {
      categoryMap.set(item.category, {
        totalAmount: item.amount,
        joIds: new Set([item.joId]),
      })
    }
  }
  
  return categoryMap
}

/**
 * Calculate average cost per JO for a category
 */
export function calculateAveragePerJO(totalAmount: number, joCount: number): number {
  if (joCount === 0) return 0
  return totalAmount / joCount
}

/**
 * Calculate period-over-period change percentage
 */
export function calculatePeriodComparison(currentAmount: number, previousAmount: number): number | null {
  if (previousAmount === 0) return null
  return ((currentAmount - previousAmount) / previousAmount) * 100
}

/**
 * Filter out categories with zero costs
 */
export function filterZeroCosts<T extends { totalAmount: number }>(items: T[]): T[] {
  return items.filter(item => item.totalAmount > 0)
}

/**
 * Sort categories by total amount descending
 */
export function sortByCostDescending<T extends { totalAmount: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => b.totalAmount - a.totalAmount)
}

/**
 * Build complete Cost Analysis report
 */
export function buildCostAnalysisReport(
  costItems: CostItemData[],
  period: DateRange,
  previousPeriodData?: CostItemData[]
): CostAnalysisReport {
  const categoryMap = aggregateCostsByCategory(costItems)
  const previousCategoryMap = previousPeriodData ? aggregateCostsByCategory(previousPeriodData) : null
  
  let items: CostAnalysisItem[] = Array.from(categoryMap.entries()).map(([category, data]) => {
    const previousData = previousCategoryMap?.get(category)
    return {
      category: getCategoryDisplayName(category),
      totalAmount: data.totalAmount,
      percentageOfTotal: 0,
      averagePerJO: calculateAveragePerJO(data.totalAmount, data.joIds.size),
      joCount: data.joIds.size,
      previousPeriodAmount: previousData?.totalAmount,
      changePercentage: previousData ? calculatePeriodComparison(data.totalAmount, previousData.totalAmount) ?? undefined : undefined,
    }
  })
  
  items = filterZeroCosts(items)
  items = sortByCostDescending(items)
  
  const totalCost = items.reduce((sum, item) => sum + item.totalAmount, 0)
  
  // Calculate percentages
  items = items.map(item => ({
    ...item,
    percentageOfTotal: totalCost > 0 ? (item.totalAmount / totalCost) * 100 : 0,
  }))
  
  return {
    items,
    totalCost,
    period,
    comparisonPeriod: previousPeriodData ? period : undefined,
  }
}
