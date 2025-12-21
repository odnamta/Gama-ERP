'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Notification, NotificationType } from '@/types/notifications'
import { NotificationItem } from '@/components/notifications/notification-item'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CheckCheck, Trash2, Loader2, Bell } from 'lucide-react'

const PAGE_SIZE = 25

const TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: 'all', label: 'All Types' },
  { value: 'approval', label: 'Approvals' },
  { value: 'budget_alert', label: 'Budget Alerts' },
  { value: 'status_change', label: 'Status Changes' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'system', label: 'System' },
]

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: 'all', label: 'All Status' },
  { value: 'unread', label: 'Unread' },
  { value: 'read', label: 'Read' },
]

export default function NotificationsPage() {
  const router = useRouter()
  const supabase = createClient()

  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [userProfileId, setUserProfileId] = useState<string | null>(null)
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

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

    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userProfileId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

    if (typeFilter !== 'all') {
      query = query.eq('type', typeFilter)
    }

    if (statusFilter === 'unread') {
      query = query.eq('is_read', false)
    } else if (statusFilter === 'read') {
      query = query.eq('is_read', true)
    }

    const { data, error } = await query

    if (error) {
      console.error('Failed to fetch notifications:', error)
    } else {
      if (page === 0) {
        setNotifications(data || [])
      } else {
        setNotifications((prev) => [...prev, ...(data || [])])
      }
      setHasMore((data?.length || 0) === PAGE_SIZE)
    }

    setIsLoading(false)
  }, [userProfileId, typeFilter, statusFilter, page, supabase])

  useEffect(() => {
    if (userProfileId) {
      fetchNotifications()
    }
  }, [userProfileId, fetchNotifications])

  // Reset page when filters change
  useEffect(() => {
    setPage(0)
    setNotifications([])
  }, [typeFilter, statusFilter])

  const handleMarkAsRead = async (id: string) => {
    await supabase
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', id)

    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n))
    )
  }

  const handleMarkSelectedAsRead = async () => {
    if (selectedIds.size === 0) return

    await supabase
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .in('id', Array.from(selectedIds))

    setNotifications((prev) =>
      prev.map((n) =>
        selectedIds.has(n.id) ? { ...n, is_read: true, read_at: new Date().toISOString() } : n
      )
    )
    setSelectedIds(new Set())
  }

  const handleDeleteOld = async () => {
    if (!userProfileId) return

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    await supabase
      .from('notifications')
      .update({ deleted_at: new Date().toISOString() })
      .eq('user_id', userProfileId)
      .eq('is_read', true)
      .lt('created_at', thirtyDaysAgo.toISOString())

    // Refresh the list
    setPage(0)
    setNotifications([])
    fetchNotifications()
  }

  const handleNotificationClick = (notification: Notification) => {
    if (notification.action_url) {
      router.push(notification.action_url)
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Notifications</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkSelectedAsRead}
            disabled={selectedIds.size === 0}
          >
            <CheckCheck className="h-4 w-4 mr-1" />
            Mark Selected Read
          </Button>
          <Button variant="outline" size="sm" onClick={handleDeleteOld}>
            <Trash2 className="h-4 w-4 mr-1" />
            Delete Old
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            {TYPE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="bg-card rounded-lg border">
        {isLoading && notifications.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Bell className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No notifications</p>
            <p className="text-sm text-muted-foreground mt-1">
              You&apos;re all caught up! Check back later.
            </p>
          </div>
        ) : (
          <>
            {notifications.map((notification) => (
              <div key={notification.id} className="flex items-start">
                <input
                  type="checkbox"
                  checked={selectedIds.has(notification.id)}
                  onChange={() => toggleSelect(notification.id)}
                  className="mt-5 ml-4"
                />
                <div className="flex-1">
                  <NotificationItem
                    notification={notification}
                    variant="page"
                    onMarkAsRead={handleMarkAsRead}
                    onClick={() => handleNotificationClick(notification)}
                  />
                </div>
              </div>
            ))}

            {hasMore && (
              <div className="p-4 text-center border-t">
                <Button
                  variant="outline"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Load More
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
