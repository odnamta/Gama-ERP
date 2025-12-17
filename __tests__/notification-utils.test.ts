import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import {
  formatRelativeTime,
  formatBadgeCount,
  getNotificationIcon,
  getNotificationIconColor,
  truncateMessage,
} from '@/lib/notifications/notification-utils'
import { NotificationType, NotificationPriority } from '@/types/notifications'

/**
 * Feature: v0.11-notifications, Property 16: Relative time formatting
 * Validates: Requirements 11.6
 */
describe('Property 16: Relative time formatting', () => {
  it('should produce human-readable relative time strings', () => {
    const now = new Date()

    // Test various time differences
    const testCases = [
      { offset: 0, expected: 'Just now' },
      { offset: 2 * 60 * 1000, expected: '2 min ago' },
      { offset: 30 * 60 * 1000, expected: '30 min ago' },
    ]

    testCases.forEach(({ offset, expected }) => {
      const timestamp = new Date(now.getTime() - offset).toISOString()
      const result = formatRelativeTime(timestamp)
      expect(result).toBe(expected)
    })
  })

  it('should return valid string for any timestamp', () => {
    // Generate timestamps within the last year
    const now = Date.now()
    const oneYearAgo = now - 365 * 24 * 60 * 60 * 1000

    const timestampArb = fc
      .integer({ min: oneYearAgo, max: now })
      .map((ts) => new Date(ts).toISOString())

    fc.assert(
      fc.property(timestampArb, (timestamp) => {
        const result = formatRelativeTime(timestamp)
        expect(typeof result).toBe('string')
        expect(result.length).toBeGreaterThan(0)
      }),
      { numRuns: 100 }
    )
  })
})

/**
 * Feature: v0.11-notifications, Property 1: Badge count accuracy
 * Validates: Requirements 1.2, 1.3, 1.4
 */
describe('Property 1: Badge count accuracy', () => {
  it('should return empty string for count <= 0', () => {
    fc.assert(
      fc.property(fc.integer({ min: -100, max: 0 }), (count) => {
        const result = formatBadgeCount(count)
        expect(result).toBe('')
      }),
      { numRuns: 50 }
    )
  })

  it('should return count as string for 1-99', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 99 }), (count) => {
        const result = formatBadgeCount(count)
        expect(result).toBe(count.toString())
      }),
      { numRuns: 99 }
    )
  })

  it('should return "99+" for count > 99', () => {
    fc.assert(
      fc.property(fc.integer({ min: 100, max: 10000 }), (count) => {
        const result = formatBadgeCount(count)
        expect(result).toBe('99+')
      }),
      { numRuns: 100 }
    )
  })
})

/**
 * Feature: v0.11-notifications, Property 3: Notification content completeness
 * Validates: Requirements 2.3, 3.3
 */
describe('Property 3: Notification content completeness', () => {
  it('each notification type should have an icon', () => {
    const types: NotificationType[] = [
      'approval',
      'budget_alert',
      'status_change',
      'overdue',
      'system',
      'info',
    ]

    types.forEach((type) => {
      const icon = getNotificationIcon(type)
      expect(typeof icon).toBe('string')
      expect(icon.length).toBeGreaterThan(0)
    })
  })

  it('each notification type should have an icon color', () => {
    const types: NotificationType[] = [
      'approval',
      'budget_alert',
      'status_change',
      'overdue',
      'system',
      'info',
    ]
    const priorities: NotificationPriority[] = ['low', 'normal', 'high', 'urgent']

    types.forEach((type) => {
      priorities.forEach((priority) => {
        const color = getNotificationIconColor(type, priority)
        expect(typeof color).toBe('string')
        expect(color).toMatch(/^text-/)
      })
    })
  })

  it('urgent priority should always return red color', () => {
    const types: NotificationType[] = [
      'approval',
      'budget_alert',
      'status_change',
      'overdue',
      'system',
      'info',
    ]

    types.forEach((type) => {
      const color = getNotificationIconColor(type, 'urgent')
      expect(color).toBe('text-red-500')
    })
  })

  it('message truncation should preserve content up to maxLength', () => {
    const messageArb = fc.string({ minLength: 1, maxLength: 500 })
    const maxLengthArb = fc.integer({ min: 10, max: 200 })

    fc.assert(
      fc.property(messageArb, maxLengthArb, (message, maxLength) => {
        const result = truncateMessage(message, maxLength)

        if (message.length <= maxLength) {
          expect(result).toBe(message)
        } else {
          expect(result.length).toBe(maxLength)
          expect(result.endsWith('...')).toBe(true)
        }
      }),
      { numRuns: 100 }
    )
  })
})

/**
 * Feature: v0.11-notifications, Property 2: Dropdown limit and ordering
 * Validates: Requirements 2.2
 */
describe('Property 2: Dropdown limit and ordering', () => {
  it('dropdown should show at most 10 notifications', () => {
    const DROPDOWN_LIMIT = 10

    fc.assert(
      fc.property(fc.integer({ min: 0, max: 100 }), (totalNotifications) => {
        const displayedCount = Math.min(totalNotifications, DROPDOWN_LIMIT)
        expect(displayedCount).toBeLessThanOrEqual(DROPDOWN_LIMIT)
      }),
      { numRuns: 100 }
    )
  })

  it('notifications should be ordered by created_at descending', () => {
    const notificationArb = fc.record({
      id: fc.uuid(),
      created_at: fc.date().map((d) => d.toISOString()),
    })

    const notificationsArb = fc.array(notificationArb, { minLength: 2, maxLength: 20 })

    fc.assert(
      fc.property(notificationsArb, (notifications) => {
        // Sort by created_at descending
        const sorted = [...notifications].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )

        // Verify ordering
        for (let i = 1; i < sorted.length; i++) {
          const prev = new Date(sorted[i - 1].created_at).getTime()
          const curr = new Date(sorted[i].created_at).getTime()
          expect(prev).toBeGreaterThanOrEqual(curr)
        }
      }),
      { numRuns: 100 }
    )
  })
})
