'use server'

import { createClient } from '@/lib/supabase/server'
import { Tables } from '@/types/database'
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

// Use database types for views
type SalesPipelineSummaryRow = Tables<'sales_pipeline_summary'>
type EngineeringWorkloadSummaryRow = Tables<'engineering_workload_summary'>
type QuotationDashboardListRow = Tables<'quotation_dashboard_list'>

/**
 * Get complete sales/engineering dashboard data
 * Includes sales pipeline summary, engineering workload, urgent quotations, and recent quotations
 */
export async function getSalesEngineeringDashboardData(): Promise<SalesEngineeringDashboardData> {
  const supabase = await createClient()

  // Check staleness and refresh if needed
  const { data: salesCheck } = await supabase
    .from('sales_pipeline_summary')
    .select('calculated_at')
    .single()

  if (!salesCheck || isDashboardStale(salesCheck.calculated_at || '')) {
    await refreshSalesEngineeringDashboard()
  }

  // Fetch all data in parallel
  const [salesResult, engineeringResult, urgentResult, recentResult] = await Promise.all([
    supabase.from('sales_pipeline_summary').select('*').single(),
    supabase.from('engineering_workload_summary').select('*').single(),
    getUrgentQuotations(5),
    getRecentQuotations(10),
  ])

  // Transform sales summary
  const salesData = salesResult.data as SalesPipelineSummaryRow | null
  const salesSummary: SalesPipelineSummary = salesData
    ? transformSalesPipelineSummary({
        draft_count: salesData.draft_count,
        draft_value: salesData.draft_value,
        eng_review_count: salesData.eng_review_count,
        eng_review_value: salesData.eng_review_value,
        submitted_count: salesData.submitted_count,
        submitted_value: salesData.submitted_value,
        ready_count: salesData.ready_count,
        ready_value: salesData.ready_value,
        won_mtd: salesData.won_mtd,
        won_value_mtd: salesData.won_value_mtd,
        lost_mtd: salesData.lost_mtd,
        lost_value_mtd: salesData.lost_value_mtd,
        win_rate_90d: salesData.win_rate_90d,
        pursuit_costs_mtd: salesData.pursuit_costs_mtd,
        calculated_at: salesData.calculated_at,
      })
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
    ? transformEngineeringWorkloadSummary({
        pending_assessments: engineeringData.pending_assessments,
        pending_surveys: engineeringData.pending_surveys,
        pending_technical: engineeringData.pending_technical,
        pending_jmp: engineeringData.pending_jmp,
        pending_permit: engineeringData.pending_permit,
        completed_mtd: engineeringData.completed_mtd,
        complex_in_pipeline: engineeringData.complex_in_pipeline,
        calculated_at: engineeringData.calculated_at,
      })
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

  const { error } = await supabase.rpc('refresh_sales_engineering_dashboard')

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

  const { data, error } = await supabase
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

  return ((data || []) as QuotationDashboardListRow[]).map((row) => transformQuotationRow({
    id: row.id || '',
    quotation_number: row.quotation_number || '',
    rfq_number: row.rfq_number,
    customer_name: row.customer_name,
    cargo_description: row.cargo_description,
    total_revenue: row.total_revenue,
    gross_margin: row.gross_margin,
    status: row.status,
    market_type: row.market_type,
    submission_deadline: row.submission_deadline,
    created_at: row.created_at,
    updated_at: row.updated_at,
    engineering_status: row.engineering_status,
    days_to_deadline: row.days_to_deadline,
  }))
}

/**
 * Get recent quotations for table display
 */
export async function getRecentQuotations(limit: number = 10): Promise<QuotationListItem[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('quotation_dashboard_list')
    .select('*')
    .not('status', 'in', '("won","lost","cancelled")')
    .order('updated_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Failed to fetch recent quotations:', error)
    return []
  }

  return ((data || []) as QuotationDashboardListRow[]).map((row) => transformQuotationRow({
    id: row.id || '',
    quotation_number: row.quotation_number || '',
    rfq_number: row.rfq_number,
    customer_name: row.customer_name,
    cargo_description: row.cargo_description,
    total_revenue: row.total_revenue,
    gross_margin: row.gross_margin,
    status: row.status,
    market_type: row.market_type,
    submission_deadline: row.submission_deadline,
    created_at: row.created_at,
    updated_at: row.updated_at,
    engineering_status: row.engineering_status,
    days_to_deadline: row.days_to_deadline,
  }))
}

/**
 * Get all quotations for the full list view
 */
export async function getAllQuotations(): Promise<QuotationListItem[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('quotation_dashboard_list')
    .select('*')
    .order('updated_at', { ascending: false })

  if (error) {
    console.error('Failed to fetch all quotations:', error)
    return []
  }

  return ((data || []) as QuotationDashboardListRow[]).map((row) => transformQuotationRow({
    id: row.id || '',
    quotation_number: row.quotation_number || '',
    rfq_number: row.rfq_number,
    customer_name: row.customer_name,
    cargo_description: row.cargo_description,
    total_revenue: row.total_revenue,
    gross_margin: row.gross_margin,
    status: row.status,
    market_type: row.market_type,
    submission_deadline: row.submission_deadline,
    created_at: row.created_at,
    updated_at: row.updated_at,
    engineering_status: row.engineering_status,
    days_to_deadline: row.days_to_deadline,
  }))
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

  return (data || []).map((row) => {
    // Handle the quotations relation which could be an object or array
    const quotation = Array.isArray(row.quotations) ? row.quotations[0] : row.quotations
    return {
      id: row.id,
      assessmentType: row.assessment_type,
      status: row.status || 'pending',
      quotationNumber: quotation?.quotation_number || null,
      cargoDescription: quotation?.commodity || null,
      createdAt: row.created_at || new Date().toISOString(),
    }
  })
}
