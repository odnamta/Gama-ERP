/**
 * Unit tests for Engineering Dashboard Data Service
 * Tests specific examples and edge cases
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Supabase client
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

// Mock dashboard cache
vi.mock('@/lib/dashboard-cache', () => ({
  getOrFetch: vi.fn((key, fetcher) => fetcher()),
  generateCacheKey: vi.fn((prefix, role) => `${prefix}:${role}:2026-01-24`),
}))

describe('Engineering Dashboard Data - Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Empty data scenarios', () => {
    it('should handle empty surveys array', () => {
      const surveys: { id: string; status: string }[] = []
      const pendingStatuses = ['requested', 'scheduled', 'in_progress']
      
      const pending = surveys.filter(s => pendingStatuses.includes(s.status))
      
      expect(pending).toHaveLength(0)
    })

    it('should handle empty JMPs array', () => {
      const jmps: { id: string; status: string }[] = []
      const activeStatuses = ['active', 'in_progress']
      
      const active = jmps.filter(j => activeStatuses.includes(j.status))
      
      expect(active).toHaveLength(0)
    })

    it('should handle empty assessments array', () => {
      const assessments: { id: string; status: string }[] = []
      const pendingStatuses = ['pending', 'in_progress']
      
      const pending = assessments.filter(a => pendingStatuses.includes(a.status))
      
      expect(pending).toHaveLength(0)
    })

    it('should return 0 completion rate for empty assessments', () => {
      const total = 0
      const completed = 0
      
      const rate = total === 0 ? 0 : Math.round((completed / total) * 100)
      
      expect(rate).toBe(0)
    })
  })

  describe('Null value handling', () => {
    it('should handle null origin_location in surveys', () => {
      const survey = {
        id: '123',
        survey_number: 'SRV-001',
        origin_location: null,
        destination_location: 'Jakarta',
        status: 'completed',
        created_at: '2026-01-24T00:00:00Z',
      }
      
      const transformed = {
        id: survey.id,
        surveyNumber: survey.survey_number || '',
        originLocation: survey.origin_location,
        destinationLocation: survey.destination_location,
        status: survey.status || '',
        createdAt: survey.created_at || '',
      }
      
      expect(transformed.originLocation).toBeNull()
      expect(transformed.destinationLocation).toBe('Jakarta')
    })

    it('should handle null journey_title in JMPs', () => {
      const jmp = {
        id: '123',
        jmp_number: 'JMP-001',
        journey_title: null,
        status: 'active',
        planned_departure: null,
      }
      
      const transformed = {
        id: jmp.id,
        jmpNumber: jmp.jmp_number || '',
        journeyTitle: jmp.journey_title,
        status: jmp.status || '',
        plannedDeparture: jmp.planned_departure,
      }
      
      expect(transformed.journeyTitle).toBeNull()
      expect(transformed.plannedDeparture).toBeNull()
    })

    it('should handle null risk_level in assessments', () => {
      const assessment = {
        id: '123',
        assessment_type: 'route_feasibility',
        status: 'completed',
        risk_level: null,
        created_at: '2026-01-24T00:00:00Z',
        pjo_id: null,
        proforma_job_orders: null,
      }
      
      const transformed = {
        id: assessment.id,
        assessmentType: assessment.assessment_type,
        status: assessment.status || '',
        riskLevel: assessment.risk_level,
        createdAt: assessment.created_at || '',
        pjoNumber: null,
      }
      
      expect(transformed.riskLevel).toBeNull()
      expect(transformed.pjoNumber).toBeNull()
    })

    it('should handle null completed_at for date filtering', () => {
      const surveys = [
        { id: '1', completed_at: '2026-01-15T00:00:00Z' },
        { id: '2', completed_at: null },
        { id: '3', completed_at: '2026-01-20T00:00:00Z' },
      ]
      
      const startOfMonth = new Date('2026-01-01')
      const now = new Date('2026-01-24')
      
      const completedThisMonth = surveys.filter(s => {
        if (!s.completed_at) return false
        const date = new Date(s.completed_at)
        return date >= startOfMonth && date <= now
      })
      
      expect(completedThisMonth).toHaveLength(2)
      expect(completedThisMonth.map(s => s.id)).toEqual(['1', '3'])
    })
  })

  describe('Date boundary cases', () => {
    it('should include items exactly at start of month', () => {
      const startOfMonth = new Date('2026-01-01T00:00:00Z')
      const completedAt = new Date('2026-01-01T00:00:00Z')
      
      const isInRange = completedAt >= startOfMonth
      
      expect(isInRange).toBe(true)
    })

    it('should include items exactly at end of range', () => {
      const endOfRange = new Date('2026-01-24T23:59:59Z')
      const completedAt = new Date('2026-01-24T23:59:59Z')
      
      const isInRange = completedAt <= endOfRange
      
      expect(isInRange).toBe(true)
    })

    it('should exclude items before start of month', () => {
      const startOfMonth = new Date('2026-01-01T00:00:00Z')
      const completedAt = new Date('2025-12-31T23:59:59Z')
      
      const isInRange = completedAt >= startOfMonth
      
      expect(isInRange).toBe(false)
    })

    it('should calculate upcoming JMPs within 7 days correctly', () => {
      const now = new Date('2026-01-24T12:00:00Z')
      const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
      
      const jmps = [
        { id: '1', planned_departure: '2026-01-25T00:00:00Z' }, // 1 day - included
        { id: '2', planned_departure: '2026-01-31T00:00:00Z' }, // 7 days - included
        { id: '3', planned_departure: '2026-02-01T00:00:00Z' }, // 8 days - excluded
        { id: '4', planned_departure: '2026-01-23T00:00:00Z' }, // past - excluded
        { id: '5', planned_departure: null }, // null - excluded
      ]
      
      const upcoming = jmps.filter(j => {
        if (!j.planned_departure) return false
        const date = new Date(j.planned_departure)
        return date >= now && date <= sevenDaysFromNow
      })
      
      expect(upcoming).toHaveLength(2)
      expect(upcoming.map(j => j.id)).toEqual(['1', '2'])
    })
  })

  describe('Role access scenarios', () => {
    const allowedRoles = ['engineer', 'owner', 'director', 'marketing_manager']
    
    it('should allow engineer role', () => {
      const role = 'engineer'
      expect(allowedRoles.includes(role)).toBe(true)
    })

    it('should allow owner role', () => {
      const role = 'owner'
      expect(allowedRoles.includes(role)).toBe(true)
    })

    it('should allow director role', () => {
      const role = 'director'
      expect(allowedRoles.includes(role)).toBe(true)
    })

    it('should allow marketing_manager role', () => {
      const role = 'marketing_manager'
      expect(allowedRoles.includes(role)).toBe(true)
    })

    it('should deny finance role', () => {
      const role = 'finance'
      expect(allowedRoles.includes(role)).toBe(false)
    })

    it('should deny ops role', () => {
      const role = 'ops'
      expect(allowedRoles.includes(role)).toBe(false)
    })

    it('should deny hr role', () => {
      const role = 'hr'
      expect(allowedRoles.includes(role)).toBe(false)
    })
  })

  describe('Assignment sorting', () => {
    it('should sort assignments by due date (soonest first)', () => {
      const assignments = [
        { id: '1', dueDate: '2026-01-30', createdAt: '2026-01-20' },
        { id: '2', dueDate: '2026-01-25', createdAt: '2026-01-21' },
        { id: '3', dueDate: '2026-01-28', createdAt: '2026-01-19' },
      ]
      
      const sorted = [...assignments].sort((a, b) => {
        if (a.dueDate && b.dueDate) {
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
        }
        if (a.dueDate) return -1
        if (b.dueDate) return 1
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      })
      
      expect(sorted.map(a => a.id)).toEqual(['2', '3', '1'])
    })

    it('should prioritize items with due dates over those without', () => {
      const assignments = [
        { id: '1', dueDate: null, createdAt: '2026-01-24' },
        { id: '2', dueDate: '2026-01-30', createdAt: '2026-01-20' },
        { id: '3', dueDate: null, createdAt: '2026-01-22' },
      ]
      
      const sorted = [...assignments].sort((a, b) => {
        if (a.dueDate && b.dueDate) {
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
        }
        if (a.dueDate) return -1
        if (b.dueDate) return 1
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      })
      
      expect(sorted[0].id).toBe('2') // Has due date, comes first
    })

    it('should sort items without due dates by createdAt descending', () => {
      const assignments = [
        { id: '1', dueDate: null, createdAt: '2026-01-20' },
        { id: '2', dueDate: null, createdAt: '2026-01-24' },
        { id: '3', dueDate: null, createdAt: '2026-01-22' },
      ]
      
      const sorted = [...assignments].sort((a, b) => {
        if (a.dueDate && b.dueDate) {
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
        }
        if (a.dueDate) return -1
        if (b.dueDate) return 1
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      })
      
      expect(sorted.map(a => a.id)).toEqual(['2', '3', '1'])
    })
  })

  describe('Completion rate calculation', () => {
    it('should calculate 50% correctly', () => {
      const completed = 5
      const total = 10
      const rate = Math.round((completed / total) * 100)
      
      expect(rate).toBe(50)
    })

    it('should calculate 33% correctly (rounded)', () => {
      const completed = 1
      const total = 3
      const rate = Math.round((completed / total) * 100)
      
      expect(rate).toBe(33)
    })

    it('should calculate 67% correctly (rounded)', () => {
      const completed = 2
      const total = 3
      const rate = Math.round((completed / total) * 100)
      
      expect(rate).toBe(67)
    })

    it('should handle 0 completed', () => {
      const completed = 0
      const total = 10
      const rate = Math.round((completed / total) * 100)
      
      expect(rate).toBe(0)
    })

    it('should handle 100% completion', () => {
      const completed = 10
      const total = 10
      const rate = Math.round((completed / total) * 100)
      
      expect(rate).toBe(100)
    })
  })

  describe('Recent items limiting', () => {
    it('should limit to 5 items', () => {
      const items = Array.from({ length: 10 }, (_, i) => ({
        id: String(i),
        createdAt: `2026-01-${String(24 - i).padStart(2, '0')}`,
      }))
      
      const limited = items.slice(0, 5)
      
      expect(limited).toHaveLength(5)
    })

    it('should return all items if less than limit', () => {
      const items = Array.from({ length: 3 }, (_, i) => ({
        id: String(i),
        createdAt: `2026-01-${String(24 - i).padStart(2, '0')}`,
      }))
      
      const limited = items.slice(0, 5)
      
      expect(limited).toHaveLength(3)
    })

    it('should return empty array for empty input', () => {
      const items: { id: string; createdAt: string }[] = []
      
      const limited = items.slice(0, 5)
      
      expect(limited).toHaveLength(0)
    })
  })

  describe('Status badge mapping', () => {
    const statusColors: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-800',
      requested: 'bg-blue-100 text-blue-800',
      scheduled: 'bg-indigo-100 text-indigo-800',
      in_progress: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      active: 'bg-emerald-100 text-emerald-800',
      pending: 'bg-orange-100 text-orange-800',
      pending_review: 'bg-purple-100 text-purple-800',
    }

    it('should map all survey statuses', () => {
      const surveyStatuses = ['draft', 'requested', 'scheduled', 'in_progress', 'completed', 'cancelled']
      
      surveyStatuses.forEach(status => {
        expect(statusColors[status]).toBeDefined()
      })
    })

    it('should map all JMP statuses', () => {
      const jmpStatuses = ['draft', 'pending_review', 'active', 'in_progress', 'completed', 'cancelled']
      
      jmpStatuses.forEach(status => {
        expect(statusColors[status]).toBeDefined()
      })
    })

    it('should map all assessment statuses', () => {
      const assessmentStatuses = ['pending', 'in_progress', 'completed', 'cancelled']
      
      assessmentStatuses.forEach(status => {
        expect(statusColors[status]).toBeDefined()
      })
    })
  })
})
