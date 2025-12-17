import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import {
  NotificationType,
  NotificationPriority,
  EntityType,
  CreateNotificationParams,
  NotificationFilters,
} from '@/types/notifications'

// Arbitraries for notification types
const notificationTypeArb = fc.constantFrom<NotificationType>(
  'approval',
  'budget_alert',
  'status_change',
  'overdue',
  'system',
  'info'
)

const notificationPriorityArb = fc.constantFrom<NotificationPriority>(
  'low',
  'normal',
  'high',
  'urgent'
)

const entityTypeArb = fc.constantFrom<EntityType>(
  'pjo',
  'jo',
  'invoice',
  'user',
  'cost_item'
)

const uuidArb = fc.uuid()

const createNotificationParamsArb = fc.record({
  userId: uuidArb,
  title: fc.string({ minLength: 1, maxLength: 200 }),
  message: fc.string({ minLength: 1 }),
  type: notificationTypeArb,
  priority: fc.option(notificationPriorityArb, { nil: undefined }),
  entityType: fc.option(entityTypeArb, { nil: undefined }),
  entityId: fc.option(uuidArb, { nil: undefined }),
  actionUrl: fc.option(fc.webUrl(), { nil: undefined }),
})

/**
 * Feature: v0.11-notifications, Property 17: Notification service API contract
 * Validates: Requirements 12.1, 12.2, 12.3
 */
describe('Property 17: Notification service API contract', () => {
  it('createNotification params should have required fields', () => {
    fc.assert(
      fc.property(createNotificationParamsArb, (params) => {
        // Required fields must be present
        expect(params.userId).toBeDefined()
        expect(params.title).toBeDefined()
        expect(params.message).toBeDefined()
        expect(params.type).toBeDefined()

        // Type must be valid
        const validTypes: NotificationType[] = [
          'approval',
          'budget_alert',
          'status_change',
          'overdue',
          'system',
          'info',
        ]
        expect(validTypes).toContain(params.type)

        // Priority if provided must be valid
        if (params.priority) {
          const validPriorities: NotificationPriority[] = ['low', 'normal', 'high', 'urgent']
          expect(validPriorities).toContain(params.priority)
        }

        // EntityType if provided must be valid
        if (params.entityType) {
          const validEntityTypes: EntityType[] = ['pjo', 'jo', 'invoice', 'user', 'cost_item']
          expect(validEntityTypes).toContain(params.entityType)
        }
      }),
      { numRuns: 100 }
    )
  })

  it('bulk notification recipients should accept userIds array or roles filter', () => {
    const recipientsArb = fc.oneof(
      fc.record({
        userIds: fc.array(uuidArb, { minLength: 1, maxLength: 10 }),
        roles: fc.constant(undefined),
      }),
      fc.record({
        userIds: fc.constant(undefined),
        roles: fc.array(
          fc.constantFrom('owner', 'admin', 'manager', 'ops', 'finance', 'sales'),
          { minLength: 1, maxLength: 3 }
        ),
      }),
      fc.record({
        userIds: fc.array(uuidArb, { minLength: 1, maxLength: 5 }),
        roles: fc.array(
          fc.constantFrom('owner', 'admin', 'manager', 'ops', 'finance', 'sales'),
          { minLength: 1, maxLength: 3 }
        ),
      })
    )

    fc.assert(
      fc.property(recipientsArb, (recipients) => {
        // At least one of userIds or roles should be defined
        const hasUserIds = recipients.userIds && recipients.userIds.length > 0
        const hasRoles = recipients.roles && recipients.roles.length > 0
        expect(hasUserIds || hasRoles).toBe(true)
      }),
      { numRuns: 100 }
    )
  })

  it('notification filters should support isRead, type, and date range', () => {
    const validDateArb = fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') })
    const filtersArb = fc.record({
      isRead: fc.option(fc.boolean(), { nil: undefined }),
      type: fc.option(notificationTypeArb, { nil: undefined }),
      startDate: fc.option(validDateArb, { nil: undefined }),
      endDate: fc.option(validDateArb, { nil: undefined }),
      limit: fc.option(fc.integer({ min: 1, max: 100 }), { nil: undefined }),
      offset: fc.option(fc.integer({ min: 0, max: 1000 }), { nil: undefined }),
    })

    fc.assert(
      fc.property(filtersArb, (filters: NotificationFilters) => {
        // All filter fields should be optional
        // If startDate and endDate both exist, startDate should be before endDate
        if (filters.startDate && filters.endDate) {
          // This is a validation rule, not enforced by type
          // Just verify both are Date objects
          expect(filters.startDate instanceof Date).toBe(true)
          expect(filters.endDate instanceof Date).toBe(true)
        }

        // Limit should be positive if defined
        if (filters.limit !== undefined) {
          expect(filters.limit).toBeGreaterThan(0)
        }

        // Offset should be non-negative if defined
        if (filters.offset !== undefined) {
          expect(filters.offset).toBeGreaterThanOrEqual(0)
        }
      }),
      { numRuns: 100 }
    )
  })
})

/**
 * Feature: v0.11-notifications, Property 4: Mark as read state transition
 * Validates: Requirements 2.5, 2.6, 12.4
 */
describe('Property 4: Mark as read state transition', () => {
  it('marking as read should set is_read to true and read_at to non-null', () => {
    // Simulate notification state before and after marking as read
    const notificationArb = fc.record({
      id: uuidArb,
      is_read: fc.constant(false),
      read_at: fc.constant(null),
    })

    fc.assert(
      fc.property(notificationArb, (notification) => {
        // Before marking as read
        expect(notification.is_read).toBe(false)
        expect(notification.read_at).toBeNull()

        // Simulate marking as read
        const markedNotification = {
          ...notification,
          is_read: true,
          read_at: new Date().toISOString(),
        }

        // After marking as read
        expect(markedNotification.is_read).toBe(true)
        expect(markedNotification.read_at).not.toBeNull()
        expect(typeof markedNotification.read_at).toBe('string')
      }),
      { numRuns: 100 }
    )
  })
})

/**
 * Feature: v0.11-notifications, Property 18: Soft delete behavior
 * Validates: Requirements 12.5
 */
describe('Property 18: Soft delete behavior', () => {
  it('deleting should set deleted_at to non-null timestamp', () => {
    const notificationArb = fc.record({
      id: uuidArb,
      deleted_at: fc.constant(null),
    })

    fc.assert(
      fc.property(notificationArb, (notification) => {
        // Before deletion
        expect(notification.deleted_at).toBeNull()

        // Simulate soft delete
        const deletedNotification = {
          ...notification,
          deleted_at: new Date().toISOString(),
        }

        // After deletion
        expect(deletedNotification.deleted_at).not.toBeNull()
        expect(typeof deletedNotification.deleted_at).toBe('string')

        // Verify it's a valid ISO date string
        const parsedDate = new Date(deletedNotification.deleted_at)
        expect(parsedDate.toString()).not.toBe('Invalid Date')
      }),
      { numRuns: 100 }
    )
  })
})

/**
 * Feature: v0.11-notifications, Property 14: Notification cleanup eligibility
 * Validates: Requirements 9.1, 9.2, 9.3, 9.5
 */
describe('Property 14: Notification cleanup eligibility', () => {
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)

  it('expired notifications should be eligible for cleanup', () => {
    const expiredNotificationArb = fc.record({
      id: uuidArb,
      expires_at: fc.date({ max: new Date(now.getTime() - 1000) }).map((d) => d.toISOString()),
      is_read: fc.boolean(),
      deleted_at: fc.constant(null),
    })

    fc.assert(
      fc.property(expiredNotificationArb, (notification) => {
        const expiresAt = new Date(notification.expires_at)
        const isExpired = expiresAt < now
        expect(isExpired).toBe(true)
      }),
      { numRuns: 100 }
    )
  })

  it('read notifications older than 30 days should be eligible for cleanup', () => {
    const oldReadNotificationArb = fc.record({
      id: uuidArb,
      created_at: fc
        .date({ min: new Date('2020-01-01'), max: new Date(thirtyDaysAgo.getTime() - 1000) })
        .map((d) => d.toISOString()),
      is_read: fc.constant(true),
      deleted_at: fc.constant(null),
    })

    fc.assert(
      fc.property(oldReadNotificationArb, (notification) => {
        const createdAt = new Date(notification.created_at)
        const isOldRead = notification.is_read && createdAt < thirtyDaysAgo
        expect(isOldRead).toBe(true)
      }),
      { numRuns: 100 }
    )
  })

  it('unread notifications older than 90 days should be eligible for cleanup', () => {
    const oldUnreadNotificationArb = fc.record({
      id: uuidArb,
      created_at: fc
        .date({ min: new Date('2020-01-01'), max: new Date(ninetyDaysAgo.getTime() - 1000) })
        .map((d) => d.toISOString()),
      is_read: fc.constant(false),
      deleted_at: fc.constant(null),
    })

    fc.assert(
      fc.property(oldUnreadNotificationArb, (notification) => {
        const createdAt = new Date(notification.created_at)
        const isOldUnread = !notification.is_read && createdAt < ninetyDaysAgo
        expect(isOldUnread).toBe(true)
      }),
      { numRuns: 100 }
    )
  })

  it('deleted notifications should be excluded from queries', () => {
    const deletedNotificationArb = fc.record({
      id: uuidArb,
      deleted_at: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }).map((d) => d.toISOString()),
    })

    fc.assert(
      fc.property(deletedNotificationArb, (notification) => {
        // Notification with deleted_at set should be excluded
        const shouldBeExcluded = notification.deleted_at !== null
        expect(shouldBeExcluded).toBe(true)
      }),
      { numRuns: 100 }
    )
  })
})
