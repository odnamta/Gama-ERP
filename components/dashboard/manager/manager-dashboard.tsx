'use client'

import { useState, useTransition } from 'react'
import { ManagerPeriodFilter } from './manager-period-filter'
import { ManagerKPICards } from './manager-kpi-cards'
import { PLSummaryTable } from './pl-summary-table'
import { ApprovalQueue } from './approval-queue'
import { BudgetAlertsTable } from './budget-alerts-table'
import { TeamPerformanceTable } from './team-performance-table'
import {
  type ManagerPeriodType,
  type ManagerKPIs,
  type PLSummaryRow,
  type PendingApproval,
  type BudgetAlertItem,
  type TeamMemberMetrics,
} from '@/lib/manager-dashboard-utils'

export interface ManagerDashboardData {
  kpis: ManagerKPIs
  plSummary: PLSummaryRow[]
  pendingApprovals: PendingApproval[]
  budgetAlerts: BudgetAlertItem[]
  teamMetrics: TeamMemberMetrics[]
}

interface ManagerDashboardProps {
  initialData: ManagerDashboardData
  userName?: string
  onPeriodChange?: (period: ManagerPeriodType) => Promise<ManagerDashboardData>
  onApprove?: (id: string) => Promise<void>
  onReject?: (id: string, reason: string) => Promise<void>
  onApproveAll?: () => Promise<void>
}

export function ManagerDashboard({
  initialData,
  userName,
  onPeriodChange,
  onApprove,
  onReject,
  onApproveAll,
}: ManagerDashboardProps) {
  const [data, setData] = useState<ManagerDashboardData>(initialData)
  const [period, setPeriod] = useState<ManagerPeriodType>('this_month')
  const [isPending, startTransition] = useTransition()

  const handlePeriodChange = async (newPeriod: ManagerPeriodType) => {
    setPeriod(newPeriod)
    if (onPeriodChange) {
      startTransition(async () => {
        const newData = await onPeriodChange(newPeriod)
        setData(newData)
      })
    }
  }


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Manager Dashboard</h1>
          {userName && (
            <p className="text-muted-foreground">Welcome, {userName}</p>
          )}
        </div>
        <ManagerPeriodFilter value={period} onChange={handlePeriodChange} />
      </div>

      {/* KPI Cards */}
      <ManagerKPICards kpis={data.kpis} isLoading={isPending} />

      {/* P&L Summary */}
      <PLSummaryTable rows={data.plSummary} isLoading={isPending} />

      {/* Two Column Layout: Approvals and Budget Alerts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ApprovalQueue
          approvals={data.pendingApprovals}
          isLoading={isPending}
          onApprove={onApprove}
          onReject={onReject}
          onApproveAll={onApproveAll}
        />
        <BudgetAlertsTable alerts={data.budgetAlerts} isLoading={isPending} />
      </div>

      {/* Team Performance */}
      <TeamPerformanceTable members={data.teamMetrics} isLoading={isPending} />
    </div>
  )
}
