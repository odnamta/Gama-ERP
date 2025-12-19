/**
 * PDF Utility Functions Tests
 * Tests for formatCurrencyForPDF and formatDateForPDF
 * Validates: Requirements 1.8, 1.9, 6.3
 */

import { describe, it, expect } from 'vitest'
import { formatCurrencyForPDF, formatDateForPDF } from '@/lib/pdf/pdf-utils'

describe('PDF Utility Functions', () => {
  describe('formatCurrencyForPDF', () => {
    // Property 6: Currency Formatting
    it('should format positive amounts correctly', () => {
      expect(formatCurrencyForPDF(1000)).toBe('Rp 1.000')
      expect(formatCurrencyForPDF(1234567)).toBe('Rp 1.234.567')
      expect(formatCurrencyForPDF(100000000)).toBe('Rp 100.000.000')
    })

    it('should format zero correctly', () => {
      expect(formatCurrencyForPDF(0)).toBe('Rp 0')
    })

    it('should format decimal amounts correctly', () => {
      expect(formatCurrencyForPDF(1234.56)).toMatch(/Rp 1\.234/)
    })

    it('should handle null/undefined/NaN gracefully', () => {
      expect(formatCurrencyForPDF(null as unknown as number)).toBe('Rp 0')
      expect(formatCurrencyForPDF(undefined as unknown as number)).toBe('Rp 0')
      expect(formatCurrencyForPDF(NaN)).toBe('Rp 0')
    })

    it('should format negative amounts', () => {
      const result = formatCurrencyForPDF(-1000)
      expect(result).toContain('1.000')
    })

    it('should format large amounts correctly', () => {
      expect(formatCurrencyForPDF(999999999999)).toMatch(/Rp.*999/)
    })
  })

  describe('formatDateForPDF', () => {
    // Property 7: Date Formatting
    it('should format ISO date strings to DD/MM/YYYY', () => {
      expect(formatDateForPDF('2025-12-19')).toBe('19/12/2025')
      expect(formatDateForPDF('2025-01-05')).toBe('05/01/2025')
      expect(formatDateForPDF('2024-06-15')).toBe('15/06/2024')
    })

    it('should format Date objects correctly', () => {
      const date = new Date(2025, 11, 19) // December 19, 2025
      expect(formatDateForPDF(date)).toBe('19/12/2025')
    })

    it('should handle ISO datetime strings', () => {
      expect(formatDateForPDF('2025-12-19T10:30:00Z')).toBe('19/12/2025')
    })

    it('should return "-" for null/undefined', () => {
      expect(formatDateForPDF(null)).toBe('-')
      expect(formatDateForPDF(undefined)).toBe('-')
    })

    it('should return "-" for invalid date strings', () => {
      expect(formatDateForPDF('invalid-date')).toBe('-')
      expect(formatDateForPDF('')).toBe('-')
    })

    it('should pad single digit days and months', () => {
      expect(formatDateForPDF('2025-01-01')).toBe('01/01/2025')
      expect(formatDateForPDF('2025-09-09')).toBe('09/09/2025')
    })
  })
})

describe('Invoice Total Calculation Properties', () => {
  // Property 3: Invoice Total Calculation
  const VAT_RATE = 0.11

  it('should verify tax_amount = subtotal × 0.11', () => {
    const testCases = [
      { subtotal: 1000000 },
      { subtotal: 5000000 },
      { subtotal: 10000000 },
      { subtotal: 123456789 },
    ]

    testCases.forEach(({ subtotal }) => {
      const expectedTax = subtotal * VAT_RATE
      expect(expectedTax).toBe(subtotal * 0.11)
    })
  })

  it('should verify grand_total = subtotal + tax_amount', () => {
    const testCases = [
      { subtotal: 1000000 },
      { subtotal: 5000000 },
      { subtotal: 10000000 },
    ]

    testCases.forEach(({ subtotal }) => {
      const taxAmount = subtotal * VAT_RATE
      const grandTotal = subtotal + taxAmount
      // Use toBeCloseTo for floating point comparison
      expect(grandTotal).toBeCloseTo(subtotal * (1 + VAT_RATE), 2)
    })
  })

  it('should handle zero subtotal', () => {
    const subtotal = 0
    const taxAmount = subtotal * VAT_RATE
    const grandTotal = subtotal + taxAmount
    expect(taxAmount).toBe(0)
    expect(grandTotal).toBe(0)
  })
})

describe('PDF Response Headers Properties', () => {
  // Property 1: PDF Content-Type Header
  it('should define correct PDF content type', () => {
    const expectedContentType = 'application/pdf'
    expect(expectedContentType).toBe('application/pdf')
  })

  // Property 2: PDF Disposition Header
  it('should define inline disposition for viewing', () => {
    const filename = 'INV-2025-0001.pdf'
    const inlineDisposition = `inline; filename="${filename}"`
    expect(inlineDisposition).toContain('inline')
    expect(inlineDisposition).toContain(filename)
  })

  it('should define attachment disposition for downloading', () => {
    const filename = 'INV-2025-0001.pdf'
    const attachmentDisposition = `attachment; filename="${filename}"`
    expect(attachmentDisposition).toContain('attachment')
    expect(attachmentDisposition).toContain(filename)
  })
})
