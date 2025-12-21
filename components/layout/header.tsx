'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { NotificationDropdown } from '@/components/notifications/notification-dropdown'
import { GlobalSearch } from '@/components/search/global-search'
import { ContextualHelpPopover } from '@/components/help-center/contextual-help-popover'

export interface UserInfo {
  name: string
  email: string
  avatarUrl: string | null
  role?: string
}

interface HeaderProps {
  user?: UserInfo | null
}

export function getInitials(name: string): string {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase()
  }
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}

export function Header({ user }: HeaderProps) {
  const router = useRouter()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [avatarError, setAvatarError] = useState(false)

  const handleLogout = async () => {
    setIsLoggingOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const showFallback = !user?.avatarUrl || avatarError

  return (
    <header className="flex h-16 items-center justify-between border-b bg-card px-6">
      <div className="flex items-center gap-4">
        <GlobalSearch />
      </div>
      <div className="flex items-center gap-4">
        <ContextualHelpPopover userRole={user?.role || 'viewer'} />
        <NotificationDropdown />

        {user && (
          <>
            <span className="text-sm font-medium">{user.name}</span>
            
            {showFallback ? (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                {getInitials(user.name)}
              </div>
            ) : (
              <img
                src={user.avatarUrl!}
                alt={user.name}
                className="h-8 w-8 rounded-full"
                onError={() => setAvatarError(true)}
              />
            )}

            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              disabled={isLoggingOut}
              title="Sign out"
            >
              {isLoggingOut ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <LogOut className="h-5 w-5" />
              )}
            </Button>
          </>
        )}

        {!user && (
          <div className="h-8 w-8 rounded-full bg-muted" />
        )}
      </div>
    </header>
  )
}
