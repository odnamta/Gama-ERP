'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { usePermissions } from '@/components/providers/permission-provider'
import { usePreview } from '@/hooks/use-preview'
import { NAV_ITEMS, filterNavItems } from '@/lib/navigation'
import { Skeleton } from '@/components/ui/skeleton'

export function Sidebar() {
  const pathname = usePathname()
  const { profile, isLoading } = usePermissions()
  const { effectiveRole, effectivePermissions, isPreviewActive } = usePreview()

  // Filter navigation based on effective role and permissions (supports preview mode)
  const filteredNav = profile
    ? filterNavItems(NAV_ITEMS, effectiveRole, effectivePermissions)
    : []

  return (
    <div className="flex h-full w-64 flex-col border-r bg-card">
      <div className="flex h-16 items-center border-b px-6">
        <h1 className="text-xl font-bold text-primary">Gama ERP</h1>
      </div>
      <nav className="flex-1 space-y-1 p-4">
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
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
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
                          'block rounded-lg px-3 py-2 text-sm transition-colors',
                          pathname === child.href || pathname.startsWith(child.href + '/')
                            ? 'bg-muted text-foreground'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        )}
                      >
                        {child.title}
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
    </div>
  )
}
