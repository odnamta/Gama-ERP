// JO Summary Report Utility Functions

import { DateRange } from '@/types/reports'

export type JOStatus = 'active' | 'completed' | 'submitted_to_finance' | 'invoiced' | 'closed'

export interface JOSummaryItem {
  joId: string
  joNumber: string
  customerName: string
  projectName: string
  status: JOStatus
  revenue: number
  cost: number
  margin: number
  completedDate?: Date
}

export interface JOSummaryReport {
  items: JOSummaryItem[]
  totalCount: number
  totalRevenue: number
  totalCost: number
  averageMargin: number
  statusBreakdown: { status: JOStatus; count: number }[]
  period: DateRange
}

/**
 * Calculate margin percentage
 */
export function calculateMargin(revenue: number, cost: number): number {
  if (revenue === 0) return 0
  return ((revenue - cost) / revenue) * 100
}

/**
 * Calculate summary totals from JO items
 */
export function calculateSummaryTotals(items: JOSummaryItem[]): { totalRevenue: number; totalCost: number; averageMargin: number } {
  const totalRevenue = items.reduce((sum, item) => sum + item.revenue, 0)
  const totalCost = items.reduce((sum, item) => sum + item.cost, 0)
  const averageMargin = calculateMargin(totalRevenue, totalCost)
  
  return { totalRevenue, totalCost, averageMargin }
}

/**
 * Filter JOs by status
 */
export function filterByStatus(items: JOSummaryItem[], status: JOStatus | 'all'): JOSummaryItem[] {
  if (status === 'all') return items
  return items.filter(item => item.status === status)
}

/**
 * Calculate status breakdown
 */
export function calculateStatusBreakdown(items: JOSummaryItem[]): { status: JOStatus; count: number }[] {
  const statusCounts = new Map<JOStatus, number>()
  
  for (const item of items) {
    statusCounts.set(item.status, (statusCounts.get(item.status) || 0) + 1)
  }
  
  return Array.from(statusCounts.entries()).map(([status, count]) => ({ status, count }))
}

/**
 * Build complete JO Summary report
 */
export function buildJOSummaryReport(items: JOSummaryItem[], period: DateRange): JOSummaryReport {
  const totals = calculateSummaryTotals(items)
  const statusBreakdown = calculateStatusBreakdown(items)
  
  return {
    items,
    totalCount: items.length,
    ...totals,
    statusBreakdown,
    period,
  }
}
