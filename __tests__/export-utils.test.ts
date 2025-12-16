import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import {
  formatExportValue,
  formatExportData,
  validateExportMetadata,
  ExportColumn,
  ExportMetadata,
} from '@/lib/reports/export-utils'

/**
 * **Feature: v0.10.1-reports-phase2, Property 23: Export file metadata**
 * For any exported file (PDF or Excel), it should contain the report title, period dates,
 * generation timestamp, and user name.
 * **Validates: Requirements 11.2, 11.3, 11.4**
 */
describe('Property 23: Export file metadata', () => {
  it('should validate metadata with all required fields', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 100 }),
        fc.string({ minLength: 1, maxLength: 100 }),
        (reportTitle, generatedBy) => {
          const metadata: ExportMetadata = {
            generatedAt: new Date(),
            generatedBy,
            reportTitle,
          }
          
          expect(validateExportMetadata(metadata)).toBe(true)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should reject metadata with missing fields', () => {
    const invalidMetadata1 = {
      generatedAt: new Date(),
      generatedBy: '',
      reportTitle: 'Test Report',
    }
    expect(validateExportMetadata(invalidMetadata1)).toBe(false)

    const invalidMetadata2 = {
      generatedAt: new Date(),
      generatedBy: 'User',
      reportTitle: '',
    }
    expect(validateExportMetadata(invalidMetadata2)).toBe(false)
  })
})

describe('formatExportValue', () => {
  it('should format currency values as numbers', () => {
    expect(formatExportValue(1000, 'currency')).toBe(1000)
    expect(formatExportValue('500', 'currency')).toBe(500)
  })

  it('should format percentage values with % suffix', () => {
    expect(formatExportValue(25.5, 'percentage')).toBe('25.5%')
    expect(formatExportValue(100, 'percentage')).toBe('100.0%')
  })

  it('should format date values', () => {
    const date = new Date('2024-01-15')
    const result = formatExportValue(date, 'date')
    expect(typeof result).toBe('string')
    expect(result).toContain('2024')
  })

  it('should handle null and undefined', () => {
    expect(formatExportValue(null, 'text')).toBe('')
    expect(formatExportValue(undefined, 'text')).toBe('')
  })
})

describe('formatExportData', () => {
  it('should format data according to column definitions', () => {
    const columns: ExportColumn[] = [
      { key: 'name', header: 'Name', format: 'text' },
      { key: 'amount', header: 'Amount', format: 'currency' },
      { key: 'percentage', header: 'Percentage', format: 'percentage' },
    ]
    
    const data = [
      { name: 'Item 1', amount: 1000, percentage: 25.5 },
      { name: 'Item 2', amount: 2000, percentage: 50.0 },
    ]
    
    const result = formatExportData(data, columns)
    
    expect(result).toHaveLength(2)
    expect(result[0]['Name']).toBe('Item 1')
    expect(result[0]['Amount']).toBe(1000)
    expect(result[0]['Percentage']).toBe('25.5%')
  })

  it('should handle empty data', () => {
    const columns: ExportColumn[] = [
      { key: 'name', header: 'Name' },
    ]
    
    const result = formatExportData([], columns)
    expect(result).toHaveLength(0)
  })
})
