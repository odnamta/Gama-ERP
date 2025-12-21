'use client'

import { RefreshCw, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { getTimeBasedGreeting, getTimeSinceUpdate } from '@/lib/sales-engineering-dashboard-utils'

interface DashboardHeaderProps {
  userName?: string
  calculatedAt: string
  isStale: boolean
  isRefreshing: boolean
  onRefresh: () => void
}

export function DashboardHeader({
  userName,
  calculatedAt,
  isStale,
  isRefreshing,
  onRefresh,
}: DashboardHeaderProps) {
  const greeting = getTimeBasedGreeting()
  const timeSince = getTimeSinceUpdate(calculatedAt)

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          👋 {greeting}, {userName || 'there'}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Sales Pipeline & Engineering Dashboard
        </p>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          {isStale && (
            <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50">
              <AlertCircle className="h-3 w-3 mr-1" />
              Stale
            </Badge>
          )}
          <span>Last updated: {timeSince}</span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>
    </div>
  )
}
