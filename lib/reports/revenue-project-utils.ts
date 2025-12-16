// Revenue by Project Report Utility Functions

import { DateRange } from '@/types/reports'

export interface RevenueByProjectItem {
  projectId: string
  projectName: string
  customerName: string
  totalRevenue: number
  totalCost: number
  profitMargin: number
}

export interface RevenueByProjectReport {
  items: RevenueByProjectItem[]
  totalRevenue: number
  totalCost: number
  averageMargin: number
  period: DateRange
}

interface JOProjectData {
  projectId: string
  projectName: string
  customerName: string
  revenue: number
  cost: number
}

/**
 * Calculate profit margin with zero-revenue handling
 * Returns 0 when revenue is zero
 */
export function calculateProfitMargin(revenue: number, cost: number): number {
  if (revenue === 0) return 0
  return ((revenue - cost) / revenue) * 100
}

/**
 * Aggregate revenue and cost by project from JO data
 */
export function aggregateRevenueByProject(joData: JOProjectData[]): Map<string, { projectName: string; customerName: string; totalRevenue: number; totalCost: number }> {
  const projectMap = new Map<string, { projectName: string; customerName: string; totalRevenue: number; totalCost: number }>()
  
  for (const jo of joData) {
    const existing = projectMap.get(jo.projectId)
    if (existing) {
      existing.totalRevenue += jo.revenue
      existing.totalCost += jo.cost
    } else {
      projectMap.set(jo.projectId, {
        projectName: jo.projectName,
        customerName: jo.customerName,
        totalRevenue: jo.revenue,
        totalCost: jo.cost,
      })
    }
  }
  
  return projectMap
}

/**
 * Build complete Revenue by Project report
 */
export function buildRevenueByProjectReport(
  joData: JOProjectData[],
  period: DateRange
): RevenueByProjectReport {
  const projectMap = aggregateRevenueByProject(joData)
  
  let items: RevenueByProjectItem[] = Array.from(projectMap.entries()).map(([projectId, data]) => ({
    projectId,
    projectName: data.projectName,
    customerName: data.customerName,
    totalRevenue: data.totalRevenue,
    totalCost: data.totalCost,
    profitMargin: calculateProfitMargin(data.totalRevenue, data.totalCost),
  }))
  
  // Filter out zero revenue projects
  items = items.filter(item => item.totalRevenue > 0)
  
  // Sort by revenue descending
  items.sort((a, b) => b.totalRevenue - a.totalRevenue)
  
  const totalRevenue = items.reduce((sum, item) => sum + item.totalRevenue, 0)
  const totalCost = items.reduce((sum, item) => sum + item.totalCost, 0)
  const averageMargin = calculateProfitMargin(totalRevenue, totalCost)
  
  return {
    items,
    totalRevenue,
    totalCost,
    averageMargin,
    period,
  }
}
