import { isToday, isYesterday, parseISO } from 'date-fns'
import {
  EnhancedNotification,
  NotificationGroup,
  NotificationCenterFilters,
  NotificationCategory,
  TYPE_TO_CATEGORY,
  PRIORITY_ORDER,
} from '@/types/notification-center'
import { NotificationPriority } from '@/types/notifications'

/**
 * Group notifications by read status (New/Earlier)
 * New = unread, Earlier = read
 */
export function groupNotificationsByReadStatus(
  notifications: EnhancedNotification[]
): NotificationGroup[] {
  const unread = notifications.filter((n) => !n.is_read)
  const read = notifications.filter((n) => n.is_read)

  const groups: NotificationGroup[] = []

  if (unread.length > 0) {
    groups.push({ label: 'New', notifications: unread })
  }

  if (read.length > 0) {
    groups.push({ label: 'Earlier', notifications: read })
  }

  return groups
}

/**
 * Group notifications by date (Today, Yesterday, Earlier)
 */
export function groupNotificationsByDate(
  notifications: EnhancedNotification[]
): NotificationGroup[] {
  const today: EnhancedNotification[] = []
  const yesterday: EnhancedNotification[] = []
  const earlier: EnhancedNotification[] = []

  for (const notification of notifications) {
    if (!notification.created_at) {
      earlier.push(notification)
      continue
    }

    const date = parseISO(notification.created_at)

    if (isToday(date)) {
      today.push(notification)
    } else if (isYesterday(date)) {
      yesterday.push(notification)
    } else {
      earlier.push(notification)
    }
  }

  const groups: NotificationGroup[] = []

  if (today.length > 0) {
    groups.push({ label: 'Today', notifications: today })
  }

  if (yesterday.length > 0) {
    groups.push({ label: 'Yesterday', notifications: yesterday })
  }

  if (earlier.length > 0) {
    groups.push({ label: 'Earlier', notifications: earlier })
  }

  return groups
}

/**
 * Filter notifications based on filter criteria
 */
export function filterNotifications(
  notifications: EnhancedNotification[],
  filters: NotificationCenterFilters
): EnhancedNotification[] {
  return notifications.filter((notification) => {
    // Status filter
    if (filters.status === 'unread' && notification.is_read) {
      return false
    }
    if (filters.status === 'read' && !notification.is_read) {
      return false
    }

    // Category filter
    if (filters.category !== 'all' && notification.category !== filters.category) {
      return false
    }

    // Priority filter
    if (filters.priority !== 'all' && notification.priority !== filters.priority) {
      return false
    }

    // Search filter
    if (filters.searchQuery.trim()) {
      const query = filters.searchQuery.toLowerCase().trim()
      const titleMatch = notification.title?.toLowerCase().includes(query)
      const messageMatch = notification.message?.toLowerCase().includes(query)
      if (!titleMatch && !messageMatch) {
        return false
      }
    }

    return true
  })
}

/**
 * Search notifications by title or message
 */
export function searchNotifications(
  notifications: EnhancedNotification[],
  query: string
): EnhancedNotification[] {
  if (!query.trim()) {
    return notifications
  }

  const searchTerm = query.toLowerCase().trim()

  return notifications.filter((notification) => {
    const titleMatch = notification.title?.toLowerCase().includes(searchTerm)
    const messageMatch = notification.message?.toLowerCase().includes(searchTerm)
    return titleMatch || messageMatch
  })
}

/**
 * Sort notifications by timestamp (primary) and priority (secondary)
 */
export function sortNotifications(notifications: EnhancedNotification[]): EnhancedNotification[] {
  return [...notifications].sort((a, b) => {
    // Primary sort: by created_at descending (newest first)
    const dateA = a.created_at ? new Date(a.created_at).getTime() : 0
    const dateB = b.created_at ? new Date(b.created_at).getTime() : 0

    if (dateA !== dateB) {
      return dateB - dateA
    }

    // Secondary sort: by priority descending (urgent > high > normal > low)
    const priorityA = PRIORITY_ORDER[(a.priority as NotificationPriority) || 'normal'] || 2
    const priorityB = PRIORITY_ORDER[(b.priority as NotificationPriority) || 'normal'] || 2

    return priorityB - priorityA
  })
}

/**
 * Get category from notification type
 */
export function getCategoryFromType(type: string | null): NotificationCategory {
  if (!type) return 'system'
  // Use Object.hasOwn to safely check if the type exists in the mapping
  return Object.hasOwn(TYPE_TO_CATEGORY, type) ? TYPE_TO_CATEGORY[type] : 'system'
}

/**
 * Check if notification has high priority styling
 */
export function hasHighPriorityStyling(priority: string | null): boolean {
  return priority === 'high' || priority === 'urgent'
}

/**
 * Get priority border color class
 */
export function getPriorityBorderClass(priority: string | null): string {
  switch (priority) {
    case 'urgent':
      return 'border-l-4 border-l-red-500'
    case 'high':
      return 'border-l-4 border-l-orange-500'
    default:
      return ''
  }
}

/**
 * Check if notification should show action button
 */
export function shouldShowActionButton(notification: EnhancedNotification): boolean {
  return !!notification.action_url && notification.action_url.trim().length > 0
}

/**
 * Check if notification is unread
 */
export function isUnread(notification: EnhancedNotification): boolean {
  return notification.is_read === false || notification.is_read === null
}

/**
 * Format notification for display with computed properties
 */
export function formatNotificationForDisplay(notification: EnhancedNotification): EnhancedNotification & {
  isUnread: boolean
  hasHighPriority: boolean
  priorityBorderClass: string
  showActionButton: boolean
} {
  return {
    ...notification,
    isUnread: isUnread(notification),
    hasHighPriority: hasHighPriorityStyling(notification.priority),
    priorityBorderClass: getPriorityBorderClass(notification.priority),
    showActionButton: shouldShowActionButton(notification),
  }
}
