// Customer Acquisition Report Utility Functions

import { DateRange } from '@/types/reports'

export interface CustomerAcquisitionItem {
  customerId: string
  customerName: string
  acquisitionDate: Date
  firstProject: string | null
  totalRevenueToDate: number
}

export interface CustomerAcquisitionReport {
  items: CustomerAcquisitionItem[]
  totalNewCustomers: number
  averageRevenuePerCustomer: number
  previousPeriodCount: number
  acquisitionTrend: number | null
  period: DateRange
}

interface CustomerData {
  customerId: string
  customerName: string
  createdAt: Date
  firstProjectName: string | null
  totalRevenue: number
}

/**
 * Filter customers by acquisition date within period
 */
export function getNewCustomers(customers: CustomerData[], period: DateRange): CustomerData[] {
  return customers.filter(customer => {
    const createdAt = new Date(customer.createdAt)
    return createdAt >= period.startDate && createdAt <= period.endDate
  })
}

/**
 * Calculate acquisition metrics
 */
export function calculateAcquisitionMetrics(items: CustomerAcquisitionItem[]): { totalNewCustomers: number; averageRevenuePerCustomer: number } {
  const totalNewCustomers = items.length
  const totalRevenue = items.reduce((sum, item) => sum + item.totalRevenueToDate, 0)
  const averageRevenuePerCustomer = totalNewCustomers > 0 ? totalRevenue / totalNewCustomers : 0
  
  return { totalNewCustomers, averageRevenuePerCustomer }
}

/**
 * Calculate acquisition trend (period-over-period change)
 */
export function calculateAcquisitionTrend(currentCount: number, previousCount: number): number | null {
  if (previousCount === 0) return null
  return ((currentCount - previousCount) / previousCount) * 100
}

/**
 * Build complete Customer Acquisition report
 */
export function buildCustomerAcquisitionReport(
  customers: CustomerData[],
  period: DateRange,
  previousPeriodCount: number = 0
): CustomerAcquisitionReport {
  const newCustomers = getNewCustomers(customers, period)
  
  const items: CustomerAcquisitionItem[] = newCustomers.map(customer => ({
    customerId: customer.customerId,
    customerName: customer.customerName,
    acquisitionDate: customer.createdAt,
    firstProject: customer.firstProjectName,
    totalRevenueToDate: customer.totalRevenue,
  }))
  
  // Sort by acquisition date descending
  items.sort((a, b) => new Date(b.acquisitionDate).getTime() - new Date(a.acquisitionDate).getTime())
  
  const metrics = calculateAcquisitionMetrics(items)
  const acquisitionTrend = calculateAcquisitionTrend(metrics.totalNewCustomers, previousPeriodCount)
  
  return {
    items,
    ...metrics,
    previousPeriodCount,
    acquisitionTrend,
    period,
  }
}
