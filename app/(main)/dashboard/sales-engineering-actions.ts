'use server'

import { createClient } from '@/lib/supabase/server'
import {
  SalesPipelineSummary,
  EngineeringWorkloadSummary,
  QuotationListItem,
  SalesEngineeringDashboardData,
  transformSalesPipelineSummary,
  transformEngineeringWorkloadSummary,
  transformQuotationRow,
  isDashboardStale,
} from '@/lib/sales-engineering-dashboard-utils'

// Type definitions for the views (until database types are regenerated)
type SalesPipelineSummaryRow = {
  calculated_at: string | null
  draft_count: number | null
  draft_value: number | null
  eng_review_count: number | null
  eng_review_value: number | null
  lost_mtd: number | null
  lost_value_mtd: number | null
  pursuit_costs_mtd: number | null
  ready_count: number | null
  ready_value: number | null
  submitted_count: number | null
  submitted_value: number | null
  win_rate_90d: number | null
  won_mtd: number | null
  won_value_mtd: number | null
}

type EngineeringWorkloadSummaryRow = {
  calculated_at: string | null
  completed_mtd: number | null
  complex_in_pipeline: number | null
  pending_assessments: number | null
  pending_jmp: number | null
  pending_permit: number | null
  pending_surveys: number | null
  pending_technical: number | null
}

type QuotationDashboardListRow = {
  id: string
  quotation_number: string
  rfq_number: string | null
  customer_name: string
  cargo_description: string | null
  total_revenue: number | null
  gross_margin: number | null
  status: string | null
  engineering_status: string | null
  market_type: string | null
  submission_deadline: string | null
  days_to_deadline: number | null
  created_at: string | null
  updated_at: string | null
}

/**
 * Get complete sales/engineering dashboard data
 * Includes sales pipeline summary, engineering workload, urgent quotations, and recent quotations
 */
export async function getSalesEngineeringDashboardData(): Promise<SalesEngineeringDashboardData> {
  const supabase = await createClient()

  // Check staleness and refresh if needed
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: salesCheck } = await (supabase as any)
    .from('sales_pipeline_summary')
    .select('calculated_at')
    .single()

  if (!salesCheck || isDashboardStale(salesCheck.calculated_at)) {
    await refreshSalesEngineeringDashboard()
  }

  // Fetch all data in parallel
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabaseAny = supabase as any
  const [salesResult, engineeringResult, urgentResult, recentResult] = await Promise.all([
    supabaseAny.from('sales_pipeline_summary').select('*').single(),
    supabaseAny.from('engineering_workload_summary').select('*').single(),
    getUrgentQuotations(5),
    getRecentQuotations(10),
  ])

  // Transform sales summary
  const salesData = salesResult.data as SalesPipelineSummaryRow | null
  const salesSummary: SalesPipelineSummary = salesData
    ? transformSalesPipelineSummary(salesData)
    : {
        draftCount: 0,
        draftValue: 0,
        engReviewCount: 0,
        engReviewValue: 0,
        submittedCount: 0,
        submittedValue: 0,
        readyCount: 0,
        readyValue: 0,
        wonMTD: 0,
        wonValueMTD: 0,
        lostMTD: 0,
        lostValueMTD: 0,
        winRate90d: 0,
        pursuitCostsMTD: 0,
        calculatedAt: new Date().toISOString(),
      }

  // Transform engineering summary
  const engineeringData = engineeringResult.data as EngineeringWorkloadSummaryRow | null
  const engineeringSummary: EngineeringWorkloadSummary = engineeringData
    ? transformEngineeringWorkloadSummary(engineeringData)
    : {
        pendingAssessments: 0,
        pendingSurveys: 0,
        pendingTechnical: 0,
        pendingJMP: 0,
        pendingPermit: 0,
        completedMTD: 0,
        complexInPipeline: 0,
        calculatedAt: new Date().toISOString(),
      }

  // Check if data is stale
  const isStale = isDashboardStale(salesSummary.calculatedAt)

  return {
    salesSummary,
    engineeringSummary,
    urgentQuotations: urgentResult,
    recentQuotations: recentResult,
    isStale,
  }
}

/**
 * Refresh dashboard materialized views
 */
export async function refreshSalesEngineeringDashboard(): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).rpc('refresh_sales_engineering_dashboard')

  if (error) {
    console.error('Failed to refresh sales/engineering dashboard:', error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

/**
 * Get urgent quotations (deadline within N days)
 */
export async function getUrgentQuotations(maxDays: number = 7): Promise<QuotationListItem[]> {
  const supabase = await createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('quotation_dashboard_list')
    .select('*')
    .not('submission_deadline', 'is', null)
    .gte('days_to_deadline', 0)
    .lte('days_to_deadline', maxDays)
    .not('status', 'in', '("won","lost","cancelled")')
    .order('days_to_deadline', { ascending: true })
    .limit(maxDays === 7 ? 5 : 20)

  if (error) {
    console.error('Failed to fetch urgent quotations:', error)
    return []
  }

  return ((data || []) as QuotationDashboardListRow[]).map(transformQuotationRow)
}

/**
 * Get recent quotations for table display
 */
export async function getRecentQuotations(limit: number = 10): Promise<QuotationListItem[]> {
  const supabase = await createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('quotation_dashboard_list')
    .select('*')
    .not('status', 'in', '("won","lost","cancelled")')
    .order('updated_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Failed to fetch recent quotations:', error)
    return []
  }

  return ((data || []) as QuotationDashboardListRow[]).map(transformQuotationRow)
}

/**
 * Get all quotations for the full list view
 */
export async function getAllQuotations(): Promise<QuotationListItem[]> {
  const supabase = await createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('quotation_dashboard_list')
    .select('*')
    .order('updated_at', { ascending: false })

  if (error) {
    console.error('Failed to fetch all quotations:', error)
    return []
  }

  return ((data || []) as QuotationDashboardListRow[]).map(transformQuotationRow)
}

/**
 * Get pending engineering assessments
 */
export async function getPendingAssessments(limit: number = 5): Promise<{
  id: string
  assessmentType: string
  status: string
  quotationNumber: string | null
  cargoDescription: string | null
  createdAt: string
}[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('engineering_assessments')
    .select(`
      id,
      assessment_type,
      status,
      created_at,
      quotations(quotation_number, commodity)
    `)
    .in('status', ['pending', 'in_progress'])
    .order('created_at', { ascending: true })
    .limit(limit)

  if (error) {
    console.error('Failed to fetch pending assessments:', error)
    return []
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data || []).map((row: any) => ({
    id: row.id,
    assessmentType: row.assessment_type,
    status: row.status || 'pending',
    quotationNumber: row.quotations?.quotation_number || null,
    cargoDescription: row.quotations?.commodity || null,
    createdAt: row.created_at || new Date().toISOString(),
  }))
}
