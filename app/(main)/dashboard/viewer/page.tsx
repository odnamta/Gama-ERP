/**
 * Viewer Dashboard Route
 * v0.35: Role-Based Homepage Routing
 * 
 * This route serves as the dedicated entry point for viewer users.
 * Viewers have read-only access to basic dashboard information.
 */

import { getUserProfile } from '@/lib/permissions-server'
import { DashboardClient } from '@/components/dashboard/dashboard-client'
import {
  fetchDashboardKPIs,
  fetchBudgetAlerts,
  fetchExceededBudgetCount,
  fetchRecentActivity,
  fetchOperationsQueue,
  fetchManagerMetrics,
} from '../actions'

export default async function ViewerDashboardPage() {
  const profile = await getUserProfile()
  const userRole = profile?.role || 'viewer'

  // Fetch basic dashboard data for viewer
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
