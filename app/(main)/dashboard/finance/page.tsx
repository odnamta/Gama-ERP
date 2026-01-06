/**
 * Finance Dashboard Route
 * v0.35: Role-Based Homepage Routing
 * 
 * This route serves as the dedicated entry point for finance users (Feri).
 */

import { redirect } from 'next/navigation'
import { getUserProfile } from '@/lib/permissions-server'
import { FinanceDashboard } from '@/components/dashboard/finance/finance-dashboard'
import { fetchFinanceDashboardData } from '../actions'

export default async function FinanceDashboardPage() {
  const profile = await getUserProfile()
  
  // Finance role and above can access finance dashboard
  if (!profile || !['owner', 'director', 'administration', 'manager', 'finance'].includes(profile.role)) {
    redirect('/dashboard')
  }

  const financeData = await fetchFinanceDashboardData()

  return <FinanceDashboard data={financeData} />
}
