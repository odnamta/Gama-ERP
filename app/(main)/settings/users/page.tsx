import { redirect } from 'next/navigation'
import { getUserProfile, getAllUsers } from '@/lib/permissions-server'
import { UserManagementClient } from './user-management-client'
import { getPendingRoleRequests } from './actions'

export default async function UsersPage() {
  const profile = await getUserProfile()

  // Check if user has permission to manage users
  if (!profile?.can_manage_users) {
    redirect('/dashboard')
  }

  // Fetch users and pending role requests in parallel
  const [users, pendingRequests] = await Promise.all([
    getAllUsers(),
    getPendingRoleRequests(),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">User Management</h2>
        <p className="text-muted-foreground">Manage user roles and permissions</p>
      </div>

      <UserManagementClient 
        users={users} 
        currentUserId={profile.user_id ?? ''} 
        pendingRequests={pendingRequests}
      />
    </div>
  )
}
