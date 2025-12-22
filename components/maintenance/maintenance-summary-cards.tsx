'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, Clock, Wrench, DollarSign } from 'lucide-react'
import { MaintenanceDashboardStats } from '@/types/maintenance'
import { formatIDR } from '@/lib/pjo-utils'

interface MaintenanceSummaryCardsProps {
  stats: MaintenanceDashboardStats
}

export function MaintenanceSummaryCards({ stats }: MaintenanceSummaryCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Overdue</CardTitle>
          <AlertTriangle className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{stats.overdueCount}</div>
          <p className="text-xs text-muted-foreground">
            Needs immediate attention
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Due Soon</CardTitle>
          <Clock className="h-4 w-4 text-yellow-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-yellow-600">{stats.dueSoonCount}</div>
          <p className="text-xs text-muted-foreground">
            Within warning threshold
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">In Progress</CardTitle>
          <Wrench className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">{stats.inProgressCount}</div>
          <p className="text-xs text-muted-foreground">
            Currently being serviced
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Cost MTD</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatIDR(stats.costMTD)}</div>
          <p className="text-xs text-muted-foreground">
            Month to date
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
