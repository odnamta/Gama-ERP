'use client'

import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatBadgeCount } from '@/lib/notifications/notification-utils'
import { cn } from '@/lib/utils'

interface NotificationBellProps {
  unreadCount: number
  onClick?: () => void
  className?: string
}

export function NotificationBell({ unreadCount, onClick, className }: NotificationBellProps) {
  const badgeText = formatBadgeCount(unreadCount)

  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn('relative', className)}
      onClick={onClick}
      aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
    >
      <Bell className="h-5 w-5" />
      {badgeText && (
        <span
          className={cn(
            'absolute -top-1 -right-1 flex items-center justify-center',
            'min-w-[18px] h-[18px] px-1 rounded-full',
            'bg-red-500 text-white text-[10px] font-medium',
            'animate-in fade-in zoom-in duration-200'
          )}
        >
          {badgeText}
        </span>
      )}
    </Button>
  )
}
