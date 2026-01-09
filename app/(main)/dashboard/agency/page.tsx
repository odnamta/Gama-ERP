import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export const metadata = {
  title: 'Agency Dashboard | Gama ERP',
  description: 'Agency division operations overview',
}

export default async function AgencyDashboardPage() {
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

  if (!profile) {
    redirect('/login')
  }

  // Only agency role (or owner/director) can access
  const allowedRoles = ['agency', 'owner', 'director']
  if (!allowedRoles.includes(profile.role)) {
    redirect('/dashboard')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Agency Dashboard</h1>
        <p className="text-muted-foreground">
          Shipping operations, bookings, and B/L management
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border p-4">
          <h3 className="font-semibold">Active Bookings</h3>
          <div className="text-2xl font-bold mt-2">-</div>
          <p className="text-sm text-muted-foreground">In progress</p>
        </div>
        <div className="rounded-lg border p-4">
          <h3 className="font-semibold">Pending B/Ls</h3>
          <div className="text-2xl font-bold mt-2">-</div>
          <p className="text-sm text-muted-foreground">Awaiting completion</p>
        </div>
        <div className="rounded-lg border p-4">
          <h3 className="font-semibold">Vessels This Week</h3>
          <div className="text-2xl font-bold mt-2">-</div>
          <p className="text-sm text-muted-foreground">Scheduled arrivals</p>
        </div>
        <div className="rounded-lg border p-4">
          <h3 className="font-semibold">Container Tracking</h3>
          <div className="text-2xl font-bold mt-2">-</div>
          <p className="text-sm text-muted-foreground">Active shipments</p>
        </div>
      </div>

      <div className="text-sm text-muted-foreground">
        Note: Dashboard metrics will be populated with real data in future updates
      </div>
    </div>
  )
}
