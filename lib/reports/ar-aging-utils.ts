// AR Aging Report Utility Functions

import { AgingBucket, AgingInvoice, ARAgingReportData, AgingSeverity } from '@/types/reports'
import { differenceInDays } from 'date-fns'

// Aging bucket definitions
const AGING_BUCKETS = [
  { label: 'Current', minDays: -Infinity, maxDays: 0 },
  { label: '1-30 Days', minDays: 1, maxDays: 30 },
  { label: '31-60 Days', minDays: 31, maxDays: 60 },
  { label: '61-90 Days', minDays: 61, maxDays: 90 },
  { label: '90+ Days', minDays: 91, maxDays: null },
]

interface InvoiceData {
  id: string
  invoice_number: string
  invoice_date: string
  due_date: string
  total_amount: number
  customers: { name: string } | null
}

/**
 * Calculate days overdue from due date
 */
export function calculateDaysOverdue(dueDate: Date, today: Date = new Date()): number {
  const days = differenceInDays(today, dueDate)
  return Math.max(0, days) // Return 0 if not overdue
}

/**
 * Assign invoice to an aging bucket based on days overdue
 */
export function assignAgingBucket(daysOverdue: number): string {
  for (const bucket of AGING_BUCKETS) {
    const minMatch = daysOverdue >= bucket.minDays
    const maxMatch = bucket.maxDays === null || daysOverdue <= bucket.maxDays
    
    if (minMatch && maxMatch) {
      return bucket.label
    }
  }
  return 'Current'
}

/**
 * Determine severity based on days overdue
 */
export function determineSeverity(daysOverdue: number): AgingSeverity {
  if (daysOverdue >= 90) return 'critical'
  if (daysOverdue >= 31) return 'warning'
  return 'normal'
}

/**
 * Aggregate invoices by bucket
 */
export function aggregateByBucket(invoices: AgingInvoice[]): AgingBucket[] {
  const bucketMap = new Map<string, { count: number; totalAmount: number }>()
  
  // Initialize all buckets
  for (const bucket of AGING_BUCKETS) {
    bucketMap.set(bucket.label, { count: 0, totalAmount: 0 })
  }
  
  // Aggregate invoices
  for (const invoice of invoices) {
    const existing = bucketMap.get(invoice.bucket)
    if (existing) {
      existing.count++
      existing.totalAmount += invoice.amount
    }
  }
  
  // Convert to array
  return AGING_BUCKETS.map((bucket) => {
    const data = bucketMap.get(bucket.label) || { count: 0, totalAmount: 0 }
    return {
      label: bucket.label,
      minDays: bucket.minDays === -Infinity ? 0 : bucket.minDays,
      maxDays: bucket.maxDays,
      count: data.count,
      totalAmount: data.totalAmount,
    }
  })
}

/**
 * Transform invoice data to aging invoices
 */
export function transformInvoicesToAgingItems(
  invoices: InvoiceData[],
  today: Date = new Date()
): AgingInvoice[] {
  return invoices.map((invoice) => {
    const dueDate = new Date(invoice.due_date)
    const daysOverdue = calculateDaysOverdue(dueDate, today)
    
    return {
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoice_number,
      customerName: invoice.customers?.name ?? 'Unknown',
      invoiceDate: new Date(invoice.invoice_date),
      dueDate,
      amount: invoice.total_amount,
      daysOverdue,
      bucket: assignAgingBucket(daysOverdue),
      severity: determineSeverity(daysOverdue),
    }
  })
}

/**
 * Build complete AR aging report data
 */
export function buildARAgingReportData(
  invoices: InvoiceData[],
  today: Date = new Date()
): ARAgingReportData {
  const details = transformInvoicesToAgingItems(invoices, today)
  
  // Sort by days overdue descending
  details.sort((a, b) => b.daysOverdue - a.daysOverdue)
  
  const summary = aggregateByBucket(details)
  
  return {
    summary,
    details,
    totals: {
      totalCount: details.length,
      totalAmount: details.reduce((sum, inv) => sum + inv.amount, 0),
    },
  }
}

/**
 * Filter invoices by bucket
 */
export function filterByBucket(invoices: AgingInvoice[], bucketLabel: string): AgingInvoice[] {
  return invoices.filter((inv) => inv.bucket === bucketLabel)
}
