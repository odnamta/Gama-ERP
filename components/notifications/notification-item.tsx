'use client'

import { Notification } from '@/types/notifications'
import {
  formatRelativeTime,
  getNotificationIcon,
  getNotificationIconColor,
  truncateMessage,
  shouldPulse,
} from '@/lib/notifications/notification-utils'
import { cn } from '@/lib/utils'
import {
  ClipboardCheck,
  AlertTriangle,
  RefreshCw,
  Clock,
  Info,
  Bell,
  ChevronRight,
} from 'lucide-react'

interface NotificationItemProps {
  notification: Notification
  variant?: 'dropdown' | 'page'
  onMarkAsRead?: (id: string) => void
  onClick?: () => void
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  ClipboardCheck,
  AlertTriangle,
  RefreshCw,
  Clock,
  Info,
  Bell,
}

export function NotificationItem({
  notification,
  variant = 'dropdown',
  onMarkAsRead,
  onClick,
}: NotificationItemProps) {
  const iconName = getNotificationIcon(notification.type)
  const iconColor = getNotificationIconColor(notification.type, notification.priority)
  const Icon = iconMap[iconName] || Bell
  const isPulsing = shouldPulse(notification.priority)

  const handleClick = () => {
    if (!notification.is_read && onMarkAsRead) {
      onMarkAsRead(notification.id)
    }
    onClick?.()
  }

  if (variant === 'dropdown') {
    return (
      <div
        className={cn(
          'flex items-start gap-3 p-3 hover:bg-muted/50 cursor-pointer transition-colors',
          !notification.is_read && 'bg-blue-50/50 dark:bg-blue-950/20'
        )}
        onClick={handleClick}
      >
        <div className={cn('relative mt-0.5', isPulsing && 'animate-pulse')}>
          <Icon className={cn('h-5 w-5', iconColor)} />
          {!notification.is_read && (
            <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-blue-500" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className={cn('text-sm font-medium', !notification.is_read && 'font-semibold')}>
            {notification.title}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
            {truncateMessage(notification.message, 80)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {formatRelativeTime(notification.created_at)}
          </p>
        </div>
        {notification.action_url && <ChevronRight className="h-4 w-4 text-muted-foreground mt-1" />}
      </div>
    )
  }

  // Page variant - more detailed
  return (
    <div
      className={cn(
        'flex items-start gap-4 p-4 border-b hover:bg-muted/50 cursor-pointer transition-colors',
        !notification.is_read && 'bg-blue-50/50 dark:bg-blue-950/20'
      )}
      onClick={handleClick}
    >
      <div className={cn('relative', isPulsing && 'animate-pulse')}>
        <Icon className={cn('h-6 w-6', iconColor)} />
        {!notification.is_read && (
          <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-blue-500" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className={cn('text-sm font-medium', !notification.is_read && 'font-semibold')}>
            {notification.title}
          </p>
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {formatRelativeTime(notification.created_at)}
          </span>
        </div>
        <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
        {notification.action_url && (
          <p className="text-xs text-blue-500 mt-2 flex items-center gap-1">
            View details <ChevronRight className="h-3 w-3" />
          </p>
        )}
      </div>
    </div>
  )
}
