'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  EnhancedNotification,
  NotificationCenterFilters,
  NotificationGroup,
} from '@/types/notification-center'
import {
  groupNotificationsByReadStatus,
  groupNotificationsByDate,
  filterNotifications,
  sortNotifications,
} from '@/lib/notifications/notification-center-utils'
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js'

interface UseNotificationsEnhancedOptions {
  limit?: number
  enableRealtime?: boolean
  enableSound?: boolean
  enableDesktopNotifications?: boolean
  groupBy?: 'status' | 'date'
}

interface UseNotificationsEnhancedReturn {
  notifications: EnhancedNotification[]
  groupedNotifications: NotificationGroup[]
  unreadCount: number
  totalCount: number
  isLoading: boolean
  error: Error | null
  filters: NotificationCenterFilters
  setFilters: (filters: NotificationCenterFilters) => void
  markAsRead: (id: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  archiveNotification: (id: string) => Promise<void>
  archiveAllRead: () => Promise<void>
  refresh: () => Promise<void>
  loadMore: () => Promise<void>
  hasMore: boolean
}

const DEFAULT_FILTERS: NotificationCenterFilters = {
  status: 'all',
  category: 'all',
  priority: 'all',
  searchQuery: '',
}

const PAGE_SIZE = 25

// Notification sound (base64 encoded short beep)
const NOTIFICATION_SOUND_URL = '/sounds/notification.mp3'

export function useNotificationsEnhanced(
  options?: UseNotificationsEnhancedOptions
): UseNotificationsEnhancedReturn {
  const [notifications, setNotifications] = useState<EnhancedNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [userProfileId, setUserProfileId] = useState<string | null>(null)
  const [filters, setFilters] = useState<NotificationCenterFilters>(DEFAULT_FILTERS)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const supabase = createClient()

  const {
    limit = PAGE_SIZE,
    enableRealtime = true,
    enableSound = false,
    enableDesktopNotifications = false,
    groupBy = 'status',
  } = options || {}

  // Initialize audio element
  useEffect(() => {
    if (enableSound && typeof window !== 'undefined') {
      audioRef.current = new Audio(NOTIFICATION_SOUND_URL)
      audioRef.current.volume = 0.5
    }
    return () => {
      audioRef.current = null
    }
  }, [enableSound])


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

  // Play notification sound
  const playNotificationSound = useCallback(() => {
    if (enableSound && audioRef.current) {
      audioRef.current.currentTime = 0
      audioRef.current.play().catch(() => {
        // Ignore autoplay errors
      })
    }
  }, [enableSound])

  // Show desktop notification
  const showDesktopNotification = useCallback(
    (notification: EnhancedNotification) => {
      if (!enableDesktopNotifications || typeof window === 'undefined') return
      if (!('Notification' in window)) return
      if (Notification.permission !== 'granted') return

      new Notification(notification.title || 'New Notification', {
        body: notification.message || '',
        icon: '/favicon.ico',
        tag: notification.id,
      })
    },
    [enableDesktopNotifications]
  )

  // Request desktop notification permission
  useEffect(() => {
    if (enableDesktopNotifications && typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission()
      }
    }
  }, [enableDesktopNotifications])

  // Fetch notifications
  const fetchNotifications = useCallback(
    async (resetPage = false) => {
      if (!userProfileId) return

      setIsLoading(true)
      setError(null)

      try {
        const currentPage = resetPage ? 0 : page
        const offset = currentPage * limit

        let query = supabase
          .from('notifications')
          .select('*', { count: 'exact' })
          .eq('user_id', userProfileId)
          .eq('is_archived', false)
          .is('deleted_at', null)
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1)

        // Apply filters at database level for efficiency
        if (filters.status === 'unread') {
          query = query.eq('is_read', false)
        } else if (filters.status === 'read') {
          query = query.eq('is_read', true)
        }

        if (filters.category !== 'all') {
          query = query.eq('category', filters.category)
        }

        if (filters.priority !== 'all') {
          query = query.eq('priority', filters.priority)
        }

        if (filters.searchQuery.trim()) {
          const searchTerm = `%${filters.searchQuery.trim()}%`
          query = query.or(`title.ilike.${searchTerm},message.ilike.${searchTerm}`)
        }

        const { data, count, error: fetchError } = await query

        if (fetchError) throw fetchError

        const fetchedNotifications = (data || []) as EnhancedNotification[]

        if (resetPage || currentPage === 0) {
          setNotifications(fetchedNotifications)
          setPage(0)
        } else {
          setNotifications((prev) => [...prev, ...fetchedNotifications])
        }

        setTotalCount(count || 0)
        setHasMore(fetchedNotifications.length === limit)
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch notifications'))
      } finally {
        setIsLoading(false)
      }
    },
    [userProfileId, filters, page, limit, supabase]
  )

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    if (!userProfileId) return

    try {
      const { count, error: countError } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userProfileId)
        .eq('is_read', false)
        .eq('is_archived', false)
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
      fetchNotifications(true)
      fetchUnreadCount()
    }
  }, [userProfileId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Refetch when filters change
  useEffect(() => {
    if (userProfileId) {
      fetchNotifications(true)
    }
  }, [filters]) // eslint-disable-line react-hooks/exhaustive-deps


  // Real-time subscription
  useEffect(() => {
    if (!userProfileId || !enableRealtime) return

    const channel = supabase
      .channel(`notifications:${userProfileId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userProfileId}`,
        },
        (payload: RealtimePostgresChangesPayload<EnhancedNotification>) => {
          const newNotification = payload.new as EnhancedNotification

          // Add to the beginning of the list
          setNotifications((prev) => [newNotification, ...prev])
          setUnreadCount((prev) => prev + 1)
          setTotalCount((prev) => prev + 1)

          // Play sound and show desktop notification
          playNotificationSound()
          showDesktopNotification(newNotification)
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userProfileId}`,
        },
        (payload: RealtimePostgresChangesPayload<EnhancedNotification>) => {
          const updatedNotification = payload.new as EnhancedNotification

          setNotifications((prev) =>
            prev.map((n) => (n.id === updatedNotification.id ? updatedNotification : n))
          )

          // Recalculate unread count
          fetchUnreadCount()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [
    userProfileId,
    enableRealtime,
    supabase,
    playNotificationSound,
    showDesktopNotification,
    fetchUnreadCount,
  ])

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

        // Optimistic update
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
        .eq('is_archived', false)
        .is('deleted_at', null)

      if (updateError) throw updateError

      // Optimistic update
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
      )
      setUnreadCount(0)
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err)
      throw err
    }
  }, [userProfileId, supabase])

  // Archive single notification
  const archiveNotification = useCallback(
    async (id: string) => {
      try {
        const { error: updateError } = await supabase
          .from('notifications')
          .update({
            is_archived: true,
            archived_at: new Date().toISOString(),
          })
          .eq('id', id)

        if (updateError) throw updateError

        // Remove from list
        setNotifications((prev) => prev.filter((n) => n.id !== id))
        setTotalCount((prev) => Math.max(0, prev - 1))

        // Update unread count if it was unread
        const notification = notifications.find((n) => n.id === id)
        if (notification && !notification.is_read) {
          setUnreadCount((prev) => Math.max(0, prev - 1))
        }
      } catch (err) {
        console.error('Failed to archive notification:', err)
        throw err
      }
    },
    [supabase, notifications]
  )

  // Archive all read notifications
  const archiveAllRead = useCallback(async () => {
    if (!userProfileId) return

    try {
      const { error: updateError } = await supabase
        .from('notifications')
        .update({
          is_archived: true,
          archived_at: new Date().toISOString(),
        })
        .eq('user_id', userProfileId)
        .eq('is_read', true)
        .eq('is_archived', false)
        .is('deleted_at', null)

      if (updateError) throw updateError

      // Remove read notifications from list
      setNotifications((prev) => prev.filter((n) => !n.is_read))
      setTotalCount((prev) => Math.max(0, prev - notifications.filter((n) => n.is_read).length))
    } catch (err) {
      console.error('Failed to archive all read notifications:', err)
      throw err
    }
  }, [userProfileId, supabase, notifications])

  // Refresh function
  const refresh = useCallback(async () => {
    setPage(0)
    await Promise.all([fetchNotifications(true), fetchUnreadCount()])
  }, [fetchNotifications, fetchUnreadCount])

  // Load more function
  const loadMore = useCallback(async () => {
    if (!hasMore || isLoading) return
    setPage((p) => p + 1)
  }, [hasMore, isLoading])

  // Trigger fetch when page changes (for load more)
  useEffect(() => {
    if (page > 0 && userProfileId) {
      fetchNotifications(false)
    }
  }, [page]) // eslint-disable-line react-hooks/exhaustive-deps

  // Group notifications based on groupBy option
  const groupedNotifications = (() => {
    const sorted = sortNotifications(notifications)
    if (groupBy === 'date') {
      return groupNotificationsByDate(sorted)
    }
    return groupNotificationsByReadStatus(sorted)
  })()

  return {
    notifications,
    groupedNotifications,
    unreadCount,
    totalCount,
    isLoading,
    error,
    filters,
    setFilters,
    markAsRead,
    markAllAsRead,
    archiveNotification,
    archiveAllRead,
    refresh,
    loadMore,
    hasMore,
  }
}
