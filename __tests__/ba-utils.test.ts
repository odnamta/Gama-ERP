/**
 * Berita Acara Utility Functions Tests
 * 
 * **Feature: v0.17-surat-jalan-berita-acara**
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import {
  formatBANumber,
  parseBANumber,
  isValidBANumberFormat,
  canTransitionBAStatus,
  getAvailableBATransitions,
  getBAStatusLabel,
  getBAStatusColor,
  validateBAForm,
  isValidCargoCondition,
  getCargoConditionLabel,
  isBATerminalStatus,
  canEditBA,
  BA_STATUSES,
  CARGO_CONDITIONS,
} from '@/lib/ba-utils'
import { BAStatus, CargoCondition, BeritaAcaraFormData } from '@/types'

describe('BA Number Generation', () => {
  /**
   * **Property 2: BA Number Generation Format**
   * *For any* year and existing document count, the generated BA number SHALL follow
   * the format `BA-YYYY-NNNN` where YYYY is the year and NNNN is a zero-padded
   * sequential number starting from 0001.
   * **Validates: Requirements 3.2, 8.2**
   */
  it('Property 2: generates BA numbers in correct format BA-YYYY-NNNN', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2020, max: 2100 }), // year
        fc.integer({ min: 0, max: 9998 }), // count (0-based, so max 9998 gives 9999)
        (year, count) => {
          const baNumber = formatBANumber(year, count)
          
          // Should match format BA-YYYY-NNNN
          expect(baNumber).toMatch(/^BA-\d{4}-\d{4}$/)
          
          // Year should be correct
          expect(baNumber.substring(3, 7)).toBe(String(year))
          
          // Sequence should be count + 1, zero-padded
          const expectedSequence = String(count + 1).padStart(4, '0')
          expect(baNumber.substring(8)).toBe(expectedSequence)
          
          // Should be parseable
          const parsed = parseBANumber(baNumber)
          expect(parsed).not.toBeNull()
          expect(parsed?.year).toBe(year)
          expect(parsed?.sequence).toBe(count + 1)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('validates BA number format correctly', () => {
    expect(isValidBANumberFormat('BA-2025-0001')).toBe(true)
    expect(isValidBANumberFormat('BA-2025-9999')).toBe(true)
    expect(isValidBANumberFormat('BA-2025-001')).toBe(false) // too short
    expect(isValidBANumberFormat('BA-25-0001')).toBe(false) // year too short
    expect(isValidBANumberFormat('SJ-2025-0001')).toBe(false) // wrong prefix
    expect(isValidBANumberFormat('ba-2025-0001')).toBe(false) // lowercase
  })
})


describe('BA Status Transitions', () => {
  /**
   * **Property 4: BA Status Transition Validity**
   * *For any* Berita Acara with current status S, a transition to status T is valid if and only if:
   * - S = 'draft' AND T ∈ {'pending_signature'}
   * - S = 'pending_signature' AND T ∈ {'signed', 'archived'}
   * All other transitions SHALL be rejected.
   * **Validates: Requirements 4.1**
   */
  it('Property 4: validates status transitions correctly', () => {
    const baStatusArb = fc.constantFrom<BAStatus>(...BA_STATUSES)
    
    fc.assert(
      fc.property(baStatusArb, baStatusArb, (currentStatus, newStatus) => {
        const isValid = canTransitionBAStatus(currentStatus, newStatus)
        
        // Define expected valid transitions
        const expectedValid = 
          (currentStatus === 'draft' && newStatus === 'pending_signature') ||
          (currentStatus === 'pending_signature' && (newStatus === 'signed' || newStatus === 'archived'))
        
        expect(isValid).toBe(expectedValid)
      }),
      { numRuns: 100 }
    )
  })

  it('returns correct available transitions for each status', () => {
    expect(getAvailableBATransitions('draft')).toEqual(['pending_signature'])
    expect(getAvailableBATransitions('pending_signature')).toEqual(['signed', 'archived'])
    expect(getAvailableBATransitions('signed')).toEqual([])
    expect(getAvailableBATransitions('archived')).toEqual([])
  })

  it('identifies terminal statuses correctly', () => {
    expect(isBATerminalStatus('draft')).toBe(false)
    expect(isBATerminalStatus('pending_signature')).toBe(false)
    expect(isBATerminalStatus('signed')).toBe(true)
    expect(isBATerminalStatus('archived')).toBe(true)
  })

  it('identifies editable statuses correctly', () => {
    expect(canEditBA('draft')).toBe(true)
    expect(canEditBA('pending_signature')).toBe(false)
    expect(canEditBA('signed')).toBe(false)
    expect(canEditBA('archived')).toBe(false)
  })
})

describe('Cargo Condition Validation', () => {
  /**
   * **Property 7: Cargo Condition Validation**
   * *For any* cargo condition value V, V is valid if and only if V ∈ {'good', 'minor_damage', 'major_damage'}.
   * **Validates: Requirements 3.5**
   */
  it('Property 7: validates cargo conditions correctly', () => {
    // Valid conditions
    for (const condition of CARGO_CONDITIONS) {
      expect(isValidCargoCondition(condition)).toBe(true)
    }
    
    // Invalid conditions
    const invalidConditions = ['bad', 'excellent', 'damaged', '', 'GOOD', 'Good']
    for (const condition of invalidConditions) {
      expect(isValidCargoCondition(condition)).toBe(false)
    }
  })

  it('returns correct labels for cargo conditions', () => {
    expect(getCargoConditionLabel('good')).toContain('Good')
    expect(getCargoConditionLabel('minor_damage')).toContain('Minor')
    expect(getCargoConditionLabel('major_damage')).toContain('Major')
  })
})


describe('BA Form Validation', () => {
  /**
   * **Property 6: BA Form Validation**
   * *For any* Berita Acara form submission, the form SHALL be valid if and only if
   * all of the following fields contain non-empty values: handover_date, location,
   * work_description, cargo_condition, company_representative, client_representative.
   * **Validates: Requirements 3.3**
   */
  it('Property 6: validates required fields correctly', () => {
    const nonEmptyString = fc.string({ minLength: 1 })
    const cargoConditionArb = fc.constantFrom<CargoCondition>(...CARGO_CONDITIONS)
    
    // Test with all required fields present
    fc.assert(
      fc.property(
        nonEmptyString, // handover_date
        nonEmptyString, // location
        nonEmptyString, // work_description
        cargoConditionArb, // cargo_condition
        nonEmptyString, // company_representative
        nonEmptyString, // client_representative
        (handover_date, location, work_description, cargo_condition, company_representative, client_representative) => {
          const formData: Partial<BeritaAcaraFormData> = {
            handover_date,
            location,
            work_description,
            cargo_condition,
            company_representative,
            client_representative,
          }
          
          const result = validateBAForm(formData)
          expect(result.isValid).toBe(true)
          expect(result.errors).toHaveLength(0)
          expect(result.missingFields).toHaveLength(0)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('rejects forms with missing required fields', () => {
    // Missing handover_date
    let result = validateBAForm({
      location: 'Site A',
      work_description: 'Delivery completed',
      cargo_condition: 'good',
      company_representative: 'John',
      client_representative: 'Jane',
    })
    expect(result.isValid).toBe(false)
    expect(result.missingFields).toContain('handover_date')

    // Missing all fields
    result = validateBAForm({})
    expect(result.isValid).toBe(false)
    expect(result.missingFields).toHaveLength(6)
  })

  it('treats empty strings as missing', () => {
    const result = validateBAForm({
      handover_date: '2025-01-01',
      location: '', // empty
      work_description: 'Delivery completed',
      cargo_condition: 'good',
      company_representative: 'John',
      client_representative: 'Jane',
    })
    expect(result.isValid).toBe(false)
    expect(result.missingFields).toContain('location')
  })
})

describe('BA Status Display', () => {
  it('returns correct labels for all statuses', () => {
    expect(getBAStatusLabel('draft')).toBe('Draft')
    expect(getBAStatusLabel('pending_signature')).toBe('Pending Signature')
    expect(getBAStatusLabel('signed')).toBe('Signed')
    expect(getBAStatusLabel('archived')).toBe('Archived')
  })

  it('returns correct colors for all statuses', () => {
    expect(getBAStatusColor('draft')).toContain('gray')
    expect(getBAStatusColor('pending_signature')).toContain('yellow')
    expect(getBAStatusColor('signed')).toContain('green')
    expect(getBAStatusColor('archived')).toContain('blue')
  })
})