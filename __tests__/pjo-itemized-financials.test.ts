import { describe, it, expect } from 'vitest'
import {
  calculateRevenueTotal,
  calculateCostTotal,
  analyzeBudget,
  determineCostStatus,
  generateJONumber,
} from '@/lib/pjo-utils'
import { PJORevenueItem, PJOCostItem } from '@/types'

/**
 * Integration tests for PJO Itemized Financials workflow
 * These tests verify the complete workflow from PJO creation to JO conversion
 */

describe('PJO Itemized Financials Integration', () => {
  /**
   * Test 19.1: Full PJO workflow - create → add items → submit → approve
   */
  describe('Full PJO Workflow', () => {
    it('should calculate correct totals when adding revenue items', () => {
      // Simulate adding revenue items to a PJO
      const revenueItems: PJORevenueItem[] = []
      
      // Add first item: Freight charge
      revenueItems.push({
        id: '1',
        pjo_id: 'pjo-1',
        description: 'Freight Charge SBY-JKT',
        quantity: 1,
        unit: 'Trip',
        unit_price: 15000000,
        subtotal: 15000000,
        source_type: 'manual',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      
      expect(calculateRevenueTotal(revenueItems)).toBe(15000000)
      
      // Add second item: Handling fee
      revenueItems.push({
        id: '2',
        pjo_id: 'pjo-1',
        description: 'Handling Fee',
        quantity: 20,
        unit: 'CBM',
        unit_price: 50000,
        subtotal: 1000000,
        source_type: 'manual',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      
      expect(calculateRevenueTotal(revenueItems)).toBe(16000000)
      
      // Add third item: Documentation
      revenueItems.push({
        id: '3',
        pjo_id: 'pjo-1',
        description: 'Documentation',
        quantity: 1,
        unit: 'Set',
        unit_price: 500000,
        subtotal: 500000,
        source_type: 'manual',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      
      expect(calculateRevenueTotal(revenueItems)).toBe(16500000)
    })

    it('should calculate correct totals when adding cost items', () => {
      const costItems: PJOCostItem[] = []
      
      // Add trucking cost
      costItems.push({
        id: '1',
        pjo_id: 'pjo-1',
        category: 'trucking',
        description: 'SBY - Tanjung Perak',
        estimated_amount: 5000000,
        status: 'estimated',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      
      expect(calculateCostTotal(costItems, 'estimated')).toBe(5000000)
      
      // Add port charges
      costItems.push({
        id: '2',
        pjo_id: 'pjo-1',
        category: 'port_charges',
        description: 'THC + Lift On',
        estimated_amount: 2500000,
        status: 'estimated',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      
      expect(calculateCostTotal(costItems, 'estimated')).toBe(7500000)
      
      // Add documentation
      costItems.push({
        id: '3',
        pjo_id: 'pjo-1',
        category: 'documentation',
        description: 'B/L + COO',
        estimated_amount: 750000,
        status: 'estimated',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      
      expect(calculateCostTotal(costItems, 'estimated')).toBe(8250000)
    })

    it('should validate PJO has required items before submission', () => {
      const revenueItems: PJORevenueItem[] = []
      const costItems: PJOCostItem[] = []
      
      // Validation: must have at least 1 revenue item
      const hasRevenueItems = revenueItems.length > 0
      expect(hasRevenueItems).toBe(false)
      
      // Validation: must have at least 1 cost item
      const hasCostItems = costItems.length > 0
      expect(hasCostItems).toBe(false)
      
      // Add items
      revenueItems.push({
        id: '1',
        pjo_id: 'pjo-1',
        description: 'Freight',
        quantity: 1,
        unit: 'Trip',
        unit_price: 10000000,
        subtotal: 10000000,
        created_at: '',
        updated_at: '',
      })
      
      costItems.push({
        id: '1',
        pjo_id: 'pjo-1',
        category: 'trucking',
        description: 'Transport',
        estimated_amount: 5000000,
        status: 'estimated',
        created_at: '',
        updated_at: '',
      })
      
      // Now validation should pass
      expect(revenueItems.length > 0).toBe(true)
      expect(costItems.length > 0).toBe(true)
      
      // Validation: total cost must be less than total revenue (positive margin)
      const totalRevenue = calculateRevenueTotal(revenueItems)
      const totalCost = calculateCostTotal(costItems, 'estimated')
      expect(totalCost < totalRevenue).toBe(true)
    })
  })

  /**
   * Test 19.2: Cost confirmation workflow
   */
  describe('Cost Confirmation Workflow', () => {
    it('should track cost confirmation progress', () => {
      const costItems: PJOCostItem[] = [
        {
          id: '1',
          pjo_id: 'pjo-1',
          category: 'trucking',
          description: 'Transport',
          estimated_amount: 5000000,
          actual_amount: undefined,
          status: 'estimated',
          created_at: '',
          updated_at: '',
        },
        {
          id: '2',
          pjo_id: 'pjo-1',
          category: 'port_charges',
          description: 'Port fees',
          estimated_amount: 2500000,
          actual_amount: undefined,
          status: 'estimated',
          created_at: '',
          updated_at: '',
        },
        {
          id: '3',
          pjo_id: 'pjo-1',
          category: 'documentation',
          description: 'Docs',
          estimated_amount: 750000,
          actual_amount: undefined,
          status: 'estimated',
          created_at: '',
          updated_at: '',
        },
      ]
      
      // Initial state: no items confirmed
      let budget = analyzeBudget(costItems)
      expect(budget.items_confirmed).toBe(0)
      expect(budget.items_pending).toBe(3)
      expect(budget.all_confirmed).toBe(false)
      
      // Confirm first item (under budget)
      costItems[0].actual_amount = 4800000
      costItems[0].status = 'under_budget'
      
      budget = analyzeBudget(costItems)
      expect(budget.items_confirmed).toBe(1)
      expect(budget.items_pending).toBe(2)
      expect(budget.all_confirmed).toBe(false)
      
      // Confirm second item (over budget)
      costItems[1].actual_amount = 2600000
      costItems[1].status = 'exceeded'
      
      budget = analyzeBudget(costItems)
      expect(budget.items_confirmed).toBe(2)
      expect(budget.items_pending).toBe(1)
      expect(budget.has_overruns).toBe(true)
      
      // Confirm third item (exactly on budget)
      costItems[2].actual_amount = 750000
      costItems[2].status = 'confirmed'
      
      budget = analyzeBudget(costItems)
      expect(budget.items_confirmed).toBe(3)
      expect(budget.items_pending).toBe(0)
      expect(budget.all_confirmed).toBe(true)
    })

    it('should require justification for over-budget items', () => {
      const estimated = 5000000
      const actual = 5500000
      
      // Determine status
      const status = determineCostStatus(estimated, actual)
      expect(status).toBe('exceeded')
      
      // When status is exceeded, justification should be required
      const requiresJustification = status === 'exceeded'
      expect(requiresJustification).toBe(true)
    })

    it('should calculate variance correctly', () => {
      const costItems: PJOCostItem[] = [
        {
          id: '1',
          pjo_id: 'pjo-1',
          category: 'trucking',
          description: 'Transport',
          estimated_amount: 5000000,
          actual_amount: 4800000,
          variance: -200000,
          variance_pct: -4,
          status: 'under_budget',
          created_at: '',
          updated_at: '',
        },
        {
          id: '2',
          pjo_id: 'pjo-1',
          category: 'port_charges',
          description: 'Port fees',
          estimated_amount: 2500000,
          actual_amount: 2600000,
          variance: 100000,
          variance_pct: 4,
          status: 'exceeded',
          created_at: '',
          updated_at: '',
        },
      ]
      
      const budget = analyzeBudget(costItems)
      
      // Total estimated: 7,500,000
      expect(budget.total_estimated).toBe(7500000)
      
      // Total actual: 7,400,000
      expect(budget.total_actual).toBe(7400000)
      
      // Total variance: -100,000 (under budget overall)
      expect(budget.total_variance).toBe(-100000)
    })
  })

  /**
   * Test 19.3: PJO to JO conversion workflow
   */
  describe('PJO to JO Conversion Workflow', () => {
    it('should block conversion when costs not confirmed', () => {
      const costItems: PJOCostItem[] = [
        {
          id: '1',
          pjo_id: 'pjo-1',
          category: 'trucking',
          description: 'Transport',
          estimated_amount: 5000000,
          actual_amount: 4800000,
          status: 'confirmed',
          created_at: '',
          updated_at: '',
        },
        {
          id: '2',
          pjo_id: 'pjo-1',
          category: 'port_charges',
          description: 'Port fees',
          estimated_amount: 2500000,
          actual_amount: undefined, // Not confirmed
          status: 'estimated',
          created_at: '',
          updated_at: '',
        },
      ]
      
      const budget = analyzeBudget(costItems)
      
      // Should not be ready for conversion
      expect(budget.all_confirmed).toBe(false)
      expect(budget.items_pending).toBe(1)
    })

    it('should allow conversion when all costs confirmed', () => {
      const costItems: PJOCostItem[] = [
        {
          id: '1',
          pjo_id: 'pjo-1',
          category: 'trucking',
          description: 'Transport',
          estimated_amount: 5000000,
          actual_amount: 4800000,
          status: 'under_budget',
          created_at: '',
          updated_at: '',
        },
        {
          id: '2',
          pjo_id: 'pjo-1',
          category: 'port_charges',
          description: 'Port fees',
          estimated_amount: 2500000,
          actual_amount: 2500000,
          status: 'confirmed',
          created_at: '',
          updated_at: '',
        },
      ]
      
      const budget = analyzeBudget(costItems)
      
      // Should be ready for conversion
      expect(budget.all_confirmed).toBe(true)
      expect(budget.items_pending).toBe(0)
    })

    it('should generate correct JO number on conversion', () => {
      // Test JO number generation for different sequences and dates
      const testCases = [
        { sequence: 1, date: new Date(2025, 11, 14), expected: 'JO-0001/CARGO/XII/2025' },
        { sequence: 5, date: new Date(2025, 0, 15), expected: 'JO-0005/CARGO/I/2025' },
        { sequence: 100, date: new Date(2025, 5, 1), expected: 'JO-0100/CARGO/VI/2025' },
        { sequence: 9999, date: new Date(2025, 7, 20), expected: 'JO-9999/CARGO/VIII/2025' },
      ]
      
      testCases.forEach(({ sequence, date, expected }) => {
        const joNumber = generateJONumber(sequence, date)
        expect(joNumber).toBe(expected)
      })
    })

    it('should calculate final figures correctly on conversion', () => {
      const revenueItems: PJORevenueItem[] = [
        {
          id: '1',
          pjo_id: 'pjo-1',
          description: 'Freight',
          quantity: 1,
          unit: 'Trip',
          unit_price: 16500000,
          subtotal: 16500000,
          created_at: '',
          updated_at: '',
        },
      ]
      
      const costItems: PJOCostItem[] = [
        {
          id: '1',
          pjo_id: 'pjo-1',
          category: 'trucking',
          description: 'Transport',
          estimated_amount: 5000000,
          actual_amount: 4800000,
          status: 'under_budget',
          created_at: '',
          updated_at: '',
        },
        {
          id: '2',
          pjo_id: 'pjo-1',
          category: 'port_charges',
          description: 'Port fees',
          estimated_amount: 2500000,
          actual_amount: 2600000,
          status: 'exceeded',
          created_at: '',
          updated_at: '',
        },
        {
          id: '3',
          pjo_id: 'pjo-1',
          category: 'documentation',
          description: 'Docs',
          estimated_amount: 750000,
          actual_amount: 750000,
          status: 'confirmed',
          created_at: '',
          updated_at: '',
        },
      ]
      
      const finalRevenue = calculateRevenueTotal(revenueItems)
      const finalCost = calculateCostTotal(costItems, 'actual')
      const finalProfit = finalRevenue - finalCost
      const finalMargin = (finalProfit / finalRevenue) * 100
      
      expect(finalRevenue).toBe(16500000)
      expect(finalCost).toBe(8150000)
      expect(finalProfit).toBe(8350000)
      expect(finalMargin).toBeCloseTo(50.6, 1)
    })
  })

  /**
   * Edge cases and error handling
   */
  describe('Edge Cases', () => {
    it('should handle empty revenue items', () => {
      const items: PJORevenueItem[] = []
      expect(calculateRevenueTotal(items)).toBe(0)
    })

    it('should handle empty cost items', () => {
      const items: PJOCostItem[] = []
      expect(calculateCostTotal(items, 'estimated')).toBe(0)
      expect(calculateCostTotal(items, 'actual')).toBe(0)
      
      const budget = analyzeBudget(items)
      expect(budget.all_confirmed).toBe(false) // Empty array is not "all confirmed"
    })

    it('should handle zero values', () => {
      const revenueItems: PJORevenueItem[] = [
        {
          id: '1',
          pjo_id: 'pjo-1',
          description: 'Free service',
          quantity: 1,
          unit: 'Trip',
          unit_price: 0,
          subtotal: 0,
          created_at: '',
          updated_at: '',
        },
      ]
      
      expect(calculateRevenueTotal(revenueItems)).toBe(0)
    })

    it('should handle exact budget match', () => {
      const status = determineCostStatus(5000000, 5000000)
      expect(status).toBe('confirmed')
    })
  })
})
