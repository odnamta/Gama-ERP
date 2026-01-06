import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function SysAdminDashboardPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('user_id', user.id)
    .single()

  if (!profile || !['owner', 'director', 'sysadmin'].includes(profile.role)) {
    redirect('/dashboard')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">System Administration</h1>
        <p className="text-muted-foreground">
          Manage users, system settings, and monitor system health
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border p-4">
          <h3 className="font-semibold">User Management</h3>
          <p className="text-sm text-muted-foreground">Manage user accounts and permissions</p>
        </div>
        <div className="rounded-lg border p-4">
          <h3 className="font-semibold">System Logs</h3>
          <p className="text-sm text-muted-foreground">Monitor system activity and errors</p>
        </div>
        <div className="rounded-lg border p-4">
          <h3 className="font-semibold">Security</h3>
          <p className="text-sm text-muted-foreground">Security events and access control</p>
        </div>
        <div className="rounded-lg border p-4">
          <h3 className="font-semibold">System Health</h3>
          <p className="text-sm text-muted-foreground">Monitor system performance</p>
        </div>
      </div>
    </div>
  )
}