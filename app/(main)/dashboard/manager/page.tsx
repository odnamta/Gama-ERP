/**
 * Manager Dashboard Route
 * v0.35: Role-Based Homepage Routing
 * 
 * This route serves as the dedicated entry point for manager users.
 */

import { redirect } from 'next/navigation'
import { getUserProfile } from '@/lib/permissions-server'
import { ManagerDashboard } from '@/components/dashboard/manager/manager-dashboard'
import { fetchManagerDashboardData } from '../actions'

export default async function ManagerDashboardPage() {
  const profile = await getUserProfile()
  
  // Only manager role (and above) can access manager dashboard
  if (!profile || !['owner', 'admin', 'manager'].includes(profile.role)) {
    redirect('/dashboard')
  }

  const managerData = await fetchManagerDashboardData()

  return <ManagerDashboard initialData={managerData} userName={profile.full_name || undefined} />
}
