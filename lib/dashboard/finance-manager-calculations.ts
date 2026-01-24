/**
 * Finance Manager Dashboard - Pure Calculation Functions
 * 
 * These functions are extracted from finance-manager-data.ts for testability.
 * They contain no database dependencies and can be tested with property-based tests.
 */

// =====================================================
// Types
// =====================================================

export interface InvoiceForCalculation {
  id: string
  total_amount: number
  amount_paid: number | null
  status: string
  paid_at: string | null
  due_date: string | null
  created_at?: string
}

export interface BKKRecordForCalculation {
  id: string
  amount: number
  workflow_status: string
  approved_at: string | null
  paid_at: string | null
  created_at: string
  is_active: boolean
}

export interface PJOForCalculation {
  id: string
  estimated_amount: number | null
  status: string
  is_active: boolean
  approved_at?: string | null
  rejected_at?: string | null
}

export interface RecordWithTimestamp {
  id: string
  timestamp: string
  [key: string]: unknown
}

export interface ApprovalQueueItem {
  count: number
  totalValue: number
}

export interface AgingBucket {
  count: number
  amount: number
  invoiceIds: string[]
}

export interface ARAgingData {
  current: AgingBucket
  days31to60: AgingBucket
  days61to90: AgingBucket
  over90: AgingBucket
}

// =====================================================
// Property 1: Revenue YTD Calculation
// =====================================================

/**
 * Calculate Revenue YTD as the sum of total_amount from paid invoices
 * where paid_at is within the current calendar year.
 * 
 * **Validates: Requirements 1.1**
 */
export function calculateRevenueYTD(
  invoices: InvoiceForCalculation[],
  currentDate: Date
): number {
  const startOfYear = new Date(currentDate.getFullYear(), 0, 1)
  const startOfNextYear = new Date(currentDate.getFullYear() + 1, 0, 1)

  return invoices
    .filter((inv) => {
      if (inv.status !== 'paid') return false
      if (!inv.paid_at) return false
      const paidDate = new Date(inv.paid_at)
      return paidDate >= startOfYear && paidDate < startOfNextYear
    })
    .reduce((sum, inv) => sum + (inv.total_amount || 0), 0)
}

// =====================================================
// Property 2: Expenses MTD Calculation
// =====================================================

/**
 * Calculate Expenses MTD as the sum of amount from BKK records
 * where workflow_status is 'approved' or 'paid' and the approval/payment
 * date falls within the current calendar month.
 * 
 * **Validates: Requirements 2.1**
 */
export function calculateExpensesMTD(
  bkkRecords: BKKRecordForCalculation[],
  currentDate: Date
): number {
  const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
  const startOfNextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)

  return bkkRecords
    .filter((bkk) => {
      if (!bkk.is_active) return false
      if (bkk.workflow_status !== 'approved' && bkk.workflow_status !== 'paid') return false
      
      // Check if approved_at or paid_at is within current month
      const approvedDate = bkk.approved_at ? new Date(bkk.approved_at) : null
      const paidDate = bkk.paid_at ? new Date(bkk.paid_at) : null
      
      const isApprovedInMonth = approvedDate && approvedDate >= startOfMonth && approvedDate < startOfNextMonth
      const isPaidInMonth = paidDate && paidDate >= startOfMonth && paidDate < startOfNextMonth
      
      return isApprovedInMonth || isPaidInMonth
    })
    .reduce((sum, bkk) => sum + (bkk.amount || 0), 0)
}

// =====================================================
// Property 3: Gross Profit Invariant
// =====================================================

/**
 * Calculate Gross Profit as Revenue minus Expenses.
 * 
 * **Validates: Requirements 3.1**
 */
export function calculateGrossProfit(revenue: number, expenses: number): number {
  return revenue - expenses
}

// =====================================================
// Property 4: AR Overdue Calculation
// =====================================================

/**
 * Calculate AR Overdue as the sum of outstanding amounts from invoices
 * where status is 'sent' or 'overdue' and due_date is more than 30 days
 * before the current date.
 * 
 * **Validates: Requirements 4.1**
 */
export function calculateAROverdue(
  invoices: InvoiceForCalculation[],
  currentDate: Date
): number {
  const thirtyDaysAgo = new Date(currentDate.getTime() - 30 * 24 * 60 * 60 * 1000)
  thirtyDaysAgo.setHours(0, 0, 0, 0)

  return invoices
    .filter((inv) => {
      if (inv.status !== 'sent' && inv.status !== 'overdue') return false
      if (!inv.due_date) return false
      const dueDate = new Date(inv.due_date)
      dueDate.setHours(0, 0, 0, 0)
      return dueDate < thirtyDaysAgo
    })
    .reduce((sum, inv) => {
      const outstanding = (inv.total_amount || 0) - (inv.amount_paid || 0)
      return sum + Math.max(0, outstanding)
    }, 0)
}

// =====================================================
// Property 5: AR Aging Bucket Assignment
// =====================================================

/**
 * Determine which aging bucket an invoice belongs to based on days overdue.
 * - current: 0-30 days (not overdue or up to 30 days overdue)
 * - days31to60: 31-60 days overdue
 * - days61to90: 61-90 days overdue
 * - over90: 90+ days overdue
 */
export function getAgingBucket(dueDate: string, currentDate: Date): keyof ARAgingData {
  const due = new Date(dueDate)
  due.setHours(0, 0, 0, 0)
  const current = new Date(currentDate)
  current.setHours(0, 0, 0, 0)

  const diffTime = current.getTime() - due.getTime()
  const daysOverdue = Math.floor(diffTime / (1000 * 60 * 60 * 24))

  if (daysOverdue <= 30) return 'current'
  if (daysOverdue <= 60) return 'days31to60'
  if (daysOverdue <= 90) return 'days61to90'
  return 'over90'
}

/**
 * Group invoices by aging bucket.
 * Each invoice is assigned to exactly one bucket.
 * The sum of counts across all buckets equals the total number of outstanding invoices.
 * 
 * **Validates: Requirements 5.2**
 */
export function groupInvoicesByAgingBucket(
  invoices: InvoiceForCalculation[],
  currentDate: Date
): ARAgingData {
  const result: ARAgingData = {
    current: { count: 0, amount: 0, invoiceIds: [] },
    days31to60: { count: 0, amount: 0, invoiceIds: [] },
    days61to90: { count: 0, amount: 0, invoiceIds: [] },
    over90: { count: 0, amount: 0, invoiceIds: [] },
  }

  // Filter to only outstanding invoices (sent or overdue status)
  const outstandingInvoices = invoices.filter(
    (inv) => inv.status === 'sent' || inv.status === 'overdue'
  )

  for (const invoice of outstandingInvoices) {
    if (!invoice.due_date) {
      // Invoices without due date go to current bucket
      result.current.count += 1
      result.current.amount += Math.max(0, (invoice.total_amount || 0) - (invoice.amount_paid || 0))
      result.current.invoiceIds.push(invoice.id)
      continue
    }

    const bucket = getAgingBucket(invoice.due_date, currentDate)
    const outstanding = Math.max(0, (invoice.total_amount || 0) - (invoice.amount_paid || 0))
    
    result[bucket].count += 1
    result[bucket].amount += outstanding
    result[bucket].invoiceIds.push(invoice.id)
  }

  return result
}

// =====================================================
// Property 6: AP Outstanding Calculation
// =====================================================

/**
 * Calculate AP Outstanding as the sum of amount from BKK records
 * where workflow_status is 'draft', 'pending_check', or 'pending_approval'
 * and is_active is true.
 * 
 * **Validates: Requirements 6.1**
 */
export function calculateAPOutstanding(bkkRecords: BKKRecordForCalculation[]): number {
  const pendingStatuses = ['draft', 'pending_check', 'pending_approval']
  
  return bkkRecords
    .filter((bkk) => bkk.is_active && pendingStatuses.includes(bkk.workflow_status))
    .reduce((sum, bkk) => sum + (bkk.amount || 0), 0)
}

// =====================================================
// Property 8: Approval Queue Count and Sum Accuracy
// =====================================================

/**
 * Calculate approval queue metrics (count and total value) for PJO records.
 * Count equals the number of records matching pending criteria.
 * Total value equals the sum of estimated_amount for those records.
 * 
 * **Validates: Requirements 8.2**
 */
export function calculatePJOApprovalQueue(pjos: PJOForCalculation[]): ApprovalQueueItem {
  const pendingPJOs = pjos.filter(
    (pjo) => pjo.is_active && pjo.status === 'pending_approval'
  )

  return {
    count: pendingPJOs.length,
    totalValue: pendingPJOs.reduce((sum, pjo) => sum + (pjo.estimated_amount || 0), 0),
  }
}

/**
 * Calculate approval queue metrics (count and total value) for BKK records.
 * Count equals the number of records matching pending criteria.
 * Total value equals the sum of amount for those records.
 * 
 * **Validates: Requirements 9.2**
 */
export function calculateBKKApprovalQueue(bkkRecords: BKKRecordForCalculation[]): ApprovalQueueItem {
  const pendingStatuses = ['pending_check', 'pending_approval']
  const pendingBKKs = bkkRecords.filter(
    (bkk) => bkk.is_active && pendingStatuses.includes(bkk.workflow_status)
  )

  return {
    count: pendingBKKs.length,
    totalValue: pendingBKKs.reduce((sum, bkk) => sum + (bkk.amount || 0), 0),
  }
}

// =====================================================
// Property 9: Recent Items Ordering and Limiting
// =====================================================

/**
 * Get recent items ordered by timestamp descending, limited to N items.
 * Returns at most N records, ordered by timestamp field in descending order.
 * If fewer than N records exist, all records are returned.
 * 
 * **Validates: Requirements 10.1, 11.1, 12.1**
 */
export function getRecentItems<T extends RecordWithTimestamp>(
  items: T[],
  timestampField: keyof T,
  limit: number
): T[] {
  return [...items]
    .sort((a, b) => {
      const dateA = new Date(a[timestampField] as string).getTime()
      const dateB = new Date(b[timestampField] as string).getTime()
      return dateB - dateA // Descending order (most recent first)
    })
    .slice(0, limit)
}

/**
 * Get recent invoices ordered by created_at descending, limited to N items.
 */
export function getRecentInvoices(
  invoices: InvoiceForCalculation[],
  limit: number
): InvoiceForCalculation[] {
  return [...invoices]
    .filter((inv) => inv.created_at)
    .sort((a, b) => {
      const dateA = new Date(a.created_at!).getTime()
      const dateB = new Date(b.created_at!).getTime()
      return dateB - dateA
    })
    .slice(0, limit)
}

/**
 * Get recent payments (paid invoices) ordered by paid_at descending, limited to N items.
 */
export function getRecentPayments(
  invoices: InvoiceForCalculation[],
  limit: number
): InvoiceForCalculation[] {
  return [...invoices]
    .filter((inv) => inv.status === 'paid' && inv.paid_at)
    .sort((a, b) => {
      const dateA = new Date(a.paid_at!).getTime()
      const dateB = new Date(b.paid_at!).getTime()
      return dateB - dateA
    })
    .slice(0, limit)
}

/**
 * Get recent PJO approvals ordered by decision timestamp descending, limited to N items.
 */
export function getRecentPJOApprovals(
  pjos: PJOForCalculation[],
  limit: number
): PJOForCalculation[] {
  return [...pjos]
    .filter((pjo) => pjo.is_active && (pjo.status === 'approved' || pjo.status === 'rejected'))
    .sort((a, b) => {
      const dateA = new Date(a.approved_at || a.rejected_at || '').getTime()
      const dateB = new Date(b.approved_at || b.rejected_at || '').getTime()
      return dateB - dateA
    })
    .slice(0, limit)
}
