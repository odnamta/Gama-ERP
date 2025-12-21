/**
 * Sales/Engineering Dashboard Utility Functions
 * Provides calculations for pipeline metrics, engineering workload, and quotation tracking
 * for the combined sales/engineering dashboard (v0.9.9)
 */

// =====================================================
// Types
// =====================================================

export type QuotationStatus = 'draft' | 'engineering_review' | 'ready' | 'submitted' | 'won' | 'lost' | 'cancelled'
export type EngineeringStatusType = 'not_required' | 'pending' | 'in_progress' | 'completed'
export type DashboardTab = 'sales' | 'engineering' | 'combined'

export interface SalesPipelineSummary {
  draftCount: number
  draftValue: number
  engReviewCount: number
  engReviewValue: number
  submittedCount: number
  submittedValue: number
  readyCount: number
  readyValue: number
  wonMTD: number
  wonValueMTD: number
  lostMTD: number
  lostValueMTD: number
  winRate90d: number
  pursuitCostsMTD: number
  calculatedAt: string
}

export interface EngineeringWorkloadSummary {
  pendingAssessments: number
  pendingSurveys: number
  pendingTechnical: number
  pendingJMP: number
  pendingPermit: number
  completedMTD: number
  complexInPipeline: number
  calculatedAt: string
}

export interface QuotationListItem {
  id: string
  quotationNumber: string
  rfqNumber: string | null
  customerName: string
  cargoDescription: string | null
  totalRevenue: number
  grossMargin: number | null
  status: QuotationStatus
  marketType: 'simple' | 'complex'
  submissionDeadline: string | null
  createdAt: string
  updatedAt: string
  engineeringStatus: EngineeringStatusType
  daysToDeadline: number | null
}

export interface PipelineFunnelItem {
  stage: string
  label: string
  count: number
  value: number
  colorClass: string
}

export interface AssessmentTypeGroup {
  type: string
  label: string
  count: number
  maxCount: number
}

export interface EngineeringStatusDisplay {
  icon: string
  label: string
  colorClass: string
}

export interface SalesEngineeringDashboardData {
  salesSummary: SalesPipelineSummary
  engineeringSummary: EngineeringWorkloadSummary
  urgentQuotations: QuotationListItem[]
  recentQuotations: QuotationListItem[]
  isStale: boolean
}

// =====================================================
// Constants
// =====================================================

export const STALENESS_THRESHOLD_MS = 5 * 60 * 1000 // 5 minutes
export const URGENT_DEADLINE_DAYS = 7
export const CRITICAL_DEADLINE_DAYS = 3

// =====================================================
// Pipeline Calculations
// =====================================================

/**
 * Calculate total pipeline value (draft + eng_review + ready + submitted)
 * Property 1: Pipeline Value Calculation
 */
export function calculateTotalPipelineValue(summary: SalesPipelineSummary): number {
  return (
    Number(summary.draftValue) +
    Number(summary.engReviewValue) +
    Number(summary.readyValue) +
    Number(summary.submittedValue)
  )
}

/**
 * Calculate total pipeline count
 * Property 1: Pipeline Count Calculation
 */
export function calculateTotalPipelineCount(summary: SalesPipelineSummary): number {
  return (
    summary.draftCount +
    summary.engReviewCount +
    summary.readyCount +
    summary.submittedCount
  )
}

/**
 * Calculate win rate from won and lost counts
 * Property 6: Win Rate Calculation
 */
export function calculateWinRate(won: number, lost: number): number {
  const total = won + lost
  if (total === 0) return 0
  return (won / total) * 100
}

/**
 * Format pipeline data for funnel chart
 * Property 8: Pipeline Funnel Data
 */
export function formatPipelineFunnelData(summary: SalesPipelineSummary): PipelineFunnelItem[] {
  return [
    {
      stage: 'draft',
      label: 'Draft',
      count: summary.draftCount,
      value: Number(summary.draftValue),
      colorClass: 'bg-slate-400',
    },
    {
      stage: 'eng_review',
      label: 'Engineering Review',
      count: summary.engReviewCount,
      value: Number(summary.engReviewValue),
      colorClass: 'bg-amber-500',
    },
    {
      stage: 'ready',
      label: 'Ready',
      count: summary.readyCount,
      value: Number(summary.readyValue),
      colorClass: 'bg-blue-500',
    },
    {
      stage: 'submitted',
      label: 'Submitted',
      count: summary.submittedCount,
      value: Number(summary.submittedValue),
      colorClass: 'bg-green-500',
    },
  ]
}

// =====================================================
// Deadline Detection
// =====================================================

/**
 * Check if quotation deadline is urgent (≤7 days)
 * Property 2: Urgent Deadline Detection
 */
export function isDeadlineUrgent(daysToDeadline: number | null): boolean {
  if (daysToDeadline === null) return false
  return daysToDeadline >= 0 && daysToDeadline <= URGENT_DEADLINE_DAYS
}

/**
 * Check if quotation deadline is critical (≤3 days)
 * Property 3: Critical Deadline Detection
 */
export function isDeadlineCritical(daysToDeadline: number | null): boolean {
  if (daysToDeadline === null) return false
  return daysToDeadline >= 0 && daysToDeadline <= CRITICAL_DEADLINE_DAYS
}

/**
 * Filter quotations with upcoming deadlines
 * Property 4: Urgent Quotations Filter
 */
export function filterUrgentQuotations(
  quotations: QuotationListItem[],
  maxDays: number = URGENT_DEADLINE_DAYS
): QuotationListItem[] {
  return quotations.filter((q) => {
    if (q.daysToDeadline === null) return false
    return q.daysToDeadline >= 0 && q.daysToDeadline <= maxDays
  })
}

/**
 * Sort quotations by deadline urgency (ascending, nulls last)
 * Property 10: Quotation Sorting
 */
export function sortByDeadlineUrgency(quotations: QuotationListItem[]): QuotationListItem[] {
  return [...quotations].sort((a, b) => {
    // Nulls go last
    if (a.daysToDeadline === null && b.daysToDeadline === null) return 0
    if (a.daysToDeadline === null) return 1
    if (b.daysToDeadline === null) return -1
    // Sort by days ascending (most urgent first)
    return a.daysToDeadline - b.daysToDeadline
  })
}

// =====================================================
// Engineering Status
// =====================================================

/**
 * Get engineering status display info (icon, label, color)
 * Property 5: Engineering Status Display
 */
export function getEngineeringStatusDisplay(status: EngineeringStatusType | string): EngineeringStatusDisplay {
  switch (status) {
    case 'completed':
      return { icon: '✅', label: 'Completed', colorClass: 'text-green-600' }
    case 'in_progress':
      return { icon: '🔄', label: 'In Progress', colorClass: 'text-blue-600' }
    case 'pending':
      return { icon: '⏳', label: 'Pending', colorClass: 'text-amber-600' }
    case 'not_required':
    default:
      return { icon: 'N/A', label: 'Not Required', colorClass: 'text-gray-400' }
  }
}

/**
 * Group assessments by type for workload display
 * Property 9: Assessment Type Grouping
 */
export function groupAssessmentsByType(summary: EngineeringWorkloadSummary): AssessmentTypeGroup[] {
  const maxCount = Math.max(
    summary.pendingSurveys,
    summary.pendingTechnical,
    summary.pendingJMP,
    summary.pendingPermit,
    1 // Prevent division by zero
  )

  return [
    {
      type: 'route_survey',
      label: 'Surveys',
      count: summary.pendingSurveys,
      maxCount,
    },
    {
      type: 'technical_review',
      label: 'Technical',
      count: summary.pendingTechnical,
      maxCount,
    },
    {
      type: 'jmp_creation',
      label: 'JMP',
      count: summary.pendingJMP,
      maxCount,
    },
    {
      type: 'permit_check',
      label: 'Permits',
      count: summary.pendingPermit,
      maxCount,
    },
  ]
}

// =====================================================
// Staleness Detection
// =====================================================

/**
 * Check if dashboard data is stale (>5 minutes old)
 * Property 7: Staleness Detection
 */
export function isDashboardStale(calculatedAt: string, currentDate: Date = new Date()): boolean {
  const calculated = new Date(calculatedAt)
  const diffMs = currentDate.getTime() - calculated.getTime()
  return diffMs > STALENESS_THRESHOLD_MS
}

/**
 * Get time since last update in human-readable format
 */
export function getTimeSinceUpdate(calculatedAt: string): string {
  const calculated = new Date(calculatedAt)
  const now = new Date()
  const diffMs = now.getTime() - calculated.getTime()

  const minutes = Math.floor(diffMs / (1000 * 60))
  if (minutes < 1) return 'Just now'
  if (minutes === 1) return '1 minute ago'
  if (minutes < 60) return `${minutes} minutes ago`

  const hours = Math.floor(minutes / 60)
  if (hours === 1) return '1 hour ago'
  return `${hours} hours ago`
}

// =====================================================
// Formatting Utilities
// =====================================================

/**
 * Format currency for display (Indonesian Rupiah)
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

/**
 * Format currency in compact form (e.g., 450M, 1.2B)
 */
export function formatCurrencyCompact(amount: number): string {
  if (amount >= 1_000_000_000) {
    return `Rp ${(amount / 1_000_000_000).toFixed(1)}B`
  }
  if (amount >= 1_000_000) {
    return `Rp ${(amount / 1_000_000).toFixed(0)}M`
  }
  if (amount >= 1_000) {
    return `Rp ${(amount / 1_000).toFixed(0)}K`
  }
  return `Rp ${amount}`
}

/**
 * Format percentage for display
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`
}

/**
 * Format margin percentage
 */
export function formatMargin(margin: number | null): string {
  if (margin === null) return '-'
  return `${margin.toFixed(1)}%`
}

/**
 * Get greeting based on time of day
 */
export function getTimeBasedGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

/**
 * Format days to deadline for display
 */
export function formatDaysToDeadline(days: number | null): string {
  if (days === null) return 'No deadline'
  if (days < 0) return 'Overdue'
  if (days === 0) return 'Due today'
  if (days === 1) return '1 day left'
  return `${days} days left`
}

/**
 * Get deadline urgency class for styling
 */
export function getDeadlineUrgencyClass(days: number | null): string {
  if (days === null) return 'text-gray-500'
  if (days < 0) return 'text-red-600 font-semibold'
  if (days <= CRITICAL_DEADLINE_DAYS) return 'text-red-600 font-semibold'
  if (days <= URGENT_DEADLINE_DAYS) return 'text-amber-600'
  return 'text-gray-600'
}

// =====================================================
// Data Transformation
// =====================================================

/**
 * Transform raw database row to QuotationListItem
 */
export function transformQuotationRow(row: {
  id: string
  quotation_number: string
  rfq_number: string | null
  customer_name: string | null
  cargo_description: string | null
  total_revenue: number | string | null
  gross_margin: number | string | null
  status: string | null
  market_type: string | null
  submission_deadline: string | null
  created_at: string | null
  updated_at: string | null
  engineering_status: string | null
  days_to_deadline: number | null
}): QuotationListItem {
  return {
    id: row.id,
    quotationNumber: row.quotation_number,
    rfqNumber: row.rfq_number,
    customerName: row.customer_name || 'Unknown',
    cargoDescription: row.cargo_description,
    totalRevenue: Number(row.total_revenue || 0),
    grossMargin: row.gross_margin !== null ? Number(row.gross_margin) : null,
    status: (row.status || 'draft') as QuotationStatus,
    marketType: (row.market_type || 'simple') as 'simple' | 'complex',
    submissionDeadline: row.submission_deadline,
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
    engineeringStatus: (row.engineering_status || 'not_required') as EngineeringStatusType,
    daysToDeadline: row.days_to_deadline,
  }
}

/**
 * Transform raw database row to SalesPipelineSummary
 */
export function transformSalesPipelineSummary(row: {
  draft_count: number | null
  draft_value: number | string | null
  eng_review_count: number | null
  eng_review_value: number | string | null
  submitted_count: number | null
  submitted_value: number | string | null
  ready_count: number | null
  ready_value: number | string | null
  won_mtd: number | null
  won_value_mtd: number | string | null
  lost_mtd: number | null
  lost_value_mtd: number | string | null
  win_rate_90d: number | string | null
  pursuit_costs_mtd: number | string | null
  calculated_at: string | null
}): SalesPipelineSummary {
  return {
    draftCount: row.draft_count || 0,
    draftValue: Number(row.draft_value || 0),
    engReviewCount: row.eng_review_count || 0,
    engReviewValue: Number(row.eng_review_value || 0),
    submittedCount: row.submitted_count || 0,
    submittedValue: Number(row.submitted_value || 0),
    readyCount: row.ready_count || 0,
    readyValue: Number(row.ready_value || 0),
    wonMTD: row.won_mtd || 0,
    wonValueMTD: Number(row.won_value_mtd || 0),
    lostMTD: row.lost_mtd || 0,
    lostValueMTD: Number(row.lost_value_mtd || 0),
    winRate90d: Number(row.win_rate_90d || 0),
    pursuitCostsMTD: Number(row.pursuit_costs_mtd || 0),
    calculatedAt: row.calculated_at || new Date().toISOString(),
  }
}

/**
 * Transform raw database row to EngineeringWorkloadSummary
 */
export function transformEngineeringWorkloadSummary(row: {
  pending_assessments: number | null
  pending_surveys: number | null
  pending_technical: number | null
  pending_jmp: number | null
  pending_permit: number | null
  completed_mtd: number | null
  complex_in_pipeline: number | null
  calculated_at: string | null
}): EngineeringWorkloadSummary {
  return {
    pendingAssessments: row.pending_assessments || 0,
    pendingSurveys: row.pending_surveys || 0,
    pendingTechnical: row.pending_technical || 0,
    pendingJMP: row.pending_jmp || 0,
    pendingPermit: row.pending_permit || 0,
    completedMTD: row.completed_mtd || 0,
    complexInPipeline: row.complex_in_pipeline || 0,
    calculatedAt: row.calculated_at || new Date().toISOString(),
  }
}
