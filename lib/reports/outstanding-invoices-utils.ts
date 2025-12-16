// Outstanding Invoices Report Utility Functions

// Outstanding Invoices types are self-contained

export interface OutstandingInvoiceItem {
  invoiceId: string
  invoiceNumber: string
  customerName: string
  joNumber: string
  invoiceDate: Date
  dueDate: Date
  amount: number
  daysOutstanding: number
  agingBucket: string
}

export interface OutstandingInvoicesReport {
  items: OutstandingInvoiceItem[]
  totalCount: number
  totalAmount: number
  bucketBreakdown: { bucket: string; count: number; amount: number }[]
}

const AGING_BUCKETS = [
  { label: 'Current', minDays: -Infinity, maxDays: 0 },
  { label: '1-30 Days', minDays: 1, maxDays: 30 },
  { label: '31-60 Days', minDays: 31, maxDays: 60 },
  { label: '61-90 Days', minDays: 61, maxDays: 90 },
  { label: '90+ Days', minDays: 91, maxDays: Infinity },
]

/**
 * Calculate days outstanding from due date
 */
export function calculateDaysOutstanding(dueDate: Date, referenceDate: Date = new Date()): number {
  const due = new Date(dueDate).setHours(0, 0, 0, 0)
  const ref = new Date(referenceDate).setHours(0, 0, 0, 0)
  const diffMs = ref - due
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24))
}

/**
 * Determine aging bucket for an invoice
 */
export function getAgingBucket(daysOutstanding: number): string {
  for (const bucket of AGING_BUCKETS) {
    if (daysOutstanding >= bucket.minDays && daysOutstanding <= bucket.maxDays) {
      return bucket.label
    }
  }
  return '90+ Days'
}

/**
 * Group invoices by aging bucket
 */
export function groupByAgingBucket(items: OutstandingInvoiceItem[]): { bucket: string; count: number; amount: number }[] {
  const bucketMap = new Map<string, { count: number; amount: number }>()
  
  // Initialize all buckets
  for (const bucket of AGING_BUCKETS) {
    bucketMap.set(bucket.label, { count: 0, amount: 0 })
  }
  
  for (const item of items) {
    const bucket = bucketMap.get(item.agingBucket)
    if (bucket) {
      bucket.count += 1
      bucket.amount += item.amount
    }
  }
  
  return AGING_BUCKETS.map(b => ({
    bucket: b.label,
    ...bucketMap.get(b.label)!,
  }))
}

/**
 * Filter invoices by customer
 */
export function filterByCustomer(items: OutstandingInvoiceItem[], customerId: string | null): OutstandingInvoiceItem[] {
  if (!customerId) return items
  return items.filter(item => item.invoiceId.includes(customerId)) // Simplified - in real app would use customer ID
}

/**
 * Build complete Outstanding Invoices report
 */
export function buildOutstandingInvoicesReport(items: OutstandingInvoiceItem[]): OutstandingInvoicesReport {
  const bucketBreakdown = groupByAgingBucket(items)
  
  return {
    items,
    totalCount: items.length,
    totalAmount: items.reduce((sum, item) => sum + item.amount, 0),
    bucketBreakdown,
  }
}
