import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export const metadata = {
  title: 'Customs Dashboard | Gama ERP',
  description: 'Customs clearance operations overview',
}

export default async function CustomsDashboardPage() {
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

  // Only customs role (or owner/director/finance_manager) can access
  const allowedRoles = ['customs', 'owner', 'director', 'finance_manager']
  if (!allowedRoles.includes(profile.role)) {
    redirect('/dashboard')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Customs Dashboard</h1>
        <p className="text-muted-foreground">
          Customs clearance, PIB/PEB processing, and duty management
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border p-4">
          <h3 className="font-semibold">Pending PIB</h3>
          <div className="text-2xl font-bold mt-2">-</div>
          <p className="text-sm text-muted-foreground">Import clearance</p>
        </div>
        <div className="rounded-lg border p-4">
          <h3 className="font-semibold">Pending PEB</h3>
          <div className="text-2xl font-bold mt-2">-</div>
          <p className="text-sm text-muted-foreground">Export clearance</p>
        </div>
        <div className="rounded-lg border p-4">
          <h3 className="font-semibold">Duties This Month</h3>
          <div className="text-2xl font-bold mt-2">-</div>
          <p className="text-sm text-muted-foreground">Total paid</p>
        </div>
        <div className="rounded-lg border p-4">
          <h3 className="font-semibold">Clearance Time Avg</h3>
          <div className="text-2xl font-bold mt-2">-</div>
          <p className="text-sm text-muted-foreground">Days</p>
        </div>
      </div>

      <div className="text-sm text-muted-foreground">
        Note: Dashboard metrics will be populated with real data in future updates
      </div>
    </div>
  )
}
