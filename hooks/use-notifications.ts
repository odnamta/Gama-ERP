'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Notification, NotificationFilters } from '@/types/notifications'

interface UseNotificationsOptions {
  limit?: number
  unreadOnly?: boolean
}

interface UseNotificationsReturn {
  notifications: Notification[]
  unreadCount: number
  isLoading: boolean
  error: Error | null
  markAsRead: (id: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  refresh: () => Promise<void>
}

export function useNotifications(options?: UseNotificationsOptions): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [userProfileId, setUserProfileId] = useState<string | null>(null)

  const supabase = createClient()

  // Get user profile ID
  useEffect(() => {
    async function getUserProfileId() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (profile) {
        setUserProfileId(profile.id)
      }
    }

    getUserProfileId()
  }, [supabase])

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    if (!userProfileId) return

    setIsLoading(true)
    setError(null)

    try {
      let query = supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userProfileId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })

      if (options?.unreadOnly) {
        query = query.eq('is_read', false)
      }

      if (options?.limit) {
        query = query.limit(options.limit)
      }

      const { data, error: fetchError } = await query

      if (fetchError) throw fetchError

      setNotifications(data || [])
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch notifications'))
    } finally {
      setIsLoading(false)
    }
  }, [userProfileId, options?.limit, options?.unreadOnly, supabase])

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    if (!userProfileId) return

    try {
      const { count, error: countError } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userProfileId)
        .eq('is_read', false)
        .is('deleted_at', null)

      if (countError) throw countError

      setUnreadCount(count || 0)
    } catch (err) {
      console.error('Failed to fetch unread count:', err)
    }
  }, [userProfileId, supabase])

  // Initial fetch
  useEffect(() => {
    if (userProfileId) {
      fetchNotifications()
      fetchUnreadCount()
    }
  }, [userProfileId, fetchNotifications, fetchUnreadCount])

  // Mark single notification as read
  const markAsRead = useCallback(
    async (id: string) => {
      try {
        const { error: updateError } = await supabase
          .from('notifications')
          .update({
            is_read: true,
            read_at: new Date().toISOString(),
          })
          .eq('id', id)

        if (updateError) throw updateError

        // Update local state
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n
          )
        )
        setUnreadCount((prev) => Math.max(0, prev - 1))
      } catch (err) {
        console.error('Failed to mark notification as read:', err)
        throw err
      }
    },
    [supabase]
  )

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    if (!userProfileId) return

    try {
      const { error: updateError } = await supabase
        .from('notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq('user_id', userProfileId)
        .eq('is_read', false)
        .is('deleted_at', null)

      if (updateError) throw updateError

      // Update local state
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
      )
      setUnreadCount(0)
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err)
      throw err
    }
  }, [userProfileId, supabase])

  // Refresh function
  const refresh = useCallback(async () => {
    await Promise.all([fetchNotifications(), fetchUnreadCount()])
  }, [fetchNotifications, fetchUnreadCount])

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    refresh,
  }
}
