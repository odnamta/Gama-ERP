'use client'

import { usePreview } from '@/hooks/use-preview'
import { DashboardClient } from '@/components/dashboard/dashboard-client'
import { OpsDashboard } from '@/components/dashboard/ops'
import { FinanceDashboard } from '@/components/dashboard/finance/finance-dashboard'
import { SalesDashboard } from '@/components/dashboard/sales/sales-dashboard'
import { SalesEngineeringDashboard } from '@/components/dashboard/sales-engineering'
import { ManagerDashboard } from '@/components/dashboard/manager/manager-dashboard'
import { AdminDashboard } from '@/components/dashboard/admin/admin-dashboard'
import { OwnerDashboard } from '@/components/dashboard/owner-dashboard'
import type { SalesEngineeringDashboardData } from '@/lib/sales-engineering-dashboard-utils'

interface DashboardSelectorProps {
  ownerData?: Parameters<typeof OwnerDashboard>[0]['data']
  opsData?: Parameters<typeof OpsDashboard>[0]['data']
  financeData?: Parameters<typeof FinanceDashboard>[0]['data']
  salesData?: Parameters<typeof SalesDashboard>[0]['initialData']
  salesEngineeringData?: SalesEngineeringDashboardData
  managerData?: Parameters<typeof ManagerDashboard>[0]['initialData']
  adminData?: Parameters<typeof AdminDashboard>[0]['initialData']
  defaultData?: {
    kpis: Parameters<typeof DashboardClient>[0]['initialKPIs']
    alerts: Parameters<typeof DashboardClient>[0]['initialAlerts']
    alertCount: Parameters<typeof DashboardClient>[0]['initialAlertCount']
    activities: Parameters<typeof DashboardClient>[0]['initialActivities']
    queue: Parameters<typeof DashboardClient>[0]['initialQueue']
    metrics: Parameters<typeof DashboardClient>[0]['initialMetrics']
  }
  userName?: string
  actualRole: string
  userEmail?: string
}

export function DashboardSelector({
  ownerData,
  opsData,
  financeData,
  salesData,
  salesEngineeringData,
  managerData,
  adminData,
  defaultData,
  userName,
  actualRole,
  userEmail,
}: DashboardSelectorProps) {
  const { effectiveRole, isPreviewActive } = usePreview()

  // Use effective role for dashboard selection (supports preview mode)
  const roleToRender = effectiveRole

  // Render based on effective role
  if (roleToRender === 'owner' && ownerData) {
    return <OwnerDashboard data={ownerData} />
  }

  if (roleToRender === 'ops' && opsData) {
    return <OpsDashboard data={opsData} userName={userName} />
  }

  if (roleToRender === 'finance' && financeData) {
    return <FinanceDashboard data={financeData} />
  }

  // Sales role: Show SalesEngineeringDashboard for Hutami or if salesEngineeringData is provided
  if (roleToRender === 'sales') {
    // Check if this is Hutami (Marketing Manager who also manages Engineering)
    const isHutami = userEmail === 'hutamiarini@gama-group.co'
    
    if ((isHutami || salesEngineeringData) && salesEngineeringData) {
      return <SalesEngineeringDashboard data={salesEngineeringData} userName={userName} />
    }
    
    if (salesData) {
      return <SalesDashboard initialData={salesData} />
    }
  }

  if (roleToRender === 'manager' && managerData) {
    return <ManagerDashboard initialData={managerData} userName={userName} />
  }

  if (roleToRender === 'admin' && adminData) {
    return <AdminDashboard initialData={adminData} userName={userName} />
  }

  // Fallback to default dashboard
  if (defaultData) {
    return (
      <DashboardClient
        initialKPIs={defaultData.kpis}
        initialAlerts={defaultData.alerts}
        initialAlertCount={defaultData.alertCount}
        initialActivities={defaultData.activities}
        initialQueue={defaultData.queue}
        initialMetrics={defaultData.metrics}
        userRole={roleToRender}
      />
    )
  }

  return <div>Loading dashboard...</div>
}
