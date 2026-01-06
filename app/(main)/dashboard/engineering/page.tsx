import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function EngineeringDashboardPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role, department_scope')
    .eq('user_id', user.id)
    .single()

  if (!profile) {
    redirect('/login')
  }

  // Check access: engineer role or manager with engineering scope
  const hasAccess = profile.role === 'engineer' || 
    (profile.role === 'manager' && profile.department_scope?.includes('engineering')) ||
    ['owner', 'director'].includes(profile.role)

  if (!hasAccess) {
    redirect('/dashboard')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Engineering Dashboard</h1>
        <p className="text-muted-foreground">
          Monitor technical assessments, route surveys, and drawing management
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border p-4">
          <h3 className="font-semibold">Pending Reviews</h3>
          <p className="text-sm text-muted-foreground">Quotations needing engineering review</p>
        </div>
        <div className="rounded-lg border p-4">
          <h3 className="font-semibold">Route Surveys</h3>
          <p className="text-sm text-muted-foreground">Active and completed surveys</p>
        </div>
        <div className="rounded-lg border p-4">
          <h3 className="font-semibold">JMP Status</h3>
          <p className="text-sm text-muted-foreground">Journey Management Plans</p>
        </div>
        <div className="rounded-lg border p-4">
          <h3 className="font-semibold">Drawings</h3>
          <p className="text-sm text-muted-foreground">Drawing production and approvals</p>
        </div>
      </div>
    </div>
  )
}