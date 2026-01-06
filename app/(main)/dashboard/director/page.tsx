import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function DirectorDashboardPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role, email')
    .eq('user_id', user.id)
    .single()

  if (!profile) {
    redirect('/login')
  }

  // Check access: director role or owner
  const hasAccess = profile.role === 'director' || profile.role === 'owner'

  if (!hasAccess) {
    redirect('/dashboard')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Director Dashboard</h1>
        <p className="text-muted-foreground">
          Executive oversight and strategic management
        </p>
      </div>

      {/* Executive Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border p-4">
          <h3 className="font-semibold">Company Performance</h3>
          <div className="text-2xl font-bold text-green-600 mt-2">Excellent</div>
          <p className="text-sm text-green-600">All KPIs on target</p>
        </div>
        <div className="rounded-lg border p-4">
          <h3 className="font-semibold">Revenue MTD</h3>
          <div className="text-2xl font-bold text-blue-600 mt-2">Rp 4.2B</div>
          <p className="text-sm text-blue-600">+15% vs last month</p>
        </div>
        <div className="rounded-lg border p-4">
          <h3 className="font-semibold">Profit Margin</h3>
          <div className="text-2xl font-bold text-purple-600 mt-2">32%</div>
          <p className="text-sm text-purple-600">Above industry avg</p>
        </div>
        <div className="rounded-lg border p-4">
          <h3 className="font-semibold">Active Projects</h3>
          <div className="text-2xl font-bold text-orange-600 mt-2">28</div>
          <p className="text-sm text-orange-600">12 new this month</p>
        </div>
      </div>

      {/* Department Status */}
      <div className="grid gap-6 md:grid-cols-3">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-blue-700">Marketing & Sales</h2>
          <div className="rounded-lg border p-4 bg-blue-50">
            <h3 className="font-semibold">Pipeline Value</h3>
            <div className="text-2xl font-bold text-blue-700 mt-2">Rp 8.5B</div>
            <p className="text-sm text-muted-foreground">15 active quotations</p>
          </div>
          <div className="rounded-lg border p-4 bg-blue-50">
            <h3 className="font-semibold">Win Rate</h3>
            <div className="text-2xl font-bold text-blue-700 mt-2">72%</div>
            <p className="text-sm text-muted-foreground">Above target (65%)</p>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-green-700">Operations</h2>
          <div className="rounded-lg border p-4 bg-green-50">
            <h3 className="font-semibold">On-Time Delivery</h3>
            <div className="text-2xl font-bold text-green-700 mt-2">96%</div>
            <p className="text-sm text-muted-foreground">Excellent performance</p>
          </div>
          <div className="rounded-lg border p-4 bg-green-50">
            <h3 className="font-semibold">Safety Score</h3>
            <div className="text-2xl font-bold text-green-700 mt-2">99.2</div>
            <p className="text-sm text-muted-foreground">Zero incidents</p>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-purple-700">Finance</h2>
          <div className="rounded-lg border p-4 bg-purple-50">
            <h3 className="font-semibold">Cash Position</h3>
            <div className="text-2xl font-bold text-purple-700 mt-2">Rp 1.2B</div>
            <p className="text-sm text-muted-foreground">Strong liquidity</p>
          </div>
          <div className="rounded-lg border p-4 bg-purple-50">
            <h3 className="font-semibold">AR Collection</h3>
            <div className="text-2xl font-bold text-purple-700 mt-2">88%</div>
            <p className="text-sm text-muted-foreground">Within target</p>
          </div>
        </div>
      </div>

      {/* Strategic Initiatives */}
      <div className="rounded-lg border p-6">
        <h2 className="text-xl font-semibold mb-4">Strategic Initiatives</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <h3 className="font-semibold text-blue-600">Market Expansion</h3>
            <p className="text-sm text-muted-foreground">Expanding into new logistics corridors</p>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full" style={{ width: '75%' }}></div>
            </div>
            <p className="text-xs text-muted-foreground">75% complete</p>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold text-green-600">Digital Transformation</h3>
            <p className="text-sm text-muted-foreground">ERP system implementation and optimization</p>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-green-600 h-2 rounded-full" style={{ width: '60%' }}></div>
            </div>
            <p className="text-xs text-muted-foreground">60% complete</p>
          </div>
        </div>
      </div>
    </div>
  )
}