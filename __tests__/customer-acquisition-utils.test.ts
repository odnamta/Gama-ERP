import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import {
  getNewCustomers,
  calculateAcquisitionMetrics,
  calculateAcquisitionTrend,
  buildCustomerAcquisitionReport,
  CustomerAcquisitionItem,
} from '@/lib/reports/customer-acquisition-utils'

/**
 * **Feature: v0.10.1-reports-phase2, Property 22: Customer acquisition filtering**
 * For any set of customers with creation dates, only customers created within the selected period
 * should appear in the Customer Acquisition report.
 * **Validates: Requirements 10.1**
 */
describe('Property 22: Customer acquisition filtering', () => {
  it('should only include customers created within the period', () => {
    const period = {
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-01-31'),
    }
    
    const customers = [
      { customerId: 'c1', customerName: 'Customer A', createdAt: new Date('2024-01-15'), firstProjectName: 'Project 1', totalRevenue: 1000 },
      { customerId: 'c2', customerName: 'Customer B', createdAt: new Date('2023-12-15'), firstProjectName: 'Project 2', totalRevenue: 2000 },
      { customerId: 'c3', customerName: 'Customer C', createdAt: new Date('2024-01-25'), firstProjectName: null, totalRevenue: 0 },
      { customerId: 'c4', customerName: 'Customer D', createdAt: new Date('2024-02-05'), firstProjectName: 'Project 3', totalRevenue: 500 },
    ]
    
    const newCustomers = getNewCustomers(customers, period)
    
    expect(newCustomers.length).toBe(2)
    expect(newCustomers.every(c => c.createdAt >= period.startDate && c.createdAt <= period.endDate)).toBe(true)
  })

  it('should filter correctly with property-based testing', () => {
    fc.assert(
      fc.property(
        fc.date({ min: new Date('2024-01-01'), max: new Date('2024-01-31') }),
        fc.date({ min: new Date('2024-02-01'), max: new Date('2024-02-28') }),
        fc.array(
          fc.record({
            customerId: fc.stringMatching(/^cust-[0-9]+$/),
            customerName: fc.string({ minLength: 1, maxLength: 50 }),
            createdAt: fc.date({ min: new Date('2023-01-01'), max: new Date('2025-12-31') }),
            firstProjectName: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: null }),
            totalRevenue: fc.float({ min: Math.fround(0), max: Math.fround(100000), noNaN: true }),
          }),
          { minLength: 0, maxLength: 20 }
        ),
        (startDate, endDate, customers) => {
          const period = { startDate, endDate }
          const filtered = getNewCustomers(customers, period)
          
          // All filtered customers should be within period
          expect(filtered.every(c => c.createdAt >= startDate && c.createdAt <= endDate)).toBe(true)
          
          // Count should match manual filter
          const expectedCount = customers.filter(c => c.createdAt >= startDate && c.createdAt <= endDate).length
          expect(filtered.length).toBe(expectedCount)
        }
      ),
      { numRuns: 100 }
    )
  })
})

/**
 * **Feature: v0.10.1-reports-phase2, Property 21: Period comparison calculation (Acquisition)**
 * **Validates: Requirements 10.4**
 */
describe('Property 21: Period comparison calculation (Acquisition)', () => {
  it('should calculate acquisition trend correctly', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 100 }),
        fc.integer({ min: 1, max: 100 }),
        (current, previous) => {
          const trend = calculateAcquisitionTrend(current, previous)
          const expected = ((current - previous) / previous) * 100
          expect(trend).toBeCloseTo(expected, 5)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should return null when previous is zero', () => {
    expect(calculateAcquisitionTrend(5, 0)).toBeNull()
  })
})

describe('calculateAcquisitionMetrics', () => {
  it('should calculate metrics correctly', () => {
    const items: CustomerAcquisitionItem[] = [
      { customerId: 'c1', customerName: 'A', acquisitionDate: new Date(), firstProject: 'P1', totalRevenueToDate: 1000 },
      { customerId: 'c2', customerName: 'B', acquisitionDate: new Date(), firstProject: 'P2', totalRevenueToDate: 2000 },
      { customerId: 'c3', customerName: 'C', acquisitionDate: new Date(), firstProject: null, totalRevenueToDate: 0 },
    ]
    
    const metrics = calculateAcquisitionMetrics(items)
    
    expect(metrics.totalNewCustomers).toBe(3)
    expect(metrics.averageRevenuePerCustomer).toBe(1000) // 3000 / 3
  })

  it('should handle empty data', () => {
    const metrics = calculateAcquisitionMetrics([])
    
    expect(metrics.totalNewCustomers).toBe(0)
    expect(metrics.averageRevenuePerCustomer).toBe(0)
  })
})

describe('buildCustomerAcquisitionReport', () => {
  it('should build a complete report', () => {
    const customers = [
      { customerId: 'c1', customerName: 'Customer A', createdAt: new Date('2024-01-15'), firstProjectName: 'Project 1', totalRevenue: 5000 },
      { customerId: 'c2', customerName: 'Customer B', createdAt: new Date('2024-01-20'), firstProjectName: null, totalRevenue: 0 },
    ]
    const period = { startDate: new Date('2024-01-01'), endDate: new Date('2024-01-31') }
    
    const report = buildCustomerAcquisitionReport(customers, period, 1)
    
    expect(report.totalNewCustomers).toBe(2)
    expect(report.averageRevenuePerCustomer).toBe(2500)
    expect(report.acquisitionTrend).toBe(100) // (2-1)/1 * 100
    
    // Should handle null firstProject
    const customerB = report.items.find(i => i.customerId === 'c2')
    expect(customerB?.firstProject).toBeNull()
  })

  it('should sort by acquisition date descending', () => {
    const customers = [
      { customerId: 'c1', customerName: 'Customer A', createdAt: new Date('2024-01-10'), firstProjectName: 'P1', totalRevenue: 1000 },
      { customerId: 'c2', customerName: 'Customer B', createdAt: new Date('2024-01-20'), firstProjectName: 'P2', totalRevenue: 2000 },
      { customerId: 'c3', customerName: 'Customer C', createdAt: new Date('2024-01-15'), firstProjectName: 'P3', totalRevenue: 1500 },
    ]
    const period = { startDate: new Date('2024-01-01'), endDate: new Date('2024-01-31') }
    
    const report = buildCustomerAcquisitionReport(customers, period)
    
    expect(report.items[0].customerId).toBe('c2') // Jan 20
    expect(report.items[1].customerId).toBe('c3') // Jan 15
    expect(report.items[2].customerId).toBe('c1') // Jan 10
  })
})
