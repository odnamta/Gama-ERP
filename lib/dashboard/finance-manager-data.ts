'use server'

import { createClient } from '@/lib/supabase/server'
import { getOrFetch, generateCacheKey } from '@/lib/dashboard-cache'

export interface FinanceManagerMetrics {
  // Administration
  pendingPJOs: number
  draftInvoices: number
  documentQueue: number
  
  // Finance
  pendingBKK: number
  arOutstanding: number
  cashPosition: number
  
  // KPIs
  revenueMTD: number
  revenueMTDChange: number
  grossMargin: number
  grossMarginVsTarget: number
  collectionRate: number
  costControl: number
  
  // Cross-department
  quotationsWonPendingPJO: number
  budgetExceededCount: number
}

const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

export async function getFinanceManagerMetrics(): Promise<FinanceManagerMetrics> {
  const cacheKey = await generateCacheKey('finance-manager-metrics', 'finance_manager')
  
  return getOrFetch(cacheKey, async () => {
    const supabase = await createClient()
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)
    
    // Run all queries in parallel
    const [
      pendingPJOsResult,
      draftInvoicesResult,
      pendingBKKResult,
      arOutstandingResult,
      revenueMTDResult,
      revenueLastMonthResult,
      costsMTDResult,
      totalInvoicedResult,
      totalPaidResult,
      wonQuotationsResult,
      pjosWithQuotationResult,
      budgetExceededResult,
    ] = await Promise.all([
      // Pending PJOs (awaiting approval)
      supabase
        .from('proforma_job_orders')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending_approval'),
      
      // Draft Invoices
      supabase
        .from('invoices')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'draft'),
      
      // Pending BKK
      supabase
        .from('bkk_records')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'draft'),
      
      // AR Outstanding (unpaid invoices)
      supabase
        .from('invoices')
        .select('total_amount, amount_paid')
        .in('status', ['sent', 'overdue', 'partial']),
      
      // Revenue MTD (completed job orders this month)
      supabase
        .from('job_orders')
        .select('final_revenue')
        .gte('completed_at', startOfMonth.toISOString())
        .not('final_revenue', 'is', null),
      
      // Revenue Last Month (for comparison)
      supabase
        .from('job_orders')
        .select('final_revenue')
        .gte('completed_at', startOfLastMonth.toISOString())
        .lte('completed_at', endOfLastMonth.toISOString())
        .not('final_revenue', 'is', null),
      
      // Costs MTD (for gross margin)
      supabase
        .from('job_orders')
        .select('final_cost')
        .gte('completed_at', startOfMonth.toISOString())
        .not('final_cost', 'is', null),
      
      // Total Invoiced (for collection rate)
      supabase
        .from('invoices')
        .select('total_amount')
        .in('status', ['sent', 'paid', 'partial', 'overdue']),
      
      // Total Paid (for collection rate)
      supabase
        .from('invoices')
        .select('amount_paid')
        .in('status', ['sent', 'paid', 'partial', 'overdue']),
      
      // Won quotations
      supabase
        .from('quotations')
        .select('id')
        .eq('status', 'won'),
      
      // PJOs with quotation_id (to exclude from won quotations)
      supabase
        .from('proforma_job_orders')
        .select('quotation_id')
        .not('quotation_id', 'is', null),
      
      // Budget exceeded count (PJO cost items)
      supabase
        .from('pjo_cost_items')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'exceeded'),
    ])
    
    // Calculate AR Outstanding
    const arOutstanding = (arOutstandingResult.data || []).reduce((sum, inv) => {
      return sum + ((inv.total_amount || 0) - (inv.amount_paid || 0))
    }, 0)
    
    // Calculate Revenue MTD
    const revenueMTD = (revenueMTDResult.data || []).reduce((sum, jo) => {
      return sum + (jo.final_revenue || 0)
    }, 0)
    
    // Calculate Revenue Last Month
    const revenueLastMonth = (revenueLastMonthResult.data || []).reduce((sum, jo) => {
      return sum + (jo.final_revenue || 0)
    }, 0)
    
    // Calculate Revenue Change %
    const revenueMTDChange = revenueLastMonth > 0 
      ? Math.round(((revenueMTD - revenueLastMonth) / revenueLastMonth) * 100)
      : 0
    
    // Calculate Costs MTD
    const costsMTD = (costsMTDResult.data || []).reduce((sum, jo) => {
      return sum + (jo.final_cost || 0)
    }, 0)
    
    // Calculate Gross Margin
    const grossMargin = revenueMTD > 0 
      ? Math.round(((revenueMTD - costsMTD) / revenueMTD) * 100)
      : 0
    
    // Calculate Collection Rate
    const totalInvoiced = (totalInvoicedResult.data || []).reduce((sum, inv) => {
      return sum + (inv.total_amount || 0)
    }, 0)
    const totalPaid = (totalPaidResult.data || []).reduce((sum, inv) => {
      return sum + (inv.amount_paid || 0)
    }, 0)
    const collectionRate = totalInvoiced > 0 
      ? Math.round((totalPaid / totalInvoiced) * 100)
      : 0
    
    // Calculate quotations won but not yet converted to PJO
    const wonQuotationIds = new Set((wonQuotationsResult.data || []).map(q => q.id))
    const convertedQuotationIds = new Set(
      (pjosWithQuotationResult.data || [])
        .map(p => p.quotation_id)
        .filter(Boolean)
    )
    const quotationsWonPendingPJO = [...wonQuotationIds].filter(id => !convertedQuotationIds.has(id)).length
    
    return {
      pendingPJOs: pendingPJOsResult.count || 0,
      draftInvoices: draftInvoicesResult.count || 0,
      documentQueue: (pendingPJOsResult.count || 0) + (draftInvoicesResult.count || 0),
      pendingBKK: pendingBKKResult.count || 0,
      arOutstanding,
      cashPosition: 0, // Would need a separate cash/bank table
      revenueMTD,
      revenueMTDChange,
      grossMargin,
      grossMarginVsTarget: grossMargin - 26, // Target is 26%
      collectionRate,
      costControl: 100 - Math.min((budgetExceededResult.count || 0) * 2, 20), // Deduct 2% per exceeded item, max 20%
      quotationsWonPendingPJO,
      budgetExceededCount: budgetExceededResult.count || 0,
    }
  }, CACHE_TTL)
}
