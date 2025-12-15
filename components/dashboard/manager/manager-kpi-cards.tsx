'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { TrendingUp, TrendingDown, DollarSign, Percent, Clock, AlertTriangle, Briefcase } from 'lucide-react'
import { formatIDR } from '@/lib/pjo-utils'
import { cn } from '@/lib/utils'
import { type ManagerKPIs } from '@/lib/manager-dashboard-utils'

interface ManagerKPICardsProps {
  kpis: ManagerKPIs
  isLoading?: boolean
}

function VarianceIndicator({ value, suffix = '%' }: { value: number; suffix?: string }) {
  const isPositive = value > 0
  const isNegative = value < 0
  const Icon = isPositive ? TrendingUp : isNegative ? TrendingDown : null

  return (
    <span className={cn(
      'flex items-center gap-1 text-xs',
      isPositive && 'text-green-600',
      isNegative && 'text-red-600',
      !isPositive && !isNegative && 'text-muted-foreground'
    )}>
      {Icon && <Icon className="h-3 w-3" />}
      {isPositive && '+'}{value.toFixed(1)}{suffix} vs LM
    </span>
  )
}

export function ManagerKPICards({ kpis, isLoading }: ManagerKPICardsProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-32 mb-2" />
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
      {/* Revenue MTD */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Revenue MTD</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatIDR(kpis.revenueMTD)}</div>
          <VarianceIndicator value={kpis.revenueVariance} />
        </CardContent>
      </Card>

      {/* Costs MTD */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Costs MTD</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatIDR(kpis.costsMTD)}</div>
          <VarianceIndicator value={kpis.costsVariance} />
        </CardContent>
      </Card>

      {/* Profit MTD */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Profit MTD</CardTitle>
          <Percent className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatIDR(kpis.profitMTD)}</div>
          <span className="text-xs text-muted-foreground">{kpis.marginMTD.toFixed(1)}% margin</span>
        </CardContent>
      </Card>

      {/* Pending Approvals */}
      <Card className={cn(kpis.pendingApprovalsCount > 0 && 'border-yellow-500')}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{kpis.pendingApprovalsCount}</div>
          {kpis.pendingApprovalsCount > 0 ? (
            <Link href="#approval-queue" className="text-xs text-blue-600 hover:underline">
              Review Now →
            </Link>
          ) : (
            <span className="text-xs text-muted-foreground">All clear</span>
          )}
        </CardContent>
      </Card>

      {/* Budget Exceeded */}
      <Card className={cn(kpis.budgetExceededCount > 0 && 'border-red-500')}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Budget Exceeded</CardTitle>
          <AlertTriangle className={cn('h-4 w-4', kpis.budgetExceededCount > 0 ? 'text-red-500' : 'text-muted-foreground')} />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{kpis.budgetExceededCount}</div>
          {kpis.budgetExceededCount > 0 ? (
            <span className="text-xs text-red-600">⚠️ Need Review</span>
          ) : (
            <span className="text-xs text-green-600">All within budget</span>
          )}
        </CardContent>
      </Card>

      {/* Jobs In Progress */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Jobs In Progress</CardTitle>
          <Briefcase className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{kpis.jobsInProgressCount}</div>
          <span className="text-xs text-green-600">On Track ✅</span>
        </CardContent>
      </Card>
    </div>
  )
}
