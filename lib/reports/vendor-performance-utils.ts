// Vendor Performance Report Utility Functions

import { DateRange } from '@/types/reports'

export interface VendorPerformanceItem {
  vendorName: string
  totalSpend: number
  joCount: number
  averageCostPerJO: number
  onTimeDeliveries: number
  totalDeliveries: number
  onTimeRate: number | null
}

export interface VendorPerformanceReport {
  items: VendorPerformanceItem[]
  totalSpend: number
  vendorCount: number
  period: DateRange
}

interface VendorCostData {
  vendorName: string
  amount: number
  joId: string
  isOnTime?: boolean
}

/**
 * Aggregate vendor data from cost items
 */
export function aggregateVendorData(costItems: VendorCostData[]): Map<string, { totalSpend: number; joIds: Set<string>; onTimeCount: number; totalDeliveries: number }> {
  const vendorMap = new Map<string, { totalSpend: number; joIds: Set<string>; onTimeCount: number; totalDeliveries: number }>()
  
  for (const item of costItems) {
    const existing = vendorMap.get(item.vendorName)
    if (existing) {
      existing.totalSpend += item.amount
      existing.joIds.add(item.joId)
      if (item.isOnTime !== undefined) {
        existing.totalDeliveries += 1
        if (item.isOnTime) existing.onTimeCount += 1
      }
    } else {
      vendorMap.set(item.vendorName, {
        totalSpend: item.amount,
        joIds: new Set([item.joId]),
        onTimeCount: item.isOnTime ? 1 : 0,
        totalDeliveries: item.isOnTime !== undefined ? 1 : 0,
      })
    }
  }
  
  return vendorMap
}

/**
 * Calculate vendor on-time rate
 */
export function calculateVendorOnTimeRate(onTimeDeliveries: number, totalDeliveries: number): number | null {
  if (totalDeliveries === 0) return null
  return (onTimeDeliveries / totalDeliveries) * 100
}

/**
 * Sort vendors by specified field
 */
export function sortVendors(items: VendorPerformanceItem[], sortBy: 'totalSpend' | 'joCount' | 'onTimeRate', direction: 'asc' | 'desc' = 'desc'): VendorPerformanceItem[] {
  return [...items].sort((a, b) => {
    let aVal: number, bVal: number
    
    if (sortBy === 'onTimeRate') {
      aVal = a.onTimeRate ?? -1
      bVal = b.onTimeRate ?? -1
    } else {
      aVal = a[sortBy]
      bVal = b[sortBy]
    }
    
    return direction === 'desc' ? bVal - aVal : aVal - bVal
  })
}

/**
 * Build complete Vendor Performance report
 */
export function buildVendorPerformanceReport(costItems: VendorCostData[], period: DateRange): VendorPerformanceReport {
  const vendorMap = aggregateVendorData(costItems)
  
  let items: VendorPerformanceItem[] = Array.from(vendorMap.entries()).map(([vendorName, data]) => ({
    vendorName,
    totalSpend: data.totalSpend,
    joCount: data.joIds.size,
    averageCostPerJO: data.joIds.size > 0 ? data.totalSpend / data.joIds.size : 0,
    onTimeDeliveries: data.onTimeCount,
    totalDeliveries: data.totalDeliveries,
    onTimeRate: calculateVendorOnTimeRate(data.onTimeCount, data.totalDeliveries),
  }))
  
  items = items.filter(item => item.totalSpend > 0)
  items = sortVendors(items, 'totalSpend')
  
  const totalSpend = items.reduce((sum, item) => sum + item.totalSpend, 0)
  
  return {
    items,
    totalSpend,
    vendorCount: items.length,
    period,
  }
}
