'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardHeader } from './dashboard-header'
import { TabNavigation } from './tab-navigation'
import { SalesPipelineCards } from './sales-pipeline-cards'
import { PipelineFunnelChart } from './pipeline-funnel-chart'
import { UrgentQuotationsCard } from './urgent-quotations-card'
import { EngineeringWorkloadCard } from './engineering-workload-card'
import { RecentQuotationsTable } from './recent-quotations-table'
import { QuickActionsBar } from './quick-actions-bar'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'
import type { SalesEngineeringDashboardData, DashboardTab } from '@/lib/sales-engineering-dashboard-utils'
import { refreshSalesEngineeringDashboard } from '@/app/(main)/dashboard/sales-engineering-actions'

interface SalesEngineeringDashboardProps {
  data: SalesEngineeringDashboardData
  userName?: string
}

export function SalesEngineeringDashboard({
  data,
  userName,
}: SalesEngineeringDashboardProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState<DashboardTab>('combined')

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await refreshSalesEngineeringDashboard()
      startTransition(() => {
        router.refresh()
      })
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleTabChange = (tab: DashboardTab) => {
    setActiveTab(tab)
  }

  const showSales = activeTab === 'sales' || activeTab === 'combined'
  const showEngineering = activeTab === 'engineering' || activeTab === 'combined'

  return (
    <div className="space-y-6">
      {/* Header */}
      <DashboardHeader
        userName={userName}
        calculatedAt={data.salesSummary.calculatedAt}
        isStale={data.isStale}
        isRefreshing={isRefreshing || isPending}
        onRefresh={handleRefresh}
      />

      {/* Tab Navigation */}
      <TabNavigation activeTab={activeTab} onTabChange={handleTabChange} />

      {/* Quick Actions */}
      <QuickActionsBar />

      {/* Sales Pipeline Section */}
      {showSales && (
        <>
          {/* Summary Cards */}
          <SalesPipelineCards summary={data.salesSummary} />

          {/* Pipeline Funnel */}
          <PipelineFunnelChart summary={data.salesSummary} />
        </>
      )}

      {/* Middle Section - Urgent & Engineering */}
      <div className="grid gap-6 md:grid-cols-2">
        {showSales && (
          <UrgentQuotationsCard quotations={data.urgentQuotations} />
        )}
        {showEngineering && (
          <EngineeringWorkloadCard summary={data.engineeringSummary} />
        )}
        {/* If only showing one, make it full width */}
        {activeTab === 'sales' && (
          <div className="hidden md:block" /> // Placeholder for grid alignment
        )}
      </div>

      {/* Recent Quotations Table */}
      {showSales && (
        <RecentQuotationsTable quotations={data.recentQuotations} />
      )}
    </div>
  )
}

// Loading skeleton for the dashboard
export function SalesEngineeringDashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-9 w-24" />
        </div>
      </div>

      {/* Tab Navigation Skeleton */}
      <div className="border-b border-gray-200 pb-4">
        <div className="flex gap-8">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-6 w-28" />
          <Skeleton className="h-6 w-36" />
        </div>
      </div>

      {/* Quick Actions Skeleton */}
      <div className="flex gap-2">
        <Skeleton className="h-9 w-36" />
        <Skeleton className="h-9 w-36" />
        <Skeleton className="h-9 w-28" />
        <Skeleton className="h-9 w-36" />
      </div>

      {/* Summary Cards Skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {[1, 2, 3, 4, 5].map((i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-8 w-16 mb-1" />
              <Skeleton className="h-3 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pipeline Funnel Skeleton */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <Skeleton className="h-5 w-32" />
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-2">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-20" />
              </div>
              <Skeleton className="h-6 w-full" />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Middle Section Skeleton */}
      <div className="grid gap-6 md:grid-cols-2">
        {[1, 2].map((i) => (
          <Card key={i}>
            <CardContent className="pt-6 space-y-4">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-9 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table Skeleton */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    </div>
  )
}
