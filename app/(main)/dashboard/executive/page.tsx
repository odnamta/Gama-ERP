/**
 * Executive Dashboard Route - Owner View
 * v0.35: Role-Based Homepage Routing
 * 
 * This route serves as the dedicated entry point for owner users.
 * It renders the full executive dashboard with all data access.
 */

import { redirect } from 'next/navigation'
import { getUserProfile, getOwnerDashboardData } from '@/lib/permissions-server'
import { OwnerDashboard } from '@/components/dashboard/owner-dashboard'
import { DashboardSkeleton } from '@/components/dashboard/dashboard-skeleton'

export default async function ExecutiveDashboardPage() {
  const profile = await getUserProfile()
  
  // Only owner role can access executive dashboard
  if (!profile || profile.role !== 'owner') {
    redirect('/dashboard')
  }

  const ownerData = await getOwnerDashboardData()

  return <OwnerDashboard data={ownerData} />
}
