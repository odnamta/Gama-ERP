'use client'

import { EnhancedNotification } from '@/types/notification-center'
import {
  formatRelativeTime,
  getNotificationIcon,
  getNotificationIconColor,
  truncateMessage,
  shouldPulse,
} from '@/lib/notifications/notification-utils'
import {
  isUnread,
  getPriorityBorderClass,
  shouldShowActionButton,
  hasHighPriorityStyling,
} from '@/lib/notifications/notification-center-utils'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  ClipboardCheck,
  AlertTriangle,
  RefreshCw,
  Clock,
  Info,
  Bell,
  ChevronRight,
  Archive,
  Check,
  ExternalLink,
} from 'lucide-react'

interface NotificationItemEnhancedProps {
  notification: EnhancedNotification
  variant?: 'dropdown' | 'page'
  onMarkAsRead?: (id: string) => void
  onArchive?: (id: string) => void
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

export function NotificationItemEnhanced({
  notification,
  variant = 'dropdown',
  onMarkAsRead,
  onArchive,
  onClick,
}: NotificationItemEnhancedProps) {
  const iconName = getNotificationIcon(notification.type)
  const iconColor = getNotificationIconColor(notification.type, notification.priority)
  const Icon = iconMap[iconName] || Bell
  const isPulsing = shouldPulse(notification.priority)
  const unread = isUnread(notification)
  const priorityBorder = getPriorityBorderClass(notification.priority)
  const showAction = shouldShowActionButton(notification)
  const highPriority = hasHighPriorityStyling(notification.priority)

  const handleClick = () => {
    if (unread && onMarkAsRead) {
      onMarkAsRead(notification.id)
    }
    onClick?.()
  }

  const handleMarkAsRead = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onMarkAsRead) {
      onMarkAsRead(notification.id)
    }
  }

  const handleArchive = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onArchive) {
      onArchive(notification.id)
    }
  }


  if (variant === 'dropdown') {
    return (
      <div
        className={cn(
          'flex items-start gap-3 p-3 hover:bg-muted/50 cursor-pointer transition-colors',
          unread && 'bg-blue-50/50 dark:bg-blue-950/20',
          priorityBorder
        )}
        onClick={handleClick}
      >
        <div className={cn('relative mt-0.5', isPulsing && 'animate-pulse')}>
          <Icon className={cn('h-5 w-5', iconColor)} />
          {unread && (
            <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-blue-500" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className={cn('text-sm font-medium', unread && 'font-semibold')}>
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

  // Page variant - more detailed with action buttons
  return (
    <div
      className={cn(
        'flex items-start gap-4 p-4 border-b hover:bg-muted/50 cursor-pointer transition-colors',
        unread && 'bg-blue-50/50 dark:bg-blue-950/20',
        priorityBorder
      )}
      onClick={handleClick}
    >
      <div className={cn('relative', isPulsing && 'animate-pulse')}>
        <Icon className={cn('h-6 w-6', iconColor)} />
        {unread && (
          <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-blue-500" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <p className={cn('text-sm font-medium', unread && 'font-semibold')}>
              {notification.title}
            </p>
            {highPriority && (
              <span
                className={cn(
                  'text-[10px] px-1.5 py-0.5 rounded-full font-medium',
                  notification.priority === 'urgent'
                    ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                )}
              >
                {notification.priority === 'urgent' ? 'Urgent' : 'High'}
              </span>
            )}
          </div>
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {formatRelativeTime(notification.created_at)}
          </span>
        </div>
        <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>

        {/* Action buttons */}
        <div className="flex items-center gap-2 mt-3">
          {showAction && (
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={(e) => {
                e.stopPropagation()
                if (notification.action_url) {
                  window.location.href = notification.action_url
                }
              }}
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              {notification.action_label || 'View'}
            </Button>
          )}
          {unread && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={handleMarkAsRead}
            >
              <Check className="h-3 w-3 mr-1" />
              Mark Read
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-muted-foreground"
            onClick={handleArchive}
          >
            <Archive className="h-3 w-3 mr-1" />
            Archive
          </Button>
        </div>
      </div>
    </div>
  )
}
