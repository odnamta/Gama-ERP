/**
 * Manager Dashboard Utility Functions
 * Provides calculations for P&L, approvals, budget alerts, and team metrics
 */

// Types
export type ManagerPeriodType = 'this_month' | 'this_quarter' | 'this_year' | 'ytd'
export type CostCategory = 'trucking' | 'port_charges' | 'documentation' | 'handling' | 'customs' | 'insurance' | 'storage' | 'labor' | 'fuel' | 'tolls' | 'other'

export interface ManagerPeriodFilter {
  type: ManagerPeriodType
  startDate: Date
  endDate: Date
}

export interface ManagerKPIs {
  revenueMTD: number
  costsMTD: number
  profitMTD: number
  marginMTD: number
  revenueVariance: number
  costsVariance: number
  profitVariance: number
  pendingApprovalsCount: number
  budgetExceededCount: number
  jobsInProgressCount: number
}

export interface PLSummaryRow {
  category: string
  thisMonth: number
  lastMonth: number
  variance: number
  ytd: number
  isSubtotal?: boolean
  isTotal?: boolean
}

export interface PendingApproval {
  id: string
  pjo_number: string
  customer_name: string
  project_name: string
  revenue: number
  estimatedCost: number
  estimatedProfit: number
  margin: number
  daysPending: number
  created_at: string
}

export interface BudgetAlertItem {
  id: string
  pjo_id: string
  pjo_number: string
  category: string
  budgetAmount: number
  actualAmount: number
  overByAmount: number
  overByPercentage: number
}

export interface TeamMemberMetrics {
  userId: string
  name: string
  role: string
  pjosCreated: number | null
  josCompleted: number | null
  onTimeRate: number | null
  rating: number
}


// Input types for functions
export interface JOInput {
  id: string
  final_revenue?: number | null
  final_cost?: number | null
  status: string
  created_at?: string | null
  completed_at?: string | null
}

export interface CostItemInput {
  id: string
  pjo_id: string
  category: string
  estimated_amount: number
  actual_amount?: number | null
  status: string
  pjo_number?: string
}

export interface PJOApprovalInput {
  id: string
  pjo_number: string
  status: string
  total_revenue_calculated?: number | null
  total_cost_calculated?: number | null
  estimated_amount?: number | null
  created_at: string | null
  customer_name?: string
  project_name?: string
}

export interface UserMetricsInput {
  userId: string
  name: string
  role: string
  pjosCreated?: number
  josCompleted?: number
  josOnTime?: number
  josTotal?: number
}


// Variance and Margin Calculation Functions

/**
 * Calculate percentage variance between current and previous values
 * Returns 0 when previous is 0 to avoid NaN/Infinity
 */
export function calculateVariance(current: number, previous: number): number {
  if (previous === 0) return 0
  return ((current - previous) / previous) * 100
}

/**
 * Calculate margin percentage (profit / revenue * 100)
 * Returns 0 when revenue is 0 to avoid NaN/Infinity
 */
export function calculateMargin(revenue: number, cost: number): number {
  if (revenue === 0) return 0
  const profit = revenue - cost
  return (profit / revenue) * 100
}

/**
 * Calculate gross profit (revenue - cost)
 */
export function calculateGrossProfit(revenue: number, cost: number): number {
  return revenue - cost
}


// P&L Calculation Functions

/**
 * Calculate P&L summary from job orders
 */
export function calculatePLSummary(
  currentPeriodJOs: JOInput[],
  lastPeriodJOs: JOInput[],
  ytdJOs: JOInput[]
): { revenue: number; costs: number; profit: number; margin: number; lastRevenue: number; lastCosts: number; lastProfit: number; ytdRevenue: number; ytdCosts: number; ytdProfit: number } {
  const sumRevenue = (jos: JOInput[]) => jos.reduce((sum, jo) => sum + (jo.final_revenue ?? 0), 0)
  const sumCosts = (jos: JOInput[]) => jos.reduce((sum, jo) => sum + (jo.final_cost ?? 0), 0)

  const revenue = sumRevenue(currentPeriodJOs)
  const costs = sumCosts(currentPeriodJOs)
  const profit = calculateGrossProfit(revenue, costs)
  const margin = calculateMargin(revenue, costs)

  const lastRevenue = sumRevenue(lastPeriodJOs)
  const lastCosts = sumCosts(lastPeriodJOs)
  const lastProfit = calculateGrossProfit(lastRevenue, lastCosts)

  const ytdRevenue = sumRevenue(ytdJOs)
  const ytdCosts = sumCosts(ytdJOs)
  const ytdProfit = calculateGrossProfit(ytdRevenue, ytdCosts)

  return {
    revenue, costs, profit, margin,
    lastRevenue, lastCosts, lastProfit,
    ytdRevenue, ytdCosts, ytdProfit
  }
}

/**
 * Group cost items by category with totals
 */
export function groupCostsByCategory(costItems: CostItemInput[]): Map<string, number> {
  const groups = new Map<string, number>()
  
  for (const item of costItems) {
    const amount = item.actual_amount ?? item.estimated_amount ?? 0
    const current = groups.get(item.category) || 0
    groups.set(item.category, current + amount)
  }
  
  return groups
}

/**
 * Calculate total from category groups
 */
export function calculateTotalFromGroups(groups: Map<string, number>): number {
  let total = 0
  groups.forEach(value => { total += value })
  return total
}


// Pending Approvals Functions

/**
 * Filter PJOs with status 'pending_approval'
 */
export function filterPendingApprovals(pjos: PJOApprovalInput[]): PJOApprovalInput[] {
  return pjos.filter(pjo => pjo.status === 'pending_approval')
}

/**
 * Calculate estimated profit from PJO revenue and costs
 */
export function calculateEstimatedProfit(revenue: number, cost: number): number {
  return revenue - cost
}

/**
 * Calculate days pending from created_at
 */
export function calculateDaysPending(createdAt: string, currentDate: Date): number {
  const created = new Date(createdAt)
  created.setHours(0, 0, 0, 0)
  const current = new Date(currentDate)
  current.setHours(0, 0, 0, 0)
  
  const diffTime = current.getTime() - created.getTime()
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
  
  return Math.max(0, diffDays)
}

/**
 * Transform PJO to PendingApproval object
 */
export function transformPendingApproval(pjo: PJOApprovalInput, currentDate: Date): PendingApproval {
  const revenue = pjo.total_revenue_calculated ?? pjo.estimated_amount ?? 0
  const cost = pjo.total_cost_calculated ?? 0
  const profit = calculateEstimatedProfit(revenue, cost)
  const margin = calculateMargin(revenue, cost)
  const daysPending = pjo.created_at ? calculateDaysPending(pjo.created_at, currentDate) : 0

  return {
    id: pjo.id,
    pjo_number: pjo.pjo_number,
    customer_name: pjo.customer_name ?? 'Unknown',
    project_name: pjo.project_name ?? '',
    revenue,
    estimatedCost: cost,
    estimatedProfit: profit,
    margin,
    daysPending,
    created_at: pjo.created_at ?? ''
  }
}

/**
 * Get pending approvals with all required fields
 */
export function getPendingApprovals(pjos: PJOApprovalInput[], currentDate: Date): PendingApproval[] {
  return filterPendingApprovals(pjos)
    .map(pjo => transformPendingApproval(pjo, currentDate))
    .sort((a, b) => b.daysPending - a.daysPending)
}


// Budget Alerts Functions

/**
 * Filter cost items with status 'exceeded'
 */
export function filterBudgetAlerts(costItems: CostItemInput[]): CostItemInput[] {
  return costItems.filter(item => item.status === 'exceeded')
}

/**
 * Calculate over-by percentage
 */
export function calculateOverByPercentage(budget: number, actual: number): number {
  if (budget === 0) return 0
  return ((actual - budget) / budget) * 100
}

/**
 * Sort items by variance percentage descending
 */
export function sortByVarianceDesc<T extends { overByPercentage: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => b.overByPercentage - a.overByPercentage)
}

/**
 * Transform cost item to BudgetAlertItem
 */
export function transformBudgetAlert(item: CostItemInput): BudgetAlertItem {
  const budget = item.estimated_amount
  const actual = item.actual_amount ?? 0
  const overByAmount = actual - budget
  const overByPercentage = calculateOverByPercentage(budget, actual)

  return {
    id: item.id,
    pjo_id: item.pjo_id,
    pjo_number: item.pjo_number ?? '',
    category: item.category,
    budgetAmount: budget,
    actualAmount: actual,
    overByAmount,
    overByPercentage
  }
}

/**
 * Get budget alerts sorted by variance
 */
export function getBudgetAlerts(costItems: CostItemInput[]): BudgetAlertItem[] {
  const exceeded = filterBudgetAlerts(costItems)
  const alerts = exceeded.map(transformBudgetAlert)
  return sortByVarianceDesc(alerts)
}


// Team Metrics Functions

/**
 * Calculate on-time rate percentage
 */
export function calculateOnTimeRate(onTime: number, total: number): number {
  if (total === 0) return 0
  return (onTime / total) * 100
}

/**
 * Calculate performance rating (1-5 stars)
 * Based on role-specific metrics
 */
export function calculatePerformanceRating(metrics: UserMetricsInput): number {
  const { role, pjosCreated, josCompleted, josOnTime, josTotal } = metrics
  
  if (role === 'admin' || role === 'sales') {
    // Rating based on PJOs created
    const count = pjosCreated ?? 0
    if (count >= 10) return 5
    if (count >= 7) return 4
    if (count >= 5) return 3
    if (count >= 2) return 2
    return 1
  }
  
  if (role === 'ops') {
    // Rating based on JOs completed and on-time rate
    const completed = josCompleted ?? 0
    const onTimeRate = josTotal && josTotal > 0 ? ((josOnTime ?? 0) / josTotal) * 100 : 0
    
    // Combined score: 50% completion volume, 50% on-time rate
    let score = 0
    
    // Volume score (0-2.5)
    if (completed >= 15) score += 2.5
    else if (completed >= 10) score += 2
    else if (completed >= 5) score += 1.5
    else if (completed >= 2) score += 1
    else score += 0.5
    
    // On-time score (0-2.5)
    if (onTimeRate >= 95) score += 2.5
    else if (onTimeRate >= 85) score += 2
    else if (onTimeRate >= 75) score += 1.5
    else if (onTimeRate >= 60) score += 1
    else score += 0.5
    
    return Math.min(5, Math.max(1, Math.round(score)))
  }
  
  // Default rating for other roles
  return 3
}

/**
 * Transform user metrics input to TeamMemberMetrics
 */
export function transformTeamMetrics(input: UserMetricsInput): TeamMemberMetrics {
  const onTimeRate = input.josTotal && input.josTotal > 0 
    ? calculateOnTimeRate(input.josOnTime ?? 0, input.josTotal)
    : null

  return {
    userId: input.userId,
    name: input.name,
    role: input.role,
    pjosCreated: (input.role === 'admin' || input.role === 'sales') ? (input.pjosCreated ?? 0) : null,
    josCompleted: input.role === 'ops' ? (input.josCompleted ?? 0) : null,
    onTimeRate: input.role === 'ops' ? onTimeRate : null,
    rating: calculatePerformanceRating(input)
  }
}

/**
 * Calculate team metrics for all members
 */
export function calculateTeamMetrics(users: UserMetricsInput[]): TeamMemberMetrics[] {
  return users.map(transformTeamMetrics)
}


// Period Filter Functions

/**
 * Get start and end dates for manager period type
 */
export function getManagerPeriodDates(
  periodType: ManagerPeriodType,
  currentDate: Date
): ManagerPeriodFilter {
  const current = new Date(currentDate)
  current.setHours(0, 0, 0, 0)
  
  let startDate: Date
  let endDate: Date
  
  switch (periodType) {
    case 'this_month': {
      startDate = new Date(current.getFullYear(), current.getMonth(), 1)
      endDate = new Date(current.getFullYear(), current.getMonth() + 1, 0)
      break
    }
    case 'this_quarter': {
      const quarter = Math.floor(current.getMonth() / 3)
      startDate = new Date(current.getFullYear(), quarter * 3, 1)
      endDate = new Date(current.getFullYear(), quarter * 3 + 3, 0)
      break
    }
    case 'this_year': {
      startDate = new Date(current.getFullYear(), 0, 1)
      endDate = new Date(current.getFullYear(), 11, 31)
      break
    }
    case 'ytd': {
      startDate = new Date(current.getFullYear(), 0, 1)
      endDate = new Date(current)
      break
    }
    default:
      startDate = new Date(current.getFullYear(), current.getMonth(), 1)
      endDate = new Date(current.getFullYear(), current.getMonth() + 1, 0)
  }
  
  startDate.setHours(0, 0, 0, 0)
  endDate.setHours(23, 59, 59, 999)
  
  return { type: periodType, startDate, endDate }
}

/**
 * Get previous period dates for comparison
 */
export function getPreviousPeriodDates(period: ManagerPeriodFilter): ManagerPeriodFilter {
  const { type, startDate, endDate } = period
  
  let previousStart: Date
  let previousEnd: Date
  
  switch (type) {
    case 'this_month': {
      // Previous month
      previousStart = new Date(startDate.getFullYear(), startDate.getMonth() - 1, 1)
      previousEnd = new Date(startDate.getFullYear(), startDate.getMonth(), 0)
      break
    }
    case 'this_quarter': {
      // Previous quarter
      const quarter = Math.floor(startDate.getMonth() / 3)
      previousStart = new Date(startDate.getFullYear(), (quarter - 1) * 3, 1)
      previousEnd = new Date(startDate.getFullYear(), quarter * 3, 0)
      break
    }
    case 'this_year':
    case 'ytd': {
      // Previous year same period
      previousStart = new Date(startDate.getFullYear() - 1, startDate.getMonth(), startDate.getDate())
      previousEnd = new Date(endDate.getFullYear() - 1, endDate.getMonth(), endDate.getDate())
      break
    }
    default: {
      const duration = endDate.getTime() - startDate.getTime()
      previousEnd = new Date(startDate.getTime() - 1)
      previousStart = new Date(previousEnd.getTime() - duration)
    }
  }
  
  previousStart.setHours(0, 0, 0, 0)
  previousEnd.setHours(23, 59, 59, 999)
  
  return { type, startDate: previousStart, endDate: previousEnd }
}

/**
 * Get YTD period dates
 */
export function getYTDPeriodDates(currentDate: Date): ManagerPeriodFilter {
  const current = new Date(currentDate)
  const startDate = new Date(current.getFullYear(), 0, 1)
  startDate.setHours(0, 0, 0, 0)
  
  const endDate = new Date(current)
  endDate.setHours(23, 59, 59, 999)
  
  return { type: 'ytd', startDate, endDate }
}

/**
 * Filter items by period
 */
export function filterByPeriod<T extends { created_at?: string | null }>(
  items: T[],
  period: ManagerPeriodFilter
): T[] {
  return items.filter(item => {
    if (!item.created_at) return false
    const createdAt = new Date(item.created_at)
    return createdAt >= period.startDate && createdAt <= period.endDate
  })
}


// KPI Aggregation Function

/**
 * Calculate all manager KPIs
 */
export function calculateManagerKPIs(
  currentPeriodJOs: JOInput[],
  lastPeriodJOs: JOInput[],
  pendingApprovals: PJOApprovalInput[],
  exceededCostItems: CostItemInput[],
  jobsInProgress: JOInput[]
): ManagerKPIs {
  // Calculate P&L metrics
  const currentRevenue = currentPeriodJOs.reduce((sum, jo) => sum + (jo.final_revenue ?? 0), 0)
  const currentCosts = currentPeriodJOs.reduce((sum, jo) => sum + (jo.final_cost ?? 0), 0)
  const currentProfit = calculateGrossProfit(currentRevenue, currentCosts)
  const currentMargin = calculateMargin(currentRevenue, currentCosts)

  const lastRevenue = lastPeriodJOs.reduce((sum, jo) => sum + (jo.final_revenue ?? 0), 0)
  const lastCosts = lastPeriodJOs.reduce((sum, jo) => sum + (jo.final_cost ?? 0), 0)
  const lastProfit = calculateGrossProfit(lastRevenue, lastCosts)

  // Calculate variances
  const revenueVariance = calculateVariance(currentRevenue, lastRevenue)
  const costsVariance = calculateVariance(currentCosts, lastCosts)
  const profitVariance = calculateVariance(currentProfit, lastProfit)

  // Count operational metrics
  const pendingApprovalsCount = filterPendingApprovals(pendingApprovals).length
  const budgetExceededCount = filterBudgetAlerts(exceededCostItems).length
  const jobsInProgressCount = jobsInProgress.filter(jo => jo.status === 'active').length

  return {
    revenueMTD: currentRevenue,
    costsMTD: currentCosts,
    profitMTD: currentProfit,
    marginMTD: currentMargin,
    revenueVariance,
    costsVariance,
    profitVariance,
    pendingApprovalsCount,
    budgetExceededCount,
    jobsInProgressCount
  }
}


// P&L Summary Table Builder

const COST_CATEGORY_LABELS: Record<string, string> = {
  trucking: 'Trucking',
  port_charges: 'Port Charges',
  documentation: 'Documentation',
  handling: 'Handling',
  customs: 'Customs',
  insurance: 'Insurance',
  storage: 'Storage',
  labor: 'Labor / Crew',
  fuel: 'Fuel',
  tolls: 'Tolls',
  other: 'Other'
}

/**
 * Build P&L summary rows for display
 */
export function buildPLSummaryRows(
  currentRevenue: number,
  lastRevenue: number,
  ytdRevenue: number,
  currentCostsByCategory: Map<string, number>,
  lastCostsByCategory: Map<string, number>,
  ytdCostsByCategory: Map<string, number>
): PLSummaryRow[] {
  const rows: PLSummaryRow[] = []

  // Revenue row
  rows.push({
    category: 'Revenue',
    thisMonth: currentRevenue,
    lastMonth: lastRevenue,
    variance: calculateVariance(currentRevenue, lastRevenue),
    ytd: ytdRevenue,
    isTotal: true
  })

  // Cost category rows
  const allCategories = new Set<string>()
  currentCostsByCategory.forEach((_, key) => allCategories.add(key))
  lastCostsByCategory.forEach((_, key) => allCategories.add(key))
  ytdCostsByCategory.forEach((_, key) => allCategories.add(key))

  // Sort categories by current month value descending
  const sortedCategories = Array.from(allCategories).sort((a, b) => {
    const aVal = currentCostsByCategory.get(a) ?? 0
    const bVal = currentCostsByCategory.get(b) ?? 0
    return bVal - aVal
  })

  let totalCurrentCost = 0
  let totalLastCost = 0
  let totalYtdCost = 0

  for (const category of sortedCategories) {
    const current = currentCostsByCategory.get(category) ?? 0
    const last = lastCostsByCategory.get(category) ?? 0
    const ytd = ytdCostsByCategory.get(category) ?? 0

    if (current === 0 && last === 0 && ytd === 0) continue

    totalCurrentCost += current
    totalLastCost += last
    totalYtdCost += ytd

    rows.push({
      category: `Cost - ${COST_CATEGORY_LABELS[category] || category}`,
      thisMonth: current,
      lastMonth: last,
      variance: calculateVariance(current, last),
      ytd
    })
  }

  // Total Cost subtotal row
  rows.push({
    category: 'Total Cost',
    thisMonth: totalCurrentCost,
    lastMonth: totalLastCost,
    variance: calculateVariance(totalCurrentCost, totalLastCost),
    ytd: totalYtdCost,
    isSubtotal: true
  })

  // Gross Profit row
  const currentProfit = currentRevenue - totalCurrentCost
  const lastProfit = lastRevenue - totalLastCost
  const ytdProfit = ytdRevenue - totalYtdCost

  rows.push({
    category: 'Gross Profit',
    thisMonth: currentProfit,
    lastMonth: lastProfit,
    variance: calculateVariance(currentProfit, lastProfit),
    ytd: ytdProfit,
    isTotal: true
  })

  // Margin row
  const currentMargin = calculateMargin(currentRevenue, totalCurrentCost)
  const lastMargin = calculateMargin(lastRevenue, totalLastCost)
  const ytdMargin = calculateMargin(ytdRevenue, totalYtdCost)

  rows.push({
    category: 'Margin %',
    thisMonth: currentMargin,
    lastMonth: lastMargin,
    variance: currentMargin - lastMargin, // Percentage point difference
    ytd: ytdMargin,
    isTotal: true
  })

  return rows
}
