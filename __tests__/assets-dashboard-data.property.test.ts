/**
 * Property-Based Tests for Assets Dashboard Data
 * Tests universal properties across generated inputs
 * 
 * Feature: v0.9.16-assets-dashboard-real-data
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'

// =====================================================
// ARBITRARIES (Test Data Generators)
// =====================================================

const assetStatusArb = fc.constantFrom('available', 'in_use', 'maintenance', 'repair', 'retired', 'sold')
const maintenanceAlertStatusArb = fc.constantFrom('overdue', 'due_soon', 'scheduled', 'completed')

const dateInRangeArb = (startDaysAgo: number, endDaysAgo: number) => {
  const now = Date.now()
  const start = now - startDaysAgo * 24 * 60 * 60 * 1000
  const end = now - endDaysAgo * 24 * 60 * 60 * 1000
  return fc.integer({ min: Math.min(start, end), max: Math.max(start, end) })
    .map(ts => new Date(ts).toISOString())
}

const assetArb = fc.record({
  id: fc.uuid(),
  asset_code: fc.string({ minLength: 3, maxLength: 10 }),
  asset_name: fc.string({ minLength: 5, maxLength: 50 }),
  status: assetStatusArb,
  category_id: fc.uuid(),
  assigned_to_job_id: fc.option(fc.uuid(), { nil: null }),
})

const categoryArb = fc.record({
  id: fc.uuid(),
  category_code: fc.string({ minLength: 2, maxLength: 10 }),
  category_name: fc.string({ minLength: 3, maxLength: 30 }),
  is_active: fc.boolean(),
  display_order: fc.integer({ min: 1, max: 100 }),
})

const maintenanceAlertArb = fc.record({
  id: fc.uuid(),
  asset_id: fc.uuid(),
  asset_name: fc.string({ minLength: 5, maxLength: 50 }),
  asset_code: fc.string({ minLength: 3, maxLength: 10 }),
  maintenance_type: fc.string({ minLength: 5, maxLength: 30 }),
  next_due_date: dateInRangeArb(30, -30), // 30 days ago to 30 days from now
  status: maintenanceAlertStatusArb,
})

const maintenanceRecordArb = fc.record({
  id: fc.uuid(),
  record_number: fc.string({ minLength: 5, maxLength: 20 }),
  asset_id: fc.uuid(),
  asset_name: fc.string({ minLength: 5, maxLength: 50 }),
  asset_code: fc.string({ minLength: 3, maxLength: 10 }),
  maintenance_type: fc.string({ minLength: 5, maxLength: 30 }),
  maintenance_date: dateInRangeArb(14, 0), // Last 14 days
  total_cost: fc.integer({ min: 0, max: 100000000 }),
  status: fc.constantFrom('scheduled', 'in_progress', 'completed', 'cancelled'),
})

const assignmentArb = fc.record({
  id: fc.uuid(),
  asset_id: fc.uuid(),
  asset_name: fc.string({ minLength: 5, maxLength: 50 }),
  asset_code: fc.string({ minLength: 3, maxLength: 10 }),
  job_number: fc.option(fc.string({ minLength: 5, maxLength: 20 }), { nil: null }),
  assigned_from: dateInRangeArb(30, 0),
  assigned_to: fc.option(dateInRangeArb(30, 0), { nil: null }),
  created_at: dateInRangeArb(30, 0),
})

const statusChangeArb = fc.record({
  id: fc.uuid(),
  asset_id: fc.uuid(),
  asset_name: fc.string({ minLength: 5, maxLength: 50 }),
  asset_code: fc.string({ minLength: 3, maxLength: 10 }),
  previous_status: fc.option(assetStatusArb, { nil: null }),
  new_status: assetStatusArb,
  changed_at: dateInRangeArb(30, 0),
  reason: fc.option(fc.string({ minLength: 5, maxLength: 100 }), { nil: null }),
})

// =====================================================
// INTERFACES
// =====================================================

interface Asset {
  id: string
  asset_code: string
  asset_name: string
  status: string
  category_id: string
  assigned_to_job_id: string | null
}

interface Category {
  id: string
  category_code: string
  category_name: string
  is_active: boolean
  display_order: number
}

interface MaintenanceAlert {
  id: string
  asset_id: string
  asset_name: string
  asset_code: string
  maintenance_type: string
  next_due_date: string
  status: string
}

interface MaintenanceRecord {
  id: string
  record_number: string
  asset_id: string
  asset_name: string
  asset_code: string
  maintenance_type: string
  maintenance_date: string
  total_cost: number
  status: string
}

interface Assignment {
  id: string
  asset_id: string
  asset_name: string
  asset_code: string
  job_number: string | null
  assigned_from: string
  assigned_to: string | null
  created_at: string
}

interface StatusChange {
  id: string
  asset_id: string
  asset_name: string
  asset_code: string
  previous_status: string | null
  new_status: string
  changed_at: string
  reason: string | null
}

// =====================================================
// HELPER FUNCTIONS (Pure calculation functions)
// =====================================================

const ACTIVE_STATUSES = ['available', 'in_use']
const MAINTENANCE_STATUSES = ['maintenance', 'repair']
const DISPOSED_STATUSES = ['retired', 'sold']
const ALERT_STATUSES = ['overdue', 'due_soon']

function calculateAssetSummary(assets: Asset[]) {
  return {
    total: assets.length,
    active: assets.filter(a => ACTIVE_STATUSES.includes(a.status)).length,
    maintenance: assets.filter(a => MAINTENANCE_STATUSES.includes(a.status)).length,
    idle: assets.filter(a => a.status === 'available' && a.assigned_to_job_id === null).length,
    disposed: assets.filter(a => DISPOSED_STATUSES.includes(a.status)).length,
  }
}

function calculateCategoryCounts(categories: Category[], assets: Asset[]) {
  const activeCats = categories.filter(c => c.is_active)
  
  return activeCats
    .map(cat => ({
      categoryId: cat.id,
      categoryName: cat.category_name,
      categoryCode: cat.category_code,
      count: assets.filter(a => a.category_id === cat.id).length,
    }))
    .filter(c => c.count > 0)
    .sort((a, b) => {
      const catA = categories.find(c => c.id === a.categoryId)
      const catB = categories.find(c => c.id === b.categoryId)
      return (catA?.display_order || 0) - (catB?.display_order || 0)
    })
}

function filterMaintenanceAlerts(alerts: MaintenanceAlert[]) {
  return alerts.filter(a => ALERT_STATUSES.includes(a.status))
}

function calculateOverdueDays(dueDate: string, referenceDate: Date = new Date()): number {
  const due = new Date(dueDate)
  const diffMs = referenceDate.getTime() - due.getTime()
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)))
}

function calculateUtilizationRate(assets: Asset[]): number {
  const activeAssets = assets.filter(a => ACTIVE_STATUSES.includes(a.status))
  if (activeAssets.length === 0) return 0
  
  const assignedToJobs = activeAssets.filter(a => a.assigned_to_job_id !== null).length
  return Math.round((assignedToJobs / activeAssets.length) * 100)
}

function getRecentRecords<T extends { created_at?: string; changed_at?: string; maintenance_date?: string }>(
  records: T[],
  dateField: 'created_at' | 'changed_at' | 'maintenance_date',
  limit: number = 5
): T[] {
  return [...records]
    .sort((a, b) => {
      const dateA = new Date((a as Record<string, string>)[dateField] || '').getTime()
      const dateB = new Date((b as Record<string, string>)[dateField] || '').getTime()
      return dateB - dateA
    })
    .slice(0, limit)
}

function filterRecentMaintenance(records: MaintenanceRecord[], daysAgo: number = 7): MaintenanceRecord[] {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - daysAgo)
  
  return records.filter(r => new Date(r.maintenance_date) >= cutoff)
}

// =====================================================
// PROPERTY TESTS
// =====================================================

describe('Assets Dashboard Data - Property Tests', () => {
  describe('Property 1: Asset Summary Status Counts', () => {
    /**
     * **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5**
     * 
     * For any collection of assets with various statuses, the summary counts SHALL satisfy:
     * - total equals the count of all assets
     * - active equals the count of assets where status is 'available' OR 'in_use'
     * - maintenance equals the count of assets where status is 'maintenance' OR 'repair'
     * - idle equals the count of assets where status is 'available' AND assigned_to_job_id IS NULL
     * - disposed equals the count of assets where status is 'retired' OR 'sold'
     */
    it('total count equals count of all assets', () => {
      fc.assert(
        fc.property(
          fc.array(assetArb, { minLength: 0, maxLength: 100 }),
          (assets) => {
            const summary = calculateAssetSummary(assets)
            expect(summary.total).toBe(assets.length)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('active count equals count of assets with available or in_use status', () => {
      fc.assert(
        fc.property(
          fc.array(assetArb, { minLength: 0, maxLength: 100 }),
          (assets) => {
            const summary = calculateAssetSummary(assets)
            const expectedActive = assets.filter(a => ACTIVE_STATUSES.includes(a.status)).length
            expect(summary.active).toBe(expectedActive)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('maintenance count equals count of assets with maintenance or repair status', () => {
      fc.assert(
        fc.property(
          fc.array(assetArb, { minLength: 0, maxLength: 100 }),
          (assets) => {
            const summary = calculateAssetSummary(assets)
            const expectedMaintenance = assets.filter(a => MAINTENANCE_STATUSES.includes(a.status)).length
            expect(summary.maintenance).toBe(expectedMaintenance)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('idle count equals count of available assets not assigned to jobs', () => {
      fc.assert(
        fc.property(
          fc.array(assetArb, { minLength: 0, maxLength: 100 }),
          (assets) => {
            const summary = calculateAssetSummary(assets)
            const expectedIdle = assets.filter(
              a => a.status === 'available' && a.assigned_to_job_id === null
            ).length
            expect(summary.idle).toBe(expectedIdle)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('disposed count equals count of assets with retired or sold status', () => {
      fc.assert(
        fc.property(
          fc.array(assetArb, { minLength: 0, maxLength: 100 }),
          (assets) => {
            const summary = calculateAssetSummary(assets)
            const expectedDisposed = assets.filter(a => DISPOSED_STATUSES.includes(a.status)).length
            expect(summary.disposed).toBe(expectedDisposed)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('all summary counts are non-negative', () => {
      fc.assert(
        fc.property(
          fc.array(assetArb, { minLength: 0, maxLength: 100 }),
          (assets) => {
            const summary = calculateAssetSummary(assets)
            expect(summary.total).toBeGreaterThanOrEqual(0)
            expect(summary.active).toBeGreaterThanOrEqual(0)
            expect(summary.maintenance).toBeGreaterThanOrEqual(0)
            expect(summary.idle).toBeGreaterThanOrEqual(0)
            expect(summary.disposed).toBeGreaterThanOrEqual(0)
          }
        ),
        { numRuns: 100 }
      )
    })
  })


  describe('Property 2: Category Counts Exclude Empty Categories', () => {
    /**
     * **Validates: Requirements 2.1, 2.3**
     * 
     * For any set of asset categories, the returned category counts SHALL only include
     * categories where count > 0.
     */
    it('returned categories only include those with count > 0', () => {
      fc.assert(
        fc.property(
          fc.array(categoryArb, { minLength: 0, maxLength: 20 }),
          fc.array(assetArb, { minLength: 0, maxLength: 100 }),
          (categories, assets) => {
            const counts = calculateCategoryCounts(categories, assets)
            
            for (const cat of counts) {
              expect(cat.count).toBeGreaterThan(0)
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    it('empty categories are excluded from results', () => {
      fc.assert(
        fc.property(
          fc.array(categoryArb, { minLength: 1, maxLength: 20 }),
          (categories) => {
            // No assets means all categories should be empty
            const counts = calculateCategoryCounts(categories, [])
            expect(counts.length).toBe(0)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('only active categories are considered', () => {
      fc.assert(
        fc.property(
          fc.array(categoryArb, { minLength: 0, maxLength: 20 }),
          fc.array(assetArb, { minLength: 0, maxLength: 100 }),
          (categories, assets) => {
            const counts = calculateCategoryCounts(categories, assets)
            const activeCatIds = new Set(categories.filter(c => c.is_active).map(c => c.id))
            
            for (const cat of counts) {
              expect(activeCatIds.has(cat.categoryId)).toBe(true)
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    it('category count equals actual asset count for that category', () => {
      fc.assert(
        fc.property(
          fc.array(categoryArb, { minLength: 0, maxLength: 20 }),
          fc.array(assetArb, { minLength: 0, maxLength: 100 }),
          (categories, assets) => {
            const counts = calculateCategoryCounts(categories, assets)
            
            for (const cat of counts) {
              const expectedCount = assets.filter(a => a.category_id === cat.categoryId).length
              expect(cat.count).toBe(expectedCount)
            }
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe('Property 3: Maintenance Alerts Filter by Status', () => {
    /**
     * **Validates: Requirements 3.1, 3.2**
     * 
     * For any set of maintenance items, the returned alerts SHALL only include items
     * where status is 'overdue' OR 'due_soon'.
     */
    it('returned alerts only include overdue or due_soon status', () => {
      fc.assert(
        fc.property(
          fc.array(maintenanceAlertArb, { minLength: 0, maxLength: 50 }),
          (alerts) => {
            const filtered = filterMaintenanceAlerts(alerts)
            
            for (const alert of filtered) {
              expect(ALERT_STATUSES).toContain(alert.status)
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    it('scheduled and completed alerts are excluded', () => {
      fc.assert(
        fc.property(
          fc.array(maintenanceAlertArb, { minLength: 0, maxLength: 50 }),
          (alerts) => {
            const filtered = filterMaintenanceAlerts(alerts)
            
            for (const alert of filtered) {
              expect(alert.status).not.toBe('scheduled')
              expect(alert.status).not.toBe('completed')
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    it('filtered count equals count of alerts with overdue or due_soon status', () => {
      fc.assert(
        fc.property(
          fc.array(maintenanceAlertArb, { minLength: 0, maxLength: 50 }),
          (alerts) => {
            const filtered = filterMaintenanceAlerts(alerts)
            const expectedCount = alerts.filter(a => ALERT_STATUSES.includes(a.status)).length
            
            expect(filtered.length).toBe(expectedCount)
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe('Property 7: Utilization Rate Calculation', () => {
    /**
     * **Validates: Requirements 4.1, 4.3**
     * 
     * For any set of assets, the utilization rate SHALL equal (assignedToJobs / totalActive) * 100,
     * where:
     * - assignedToJobs = count of assets with assigned_to_job_id IS NOT NULL AND status IN ('available', 'in_use')
     * - totalActive = count of assets with status IN ('available', 'in_use')
     * - If totalActive is 0, utilization rate SHALL be 0
     */
    it('utilization rate is 0 when no active assets', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              ...assetArb.model,
              status: fc.constantFrom('maintenance', 'repair', 'retired', 'sold'),
            }),
            { minLength: 0, maxLength: 50 }
          ),
          (assets) => {
            const rate = calculateUtilizationRate(assets as Asset[])
            expect(rate).toBe(0)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('utilization rate is between 0 and 100', () => {
      fc.assert(
        fc.property(
          fc.array(assetArb, { minLength: 0, maxLength: 100 }),
          (assets) => {
            const rate = calculateUtilizationRate(assets)
            expect(rate).toBeGreaterThanOrEqual(0)
            expect(rate).toBeLessThanOrEqual(100)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('utilization rate equals (assigned / active) * 100 rounded', () => {
      fc.assert(
        fc.property(
          fc.array(assetArb, { minLength: 1, maxLength: 100 }),
          (assets) => {
            const activeAssets = assets.filter(a => ACTIVE_STATUSES.includes(a.status))
            if (activeAssets.length === 0) return true // Skip if no active assets
            
            const assignedToJobs = activeAssets.filter(a => a.assigned_to_job_id !== null).length
            const expectedRate = Math.round((assignedToJobs / activeAssets.length) * 100)
            const actualRate = calculateUtilizationRate(assets)
            
            expect(actualRate).toBe(expectedRate)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('utilization rate is 100 when all active assets are assigned', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              id: fc.uuid(),
              asset_code: fc.string({ minLength: 3, maxLength: 10 }),
              asset_name: fc.string({ minLength: 5, maxLength: 50 }),
              status: fc.constantFrom('available', 'in_use'),
              category_id: fc.uuid(),
              assigned_to_job_id: fc.uuid(), // Always assigned
            }),
            { minLength: 1, maxLength: 50 }
          ),
          (assets) => {
            const rate = calculateUtilizationRate(assets as Asset[])
            expect(rate).toBe(100)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('utilization rate is 0 when no active assets are assigned', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              id: fc.uuid(),
              asset_code: fc.string({ minLength: 3, maxLength: 10 }),
              asset_name: fc.string({ minLength: 5, maxLength: 50 }),
              status: fc.constantFrom('available', 'in_use'),
              category_id: fc.uuid(),
              assigned_to_job_id: fc.constant(null), // Never assigned
            }),
            { minLength: 1, maxLength: 50 }
          ),
          (assets) => {
            const rate = calculateUtilizationRate(assets as Asset[])
            expect(rate).toBe(0)
          }
        ),
        { numRuns: 100 }
      )
    })
  })


  describe('Property 8: Recent Activity Ordering and Limiting', () => {
    /**
     * **Validates: Requirements 5.1, 5.2, 5.3**
     * 
     * For any set of activity records (maintenance, assignments, status changes), the returned results SHALL:
     * - Be limited to 5 items maximum
     * - Be ordered by date/timestamp descending (most recent first)
     */
    it('recent assignments list contains at most 5 items', () => {
      fc.assert(
        fc.property(
          fc.array(assignmentArb, { minLength: 0, maxLength: 50 }),
          (assignments) => {
            const recent = getRecentRecords(assignments, 'created_at', 5)
            expect(recent.length).toBeLessThanOrEqual(5)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('recent assignments are ordered by created_at descending', () => {
      fc.assert(
        fc.property(
          fc.array(assignmentArb, { minLength: 2, maxLength: 50 }),
          (assignments) => {
            const recent = getRecentRecords(assignments, 'created_at', 5)
            
            for (let i = 0; i < recent.length - 1; i++) {
              const current = new Date(recent[i].created_at).getTime()
              const next = new Date(recent[i + 1].created_at).getTime()
              expect(current).toBeGreaterThanOrEqual(next)
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    it('recent status changes list contains at most 5 items', () => {
      fc.assert(
        fc.property(
          fc.array(statusChangeArb, { minLength: 0, maxLength: 50 }),
          (changes) => {
            const recent = getRecentRecords(changes, 'changed_at', 5)
            expect(recent.length).toBeLessThanOrEqual(5)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('recent status changes are ordered by changed_at descending', () => {
      fc.assert(
        fc.property(
          fc.array(statusChangeArb, { minLength: 2, maxLength: 50 }),
          (changes) => {
            const recent = getRecentRecords(changes, 'changed_at', 5)
            
            for (let i = 0; i < recent.length - 1; i++) {
              const current = new Date(recent[i].changed_at).getTime()
              const next = new Date(recent[i + 1].changed_at).getTime()
              expect(current).toBeGreaterThanOrEqual(next)
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    it('recent maintenance list contains at most 5 items', () => {
      fc.assert(
        fc.property(
          fc.array(maintenanceRecordArb, { minLength: 0, maxLength: 50 }),
          (records) => {
            const recent = getRecentRecords(records, 'maintenance_date', 5)
            expect(recent.length).toBeLessThanOrEqual(5)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('recent maintenance are ordered by maintenance_date descending', () => {
      fc.assert(
        fc.property(
          fc.array(maintenanceRecordArb, { minLength: 2, maxLength: 50 }),
          (records) => {
            const recent = getRecentRecords(records, 'maintenance_date', 5)
            
            for (let i = 0; i < recent.length - 1; i++) {
              const current = new Date(recent[i].maintenance_date).getTime()
              const next = new Date(recent[i + 1].maintenance_date).getTime()
              expect(current).toBeGreaterThanOrEqual(next)
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    it('recent records length equals min(total records, limit)', () => {
      fc.assert(
        fc.property(
          fc.array(assignmentArb, { minLength: 0, maxLength: 50 }),
          fc.integer({ min: 1, max: 10 }),
          (assignments, limit) => {
            const recent = getRecentRecords(assignments, 'created_at', limit)
            const expectedLength = Math.min(assignments.length, limit)
            expect(recent.length).toBe(expectedLength)
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe('Property 4: Recent Maintenance Date Filtering', () => {
    /**
     * **Validates: Requirements 3.3**
     * 
     * For any set of maintenance records, the returned recent maintenance SHALL only include
     * records where maintenance_date is within the last 7 days.
     */
    it('filtered maintenance only includes records from last 7 days', () => {
      fc.assert(
        fc.property(
          fc.array(maintenanceRecordArb, { minLength: 0, maxLength: 50 }),
          (records) => {
            const filtered = filterRecentMaintenance(records, 7)
            const cutoff = new Date()
            cutoff.setDate(cutoff.getDate() - 7)
            
            for (const record of filtered) {
              const recordDate = new Date(record.maintenance_date)
              expect(recordDate.getTime()).toBeGreaterThanOrEqual(cutoff.getTime())
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    it('records older than 7 days are excluded', () => {
      // Create records that are definitely older than 7 days
      const oldRecordArb = fc.record({
        id: fc.uuid(),
        record_number: fc.string({ minLength: 5, maxLength: 20 }),
        asset_id: fc.uuid(),
        asset_name: fc.string({ minLength: 5, maxLength: 50 }),
        asset_code: fc.string({ minLength: 3, maxLength: 10 }),
        maintenance_type: fc.string({ minLength: 5, maxLength: 30 }),
        maintenance_date: dateInRangeArb(30, 10), // 10-30 days ago
        total_cost: fc.integer({ min: 0, max: 100000000 }),
        status: fc.constantFrom('scheduled', 'in_progress', 'completed', 'cancelled'),
      })

      fc.assert(
        fc.property(
          fc.array(oldRecordArb, { minLength: 1, maxLength: 20 }),
          (records) => {
            const filtered = filterRecentMaintenance(records as MaintenanceRecord[], 7)
            expect(filtered.length).toBe(0)
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe('Property 6: Overdue Days Calculation', () => {
    /**
     * **Validates: Requirements 3.5**
     * 
     * For any overdue maintenance alert, the overdueDays value SHALL equal the number of days
     * between the current date and the due date (positive integer).
     */
    it('overdue days is non-negative', () => {
      fc.assert(
        fc.property(
          dateInRangeArb(30, 0), // Dates in the past
          (dueDate) => {
            const days = calculateOverdueDays(dueDate)
            expect(days).toBeGreaterThanOrEqual(0)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('overdue days is 0 for future dates', () => {
      fc.assert(
        fc.property(
          dateInRangeArb(-1, -30), // Dates in the future
          (dueDate) => {
            const days = calculateOverdueDays(dueDate)
            expect(days).toBe(0)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('overdue days increases as due date gets older', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 30 }),
          fc.integer({ min: 1, max: 30 }),
          (days1, days2) => {
            const now = new Date()
            const date1 = new Date(now.getTime() - days1 * 24 * 60 * 60 * 1000)
            const date2 = new Date(now.getTime() - days2 * 24 * 60 * 60 * 1000)
            
            const overdue1 = calculateOverdueDays(date1.toISOString(), now)
            const overdue2 = calculateOverdueDays(date2.toISOString(), now)
            
            if (days1 > days2) {
              expect(overdue1).toBeGreaterThanOrEqual(overdue2)
            } else if (days1 < days2) {
              expect(overdue1).toBeLessThanOrEqual(overdue2)
            }
          }
        ),
        { numRuns: 100 }
      )
    })
  })
})
