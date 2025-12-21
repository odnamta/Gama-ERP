'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useNotificationsEnhanced } from '@/hooks/use-notifications-enhanced'
import { NotificationItemEnhanced } from '@/components/notifications/notification-item-enhanced'
import { NotificationCenterFilters, NotificationCategory } from '@/types/notification-center'
import { NotificationPriority } from '@/types/notifications'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  CheckCheck,
  Archive,
  Loader2,
  Bell,
  Search,
  Settings,
  RefreshCw,
} from 'lucide-react'
import Link from 'next/link'

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'unread', label: 'Unread' },
  { value: 'read', label: 'Read' },
]

const CATEGORY_OPTIONS: { value: NotificationCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'All Categories' },
  { value: 'finance', label: 'Finance' },
  { value: 'operations', label: 'Operations' },
  { value: 'hr', label: 'HR' },
  { value: 'approvals', label: 'Approvals' },
  { value: 'system', label: 'System' },
]

const PRIORITY_OPTIONS: { value: NotificationPriority | 'all'; label: string }[] = [
  { value: 'all', label: 'All Priorities' },
  { value: 'urgent', label: 'Urgent' },
  { value: 'high', label: 'High' },
  { value: 'normal', label: 'Normal' },
  { value: 'low', label: 'Low' },
]

export default function NotificationsPage() {
  const router = useRouter()
  const [searchInput, setSearchInput] = useState('')

  const {
    groupedNotifications,
    unreadCount,
    totalCount,
    isLoading,
    filters,
    setFilters,
    markAsRead,
    markAllAsRead,
    archiveNotification,
    archiveAllRead,
    refresh,
    loadMore,
    hasMore,
  } = useNotificationsEnhanced({
    enableRealtime: true,
    enableSound: false,
    enableDesktopNotifications: false,
    groupBy: 'date',
  })

  const handleFilterChange = (
    key: keyof NotificationCenterFilters,
    value: string
  ) => {
    setFilters({
      ...filters,
      [key]: value,
    })
  }

  const handleSearch = () => {
    setFilters({
      ...filters,
      searchQuery: searchInput,
    })
  }

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const handleNotificationClick = (actionUrl: string | null) => {
    if (actionUrl) {
      router.push(actionUrl)
    }
  }

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'} · {totalCount} total
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => markAllAsRead()}
            disabled={unreadCount === 0}
          >
            <CheckCheck className="h-4 w-4 mr-1" />
            Mark All Read
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => archiveAllRead()}
          >
            <Archive className="h-4 w-4 mr-1" />
            Archive Read
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => refresh()}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Link href="/notifications/preferences">
            <Button variant="ghost" size="icon">
              <Settings className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search notifications..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            className="pl-9"
          />
        </div>

        <Select
          value={filters.status}
          onValueChange={(value) => handleFilterChange('status', value)}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.category}
          onValueChange={(value) => handleFilterChange('category', value)}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            {CATEGORY_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.priority}
          onValueChange={(value) => handleFilterChange('priority', value)}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            {PRIORITY_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Notification List */}
      <div className="bg-card rounded-lg border">
        {isLoading && groupedNotifications.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : groupedNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Bell className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No notifications</p>
            <p className="text-sm text-muted-foreground mt-1">
              You&apos;re all caught up! Check back later.
            </p>
          </div>
        ) : (
          <>
            {groupedNotifications.map((group) => (
              <div key={group.label}>
                <div className="px-4 py-2 bg-muted/50 border-b">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    {group.label}
                  </h3>
                </div>
                {group.notifications.map((notification) => (
                  <NotificationItemEnhanced
                    key={notification.id}
                    notification={notification}
                    variant="page"
                    onMarkAsRead={markAsRead}
                    onArchive={archiveNotification}
                    onClick={() => handleNotificationClick(notification.action_url)}
                  />
                ))}
              </div>
            ))}

            {hasMore && (
              <div className="p-4 text-center border-t">
                <Button
                  variant="outline"
                  onClick={() => loadMore()}
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
