/**
 * Marketing Dashboard Route
 * v0.35: Role-Based Homepage Routing
 * 
 * This route serves as the dedicated entry point for marketing users.
 * Uses the SalesDashboard component (renamed from sales to marketing role).
 */

import { redirect } from 'next/navigation'
import { getUserProfile } from '@/lib/permissions-server'
import { profileHasRole } from '@/lib/auth-utils'
import { SalesDashboard } from '@/components/dashboard/sales/sales-dashboard'
import { fetchSalesDashboardData, refreshSalesDashboardData } from '@/app/(main)/dashboard/actions'

export default async function MarketingDashboardPage() {
  const profile = await getUserProfile()
  
  // Marketing role and above can access marketing dashboard
  if (!profileHasRole(profile, ['owner', 'director', 'marketing_manager', 'administration', 'marketing'])) {
    redirect('/dashboard')
  }

  const initialData = await fetchSalesDashboardData()

  return (
    <SalesDashboard 
      initialData={initialData} 
      onPeriodChange={refreshSalesDashboardData}
    />
  )
}
