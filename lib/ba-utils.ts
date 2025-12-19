/**
 * Berita Acara (Handover Report) Utility Functions
 * 
 * **Feature: v0.17-surat-jalan-berita-acara**
 */

import { BAStatus, CargoCondition, BeritaAcaraFormData } from '@/types'

/**
 * Valid BA status values
 */
export const BA_STATUSES: BAStatus[] = ['draft', 'pending_signature', 'signed', 'archived']

/**
 * Valid cargo condition values
 */
export const CARGO_CONDITIONS: CargoCondition[] = ['good', 'minor_damage', 'major_damage']

/**
 * BA Status labels for display
 */
export const BA_STATUS_LABELS: Record<BAStatus, string> = {
  draft: 'Draft',
  pending_signature: 'Pending Signature',
  signed: 'Signed',
  archived: 'Archived',
}

/**
 * BA Status colors for badges
 */
export const BA_STATUS_COLORS: Record<BAStatus, string> = {
  draft: 'bg-gray-100 text-gray-800',
  pending_signature: 'bg-yellow-100 text-yellow-800',
  signed: 'bg-green-100 text-green-800',
  archived: 'bg-blue-100 text-blue-800',
}

/**
 * Cargo condition labels for display
 */
export const CARGO_CONDITION_LABELS: Record<CargoCondition, string> = {
  good: 'Good - No damage',
  minor_damage: 'Minor Damage - Small issues noted',
  major_damage: 'Major Damage - Significant issues',
}

/**
 * Cargo condition colors for badges
 */
export const CARGO_CONDITION_COLORS: Record<CargoCondition, string> = {
  good: 'bg-green-100 text-green-800',
  minor_damage: 'bg-yellow-100 text-yellow-800',
  major_damage: 'bg-red-100 text-red-800',
}


/**
 * Valid status transitions for Berita Acara
 * 
 * **Property 4: BA Status Transition Validity**
 * **Validates: Requirements 4.1**
 */
const VALID_BA_TRANSITIONS: Record<BAStatus, BAStatus[]> = {
  draft: ['pending_signature'],
  pending_signature: ['signed', 'archived'],
  signed: [],
  archived: [],
}

/**
 * Check if a status transition is valid for Berita Acara
 * 
 * @param currentStatus - Current BA status
 * @param newStatus - Target BA status
 * @returns true if the transition is valid
 * 
 * **Feature: v0.17-surat-jalan-berita-acara, Property 4: BA Status Transition Validity**
 * **Validates: Requirements 4.1**
 */
export function canTransitionBAStatus(currentStatus: BAStatus, newStatus: BAStatus): boolean {
  const validTransitions = VALID_BA_TRANSITIONS[currentStatus]
  return validTransitions?.includes(newStatus) ?? false
}

/**
 * Get available next statuses for a given BA status
 * 
 * @param currentStatus - Current BA status
 * @returns Array of valid next statuses
 */
export function getAvailableBATransitions(currentStatus: BAStatus): BAStatus[] {
  return VALID_BA_TRANSITIONS[currentStatus] ?? []
}

/**
 * Get the display label for a BA status
 * 
 * @param status - BA status
 * @returns Display label string
 */
export function getBAStatusLabel(status: BAStatus): string {
  return BA_STATUS_LABELS[status] ?? status
}

/**
 * Get the color class for a BA status badge
 * 
 * @param status - BA status
 * @returns Tailwind CSS class string
 */
export function getBAStatusColor(status: BAStatus): string {
  return BA_STATUS_COLORS[status] ?? 'bg-gray-100 text-gray-800'
}

/**
 * Check if a cargo condition value is valid
 * 
 * @param condition - Cargo condition to validate
 * @returns true if valid cargo condition
 * 
 * **Feature: v0.17-surat-jalan-berita-acara, Property 7: Cargo Condition Validation**
 * **Validates: Requirements 3.5**
 */
export function isValidCargoCondition(condition: string): condition is CargoCondition {
  return CARGO_CONDITIONS.includes(condition as CargoCondition)
}

/**
 * Get the display label for a cargo condition
 * 
 * @param condition - Cargo condition
 * @returns Display label string
 */
export function getCargoConditionLabel(condition: CargoCondition): string {
  return CARGO_CONDITION_LABELS[condition] ?? condition
}

/**
 * Get the color class for a cargo condition badge
 * 
 * @param condition - Cargo condition
 * @returns Tailwind CSS class string
 */
export function getCargoConditionColor(condition: CargoCondition): string {
  return CARGO_CONDITION_COLORS[condition] ?? 'bg-gray-100 text-gray-800'
}


/**
 * Required fields for BA form validation
 */
const BA_REQUIRED_FIELDS: (keyof BeritaAcaraFormData)[] = [
  'handover_date',
  'location',
  'work_description',
  'cargo_condition',
  'company_representative',
  'client_representative',
]

/**
 * Validation result interface
 */
export interface BAValidationResult {
  isValid: boolean
  errors: string[]
  missingFields: string[]
}

/**
 * Validate Berita Acara form data
 * 
 * @param data - Form data to validate
 * @returns Validation result with errors if any
 * 
 * **Feature: v0.17-surat-jalan-berita-acara, Property 6: BA Form Validation**
 * **Validates: Requirements 3.3**
 */
export function validateBAForm(data: Partial<BeritaAcaraFormData>): BAValidationResult {
  const errors: string[] = []
  const missingFields: string[] = []

  for (const field of BA_REQUIRED_FIELDS) {
    const value = data[field]
    if (value === undefined || value === null || value === '') {
      missingFields.push(field)
      errors.push(`${formatFieldName(field)} is required`)
    }
  }

  // Additional validation for cargo_condition
  if (data.cargo_condition && !isValidCargoCondition(data.cargo_condition)) {
    errors.push('Invalid cargo condition value')
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
 * Generate BA number in format BA-YYYY-NNNN
 * 
 * @param year - Year for the BA number
 * @param count - Current count of BAs for the year
 * @returns Formatted BA number
 * 
 * **Feature: v0.17-surat-jalan-berita-acara, Property 2: BA Number Generation Format**
 * **Validates: Requirements 3.2, 8.2**
 */
export function formatBANumber(year: number, count: number): string {
  const nextNumber = count + 1
  return `BA-${year}-${String(nextNumber).padStart(4, '0')}`
}

/**
 * Parse BA number to extract year and sequence
 * 
 * @param baNumber - BA number string
 * @returns Object with year and sequence, or null if invalid
 */
export function parseBANumber(baNumber: string): { year: number; sequence: number } | null {
  const match = baNumber.match(/^BA-(\d{4})-(\d{4})$/)
  if (!match) return null
  return {
    year: parseInt(match[1], 10),
    sequence: parseInt(match[2], 10),
  }
}

/**
 * Check if a string is a valid BA number format
 * 
 * @param baNumber - String to validate
 * @returns true if valid BA number format
 */
export function isValidBANumberFormat(baNumber: string): boolean {
  return /^BA-\d{4}-\d{4}$/.test(baNumber)
}

/**
 * Check if a BA status is a terminal status (no further transitions)
 * 
 * @param status - BA status to check
 * @returns true if terminal status
 */
export function isBATerminalStatus(status: BAStatus): boolean {
  return status === 'signed' || status === 'archived'
}

/**
 * Check if a BA can be edited (only in draft status)
 * 
 * @param status - BA status to check
 * @returns true if BA can be edited
 */
export function canEditBA(status: BAStatus): boolean {
  return status === 'draft'
}