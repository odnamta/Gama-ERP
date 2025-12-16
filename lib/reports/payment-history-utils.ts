// Customer Payment History Report Utility Functions

import { DateRange } from '@/types/reports'

export interface CustomerPaymentItem {
  customerId: string
  customerName: string
  totalInvoiced: number
  totalPaid: number
  outstandingBalance: number
  averageDaysToPay: number | null
  isSlowPayer: boolean
}

export interface CustomerPaymentReport {
  items: CustomerPaymentItem[]
  totalInvoiced: number
  totalPaid: number
  totalOutstanding: number
  period: DateRange
}

interface PaymentData {
  customerId: string
  customerName: string
  invoiceAmount: number
  paidAmount: number
  daysToPay: number | null
}

const SLOW_PAYER_THRESHOLD_DAYS = 45

/**
 * Aggregate payments by customer
 */
export function aggregatePaymentsByCustomer(payments: PaymentData[]): Map<string, { customerName: string; totalInvoiced: number; totalPaid: number; daysToPay: number[] }> {
  const customerMap = new Map<string, { customerName: string; totalInvoiced: number; totalPaid: number; daysToPay: number[] }>()
  
  for (const payment of payments) {
    const existing = customerMap.get(payment.customerId)
    if (existing) {
      existing.totalInvoiced += payment.invoiceAmount
      existing.totalPaid += payment.paidAmount
      if (payment.daysToPay !== null) {
        existing.daysToPay.push(payment.daysToPay)
      }
    } else {
      customerMap.set(payment.customerId, {
        customerName: payment.customerName,
        totalInvoiced: payment.invoiceAmount,
        totalPaid: payment.paidAmount,
        daysToPay: payment.daysToPay !== null ? [payment.daysToPay] : [],
      })
    }
  }
  
  return customerMap
}

/**
 * Calculate average days to pay
 */
export function calculateAverageDaysToPay(daysToPay: number[]): number | null {
  if (daysToPay.length === 0) return null
  return daysToPay.reduce((sum, d) => sum + d, 0) / daysToPay.length
}

/**
 * Identify slow payers (average > 45 days)
 */
export function identifySlowPayers(averageDaysToPay: number | null): boolean {
  if (averageDaysToPay === null) return false
  return averageDaysToPay > SLOW_PAYER_THRESHOLD_DAYS
}

/**
 * Build complete Customer Payment History report
 */
export function buildCustomerPaymentReport(payments: PaymentData[], period: DateRange): CustomerPaymentReport {
  const customerMap = aggregatePaymentsByCustomer(payments)
  
  const items: CustomerPaymentItem[] = Array.from(customerMap.entries()).map(([customerId, data]) => {
    const averageDaysToPay = calculateAverageDaysToPay(data.daysToPay)
    return {
      customerId,
      customerName: data.customerName,
      totalInvoiced: data.totalInvoiced,
      totalPaid: data.totalPaid,
      outstandingBalance: data.totalInvoiced - data.totalPaid,
      averageDaysToPay,
      isSlowPayer: identifySlowPayers(averageDaysToPay),
    }
  })
  
  const totalInvoiced = items.reduce((sum, item) => sum + item.totalInvoiced, 0)
  const totalPaid = items.reduce((sum, item) => sum + item.totalPaid, 0)
  
  return {
    items,
    totalInvoiced,
    totalPaid,
    totalOutstanding: totalInvoiced - totalPaid,
    period,
  }
}
