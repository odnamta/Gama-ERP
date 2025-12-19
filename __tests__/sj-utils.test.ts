/**
 * Surat Jalan Utility Functions Tests
 * 
 * **Feature: v0.17-surat-jalan-berita-acara**
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import {
  formatSJNumber,
  parseSJNumber,
  isValidSJNumberFormat,
  canTransitionSJStatus,
  getAvailableSJTransitions,
  getSJStatusLabel,
  getSJStatusColor,
  validateSJForm,
  isSJTerminalStatus,
  SJ_STATUSES,
} from '@/lib/sj-utils'
import { SJStatus, SuratJalanFormData } from '@/types'

describe('SJ Number Generation', () => {
  /**
   * **Property 1: SJ Number Generation Format**
   * *For any* year and existing document count, the generated SJ number SHALL follow
   * the format `SJ-YYYY-NNNN` where YYYY is the year and NNNN is a zero-padded
   * sequential number starting from 0001.
   * **Validates: Requirements 1.2, 8.1**
   */
  it('Property 1: generates SJ numbers in correct format SJ-YYYY-NNNN', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2020, max: 2100 }), // year
        fc.integer({ min: 0, max: 9998 }), // count (0-based, so max 9998 gives 9999)
        (year, count) => {
          const sjNumber = formatSJNumber(year, count)
          
          // Should match format SJ-YYYY-NNNN
          expect(sjNumber).toMatch(/^SJ-\d{4}-\d{4}$/)
          
          // Year should be correct
          expect(sjNumber.substring(3, 7)).toBe(String(year))
          
          // Sequence should be count + 1, zero-padded
          const expectedSequence = String(count + 1).padStart(4, '0')
          expect(sjNumber.substring(8)).toBe(expectedSequence)
          
          // Should be parseable
          const parsed = parseSJNumber(sjNumber)
          expect(parsed).not.toBeNull()
          expect(parsed?.year).toBe(year)
          expect(parsed?.sequence).toBe(count + 1)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('validates SJ number format correctly', () => {
    expect(isValidSJNumberFormat('SJ-2025-0001')).toBe(true)
    expect(isValidSJNumberFormat('SJ-2025-9999')).toBe(true)
    expect(isValidSJNumberFormat('SJ-2025-001')).toBe(false) // too short
    expect(isValidSJNumberFormat('SJ-25-0001')).toBe(false) // year too short
    expect(isValidSJNumberFormat('BA-2025-0001')).toBe(false) // wrong prefix
    expect(isValidSJNumberFormat('sj-2025-0001')).toBe(false) // lowercase
  })
})


describe('SJ Status Transitions', () => {
  /**
   * **Property 3: SJ Status Transition Validity**
   * *For any* Surat Jalan with current status S, a transition to status T is valid if and only if:
   * - S = 'issued' AND T ∈ {'in_transit'}
   * - S = 'in_transit' AND T ∈ {'delivered', 'returned'}
   * All other transitions SHALL be rejected.
   * **Validates: Requirements 2.1**
   */
  it('Property 3: validates status transitions correctly', () => {
    const sjStatusArb = fc.constantFrom<SJStatus>(...SJ_STATUSES)
    
    fc.assert(
      fc.property(sjStatusArb, sjStatusArb, (currentStatus, newStatus) => {
        const isValid = canTransitionSJStatus(currentStatus, newStatus)
        
        // Define expected valid transitions
        const expectedValid = 
          (currentStatus === 'issued' && newStatus === 'in_transit') ||
          (currentStatus === 'in_transit' && (newStatus === 'delivered' || newStatus === 'returned'))
        
        expect(isValid).toBe(expectedValid)
      }),
      { numRuns: 100 }
    )
  })

  it('returns correct available transitions for each status', () => {
    expect(getAvailableSJTransitions('issued')).toEqual(['in_transit'])
    expect(getAvailableSJTransitions('in_transit')).toEqual(['delivered', 'returned'])
    expect(getAvailableSJTransitions('delivered')).toEqual([])
    expect(getAvailableSJTransitions('returned')).toEqual([])
  })

  it('identifies terminal statuses correctly', () => {
    expect(isSJTerminalStatus('issued')).toBe(false)
    expect(isSJTerminalStatus('in_transit')).toBe(false)
    expect(isSJTerminalStatus('delivered')).toBe(true)
    expect(isSJTerminalStatus('returned')).toBe(true)
  })
})

describe('SJ Form Validation', () => {
  /**
   * **Property 5: SJ Form Validation**
   * *For any* Surat Jalan form submission, the form SHALL be valid if and only if
   * all of the following fields contain non-empty values: delivery_date, vehicle_plate,
   * driver_name, origin, destination, cargo_description.
   * **Validates: Requirements 1.4**
   */
  it('Property 5: validates required fields correctly', () => {
    const nonEmptyString = fc.string({ minLength: 1 })
    const emptyOrMissing = fc.constantFrom('', undefined, null)
    
    // Test with all required fields present
    fc.assert(
      fc.property(
        nonEmptyString, // delivery_date
        nonEmptyString, // vehicle_plate
        nonEmptyString, // driver_name
        nonEmptyString, // origin
        nonEmptyString, // destination
        nonEmptyString, // cargo_description
        (delivery_date, vehicle_plate, driver_name, origin, destination, cargo_description) => {
          const formData: Partial<SuratJalanFormData> = {
            delivery_date,
            vehicle_plate,
            driver_name,
            origin,
            destination,
            cargo_description,
          }
          
          const result = validateSJForm(formData)
          expect(result.isValid).toBe(true)
          expect(result.errors).toHaveLength(0)
          expect(result.missingFields).toHaveLength(0)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('rejects forms with missing required fields', () => {
    // Missing delivery_date
    let result = validateSJForm({
      vehicle_plate: 'L 1234 AB',
      driver_name: 'John',
      origin: 'Jakarta',
      destination: 'Surabaya',
      cargo_description: 'Steel pipes',
    })
    expect(result.isValid).toBe(false)
    expect(result.missingFields).toContain('delivery_date')

    // Missing all fields
    result = validateSJForm({})
    expect(result.isValid).toBe(false)
    expect(result.missingFields).toHaveLength(6)
  })

  it('treats empty strings as missing', () => {
    const result = validateSJForm({
      delivery_date: '2025-01-01',
      vehicle_plate: '', // empty
      driver_name: 'John',
      origin: 'Jakarta',
      destination: 'Surabaya',
      cargo_description: 'Steel pipes',
    })
    expect(result.isValid).toBe(false)
    expect(result.missingFields).toContain('vehicle_plate')
  })
})

describe('SJ Status Display', () => {
  it('returns correct labels for all statuses', () => {
    expect(getSJStatusLabel('issued')).toBe('Issued')
    expect(getSJStatusLabel('in_transit')).toBe('In Transit')
    expect(getSJStatusLabel('delivered')).toBe('Delivered')
    expect(getSJStatusLabel('returned')).toBe('Returned')
  })

  it('returns correct colors for all statuses', () => {
    expect(getSJStatusColor('issued')).toContain('blue')
    expect(getSJStatusColor('in_transit')).toContain('yellow')
    expect(getSJStatusColor('delivered')).toContain('green')
    expect(getSJStatusColor('returned')).toContain('red')
  })
})