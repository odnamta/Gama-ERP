'use client'

import Link from 'next/link'
import { Bell, ClipboardList, Truck, Receipt } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PendingAction } from '@/lib/ops-dashboard-enhanced-utils'

interface PendingActionsCardProps {
  actions: PendingAction[]
}

export function PendingActionsCard({ actions }: PendingActionsCardProps) {
  const getIcon = (type: PendingAction['type']) => {
    switch (type) {
      case 'berita_acara':
        return <ClipboardList className="h-4 w-4 text-orange-500" />
      case 'surat_jalan':
        return <Truck className="h-4 w-4 text-blue-500" />
      case 'bkk':
        return <Receipt className="h-4 w-4 text-green-500" />
      default:
        return <Bell className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getLink = (type: PendingAction['type']) => {
    switch (type) {
      case 'berita_acara':
        return '/job-orders'
      case 'surat_jalan':
        return '/job-orders'
      case 'bkk':
        return '/job-orders'
      default:
        return '/dashboard'
    }
  }

  if (actions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Pending Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-muted-foreground">
            <p className="text-sm">No pending actions</p>
            <p className="text-xs">You&apos;re all caught up!</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Pending Actions
          <span className="ml-auto bg-red-100 text-red-800 text-xs font-medium px-2 py-0.5 rounded-full">
            {actions.reduce((sum, a) => sum + a.count, 0)}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {actions.map((action, index) => (
            <li key={index}>
              <Link
                href={getLink(action.type)}
                className="flex items-start gap-3 p-2 rounded-md hover:bg-muted/50 transition-colors"
              >
                {getIcon(action.type)}
                <div className="flex-1">
                  <p className="text-sm">{action.message}</p>
                  {action.jobs && action.jobs.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      ({action.jobs.slice(0, 3).join(', ')}
                      {action.jobs.length > 3 && `, +${action.jobs.length - 3} more`})
                    </p>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
