/**
 * Sales Dashboard Route
 * v0.35: Role-Based Homepage Routing
 * 
 * This route serves as the dedicated entry point for sales users (Hutami).
 * Hutami gets the Sales-Engineering combined dashboard.
 */

import { redirect } from 'next/navigation'
import { getUserProfile } from '@/lib/permissions-server'
import { SalesDashboard } from '@/components/dashboard/sales/sales-dashboard'
import { SalesEngineeringDashboard } from '@/components/dashboard/sales-engineering'
import { fetchSalesDashboardData } from '../actions'
import { getSalesEngineeringDashboardData } from '../sales-engineering-actions'

// Hutami's email - Marketing Manager who also manages Engineering
const HUTAMI_EMAIL = 'hutamiarini@gama-group.co'

export default async function SalesDashboardPage() {
  const profile = await getUserProfile()
  
  // Sales role and above can access sales dashboard
  if (!profile || !['owner', 'admin', 'manager', 'sales'].includes(profile.role)) {
    redirect('/dashboard')
  }

  // Check if this is Hutami (Marketing Manager who also manages Engineering)
  const isHutami = profile.email === HUTAMI_EMAIL

  if (isHutami) {
    // Fetch sales-engineering dashboard data for Hutami
    const salesEngineeringData = await getSalesEngineeringDashboardData()
    return <SalesEngineeringDashboard data={salesEngineeringData} userName={profile.full_name || undefined} />
  }

  // Regular sales users get the standard sales dashboard
  const salesData = await fetchSalesDashboardData()
  return <SalesDashboard initialData={salesData} />
}
