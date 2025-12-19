/**
 * Surat Jalan (Delivery Note) Utility Functions
 * 
 * **Feature: v0.17-surat-jalan-berita-acara**
 */

import { SJStatus, SuratJalanFormData } from '@/types'

/**
 * Valid SJ status values
 */
export const SJ_STATUSES: SJStatus[] = ['issued', 'in_transit', 'delivered', 'returned']

/**
 * SJ Status labels for display
 */
export const SJ_STATUS_LABELS: Record<SJStatus, string> = {
  issued: 'Issued',
  in_transit: 'In Transit',
  delivered: 'Delivered',
  returned: 'Returned',
}

/**
 * SJ Status colors for badges
 */
export const SJ_STATUS_COLORS: Record<SJStatus, string> = {
  issued: 'bg-blue-100 text-blue-800',
  in_transit: 'bg-yellow-100 text-yellow-800',
  delivered: 'bg-green-100 text-green-800',
  returned: 'bg-red-100 text-red-800',
}

/**
 * Valid status transitions for Surat Jalan
 * 
 * **Property 3: SJ Status Transition Validity**
 * **Validates: Requirements 2.1**
 */
const VALID_SJ_TRANSITIONS: Record<SJStatus, SJStatus[]> = {
  issued: ['in_transit'],
  in_transit: ['delivered', 'returned'],
  delivered: [],
  returned: [],
}

/**
 * Check if a status transition is valid for Surat Jalan
 * 
 * @param currentStatus - Current SJ status
 * @param newStatus - Target SJ status
 * @returns true if the transition is valid
 * 
 * **Feature: v0.17-surat-jalan-berita-acara, Property 3: SJ Status Transition Validity**
 * **Validates: Requirements 2.1**
 */
export function canTransitionSJStatus(currentStatus: SJStatus, newStatus: SJStatus): boolean {
  const validTransitions = VALID_SJ_TRANSITIONS[currentStatus]
  return validTransitions?.includes(newStatus) ?? false
}


/**
 * Get available next statuses for a given SJ status
 * 
 * @param currentStatus - Current SJ status
 * @returns Array of valid next statuses
 */
export function getAvailableSJTransitions(currentStatus: SJStatus): SJStatus[] {
  return VALID_SJ_TRANSITIONS[currentStatus] ?? []
}

/**
 * Get the display label for an SJ status
 * 
 * @param status - SJ status
 * @returns Display label string
 */
export function getSJStatusLabel(status: SJStatus): string {
  return SJ_STATUS_LABELS[status] ?? status
}

/**
 * Get the color class for an SJ status badge
 * 
 * @param status - SJ status
 * @returns Tailwind CSS class string
 */
export function getSJStatusColor(status: SJStatus): string {
  return SJ_STATUS_COLORS[status] ?? 'bg-gray-100 text-gray-800'
}

/**
 * Required fields for SJ form validation
 */
const SJ_REQUIRED_FIELDS: (keyof SuratJalanFormData)[] = [
  'delivery_date',
  'vehicle_plate',
  'driver_name',
  'origin',
  'destination',
  'cargo_description',
]

/**
 * Validation result interface
 */
export interface SJValidationResult {
  isValid: boolean
  errors: string[]
  missingFields: string[]
}

/**
 * Validate Surat Jalan form data
 * 
 * @param data - Form data to validate
 * @returns Validation result with errors if any
 * 
 * **Feature: v0.17-surat-jalan-berita-acara, Property 5: SJ Form Validation**
 * **Validates: Requirements 1.4**
 */
export function validateSJForm(data: Partial<SuratJalanFormData>): SJValidationResult {
  const errors: string[] = []
  const missingFields: string[] = []

  for (const field of SJ_REQUIRED_FIELDS) {
    const value = data[field]
    if (value === undefined || value === null || value === '') {
      missingFields.push(field)
      errors.push(`${formatFieldName(field)} is required`)
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    missingFields,
  }
}

/**
 * Format field name for display in error messages
 */
function formatFieldName(field: string): string {
  return field
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

/**
 * Generate SJ number in format SJ-YYYY-NNNN
 * 
 * @param year - Year for the SJ number
 * @param count - Current count of SJs for the year
 * @returns Formatted SJ number
 * 
 * **Feature: v0.17-surat-jalan-berita-acara, Property 1: SJ Number Generation Format**
 * **Validates: Requirements 1.2, 8.1**
 */
export function formatSJNumber(year: number, count: number): string {
  const nextNumber = count + 1
  return `SJ-${year}-${String(nextNumber).padStart(4, '0')}`
}

/**
 * Parse SJ number to extract year and sequence
 * 
 * @param sjNumber - SJ number string
 * @returns Object with year and sequence, or null if invalid
 */
export function parseSJNumber(sjNumber: string): { year: number; sequence: number } | null {
  const match = sjNumber.match(/^SJ-(\d{4})-(\d{4})$/)
  if (!match) return null
  return {
    year: parseInt(match[1], 10),
    sequence: parseInt(match[2], 10),
  }
}

/**
 * Check if a string is a valid SJ number format
 * 
 * @param sjNumber - String to validate
 * @returns true if valid SJ number format
 */
export function isValidSJNumberFormat(sjNumber: string): boolean {
  return /^SJ-\d{4}-\d{4}$/.test(sjNumber)
}

/**
 * Check if an SJ status is a terminal status (no further transitions)
 * 
 * @param status - SJ status to check
 * @returns true if terminal status
 */
export function isSJTerminalStatus(status: SJStatus): boolean {
  return status === 'delivered' || status === 'returned'
}