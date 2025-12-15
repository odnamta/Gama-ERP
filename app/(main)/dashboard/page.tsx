import { DashboardClient } from '@/components/dashboard/dashboard-client'
import { OpsDashboard } from '@/components/dashboard/ops'
import { FinanceDashboard } from '@/components/dashboard/finance/finance-dashboard'
import { SalesDashboard } from '@/components/dashboard/sales/sales-dashboard'
import {
  fetchDashboardKPIs,
  fetchBudgetAlerts,
  fetchExceededBudgetCount,
  fetchRecentActivity,
  fetchOperationsQueue,
  fetchManagerMetrics,
  fetchFinanceDashboardData,
  fetchSalesDashboardData,
} from './actions'
import { getUserProfile } from '@/lib/permissions-server'
import { getOpsDashboardData } from '@/lib/ops-dashboard-utils'

export default async function DashboardPage() {
  // Get user profile for role-based rendering
  const profile = await getUserProfile()
  const userRole = profile?.role || 'viewer'

  // Render ops-specific dashboard for ops users
  if (userRole === 'ops') {
    const opsData = await getOpsDashboardData()
    return (
      <OpsDashboard 
        data={opsData} 
        userName={profile?.full_name || undefined} 
      />
    )
  }

  // Render finance-specific dashboard for finance users
  if (userRole === 'finance') {
    const financeData = await fetchFinanceDashboardData()
    return <FinanceDashboard data={financeData} />
  }

  // Render sales-specific dashboard for sales users
  if (userRole === 'sales') {
    const salesData = await fetchSalesDashboardData()
    return <SalesDashboard initialData={salesData} />
  }

  // Fetch all data in parallel for other roles
  const [kpis, alerts, alertCount, activities, queue, metrics] = await Promise.all([
    fetchDashboardKPIs(),
    fetchBudgetAlerts(),
    fetchExceededBudgetCount(),
    fetchRecentActivity(),
    fetchOperationsQueue(),
    fetchManagerMetrics(),
  ])

  return (
    <DashboardClient
      initialKPIs={kpis}
      initialAlerts={alerts}
      initialAlertCount={alertCount}
      initialActivities={activities}
      initialQueue={queue}
      initialMetrics={metrics}
      userRole={userRole}
    />
  )
}
