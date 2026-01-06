/**
 * Admin Dashboard Route
 * v0.35: Role-Based Homepage Routing
 * 
 * This route serves as the dedicated entry point for admin users.
 */

import { redirect } from 'next/navigation'
import { getUserProfile } from '@/lib/permissions-server'
import { AdminDashboard } from '@/components/dashboard/admin/admin-dashboard'
import { fetchAdminDashboardData } from '../actions'

export default async function AdminDashboardPage() {
  const profile = await getUserProfile()
  
  // Only administration role can access admin dashboard
  if (!profile || !['owner', 'director', 'administration'].includes(profile.role)) {
    redirect('/dashboard')
  }

  const adminData = await fetchAdminDashboardData()

  return <AdminDashboard initialData={adminData} userName={profile.full_name || undefined} />
}
