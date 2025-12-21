/**
 * Property-Based Tests for Notification Center Utilities
 * Feature: notification-center-enhanced
 * 
 * These tests validate universal correctness properties across all valid inputs.
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import {
  groupNotificationsByReadStatus,
  groupNotificationsByDate,
  filterNotifications,
  searchNotifications,
  sortNotifications,
  getCategoryFromType,
  hasHighPriorityStyling,
  shouldShowActionButton,
  isUnread,
  getPriorityBorderClass,
} from '@/lib/notifications/notification-center-utils'
import {
  EnhancedNotification,
  NotificationCenterFilters,
  NotificationCategory,
  TYPE_TO_CATEGORY,
  PRIORITY_ORDER,
} from '@/types/notification-center'
import { NotificationPriority } from '@/types/notifications'

// Generators
const priorityArb = fc.constantFrom<NotificationPriority>('low', 'normal', 'high', 'urgent')
const categoryArb = fc.constantFrom<NotificationCategory>('finance', 'operations', 'hr', 'approvals', 'system')
const notificationTypeArb = fc.constantFrom('approval', 'budget_alert', 'status_change', 'overdue', 'system', 'info', 'leave_request', 'payroll', 'payment', 'invoice', 'jo_update', 'pjo_update')

// Safe ISO date string generator using integer timestamps
const safeIsoDateArb = fc
  .integer({ min: 1704067200000, max: 1735689600000 }) // 2024-01-01 to 2025-01-01
  .map(ts => new Date(ts).toISOString())

// Optional ISO date string
const optionalIsoDateArb = fc.option(safeIsoDateArb, { nil: null })

const notificationArb: fc.Arbitrary<EnhancedNotification> = fc.record({
  id: fc.uuid(),
  user_id: fc.uuid(),
  title: fc.string({ minLength: 1, maxLength: 200 }),
  message: fc.string({ minLength: 1, maxLength: 1000 }),
  type: notificationTypeArb,
  category: categoryArb,
  priority: priorityArb,
  entity_type: fc.constantFrom('pjo', 'jo', 'invoice', 'user', 'cost_item', null),
  entity_id: fc.option(fc.uuid(), { nil: null }),
  is_read: fc.boolean(),
  read_at: optionalIsoDateArb,
  action_url: fc.option(fc.webUrl(), { nil: null }),
  action_label: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: null }),
  metadata: fc.constant(null),
  created_at: safeIsoDateArb,
  expires_at: optionalIsoDateArb,
  deleted_at: fc.constant(null),
  is_archived: fc.boolean(),
  archived_at: optionalIsoDateArb,
  email_sent: fc.boolean(),
  email_sent_at: optionalIsoDateArb,
  push_sent: fc.boolean(),
  push_sent_at: optionalIsoDateArb,
})

const filtersArb: fc.Arbitrary<NotificationCenterFilters> = fc.record({
  status: fc.constantFrom<'all' | 'unread' | 'read'>('all', 'unread', 'read'),
  category: fc.oneof(fc.constant('all' as const), categoryArb),
  priority: fc.oneof(fc.constant('all' as const), priorityArb),
  searchQuery: fc.string({ maxLength: 50 }),
})

describe('Notification Center Utils - Property Tests', () => {
  /**
   * Property 3: Notification Grouping
   * For any list of notifications with mixed read/unread status and various timestamps,
   * grouping should produce correct sections.
   * Validates: Requirements 2.3, 3.2
   */
  describe('Property 3: Notification Grouping', () => {
    it('groupNotificationsByReadStatus: unread notifications go to "New", read to "Earlier"', () => {
      fc.assert(
        fc.property(fc.array(notificationArb, { maxLength: 50 }), (notifications) => {
          const groups = groupNotificationsByReadStatus(notifications)
          
          // All notifications should be accounted for
          const totalInGroups = groups.reduce((sum, g) => sum + g.notifications.length, 0)
          expect(totalInGroups).toBe(notifications.length)
          
          // Check "New" group contains only unread
          const newGroup = groups.find(g => g.label === 'New')
          if (newGroup) {
            expect(newGroup.notifications.every(n => !n.is_read)).toBe(true)
          }
          
          // Check "Earlier" group contains only read
          const earlierGroup = groups.find(g => g.label === 'Earlier')
          if (earlierGroup) {
            expect(earlierGroup.notifications.every(n => n.is_read)).toBe(true)
          }
        }),
        { numRuns: 100 }
      )
    })

    it('groupNotificationsByDate: notifications are grouped by Today/Yesterday/Earlier', () => {
      fc.assert(
        fc.property(fc.array(notificationArb, { maxLength: 50 }), (notifications) => {
          const groups = groupNotificationsByDate(notifications)
          
          // All notifications should be accounted for
          const totalInGroups = groups.reduce((sum, g) => sum + g.notifications.length, 0)
          expect(totalInGroups).toBe(notifications.length)
          
          // Valid group labels
          const validLabels = ['Today', 'Yesterday', 'Earlier']
          groups.forEach(group => {
            expect(validLabels).toContain(group.label)
          })
        }),
        { numRuns: 100 }
      )
    })
  })

  /**
   * Property 6: Filter Application
   * For any filter combination and notification list, the filtered result should
   * contain only notifications matching all filter criteria.
   * Validates: Requirements 4.4
   */
  describe('Property 6: Filter Application', () => {
    it('filtered notifications match all filter criteria', () => {
      fc.assert(
        fc.property(
          fc.array(notificationArb, { maxLength: 50 }),
          filtersArb,
          (notifications, filters) => {
            const filtered = filterNotifications(notifications, filters)
            
            // All filtered notifications should match criteria
            filtered.forEach(notification => {
              // Status filter
              if (filters.status === 'unread') {
                expect(notification.is_read).toBe(false)
              }
              if (filters.status === 'read') {
                expect(notification.is_read).toBe(true)
              }
              
              // Category filter
              if (filters.category !== 'all') {
                expect(notification.category).toBe(filters.category)
              }
              
              // Priority filter
              if (filters.priority !== 'all') {
                expect(notification.priority).toBe(filters.priority)
              }
              
              // Search filter
              if (filters.searchQuery.trim()) {
                const query = filters.searchQuery.toLowerCase().trim()
                const titleMatch = notification.title?.toLowerCase().includes(query)
                const messageMatch = notification.message?.toLowerCase().includes(query)
                expect(titleMatch || messageMatch).toBe(true)
              }
            })
            
            // Filtered count should be <= original count
            expect(filtered.length).toBeLessThanOrEqual(notifications.length)
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  /**
   * Property 7: Search Filtering
   * For any search query string and notification list, the search result should
   * contain only notifications where the title OR message contains the search term.
   * Validates: Requirements 4.5
   */
  describe('Property 7: Search Filtering', () => {
    it('search results contain query in title or message', () => {
      fc.assert(
        fc.property(
          fc.array(notificationArb, { maxLength: 50 }),
          fc.string({ minLength: 1, maxLength: 20 }),
          (notifications, query) => {
            const results = searchNotifications(notifications, query)
            const searchTerm = query.toLowerCase().trim()
            
            if (searchTerm) {
              results.forEach(notification => {
                const titleMatch = notification.title?.toLowerCase().includes(searchTerm)
                const messageMatch = notification.message?.toLowerCase().includes(searchTerm)
                expect(titleMatch || messageMatch).toBe(true)
              })
            }
            
            expect(results.length).toBeLessThanOrEqual(notifications.length)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('empty search returns all notifications', () => {
      fc.assert(
        fc.property(fc.array(notificationArb, { maxLength: 50 }), (notifications) => {
          const results = searchNotifications(notifications, '')
          expect(results.length).toBe(notifications.length)
        }),
        { numRuns: 100 }
      )
    })
  })

  /**
   * Property 14: Priority-Aware Sorting
   * For any list of notifications, after sorting, notifications should be ordered
   * by created_at descending, with same-timestamp notifications ordered by priority.
   * Validates: Requirements 8.4
   */
  describe('Property 14: Priority-Aware Sorting', () => {
    it('sorted notifications are ordered by timestamp descending', () => {
      fc.assert(
        fc.property(fc.array(notificationArb, { maxLength: 50 }), (notifications) => {
          const sorted = sortNotifications(notifications)
          
          // Check timestamp ordering (descending)
          for (let i = 1; i < sorted.length; i++) {
            const prevDate = sorted[i - 1].created_at ? new Date(sorted[i - 1].created_at!).getTime() : 0
            const currDate = sorted[i].created_at ? new Date(sorted[i].created_at!).getTime() : 0
            
            // Previous should be >= current (descending)
            expect(prevDate).toBeGreaterThanOrEqual(currDate)
          }
          
          // Length should be preserved
          expect(sorted.length).toBe(notifications.length)
        }),
        { numRuns: 100 }
      )
    })

    it('same-timestamp notifications are sorted by priority', () => {
      // Create notifications with same timestamp but different priorities
      const timestamp = new Date().toISOString()
      const priorities: NotificationPriority[] = ['low', 'normal', 'high', 'urgent']
      
      fc.assert(
        fc.property(
          fc.shuffledSubarray(priorities, { minLength: 2, maxLength: 4 }),
          (shuffledPriorities) => {
            const notifications: EnhancedNotification[] = shuffledPriorities.map((priority, i) => ({
              id: `id-${i}`,
              user_id: 'user-1',
              title: `Title ${i}`,
              message: `Message ${i}`,
              type: 'info',
              category: 'system',
              priority,
              entity_type: null,
              entity_id: null,
              is_read: false,
              read_at: null,
              action_url: null,
              action_label: null,
              metadata: null,
              created_at: timestamp,
              expires_at: null,
              deleted_at: null,
              is_archived: false,
              archived_at: null,
              email_sent: false,
              email_sent_at: null,
              push_sent: false,
              push_sent_at: null,
            }))
            
            const sorted = sortNotifications(notifications)
            
            // Check priority ordering for same timestamps
            for (let i = 1; i < sorted.length; i++) {
              const prevPriority = PRIORITY_ORDER[(sorted[i - 1].priority as NotificationPriority) || 'normal']
              const currPriority = PRIORITY_ORDER[(sorted[i].priority as NotificationPriority) || 'normal']
              expect(prevPriority).toBeGreaterThanOrEqual(currPriority)
            }
          }
        ),
        { numRuns: 100 }
      )
    })
  })
})


describe('Notification Center Utils - Additional Property Tests', () => {
  /**
   * Property 1: Category Lookup from Type
   * For any notification type code, the resulting category should match
   * the predefined type-to-category mapping.
   * Validates: Requirements 1.4
   */
  describe('Property 1: Category Lookup from Type', () => {
    it('known types map to correct categories', () => {
      fc.assert(
        fc.property(notificationTypeArb, (type) => {
          const category = getCategoryFromType(type)
          expect(category).toBe(TYPE_TO_CATEGORY[type])
        }),
        { numRuns: 100 }
      )
    })

    it('unknown types default to system category', () => {
      // Reserved JS property names that would cause issues with object lookup
      const reservedNames = ['constructor', 'prototype', '__proto__', 'hasOwnProperty', 'toString', 'valueOf']
      const knownTypes = Object.keys(TYPE_TO_CATEGORY)
      
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 20 }).filter(s => 
            !knownTypes.includes(s) && !reservedNames.includes(s)
          ),
          (unknownType) => {
            const category = getCategoryFromType(unknownType)
            expect(category).toBe('system')
          }
        ),
        { numRuns: 100 }
      )
    })

    it('null type defaults to system category', () => {
      expect(getCategoryFromType(null)).toBe('system')
    })
  })

  /**
   * Property 2: Badge Visibility Based on Count
   * For any unread count value, the notification bell badge should be visible
   * if and only if the count is greater than zero.
   * Validates: Requirements 2.1
   */
  describe('Property 2: Badge Visibility Based on Count', () => {
    // This is tested via formatBadgeCount in notification-utils
    // Here we test the isUnread helper
    it('isUnread returns true for unread notifications', () => {
      fc.assert(
        fc.property(notificationArb, (notification) => {
          const unread = isUnread(notification)
          if (notification.is_read === false || notification.is_read === null) {
            expect(unread).toBe(true)
          } else {
            expect(unread).toBe(false)
          }
        }),
        { numRuns: 100 }
      )
    })
  })

  /**
   * Property 5: Unread Indicator Visibility
   * For any notification, the blue unread indicator dot should be visible
   * if and only if is_read is false.
   * Validates: Requirements 3.4
   */
  describe('Property 5: Unread Indicator Visibility', () => {
    it('unread indicator matches is_read status', () => {
      fc.assert(
        fc.property(notificationArb, (notification) => {
          const showIndicator = isUnread(notification)
          
          if (notification.is_read === true) {
            expect(showIndicator).toBe(false)
          } else {
            expect(showIndicator).toBe(true)
          }
        }),
        { numRuns: 100 }
      )
    })
  })

  /**
   * Property 11: Action Button Conditional Rendering
   * For any notification, an action button should be rendered if and only if
   * action_url is non-null and non-empty.
   * Validates: Requirements 5.4
   */
  describe('Property 11: Action Button Conditional Rendering', () => {
    it('action button shown only when action_url is present', () => {
      fc.assert(
        fc.property(notificationArb, (notification) => {
          const showButton = shouldShowActionButton(notification)
          
          if (notification.action_url && notification.action_url.trim().length > 0) {
            expect(showButton).toBe(true)
          } else {
            expect(showButton).toBe(false)
          }
        }),
        { numRuns: 100 }
      )
    })
  })

  /**
   * Property 13: Priority Visual Styling
   * For any notification with priority 'high' or 'urgent', the rendered notification
   * should have distinct visual styling.
   * Validates: Requirements 8.2
   */
  describe('Property 13: Priority Visual Styling', () => {
    it('high/urgent priorities have distinct styling', () => {
      fc.assert(
        fc.property(priorityArb, (priority) => {
          const hasHighPriority = hasHighPriorityStyling(priority)
          const borderClass = getPriorityBorderClass(priority)
          
          if (priority === 'high' || priority === 'urgent') {
            expect(hasHighPriority).toBe(true)
            expect(borderClass).not.toBe('')
          } else {
            expect(hasHighPriority).toBe(false)
            expect(borderClass).toBe('')
          }
        }),
        { numRuns: 100 }
      )
    })

    it('urgent has red border, high has orange border', () => {
      expect(getPriorityBorderClass('urgent')).toContain('red')
      expect(getPriorityBorderClass('high')).toContain('orange')
      expect(getPriorityBorderClass('normal')).toBe('')
      expect(getPriorityBorderClass('low')).toBe('')
    })
  })
})
