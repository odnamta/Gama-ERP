'use client'

import { useRouter } from 'next/navigation'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { NotificationBell } from './notification-bell'
import { NotificationItem } from './notification-item'
import { useNotifications } from '@/hooks/use-notifications'
import { CheckCheck, Loader2 } from 'lucide-react'

export function NotificationDropdown() {
  const router = useRouter()
  const { notifications, unreadCount, isLoading, markAsRead, markAllAsRead } = useNotifications({
    limit: 10,
  })

  const handleNotificationClick = (notification: { id: string; action_url: string | null }) => {
    if (notification.action_url) {
      router.push(notification.action_url)
    }
  }

  const handleViewAll = () => {
    router.push('/notifications')
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <div>
          <NotificationBell unreadCount={unreadCount} />
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h4 className="font-semibold text-sm">Notifications</h4>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto py-1 px-2 text-xs"
              onClick={() => markAllAsRead()}
            >
              <CheckCheck className="h-3 w-3 mr-1" />
              Mark all read
            </Button>
          )}
        </div>

        <ScrollArea className="h-[400px]">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-sm text-muted-foreground">No notifications</p>
              <p className="text-xs text-muted-foreground mt-1">You&apos;re all caught up!</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  variant="dropdown"
                  onMarkAsRead={markAsRead}
                  onClick={() => handleNotificationClick(notification)}
                />
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="border-t p-2">
          <Button variant="ghost" className="w-full text-sm" onClick={handleViewAll}>
            View All Notifications
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
