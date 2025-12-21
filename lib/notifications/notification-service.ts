import { createClient } from '@/lib/supabase/server'
import {
  Notification,
  CreateNotificationParams,
  CreateBulkNotificationParams,
  NotificationFilters,
  NotificationRecipients,
} from '@/types/notifications'
import { Json } from '@/types/database'
import { shouldNotify } from './notification-preferences'
import { getCategoryFromType } from './notification-center-utils'

/**
 * Create a single notification for a user
 * Respects user notification preferences
 */
export async function createNotification(
  params: CreateNotificationParams
): Promise<Notification | null> {
  // Check user preferences before creating
  const shouldCreate = await shouldNotify(params.userId, params.type)
  if (!shouldCreate) {
    return null
  }

  const supabase = await createClient()
  const category = getCategoryFromType(params.type)

  const { data, error } = await supabase
    .from('notifications')
    .insert({
      user_id: params.userId,
      title: params.title,
      message: params.message,
      type: params.type,
      category: category,
      priority: params.priority || 'normal',
      entity_type: params.entityType || null,
      entity_id: params.entityId || null,
      action_url: params.actionUrl || null,
      expires_at: params.expiresAt?.toISOString() || null,
      metadata: (params.metadata || {}) as Json,
    })
    .select()
    .single()

  if (error) {
    console.error('Failed to create notification:', error)
    return null
  }

  return data
}

/**
 * Create notifications for multiple users based on user IDs or role filter
 */
export async function createBulkNotifications(
  params: CreateBulkNotificationParams,
  recipients: NotificationRecipients
): Promise<Notification[]> {
  const supabase = await createClient()

  let userIds: string[] = []

  // Get user IDs from roles if specified
  if (recipients.roles && recipients.roles.length > 0) {
    const { data: users, error } = await supabase
      .from('user_profiles')
      .select('id')
      .in('role', recipients.roles)
      .eq('is_active', true)

    if (error) {
      console.error('Failed to fetch users by role:', error)
      return []
    }

    userIds = users?.map((u) => u.id) || []
  }

  // Add specific user IDs if provided
  if (recipients.userIds && recipients.userIds.length > 0) {
    userIds = [...new Set([...userIds, ...recipients.userIds])]
  }

  if (userIds.length === 0) {
    return []
  }

  // Filter out users who have disabled this notification type
  const filteredUserIds: string[] = []
  for (const userId of userIds) {
    const shouldCreate = await shouldNotify(userId, params.type)
    if (shouldCreate) {
      filteredUserIds.push(userId)
    }
  }

  if (filteredUserIds.length === 0) {
    return []
  }

  const category = getCategoryFromType(params.type)

  // Create notifications for filtered users
  const notifications = filteredUserIds.map((userId) => ({
    user_id: userId,
    title: params.title,
    message: params.message,
    type: params.type as string,
    category: category,
    priority: (params.priority || 'normal') as string,
    entity_type: (params.entityType || null) as string | null,
    entity_id: params.entityId || null,
    action_url: params.actionUrl || null,
    expires_at: params.expiresAt?.toISOString() || null,
    metadata: (params.metadata || {}) as Json,
  }))

  const { data, error } = await supabase
    .from('notifications')
    .insert(notifications)
    .select()

  if (error) {
    console.error('Failed to create bulk notifications:', error)
    return []
  }

  return data || []
}

/**
 * Get notifications for a user with optional filters
 */
export async function getNotifications(
  userId: string,
  filters?: NotificationFilters
): Promise<Notification[]> {
  const supabase = await createClient()

  let query = supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (filters?.isRead !== undefined) {
    query = query.eq('is_read', filters.isRead)
  }

  if (filters?.type) {
    query = query.eq('type', filters.type)
  }

  if (filters?.startDate) {
    query = query.gte('created_at', filters.startDate.toISOString())
  }

  if (filters?.endDate) {
    query = query.lte('created_at', filters.endDate.toISOString())
  }

  // Apply pagination
  const limit = filters?.limit || 25
  const offset = filters?.offset || 0
  query = query.range(offset, offset + limit - 1)

  const { data, error } = await query

  if (error) {
    console.error('Failed to fetch notifications:', error)
    return []
  }

  return data || []
}

/**
 * Get unread notification count for a user
 */
export async function getUnreadCount(userId: string): Promise<number> {
  const supabase = await createClient()

  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false)
    .is('deleted_at', null)

  if (error) {
    console.error('Failed to get unread count:', error)
    return 0
  }

  return count || 0
}

/**
 * Mark a notification as read
 */
export async function markAsRead(notificationId: string): Promise<boolean> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('notifications')
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
    })
    .eq('id', notificationId)

  if (error) {
    console.error('Failed to mark notification as read:', error)
    return false
  }

  return true
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllAsRead(userId: string): Promise<boolean> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('notifications')
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .eq('is_read', false)
    .is('deleted_at', null)

  if (error) {
    console.error('Failed to mark all notifications as read:', error)
    return false
  }

  return true
}

/**
 * Soft delete a notification
 */
export async function deleteNotification(notificationId: string): Promise<boolean> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('notifications')
    .update({
      deleted_at: new Date().toISOString(),
    })
    .eq('id', notificationId)

  if (error) {
    console.error('Failed to delete notification:', error)
    return false
  }

  return true
}

/**
 * Cleanup old notifications
 * - Deletes expired notifications
 * - Deletes read notifications older than 30 days
 * - Deletes unread notifications older than 90 days
 */
export async function cleanupOldNotifications(): Promise<number> {
  const supabase = await createClient()
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)

  let deletedCount = 0

  // Delete expired notifications
  const { data: expired } = await supabase
    .from('notifications')
    .update({ deleted_at: now.toISOString() })
    .lt('expires_at', now.toISOString())
    .is('deleted_at', null)
    .select('id')

  deletedCount += expired?.length || 0

  // Delete read notifications older than 30 days
  const { data: oldRead } = await supabase
    .from('notifications')
    .update({ deleted_at: now.toISOString() })
    .eq('is_read', true)
    .lt('created_at', thirtyDaysAgo.toISOString())
    .is('deleted_at', null)
    .select('id')

  deletedCount += oldRead?.length || 0

  // Delete unread notifications older than 90 days
  const { data: oldUnread } = await supabase
    .from('notifications')
    .update({ deleted_at: now.toISOString() })
    .eq('is_read', false)
    .lt('created_at', ninetyDaysAgo.toISOString())
    .is('deleted_at', null)
    .select('id')

  deletedCount += oldUnread?.length || 0

  return deletedCount
}

/**
 * Get users by permission for notification routing
 */
export async function getUsersByPermission(
  permission: string
): Promise<{ id: string; email: string }[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('user_profiles')
    .select('id, email')
    .eq(permission, true)
    .eq('is_active', true)

  if (error) {
    console.error('Failed to get users by permission:', error)
    return []
  }

  return data || []
}

/**
 * Get users by roles for notification routing
 */
export async function getUsersByRoles(
  roles: string[]
): Promise<{ id: string; email: string; role: string }[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('user_profiles')
    .select('id, email, role')
    .in('role', roles)
    .eq('is_active', true)

  if (error) {
    console.error('Failed to get users by roles:', error)
    return []
  }

  return data || []
}
