// Reports Module Types

import { UserRole } from './permissions'

// Database-driven Report Configuration Types
export type ReportCategoryDB = 'operations' | 'finance' | 'sales' | 'executive'

export interface ReportConfigurationDB {
  id: string
  report_code: string
  report_name: string
  description: string | null
  report_category: ReportCategoryDB
  default_filters: Record<string, unknown>
  columns: ReportColumnConfig[]
  allowed_roles: string[]
  is_active: boolean
  display_order: number
  href: string | null
  icon: string | null
  created_at: string
  updated_at: string
}

export interface ReportColumnConfig {
  key: string
  header: string
  format?: 'currency' | 'percentage' | 'number' | 'date' | 'text'
  align?: 'left' | 'center' | 'right'
  width?: string
}

export interface ReportExecution {
  id: string
  report_code: string
  parameters: Record<string, unknown>
  executed_by: string
  executed_at: string
  export_format: 'view' | 'pdf' | 'excel' | 'csv' | null
  export_url: string | null
}

export interface RecentReport {
  report_code: string
  report_name: string
  href: string
  executed_at: string
}

// Category display configuration
export const CATEGORY_CONFIG_DB: Record<ReportCategoryDB, { name: string; icon: string }> = {
  operations: { name: 'Operations', icon: 'Settings' },
  finance: { name: 'Finance', icon: 'DollarSign' },
  sales: { name: 'Sales', icon: 'TrendingUp' },
  executive: { name: 'Executive', icon: 'LayoutDashboard' },
}

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
