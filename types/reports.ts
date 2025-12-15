// Reports Module Types

import { UserRole } from './permissions'

// Period and Date Range Types
export type PeriodPreset =
  | 'this-week'
  | 'this-month'
  | 'last-month'
  | 'this-quarter'
  | 'last-quarter'
  | 'this-year'
  | 'custom'

export interface DateRange {
  startDate: Date
  endDate: Date
}

// Report Configuration Types
export type ReportCategory = 'financial' | 'operational' | 'ar' | 'sales'

export interface ReportConfig {
  id: string
  title: string
  description: string
  category: ReportCategory
  href: string
  icon: string
  allowedRoles: UserRole[]
  badge?: string
}

// P&L Report Types
export interface RevenueGroup {
  category: string
  amount: number
}

export interface CostGroup {
  category: string
  amount: number
}

export interface PLReportData {
  period: DateRange
  revenue: RevenueGroup[]
  costs: CostGroup[]
  totalRevenue: number
  totalCost: number
  grossProfit: number
  grossMargin: number
}

// Budget Variance Report Types
export interface BudgetVarianceItem {
  pjoId: string
  pjoNumber: string
  customerName: string
  estimatedTotal: number
  actualTotal: number
  varianceAmount: number
  variancePercentage: number | null // null when estimated is 0
  hasWarning: boolean
}

export interface BudgetVarianceReportData {
  period: DateRange
  items: BudgetVarianceItem[]
  summary: {
    totalEstimated: number
    totalActual: number
    totalVariance: number
    itemsWithWarning: number
  }
}

// AR Aging Report Types
export type AgingSeverity = 'normal' | 'warning' | 'critical'

export interface AgingBucket {
  label: string
  minDays: number
  maxDays: number | null // null for 90+
  count: number
  totalAmount: number
}

export interface AgingInvoice {
  invoiceId: string
  invoiceNumber: string
  customerName: string
  invoiceDate: Date
  dueDate: Date
  amount: number
  daysOverdue: number
  bucket: string
  severity: AgingSeverity
}

export interface ARAgingReportData {
  summary: AgingBucket[]
  details: AgingInvoice[]
  totals: {
    totalCount: number
    totalAmount: number
  }
}

// Quotation Conversion Report Types
export type PJOStatusForReport = 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'converted'

export interface StatusCount {
  status: PJOStatusForReport
  count: number
  percentage: number
}

export interface ConversionRate {
  from: string
  to: string
  rate: number
}

export interface PipelineMetric {
  stage: string
  averageDays: number
}

export interface QuotationConversionReportData {
  period: DateRange
  statusCounts: StatusCount[]
  conversionRates: ConversionRate[]
  pipelineMetrics: PipelineMetric[]
  totals: {
    totalPJOs: number
    overallConversionRate: number
  }
}

// Report Table Types
export interface ReportColumn<T> {
  key: keyof T | string
  header: string
  align?: 'left' | 'center' | 'right'
  format?: 'currency' | 'percentage' | 'number' | 'date' | 'text'
  width?: string
}

export type RowHighlight = 'warning' | 'critical' | null

// Report Summary Types
export interface SummaryItem {
  label: string
  value: string | number
  format?: 'currency' | 'percentage' | 'number'
  highlight?: 'positive' | 'negative' | 'neutral'
}

// Pagination Types
export interface PaginationState {
  currentPage: number
  pageSize: number
  totalItems: number
  totalPages: number
}

export function calculatePagination(totalItems: number, pageSize: number = 25): PaginationState {
  const totalPages = Math.ceil(totalItems / pageSize)
  return {
    currentPage: 1,
    pageSize,
    totalItems,
    totalPages: totalPages || 1,
  }
}

export function getPageItems<T>(items: T[], page: number, pageSize: number = 25): T[] {
  const startIndex = (page - 1) * pageSize
  return items.slice(startIndex, startIndex + pageSize)
}
