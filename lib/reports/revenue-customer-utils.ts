// Revenue by Customer Report Utility Functions

import { DateRange } from '@/types/reports'

export interface RevenueByCustomerItem {
  customerId: string
  customerName: string
  totalRevenue: number
  joCount: number
  percentageOfTotal: number
}

export interface RevenueByCustomerReport {
  items: RevenueByCustomerItem[]
  totalRevenue: number
  customerCount: number
  period: DateRange
}

interface JORevenueData {
  customerId: string
  customerName: string
  revenue: number
}

/**
 * Aggregate revenue by customer from JO data
 */
export function aggregateRevenueByCustomer(joData: JORevenueData[]): Map<string, { customerName: string; totalRevenue: number; joCount: number }> {
  const customerMap = new Map<string, { customerName: string; totalRevenue: number; joCount: number }>()
  
  for (const jo of joData) {
    const existing = customerMap.get(jo.customerId)
    if (existing) {
      existing.totalRevenue += jo.revenue
      existing.joCount += 1
    } else {
      customerMap.set(jo.customerId, {
        customerName: jo.customerName,
        totalRevenue: jo.revenue,
        joCount: 1,
      })
    }
  }
  
  return customerMap
}

/**
 * Calculate percentage of total for each customer
 */
export function calculatePercentageOfTotal(
  items: { totalRevenue: number }[],
  totalRevenue: number
): number[] {
  if (totalRevenue === 0) {
    return items.map(() => 0)
  }
  return items.map(item => (item.totalRevenue / totalRevenue) * 100)
}

/**
 * Sort items by revenue in descending order
 */
export function sortByRevenueDescending<T extends { totalRevenue: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => b.totalRevenue - a.totalRevenue)
}

/**
 * Filter out customers with zero revenue
 */
export function filterZeroRevenue<T extends { totalRevenue: number }>(items: T[]): T[] {
  return items.filter(item => item.totalRevenue > 0)
}

/**
 * Build complete Revenue by Customer report
 */
export function buildRevenueByCustomerReport(
  joData: JORevenueData[],
  period: DateRange
): RevenueByCustomerReport {
  // Aggregate by customer
  const customerMap = aggregateRevenueByCustomer(joData)
  
  // Convert to array
  let items: RevenueByCustomerItem[] = Array.from(customerMap.entries()).map(([customerId, data]) => ({
    customerId,
    customerName: data.customerName,
    totalRevenue: data.totalRevenue,
    joCount: data.joCount,
    percentageOfTotal: 0, // Will be calculated below
  }))
  
  // Filter zero revenue
  items = filterZeroRevenue(items)
  
  // Sort by revenue descending
  items = sortByRevenueDescending(items)
  
  // Calculate total revenue
  const totalRevenue = items.reduce((sum, item) => sum + item.totalRevenue, 0)
  
  // Calculate percentages
  const percentages = calculatePercentageOfTotal(items, totalRevenue)
  items = items.map((item, index) => ({
    ...item,
    percentageOfTotal: percentages[index],
  }))
  
  return {
    items,
    totalRevenue,
    customerCount: items.length,
    period,
  }
}
