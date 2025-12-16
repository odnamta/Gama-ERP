// Sales Pipeline Report Utility Functions

import { DateRange, PJOStatusForReport } from '@/types/reports'

export interface SalesPipelineItem {
  status: PJOStatusForReport
  count: number
  totalValue: number
  percentageOfPipeline: number
  probability: number
  weightedValue: number
}

export interface SalesPipelineReport {
  items: SalesPipelineItem[]
  totalPipelineValue: number
  weightedPipelineValue: number
  previousPeriodValue?: number
  changePercentage?: number
  period: DateRange
}

interface PJOData {
  status: PJOStatusForReport
  value: number
}

/**
 * Stage probabilities for weighted pipeline calculation
 */
export const STAGE_PROBABILITIES: Record<PJOStatusForReport, number> = {
  draft: 0.10,
  pending_approval: 0.30,
  approved: 0.70,
  converted: 1.00,
  rejected: 0,
}

/**
 * Get probability for a stage
 */
export function getStageProbability(status: PJOStatusForReport): number {
  return STAGE_PROBABILITIES[status] ?? 0
}

/**
 * Calculate weighted value for a pipeline item
 */
export function calculateWeightedValue(value: number, status: PJOStatusForReport): number {
  return value * getStageProbability(status)
}

/**
 * Group PJOs by status
 */
export function groupPJOsByStatus(pjos: PJOData[]): Map<PJOStatusForReport, { count: number; totalValue: number }> {
  const statusMap = new Map<PJOStatusForReport, { count: number; totalValue: number }>()
  
  for (const pjo of pjos) {
    const existing = statusMap.get(pjo.status)
    if (existing) {
      existing.count += 1
      existing.totalValue += pjo.value
    } else {
      statusMap.set(pjo.status, { count: 1, totalValue: pjo.value })
    }
  }
  
  return statusMap
}

/**
 * Calculate pipeline trend (period-over-period change)
 */
export function calculatePipelineTrend(currentValue: number, previousValue: number): number | null {
  if (previousValue === 0) return null
  return ((currentValue - previousValue) / previousValue) * 100
}

/**
 * Build complete Sales Pipeline report
 */
export function buildSalesPipelineReport(
  pjos: PJOData[],
  period: DateRange,
  previousPeriodValue?: number
): SalesPipelineReport {
  const statusMap = groupPJOsByStatus(pjos)
  const totalPipelineValue = pjos.reduce((sum, pjo) => sum + pjo.value, 0)
  
  const items: SalesPipelineItem[] = Array.from(statusMap.entries()).map(([status, data]) => ({
    status,
    count: data.count,
    totalValue: data.totalValue,
    percentageOfPipeline: totalPipelineValue > 0 ? (data.totalValue / totalPipelineValue) * 100 : 0,
    probability: getStageProbability(status),
    weightedValue: data.totalValue * getStageProbability(status),
  }))
  
  // Sort by pipeline stage order
  const stageOrder: PJOStatusForReport[] = ['draft', 'pending_approval', 'approved', 'converted', 'rejected']
  items.sort((a, b) => stageOrder.indexOf(a.status) - stageOrder.indexOf(b.status))
  
  const weightedPipelineValue = items.reduce((sum, item) => sum + item.weightedValue, 0)
  const changePercentage = previousPeriodValue !== undefined ? calculatePipelineTrend(totalPipelineValue, previousPeriodValue) ?? undefined : undefined
  
  return {
    items,
    totalPipelineValue,
    weightedPipelineValue,
    previousPeriodValue,
    changePercentage,
    period,
  }
}
