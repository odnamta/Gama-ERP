/**
 * Dashboard Server Actions
 * Barrel re-export file — split into:
 *   - dashboard-kpi-actions.ts (KPIs + metrics + finance dashboard + activity log)
 *   - dashboard-role-actions.ts (sales + manager + admin + ops dashboards + PJO approval)
 */

export {
  fetchDashboardStats,
  fetchDashboardKPIs,
  fetchBudgetAlerts,
  fetchExceededBudgetCount,
  fetchRecentActivity,
  fetchManagerMetrics,
  logActivity,
  fetchFinanceDashboardData,
} from './dashboard-kpi-actions'

export type {
  FinanceDashboardData,
} from './dashboard-kpi-actions'

export {
  fetchOperationsQueue,
  fetchSalesDashboardData,
  refreshSalesDashboardData,
  fetchManagerDashboardData,
  approvePJO,
  rejectPJO,
  approveAllPJOs,
  fetchAdminDashboardData,
} from './dashboard-role-actions'

export type {
  SalesDashboardData,
  ManagerDashboardData,
  AdminDashboardData,
} from './dashboard-role-actions'
