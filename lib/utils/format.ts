import { format, formatDistanceToNow, isValid } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Flexible date input type that accepts various date representations.
 * - string: ISO date strings from database (e.g., "2026-01-15T14:30:00Z")
 * - Date: JavaScript Date objects
 * - null | undefined: Missing values, returns fallback "-"
 */
export type DateInput = string | Date | null | undefined

// ============================================================================
// Constants
// ============================================================================

const FALLBACK_DATE = '-'
const FALLBACK_CURRENCY = 'Rp 0'
const FALLBACK_NUMBER = '0'

const CURRENCY_THRESHOLDS = {
  BILLION: 1_000_000_000,
  MILLION: 1_000_000,
  THOUSAND: 1_000,
}

const CURRENCY_SUFFIXES = {
  BILLION: 'M',    // Miliar
  MILLION: 'jt',   // Juta
  THOUSAND: 'rb',  // Ribu
}

// Indonesian month names for document formatting
const INDONESIAN_MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
]

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Safely parses a date input into a Date object.
 * Returns null for invalid inputs.
 */
export function parseDate(date: DateInput): Date | null {
  if (date === null || date === undefined) return null
  
  try {
    const parsed = typeof date === 'string' ? new Date(date) : date
    return isValid(parsed) ? parsed : null
  } catch {
    return null
  }
}

/**
 * Checks if a value is a valid Date object.
 */
function isValidDate(date: unknown): date is Date {
  return date instanceof Date && isValid(date)
}

// ============================================================================
// Date Formatting Functions
// ============================================================================

/**
 * Formats a date for display in tables, cards, or general UI.
 * Output format: "DD MMM YYYY" (e.g., "15 Jan 2026")
 * 
 * @param date - Date input (string, Date, null, or undefined)
 * @returns Formatted date string or "-" for invalid/missing dates
 * 
 * @example
 * formatDate("2026-01-15") // "15 Jan 2026"
 * formatDate(new Date(2026, 0, 15)) // "15 Jan 2026"
 * formatDate(null) // "-"
 */
export function formatDate(date: DateInput): string {
  const parsed = parseDate(date)
  if (!parsed) return FALLBACK_DATE
  
  return format(parsed, 'd MMM yyyy')
}

/**
 * Formats a date with time for display.
 * Output format: "DD MMM YYYY, HH:mm" (e.g., "15 Jan 2026, 14:30")
 * 
 * @param date - Date input (string, Date, null, or undefined)
 * @returns Formatted datetime string or "-" for invalid/missing dates
 * 
 * @example
 * formatDateTime("2026-01-15T14:30:00") // "15 Jan 2026, 14:30"
 */
export function formatDateTime(date: DateInput): string {
  const parsed = parseDate(date)
  if (!parsed) return FALLBACK_DATE
  
  return format(parsed, 'd MMM yyyy, HH:mm')
}

/**
 * Formats only the time portion of a date.
 * Output format: "HH:mm" (e.g., "14:30")
 * 
 * @param date - Date input (string, Date, null, or undefined)
 * @returns Formatted time string or "-" for invalid/missing dates
 * 
 * @example
 * formatTime("2026-01-15T14:30:00") // "14:30"
 */
export function formatTime(date: DateInput): string {
  const parsed = parseDate(date)
  if (!parsed) return FALLBACK_DATE
  
  return format(parsed, 'HH:mm')
}

/**
 * Formats a date as relative time in Indonesian.
 * Uses Indonesian locale for natural language output.
 * 
 * @param date - Date input (string, Date, null, or undefined)
 * @returns Relative time string in Indonesian (e.g., "2 hari yang lalu") or "-" for invalid dates
 * 
 * @example
 * formatRelative(new Date(Date.now() - 2 * 60 * 60 * 1000)) // "sekitar 2 jam yang lalu"
 * formatRelative(new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)) // "3 hari yang lalu"
 */
export function formatRelative(date: DateInput): string {
  const parsed = parseDate(date)
  if (!parsed) return FALLBACK_DATE
  
  return formatDistanceToNow(parsed, { 
    addSuffix: true, 
    locale: idLocale 
  })
}

/**
 * Formats a date for formal documents (PDFs, official documents).
 * Uses full Indonesian month names.
 * Output format: "DD MMMM YYYY" (e.g., "15 Januari 2026")
 * 
 * @param date - Date input (string, Date, null, or undefined)
 * @returns Formatted document date string or "-" for invalid/missing dates
 * 
 * @example
 * formatDocumentDate("2026-01-15") // "15 Januari 2026"
 */
export function formatDocumentDate(date: DateInput): string {
  const parsed = parseDate(date)
  if (!parsed) return FALLBACK_DATE
  
  const day = parsed.getDate()
  const month = INDONESIAN_MONTHS[parsed.getMonth()]
  const year = parsed.getFullYear()
  
  return `${day} ${month} ${year}`
}

/**
 * Formats a date for HTML form input elements.
 * Output format: "YYYY-MM-DD" (e.g., "2026-01-15")
 * 
 * @param date - Date input (string, Date, null, or undefined)
 * @returns ISO date string for form inputs or empty string for invalid/missing dates
 * 
 * @example
 * toInputDate("2026-01-15T14:30:00") // "2026-01-15"
 * toInputDate(null) // ""
 */
export function toInputDate(date: DateInput): string {
  const parsed = parseDate(date)
  if (!parsed) return ''
  
  return format(parsed, 'yyyy-MM-dd')
}

/**
 * Formats a date for file naming (sortable format).
 * Output format: "YYYYMMDD" (e.g., "20260115")
 * 
 * @param date - Optional Date object (defaults to current date)
 * @returns Sortable date string for file naming
 * 
 * @example
 * toFileDate(new Date(2026, 0, 15)) // "20260115"
 * toFileDate() // Current date in YYYYMMDD format
 */
export function toFileDate(date?: Date): string {
  const d = date && isValidDate(date) ? date : new Date()
  return format(d, 'yyyyMMdd')
}

/**
 * Formats a date with time for file naming (sortable format).
 * Output format: "YYYYMMDD_HHmmss" (e.g., "20260115_143022")
 * 
 * @param date - Optional Date object (defaults to current date/time)
 * @returns Sortable datetime string for file naming
 * 
 * @example
 * toFileDateTime(new Date(2026, 0, 15, 14, 30, 22)) // "20260115_143022"
 * toFileDateTime() // Current datetime in YYYYMMDD_HHmmss format
 */
export function toFileDateTime(date?: Date): string {
  const d = date && isValidDate(date) ? date : new Date()
  return format(d, 'yyyyMMdd_HHmmss')
}

// ============================================================================
// Currency Formatting Functions
// ============================================================================

/**
 * Formats a number as Indonesian Rupiah currency.
 * Output format: "Rp X.XXX.XXX" (e.g., "Rp 1.500.000")
 * 
 * @param amount - Number to format (null/undefined returns "Rp 0")
 * @returns Formatted currency string
 * 
 * @example
 * formatCurrency(1500000) // "Rp 1.500.000"
 * formatCurrency(-500000) // "-Rp 500.000"
 * formatCurrency(null) // "Rp 0"
 */
export function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return FALLBACK_CURRENCY
  
  const formatted = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
  
  return formatted
}

/**
 * Formats a number as compact Indonesian Rupiah for dashboards.
 * Uses Indonesian abbreviations: jt (juta/million), M (miliar/billion)
 * 
 * @param amount - Number to format (null/undefined returns "Rp 0")
 * @returns Compact formatted currency string
 * 
 * @example
 * formatCurrencyShort(1500000000) // "Rp 1,5 M"
 * formatCurrencyShort(1500000) // "Rp 1,5 jt"
 * formatCurrencyShort(1500) // "Rp 1.500"
 */
export function formatCurrencyShort(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return FALLBACK_CURRENCY
  
  const absAmount = Math.abs(amount)
  const sign = amount < 0 ? '-' : ''
  
  if (absAmount >= CURRENCY_THRESHOLDS.BILLION) {
    const value = (absAmount / CURRENCY_THRESHOLDS.BILLION).toFixed(1).replace('.', ',')
    return `${sign}Rp ${value} ${CURRENCY_SUFFIXES.BILLION}`
  }
  
  if (absAmount >= CURRENCY_THRESHOLDS.MILLION) {
    const value = (absAmount / CURRENCY_THRESHOLDS.MILLION).toFixed(1).replace('.', ',')
    return `${sign}Rp ${value} ${CURRENCY_SUFFIXES.MILLION}`
  }
  
  // For smaller amounts, use standard formatting
  return formatCurrency(amount)
}

// ============================================================================
// Number Formatting Functions
// ============================================================================

/**
 * Formats a number with Indonesian thousand separators.
 * 
 * @param num - Number to format (null/undefined returns "0")
 * @returns Formatted number string with dot separators
 * 
 * @example
 * formatNumber(1500000) // "1.500.000"
 * formatNumber(null) // "0"
 */
export function formatNumber(num: number | null | undefined): string {
  if (num === null || num === undefined) return FALLBACK_NUMBER
  
  return new Intl.NumberFormat('id-ID').format(num)
}

/**
 * Formats a decimal as a percentage with Indonesian locale.
 * Uses comma as decimal separator.
 * 
 * @param decimal - Decimal number to format as percentage (null/undefined returns "0%")
 * @returns Formatted percentage string
 * 
 * @example
 * formatPercent(0.755) // "75,5%"
 * formatPercent(1.5) // "150%"
 * formatPercent(null) // "0%"
 */
export function formatPercent(decimal: number | null | undefined): string {
  if (decimal === null || decimal === undefined) return '0%'
  
  const percentage = decimal * 100
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  }).format(percentage) + '%'
}

// ============================================================================
// Backward Compatibility Aliases
// ============================================================================

/**
 * @deprecated Use formatCurrency instead
 * Alias for backward compatibility with existing code using formatCurrencyIDR
 */
export function formatCurrencyIDR(amount: number | null | undefined): string {
  return formatCurrency(amount)
}

/**
 * @deprecated Use formatCurrencyShort instead
 * Alias for backward compatibility with existing code using formatCurrencyIDRCompact
 */
export function formatCurrencyIDRCompact(amount: number | null | undefined): string {
  return formatCurrencyShort(amount)
}
