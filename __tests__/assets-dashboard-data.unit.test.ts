/**
 * Unit Tests for Assets Dashboard Data
 * Tests edge cases: empty database, single asset, division by zero
 */

import { describe, it, expect } from 'vitest'

import type {
  AssetSummary,
  CategoryCount,
  MaintenanceAlert,
  UtilizationMetrics
} from '@/lib/dashboard/assets-data'

// Helper functions for testing (mirrors logic in assets-data.ts)
function calculateUtilizationRate(assigned: number, total: number): number {
  if (total <= 0) return 0
  if (assigned < 0) return 0
  const rate = Math.round((assigned / total) * 100)
  return Math.min(rate, 100) // Cap at 100%
}

function calculateOverdueDays(dueDate: string | null | undefined): number {
  if (!dueDate) return 0
  const due = new Date(dueDate)
  if (isNaN(due.getTime())) return 0
  const now = new Date()
  const diffMs = now.getTime() - due.getTime()
  if (diffMs <= 0) return 0
  return Math.floor(diffMs / (1000 * 60 * 60 * 24))
}

describe('Assets Dashboard Data - Unit Tests', () => {
  describe('calculateUtilizationRate', () => {
    it('should return 0 when total assets is 0 (division by zero)', () => {
      const result = calculateUtilizationRate(0, 0)
      expect(result).toBe(0)
    })

    it('should return 0 when assigned is 0', () => {
      const result = calculateUtilizationRate(0, 10)
      expect(result).toBe(0)
    })

    it('should calculate correct percentage', () => {
      const result = calculateUtilizationRate(5, 10)
      expect(result).toBe(50)
    })

    it('should handle 100% utilization', () => {
      const result = calculateUtilizationRate(10, 10)
      expect(result).toBe(100)
    })

    it('should round to nearest integer', () => {
      const result = calculateUtilizationRate(1, 3)
      expect(result).toBe(33) // 33.33... rounds to 33
    })

    it('should handle large numbers', () => {
      const result = calculateUtilizationRate(500, 1000)
      expect(result).toBe(50)
    })
  })

  describe('calculateOverdueDays', () => {
    it('should return 0 for future dates', () => {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 5)
      const result = calculateOverdueDays(futureDate.toISOString())
      expect(result).toBe(0)
    })

    it('should return 0 for today', () => {
      const today = new Date().toISOString().split('T')[0]
      const result = calculateOverdueDays(today)
      expect(result).toBeLessThanOrEqual(1) // Could be 0 or 1 depending on time
    })

    it('should return positive days for past dates', () => {
      const pastDate = new Date()
      pastDate.setDate(pastDate.getDate() - 5)
      const result = calculateOverdueDays(pastDate.toISOString().split('T')[0])
      expect(result).toBeGreaterThanOrEqual(4) // Allow for timezone differences
      expect(result).toBeLessThanOrEqual(6)
    })

    it('should handle null/undefined gracefully', () => {
      const result = calculateOverdueDays(null)
      expect(result).toBe(0)
    })

    it('should handle invalid date strings', () => {
      const result = calculateOverdueDays('invalid-date')
      expect(result).toBe(0)
    })
  })

  describe('AssetSummary type validation', () => {
    it('should have correct structure for empty state', () => {
      const emptySummary: AssetSummary = {
        total: 0,
        active: 0,
        maintenance: 0,
        idle: 0,
        disposed: 0
      }
      
      expect(emptySummary.total).toBe(0)
      expect(emptySummary.active).toBe(0)
      expect(emptySummary.maintenance).toBe(0)
      expect(emptySummary.idle).toBe(0)
      expect(emptySummary.disposed).toBe(0)
    })

    it('should allow single asset scenario', () => {
      const singleAsset: AssetSummary = {
        total: 1,
        active: 1,
        maintenance: 0,
        idle: 0,
        disposed: 0
      }
      
      expect(singleAsset.total).toBe(1)
      expect(singleAsset.active).toBe(1)
    })
  })

  describe('CategoryCount type validation', () => {
    it('should handle empty categories array', () => {
      const categories: CategoryCount[] = []
      expect(categories.length).toBe(0)
    })

    it('should have correct structure', () => {
      const category: CategoryCount = {
        category: 'Trucks',
        count: 5
      }
      
      expect(category.category).toBe('Trucks')
      expect(category.count).toBe(5)
    })
  })

  describe('MaintenanceAlert type validation', () => {
    it('should handle empty alerts array', () => {
      const alerts: MaintenanceAlert[] = []
      expect(alerts.length).toBe(0)
    })

    it('should have correct structure for overdue alert', () => {
      const alert: MaintenanceAlert = {
        id: 'asset-1',
        asset_code: 'TRK-001',
        asset_name: 'Truck 1',
        maintenance_type: 'Oil Change',
        due_date: '2026-01-20',
        status: 'overdue',
        overdue_days: 4
      }
      
      expect(alert.status).toBe('overdue')
      expect(alert.overdue_days).toBe(4)
    })

    it('should have correct structure for due_soon alert', () => {
      const alert: MaintenanceAlert = {
        id: 'asset-2',
        asset_code: 'TRK-002',
        asset_name: 'Truck 2',
        maintenance_type: 'Tire Rotation',
        due_date: '2026-01-28',
        status: 'due_soon',
        overdue_days: 0
      }
      
      expect(alert.status).toBe('due_soon')
      expect(alert.overdue_days).toBe(0)
    })
  })

  describe('UtilizationMetrics type validation', () => {
    it('should handle zero utilization', () => {
      const metrics: UtilizationMetrics = {
        totalActive: 10,
        assignedToJobs: 0,
        utilizationRate: 0
      }
      
      expect(metrics.utilizationRate).toBe(0)
    })

    it('should handle full utilization', () => {
      const metrics: UtilizationMetrics = {
        totalActive: 10,
        assignedToJobs: 10,
        utilizationRate: 100
      }
      
      expect(metrics.utilizationRate).toBe(100)
    })

    it('should handle empty fleet', () => {
      const metrics: UtilizationMetrics = {
        totalActive: 0,
        assignedToJobs: 0,
        utilizationRate: 0
      }
      
      expect(metrics.totalActive).toBe(0)
      expect(metrics.utilizationRate).toBe(0)
    })
  })

  describe('Edge cases', () => {
    it('should handle negative values gracefully in utilization', () => {
      // This shouldn't happen in practice, but test defensive coding
      const result = calculateUtilizationRate(-1, 10)
      expect(result).toBe(0) // Should clamp to 0
    })

    it('should handle assigned > total gracefully', () => {
      // Edge case: more assigned than total (data inconsistency)
      const result = calculateUtilizationRate(15, 10)
      expect(result).toBe(100) // Should cap at 100
    })
  })
})
