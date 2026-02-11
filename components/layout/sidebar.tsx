'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { usePermissions } from '@/components/providers/permission-provider'
import { usePreview } from '@/hooks/use-preview'
import { NAV_ITEMS, filterNavItems } from '@/lib/navigation'
import { Skeleton } from '@/components/ui/skeleton'
import { Truck, X } from 'lucide-react'
import { ChangelogNotificationDot } from '@/components/changelog/changelog-notification-dot'
import { useMobileSidebar } from './mobile-sidebar-context'

export function Sidebar() {
  const pathname = usePathname()
  const { profile, isLoading } = usePermissions()
  const { effectiveRole, effectivePermissions, isPreviewActive } = usePreview()
  const { isOpen, close } = useMobileSidebar()

  // Close sidebar on route change (mobile)
  useEffect(() => {
    close()
  }, [pathname, close])

  // Filter navigation based on effective role and permissions (supports preview mode)
  const filteredNav = profile
    ? filterNavItems(NAV_ITEMS, effectiveRole, effectivePermissions)
    : []

  const sidebarContent = (
    <>
      {/* Logo area - matches header height */}
      <div className="flex h-16 shrink-0 items-center justify-between border-b px-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <Truck className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold leading-tight text-foreground">Gama</span>
            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">ERP System</span>
          </div>
        </Link>
        {/* Close button - mobile only */}
        <button
          onClick={close}
          className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted lg:hidden"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {isLoading ? (
          // Loading skeleton
          <>
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-10 w-full rounded-lg" />
            ))}
          </>
        ) : (
          filteredNav.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            const hasActiveChild = item.children?.some(child => pathname === child.href || pathname.startsWith(child.href + '/'))
            const showChildren = isActive || hasActiveChild
            return (
              <div key={item.title}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive || hasActiveChild
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.title}
                </Link>
                {/* Render children if present */}
                {item.children && item.children.length > 0 && showChildren && (
                  <div className="ml-6 mt-1 space-y-1">
                    {item.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={cn(
                          'flex items-center justify-between rounded-lg px-3 py-2.5 text-sm transition-colors',
                          pathname === child.href || pathname.startsWith(child.href + '/')
                            ? 'bg-muted text-foreground'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        )}
                      >
                        <span>{child.title}</span>
                        {/* Show notification dot for What's New */}
                        {child.href === '/changelog' && <ChangelogNotificationDot />}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )
          })
        )}
      </nav>
      {/* User role indicator */}
      {profile && (
        <div className="border-t p-4">
          <div className="text-xs text-muted-foreground">
            {isPreviewActive ? (
              <>
                Viewing as:{' '}
                <span className="font-medium capitalize text-yellow-600">
                  {effectiveRole}
                </span>
              </>
            ) : (
              <>
                Role:{' '}
                <span className={`font-medium capitalize ${profile.role === 'owner' ? 'text-amber-600' : ''}`}>
                  {profile.role === 'owner' ? '👑 Owner' : profile.role}
                </span>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden lg:flex h-full w-64 flex-col border-r bg-card">
        {sidebarContent}
      </div>

      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={close}
        />
      )}

      {/* Mobile sidebar drawer */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-card shadow-xl transition-transform duration-200 ease-in-out lg:hidden',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {sidebarContent}
      </div>
    </>
  )
}
