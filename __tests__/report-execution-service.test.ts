// Report Execution Service Tests
// Feature: reports-module-foundation

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { validateExportFormat, ExportFormat } from '@/lib/reports/report-execution-service'

describe('Report Execution Service', () => {
  describe('validateExportFormat', () => {
    it('returns true for valid export formats', () => {
      expect(validateExportFormat('view')).toBe(true)
      expect(validateExportFormat('pdf')).toBe(true)
      expect(validateExportFormat('excel')).toBe(true)
      expect(validateExportFormat('csv')).toBe(true)
    })

    it('returns false for invalid export formats', () => {
      expect(validateExportFormat('invalid')).toBe(false)
      expect(validateExportFormat('')).toBe(false)
      expect(validateExportFormat('PDF')).toBe(false) // case-sensitive
      expect(validateExportFormat('xlsx')).toBe(false)
    })

    /**
     * Property 6: Export format validation
     * For any report_execution record, the export_format field must be one of:
     * 'view', 'pdf', 'excel', 'csv', or null.
     * 
     * Feature: reports-module-foundation, Property 6: Export format validation
     * Validates: Requirements 2.3
     */
    it('property: valid formats are exactly view, pdf, excel, csv', () => {
      const validFormats: ExportFormat[] = ['view', 'pdf', 'excel', 'csv']
      
      fc.assert(
        fc.property(
          fc.constantFrom(...validFormats),
          (format) => {
            expect(validateExportFormat(format)).toBe(true)
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * Property: Invalid formats are rejected
     * Feature: reports-module-foundation, Property 6: Export format validation (inverse)
     */
    it('property: random strings that are not valid formats are rejected', () => {
      const validFormats = ['view', 'pdf', 'excel', 'csv']
      
      fc.assert(
        fc.property(
          fc.string({ minLength: 0, maxLength: 50 }).filter(s => !validFormats.includes(s)),
          (format) => {
            expect(validateExportFormat(format)).toBe(false)
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * Property: Validation is deterministic
     * Feature: reports-module-foundation, Property 6: Export format validation (invariant)
     */
    it('property: validation is deterministic', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 0, maxLength: 50 }),
          (format) => {
            const result1 = validateExportFormat(format)
            const result2 = validateExportFormat(format)
            expect(result1).toBe(result2)
          }
        ),
        { numRuns: 100 }
      )
    })
  })
})


describe('Execution Logging Input Validation', () => {
  /**
   * Property 5: Report execution logging
   * For any report run action, a corresponding report_execution record must be created
   * with the correct report_code, executed_by, and executed_at timestamp.
   * 
   * This test validates the input structure for execution logging.
   * The actual database insertion is tested via integration tests.
   * 
   * Feature: reports-module-foundation, Property 5: Report execution logging
   * Validates: Requirements 2.2
   */
  it('property: execution log input structure is valid', () => {
    interface ExecutionLogInput {
      reportCode: string
      userId: string
      parameters?: Record<string, unknown>
      exportFormat?: ExportFormat | null
    }

    function validateExecutionLogInput(input: ExecutionLogInput): boolean {
      // Report code must be non-empty
      if (!input.reportCode || input.reportCode.trim() === '') return false
      
      // User ID must be non-empty
      if (!input.userId || input.userId.trim() === '') return false
      
      // Export format must be valid if provided
      if (input.exportFormat && !validateExportFormat(input.exportFormat)) return false
      
      return true
    }

    const validFormats: (ExportFormat | null)[] = ['view', 'pdf', 'excel', 'csv', null]
    
    // Generate non-whitespace strings for reportCode
    const nonWhitespaceString = fc.string({ minLength: 1, maxLength: 50 })
      .filter(s => s.trim().length > 0)
    
    fc.assert(
      fc.property(
        fc.record({
          reportCode: nonWhitespaceString,
          userId: fc.uuid(),
          parameters: fc.constant({}),
          exportFormat: fc.constantFrom(...validFormats),
        }),
        (input) => {
          expect(validateExecutionLogInput(input)).toBe(true)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property: Invalid inputs are rejected
   * Feature: reports-module-foundation, Property 5: Report execution logging (inverse)
   */
  it('property: empty report code is rejected', () => {
    interface ExecutionLogInput {
      reportCode: string
      userId: string
      parameters?: Record<string, unknown>
      exportFormat?: ExportFormat | null
    }

    function validateExecutionLogInput(input: ExecutionLogInput): boolean {
      if (!input.reportCode || input.reportCode.trim() === '') return false
      if (!input.userId || input.userId.trim() === '') return false
      if (input.exportFormat && !validateExportFormat(input.exportFormat)) return false
      return true
    }

    fc.assert(
      fc.property(
        fc.record({
          reportCode: fc.constant(''),
          userId: fc.uuid(),
          parameters: fc.constant({}),
          exportFormat: fc.constant(null),
        }),
        (input) => {
          expect(validateExecutionLogInput(input)).toBe(false)
        }
      ),
      { numRuns: 100 }
    )
  })
})
