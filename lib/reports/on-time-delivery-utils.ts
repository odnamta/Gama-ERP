// On-Time Delivery Report Utility Functions

import { DateRange } from '@/types/reports'

export interface OnTimeDeliveryItem {
  joId: string
  joNumber: string
  customerName: string
  scheduledDate: Date
  completedDate: Date
  delayDays: number
  isOnTime: boolean
}

export interface OnTimeDeliveryReport {
  items: OnTimeDeliveryItem[]
  onTimeCount: number
  lateCount: number
  onTimePercentage: number
  averageDelayDays: number
  period: DateRange
}

/**
 * Calculate delay days between scheduled and completed dates
 */
export function calculateDelayDays(scheduledDate: Date, completedDate: Date): number {
  const scheduled = new Date(scheduledDate).setHours(0, 0, 0, 0)
  const completed = new Date(completedDate).setHours(0, 0, 0, 0)
  const diffMs = completed - scheduled
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24))
}

/**
 * Classify delivery as on-time or late
 */
export function classifyDelivery(scheduledDate: Date, completedDate: Date): { isOnTime: boolean; delayDays: number } {
  const delayDays = calculateDelayDays(scheduledDate, completedDate)
  return {
    isOnTime: delayDays <= 0,
    delayDays: Math.max(0, delayDays),
  }
}

/**
 * Calculate on-time delivery metrics
 */
export function calculateOnTimeMetrics(items: OnTimeDeliveryItem[]): { onTimeCount: number; lateCount: number; onTimePercentage: number; averageDelayDays: number } {
  const onTimeCount = items.filter(item => item.isOnTime).length
  const lateCount = items.filter(item => !item.isOnTime).length
  const total = items.length
  
  const onTimePercentage = total === 0 ? 0 : (onTimeCount / total) * 100
  
  const lateItems = items.filter(item => !item.isOnTime)
  const averageDelayDays = lateItems.length === 0 ? 0 : lateItems.reduce((sum, item) => sum + item.delayDays, 0) / lateItems.length
  
  return { onTimeCount, lateCount, onTimePercentage, averageDelayDays }
}

/**
 * Build complete On-Time Delivery report
 */
export function buildOnTimeDeliveryReport(items: OnTimeDeliveryItem[], period: DateRange): OnTimeDeliveryReport {
  const metrics = calculateOnTimeMetrics(items)
  
  return {
    items,
    ...metrics,
    period,
  }
}
