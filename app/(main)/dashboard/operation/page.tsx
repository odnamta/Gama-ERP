/**
 * Operations Dashboard Route
 * v0.35: Role-Based Homepage Routing
 * 
 * This route serves as the dedicated entry point for ops users.
 * SECURITY: This dashboard does NOT expose revenue or profit data.
 */

import { redirect } from 'next/navigation'
import { getUserProfile } from '@/lib/permissions-server'
import { EnhancedOpsDashboard } from '@/components/dashboard/ops'
import { getEnhancedOpsDashboardData } from '@/lib/ops-dashboard-enhanced-utils'

export default async function OperationsDashboardPage() {
  const profile = await getUserProfile()
  
  // Operations role and above can access operations dashboard
  if (!profile || !['owner', 'director', 'operations_manager', 'administration', 'ops'].includes(profile.role)) {
    redirect('/dashboard')
  }

  const enhancedOpsData = await getEnhancedOpsDashboardData()

  return <EnhancedOpsDashboard data={enhancedOpsData} userName={profile.full_name || undefined} />
}
