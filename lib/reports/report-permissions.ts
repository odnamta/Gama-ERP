// Report Permissions Utility
// Defines which roles can access which reports

import { UserRole } from '@/types/permissions'
import { ReportConfig, ReportCategory } from '@/types/reports'

/**
 * Report configuration with role-based access control
 */
export const REPORTS: ReportConfig[] = [
  // Financial Reports
  {
    id: 'profit-loss',
    title: 'Profit & Loss Statement',
    description: 'Revenue, costs, and margins by period',
    category: 'financial',
    href: '/reports/profit-loss',
    icon: 'TrendingUp',
    allowedRoles: ['owner', 'admin', 'manager', 'finance'],
  },
  {
    id: 'revenue-customer',
    title: 'Revenue by Customer',
    description: 'Revenue breakdown by customer',
    category: 'financial',
    href: '/reports/revenue-customer',
    icon: 'Users',
    allowedRoles: ['owner', 'admin', 'manager', 'finance', 'sales'],
  },
  {
    id: 'cost-analysis',
    title: 'Cost Analysis by Category',
    description: 'Detailed cost breakdown by category',
    category: 'financial',
    href: '/reports/cost-analysis',
    icon: 'PieChart',
    allowedRoles: ['owner', 'admin', 'manager', 'finance'],
  },
  // Operational Reports
  {
    id: 'budget-variance',
    title: 'Budget Variance Report',
    description: 'Estimated vs actual costs per PJO',
    category: 'operational',
    href: '/reports/budget-variance',
    icon: 'BarChart3',
    allowedRoles: ['owner', 'admin', 'manager', 'ops'],
  },
  {
    id: 'jo-summary',
    title: 'Job Order Summary',
    description: 'Overview of all job orders',
    category: 'operational',
    href: '/reports/jo-summary',
    icon: 'ClipboardList',
    allowedRoles: ['owner', 'admin', 'manager', 'ops'],
  },
  // Accounts Receivable Reports
  {
    id: 'ar-aging',
    title: 'AR Aging Report',
    description: 'Outstanding invoices by age',
    category: 'ar',
    href: '/reports/ar-aging',
    icon: 'Clock',
    allowedRoles: ['owner', 'admin', 'manager', 'finance'],
  },
  {
    id: 'outstanding-invoices',
    title: 'Outstanding Invoices',
    description: 'All unpaid invoices',
    category: 'ar',
    href: '/reports/outstanding-invoices',
    icon: 'FileText',
    allowedRoles: ['owner', 'admin', 'manager', 'finance'],
  },
  // Sales Reports
  {
    id: 'quotation-conversion',
    title: 'Quotation Conversion Rate',
    description: 'PJO conversion and pipeline analysis',
    category: 'sales',
    href: '/reports/quotation-conversion',
    icon: 'TrendingUp',
    allowedRoles: ['owner', 'admin', 'manager', 'sales'],
  },
  // Phase 2 Reports
  {
    id: 'revenue-by-customer',
    title: 'Revenue by Customer',
    description: 'Revenue breakdown by customer from completed JOs',
    category: 'financial',
    href: '/reports/revenue-by-customer',
    icon: 'Users',
    allowedRoles: ['owner', 'admin', 'manager', 'finance', 'sales'],
  },
  {
    id: 'revenue-by-project',
    title: 'Revenue by Project',
    description: 'Revenue and profit analysis by project',
    category: 'financial',
    href: '/reports/revenue-by-project',
    icon: 'FolderKanban',
    allowedRoles: ['owner', 'admin', 'manager'],
  },
  {
    id: 'on-time-delivery',
    title: 'On-Time Delivery',
    description: 'Delivery performance metrics',
    category: 'operational',
    href: '/reports/on-time-delivery',
    icon: 'Clock',
    allowedRoles: ['owner', 'admin', 'manager', 'ops'],
  },
  {
    id: 'vendor-performance',
    title: 'Vendor Performance',
    description: 'Vendor spend and performance analysis',
    category: 'operational',
    href: '/reports/vendor-performance',
    icon: 'Truck',
    allowedRoles: ['owner', 'admin', 'manager', 'ops'],
  },
  {
    id: 'customer-payment-history',
    title: 'Customer Payment History',
    description: 'Payment patterns and slow payer analysis',
    category: 'ar',
    href: '/reports/customer-payment-history',
    icon: 'CreditCard',
    allowedRoles: ['owner', 'admin', 'manager', 'finance'],
  },
  {
    id: 'sales-pipeline',
    title: 'Sales Pipeline Analysis',
    description: 'PJO pipeline stages and weighted values',
    category: 'sales',
    href: '/reports/sales-pipeline',
    icon: 'TrendingUp',
    allowedRoles: ['owner', 'admin', 'manager', 'sales'],
  },
  {
    id: 'customer-acquisition',
    title: 'Customer Acquisition',
    description: 'New customer trends and revenue analysis',
    category: 'sales',
    href: '/reports/customer-acquisition',
    icon: 'UserPlus',
    allowedRoles: ['owner', 'admin', 'manager', 'sales'],
  },
]

/**
 * Get reports visible to a specific role
 */
export function getVisibleReports(role: UserRole): ReportConfig[] {
  return REPORTS.filter((report) => report.allowedRoles.includes(role))
}

/**
 * Check if a role can access a specific report
 */
export function canAccessReport(role: UserRole, reportId: string): boolean {
  const report = REPORTS.find((r) => r.id === reportId)
  if (!report) return false
  return report.allowedRoles.includes(role)
}

/**
 * Get reports grouped by category for a specific role
 */
export function getReportsByCategory(role: UserRole): Record<ReportCategory, ReportConfig[]> {
  const visibleReports = getVisibleReports(role)
  
  return {
    financial: visibleReports.filter((r) => r.category === 'financial'),
    operational: visibleReports.filter((r) => r.category === 'operational'),
    ar: visibleReports.filter((r) => r.category === 'ar'),
    sales: visibleReports.filter((r) => r.category === 'sales'),
  }
}

/**
 * Get category display name
 */
export function getCategoryDisplayName(category: ReportCategory): string {
  const names: Record<ReportCategory, string> = {
    financial: 'Financial Reports',
    operational: 'Operational Reports',
    ar: 'Accounts Receivable',
    sales: 'Sales Reports',
  }
  return names[category]
}

/**
 * Get category icon
 */
export function getCategoryIcon(category: ReportCategory): string {
  const icons: Record<ReportCategory, string> = {
    financial: 'DollarSign',
    operational: 'Settings',
    ar: 'Receipt',
    sales: 'TrendingUp',
  }
  return icons[category]
}
