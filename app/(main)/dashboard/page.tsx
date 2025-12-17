import { DashboardSelector } from '@/components/dashboard/dashboard-selector'
import {
  fetchDashboardKPIs,
  fetchBudgetAlerts,
  fetchExceededBudgetCount,
  fetchRecentActivity,
  fetchOperationsQueue,
  fetchManagerMetrics,
  fetchFinanceDashboardData,
  fetchSalesDashboardData,
  fetchManagerDashboardData,
  fetchAdminDashboardData,
} from './actions'
import { getUserProfile, getOwnerDashboardData } from '@/lib/permissions-server'
import { getOpsDashboardData } from '@/lib/ops-dashboard-utils'

export default async function DashboardPage() {
  // Get user profile for role-based rendering
  const profile = await getUserProfile()
  const userRole = profile?.role || 'viewer'

  // For owner users, fetch all dashboard data to support preview mode
  if (userRole === 'owner') {
    const [
      ownerData,
      opsData,
      financeData,
      salesData,
      managerData,
      adminData,
      kpis,
      alerts,
      alertCount,
      activities,
      queue,
      metrics,
    ] = await Promise.all([
      getOwnerDashboardData(),
      getOpsDashboardData(),
      fetchFinanceDashboardData(),
      fetchSalesDashboardData(),
      fetchManagerDashboardData(),
      fetchAdminDashboardData(),
      fetchDashboardKPIs(),
      fetchBudgetAlerts(),
      fetchExceededBudgetCount(),
      fetchRecentActivity(),
      fetchOperationsQueue(),
      fetchManagerMetrics(),
    ])

    return (
      <DashboardSelector
        ownerData={ownerData}
        opsData={opsData}
        financeData={financeData}
        salesData={salesData}
        managerData={managerData}
        adminData={adminData}
        defaultData={{
          kpis,
          alerts,
          alertCount,
          activities,
          queue,
          metrics,
        }}
        userName={profile?.full_name || undefined}
        actualRole={userRole}
      />
    )
  }

  // For non-owner users, fetch only their specific dashboard data
  if (userRole === 'ops') {
    const opsData = await getOpsDashboardData()
    return (
      <DashboardSelector
        opsData={opsData}
        userName={profile?.full_name || undefined}
        actualRole={userRole}
      />
    )
  }

  if (userRole === 'finance') {
    const financeData = await fetchFinanceDashboardData()
    return <DashboardSelector financeData={financeData} actualRole={userRole} />
  }

  if (userRole === 'sales') {
    const salesData = await fetchSalesDashboardData()
    return <DashboardSelector salesData={salesData} actualRole={userRole} />
  }

  if (userRole === 'manager') {
    const managerData = await fetchManagerDashboardData()
    return (
      <DashboardSelector
        managerData={managerData}
        userName={profile?.full_name || undefined}
        actualRole={userRole}
      />
    )
  }

  if (userRole === 'admin') {
    const adminData = await fetchAdminDashboardData()
    return (
      <DashboardSelector
        adminData={adminData}
        userName={profile?.full_name || undefined}
        actualRole={userRole}
      />
    )
  }

  // Fetch default data for viewer and other roles
  const [kpis, alerts, alertCount, activities, queue, metrics] = await Promise.all([
    fetchDashboardKPIs(),
    fetchBudgetAlerts(),
    fetchExceededBudgetCount(),
    fetchRecentActivity(),
    fetchOperationsQueue(),
    fetchManagerMetrics(),
  ])

  return (
    <DashboardSelector
      defaultData={{
        kpis,
        alerts,
        alertCount,
        activities,
        queue,
        metrics,
      }}
      actualRole={userRole}
    />
  )
}
