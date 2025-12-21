'use client'

import { Truck, Package, CheckCircle, Navigation, ClipboardList } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EnhancedOpsSummary } from '@/lib/ops-dashboard-enhanced-utils'

interface EnhancedSummaryCardsProps {
  summary: EnhancedOpsSummary
}

export function EnhancedSummaryCards({ summary }: EnhancedSummaryCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
      {/* Active Jobs */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
          <Truck className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{summary.jobsInProgress}</div>
          <p className="text-xs text-muted-foreground">In Progress</p>
        </CardContent>
      </Card>

      {/* Deliveries Today */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Deliveries Today</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{summary.deliveriesToday}</div>
          <p className="text-xs text-muted-foreground">Scheduled</p>
        </CardContent>
      </Card>

      {/* Completed MTD */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Completed MTD</CardTitle>
          <CheckCircle className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{summary.jobsCompletedMTD}</div>
          <p className="text-xs text-muted-foreground">This month</p>
        </CardContent>
      </Card>

      {/* In Transit */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">In Transit</CardTitle>
          <Navigation className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{summary.deliveriesInTransit}</div>
          <p className="text-xs text-muted-foreground">Deliveries</p>
        </CardContent>
      </Card>

      {/* Handovers Pending */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Handovers Pending</CardTitle>
          <ClipboardList className="h-4 w-4 text-orange-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{summary.handoversPending}</div>
          <p className="text-xs text-muted-foreground">Berita Acara</p>
        </CardContent>
      </Card>
    </div>
  )
}
