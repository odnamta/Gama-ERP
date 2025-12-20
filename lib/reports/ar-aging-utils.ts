// AR Aging Report Utility Functions

import { AgingBucket, AgingInvoice, ARAgingReportData, AgingSeverity } from '@/types/reports'
import { differenceInDays } from 'date-fns'

// Aging bucket definitions
export const AGING_BUCKETS = [
  { label: 'Current', minDays: -Infinity, maxDays: 0 },
  { label: '1-30 Days', minDays: 1, maxDays: 30 },
  { label: '31-60 Days', minDays: 31, maxDays: 60 },
  { label: '61-90 Days', minDays: 61, maxDays: 90 },
  { label: '90+ Days', minDays: 91, maxDays: null },
]

export interface InvoiceData {
  id: string
  invoice_number: string
  invoice_date: string
  due_date: string
  total_amount: number
  amount_due?: number
  customer_id?: string
  customers: { id?: string; name: string } | null
}

export interface CustomerAgingData {
  customerId: string
  customerName: string
  current: number
  days1to30: number
  days31to60: number
  days61to90: number
  over90: number
  total: number
}

export interface AgingFilters {
  asOfDate?: Date
  customerId?: string
}

/**
 * Calculate days outstanding from due date to as-of date
 * Returns positive if overdue, zero or negative if not yet due
 */
export function calculateDaysOutstanding(dueDate: Date, asOfDate: Date = new Date()): number {
  return differenceInDays(asOfDate, dueDate)
}

/**
 * Calculate days overdue from due date (legacy - returns 0 if not overdue)
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

/**
 * Aggregate invoices by customer for customer-level aging view
 */
export function aggregateByCustomer(invoices: AgingInvoice[]): CustomerAgingData[] {
  const customerMap = new Map<string, CustomerAgingData>()
  
  for (const invoice of invoices) {
    const customerId = invoice.invoiceId.split('-')[0] // Use first part as customer proxy if no explicit ID
    const customerName = invoice.customerName
    
    if (!customerMap.has(customerName)) {
      customerMap.set(customerName, {
        customerId,
        customerName,
        current: 0,
        days1to30: 0,
        days31to60: 0,
        days61to90: 0,
        over90: 0,
        total: 0,
      })
    }
    
    const customer = customerMap.get(customerName)!
    customer.total += invoice.amount
    
    switch (invoice.bucket) {
      case 'Current':
        customer.current += invoice.amount
        break
      case '1-30 Days':
        customer.days1to30 += invoice.amount
        break
      case '31-60 Days':
        customer.days31to60 += invoice.amount
        break
      case '61-90 Days':
        customer.days61to90 += invoice.amount
        break
      case '90+ Days':
        customer.over90 += invoice.amount
        break
    }
  }
  
  return Array.from(customerMap.values())
}

/**
 * Validate aging filters
 */
export function validateAgingFilters(filters: AgingFilters): { valid: boolean; error?: string } {
  if (filters.asOfDate) {
    const asOf = new Date(filters.asOfDate)
    if (isNaN(asOf.getTime())) {
      return { valid: false, error: 'Invalid as-of date' }
    }
  }
  
  if (filters.customerId !== undefined && filters.customerId !== null) {
    if (typeof filters.customerId !== 'string' || filters.customerId.trim() === '') {
      return { valid: false, error: 'Customer ID must be a non-empty string' }
    }
  }
  
  return { valid: true }
}

/**
 * Filter invoices by customer ID
 */
export function filterByCustomer(invoices: AgingInvoice[], customerId: string): AgingInvoice[] {
  // Since AgingInvoice doesn't have customerId, we filter by customerName
  // In real usage, you'd match against the actual customer ID from the source data
  return invoices.filter((inv) => inv.customerName === customerId || inv.invoiceId.includes(customerId))
}

/**
 * Filter invoices to only include those with amount due > 0
 */
export function filterUnpaidInvoices(invoices: InvoiceData[]): InvoiceData[] {
  return invoices.filter((inv) => {
    const amountDue = inv.amount_due ?? inv.total_amount
    return amountDue > 0
  })
}
