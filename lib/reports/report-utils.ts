// Report Utility Functions

import { DateRange, PeriodPreset } from '@/types/reports'
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfQuarter,
  endOfQuarter,
  startOfYear,
  endOfYear,
  subMonths,
  subQuarters,
} from 'date-fns'

/**
 * Get date range for a period preset
 */
export function getDateRangeForPreset(preset: PeriodPreset, referenceDate: Date = new Date()): DateRange {
  switch (preset) {
    case 'this-week':
      return {
        startDate: startOfWeek(referenceDate, { weekStartsOn: 1 }),
        endDate: endOfWeek(referenceDate, { weekStartsOn: 1 }),
      }
    case 'this-month':
      return {
        startDate: startOfMonth(referenceDate),
        endDate: endOfMonth(referenceDate),
      }
    case 'last-month':
      const lastMonth = subMonths(referenceDate, 1)
      return {
        startDate: startOfMonth(lastMonth),
        endDate: endOfMonth(lastMonth),
      }
    case 'this-quarter':
      return {
        startDate: startOfQuarter(referenceDate),
        endDate: endOfQuarter(referenceDate),
      }
    case 'last-quarter':
      const lastQuarter = subQuarters(referenceDate, 1)
      return {
        startDate: startOfQuarter(lastQuarter),
        endDate: endOfQuarter(lastQuarter),
      }
    case 'this-year':
      return {
        startDate: startOfYear(referenceDate),
        endDate: endOfYear(referenceDate),
      }
    case 'custom':
    default:
      return {
        startDate: startOfMonth(referenceDate),
        endDate: endOfMonth(referenceDate),
      }
  }
}

/**
 * Validate date range (end must be after or equal to start)
 */
export function validateDateRange(range: DateRange): { valid: boolean; error?: string } {
  if (range.endDate < range.startDate) {
    return { valid: false, error: 'End date must be after start date' }
  }
  return { valid: true }
}

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
 * Format percentage for display
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`
}

/**
 * Format number with thousand separators
 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('id-ID').format(value)
}

/**
 * Get period preset display name
 */
export function getPeriodPresetLabel(preset: PeriodPreset): string {
  const labels: Record<PeriodPreset, string> = {
    'this-week': 'This Week',
    'this-month': 'This Month',
    'last-month': 'Last Month',
    'this-quarter': 'This Quarter',
    'last-quarter': 'Last Quarter',
    'this-year': 'This Year',
    'custom': 'Custom Range',
  }
  return labels[preset]
}

/**
 * Parse URL search params to DateRange
 */
export function parseDateRangeFromParams(params: URLSearchParams): DateRange | null {
  const startStr = params.get('start')
  const endStr = params.get('end')
  
  if (!startStr || !endStr) return null
  
  const startDate = new Date(startStr)
  const endDate = new Date(endStr)
  
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return null
  
  return { startDate, endDate }
}

/**
 * Convert DateRange to URL search params
 */
export function dateRangeToParams(range: DateRange): string {
  const start = range.startDate.toISOString().split('T')[0]
  const end = range.endDate.toISOString().split('T')[0]
  return `start=${start}&end=${end}`
}
