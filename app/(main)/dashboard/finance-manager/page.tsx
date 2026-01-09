import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getFinanceManagerMetrics } from '@/lib/dashboard/finance-manager-data'
import { formatCurrencyIDRCompact } from '@/lib/utils/format'

export default async function FinanceManagerDashboardPage() {
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

  // Check access: finance_manager role or owner/director
  const hasAccess = profile.role === 'finance_manager' || 
    ['owner', 'director'].includes(profile.role)

  if (!hasAccess) {
    redirect('/dashboard')
  }

  const metrics = await getFinanceManagerMetrics()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Finance Manager Dashboard</h1>
        <p className="text-muted-foreground">
          Feri&apos;s focused view: Financial operations, administration workflow, and team performance
        </p>
      </div>

      {/* Primary Focus: Administration & Finance */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Administration Section */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-orange-700">Administration Department</h2>
          <div className="grid gap-4">
            <div className="rounded-lg border p-4 bg-orange-50">
              <h3 className="font-semibold">Pending PJOs</h3>
              <p className="text-sm text-muted-foreground">Awaiting preparation</p>
              <div className="text-2xl font-bold text-orange-700 mt-2">{metrics.pendingPJOs}</div>
            </div>
            <div className="rounded-lg border p-4 bg-orange-50">
              <h3 className="font-semibold">Draft Invoices</h3>
              <p className="text-sm text-muted-foreground">Ready to send</p>
              <div className="text-2xl font-bold text-orange-700 mt-2">{metrics.draftInvoices}</div>
            </div>
            <div className="rounded-lg border p-4 bg-orange-50">
              <h3 className="font-semibold">Document Queue</h3>
              <p className="text-sm text-muted-foreground">Processing required</p>
              <div className="text-2xl font-bold text-orange-700 mt-2">{metrics.documentQueue}</div>
            </div>
          </div>
        </div>

        {/* Finance Section */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-purple-700">Finance Department</h2>
          <div className="grid gap-4">
            <div className="rounded-lg border p-4 bg-purple-50">
              <h3 className="font-semibold">Pending Payments</h3>
              <p className="text-sm text-muted-foreground">BKK approvals needed</p>
              <div className="text-2xl font-bold text-purple-700 mt-2">{metrics.pendingBKK}</div>
            </div>
            <div className="rounded-lg border p-4 bg-purple-50">
              <h3 className="font-semibold">AR Outstanding</h3>
              <p className="text-sm text-muted-foreground">Unpaid invoices</p>
              <div className="text-2xl font-bold text-purple-700 mt-2">
                {formatCurrencyIDRCompact(metrics.arOutstanding)}
              </div>
            </div>
            {metrics.cashPosition > 0 && (
              <div className="rounded-lg border p-4 bg-purple-50">
                <h3 className="font-semibold">Cash Position</h3>
                <p className="text-sm text-muted-foreground">Available funds</p>
                <div className="text-2xl font-bold text-purple-700 mt-2">
                  {formatCurrencyIDRCompact(metrics.cashPosition)}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Financial KPIs */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border p-4">
          <h3 className="font-semibold">Revenue MTD</h3>
          <div className="text-2xl font-bold text-green-600 mt-2">
            {formatCurrencyIDRCompact(metrics.revenueMTD)}
          </div>
          <p className={`text-sm ${metrics.revenueMTDChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {metrics.revenueMTDChange >= 0 ? '+' : ''}{metrics.revenueMTDChange}% vs last month
          </p>
        </div>
        <div className="rounded-lg border p-4">
          <h3 className="font-semibold">Gross Margin</h3>
          <div className="text-2xl font-bold text-blue-600 mt-2">{metrics.grossMargin}%</div>
          <p className={`text-sm ${metrics.grossMarginVsTarget >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
            {metrics.grossMarginVsTarget >= 0 ? '+' : ''}{metrics.grossMarginVsTarget}% vs target
          </p>
        </div>
        <div className="rounded-lg border p-4">
          <h3 className="font-semibold">Collection Rate</h3>
          <div className="text-2xl font-bold text-purple-600 mt-2">{metrics.collectionRate}%</div>
          <p className={`text-sm ${metrics.collectionRate >= 80 ? 'text-purple-600' : 'text-orange-600'}`}>
            {metrics.collectionRate >= 80 ? 'Within target' : 'Below target'}
          </p>
        </div>
        <div className="rounded-lg border p-4">
          <h3 className="font-semibold">Cost Control</h3>
          <div className="text-2xl font-bold text-orange-600 mt-2">{metrics.costControl}%</div>
          <p className="text-sm text-orange-600">Budget adherence</p>
        </div>
      </div>

      {/* Cross-Department Notifications */}
      <div className="rounded-lg border p-4 bg-blue-50">
        <h3 className="font-semibold text-blue-700 mb-2">Cross-Department Updates</h3>
        <div className="space-y-2 text-sm">
          {metrics.quotationsWonPendingPJO > 0 && (
            <div className="flex justify-between">
              <span>Marketing: {metrics.quotationsWonPendingPJO} quotation{metrics.quotationsWonPendingPJO > 1 ? 's' : ''} won, ready for PJO</span>
              <span className="text-blue-600 cursor-pointer hover:underline">View →</span>
            </div>
          )}
          {metrics.budgetExceededCount > 0 && (
            <div className="flex justify-between">
              <span>Operations: {metrics.budgetExceededCount} cost item{metrics.budgetExceededCount > 1 ? 's' : ''} exceeded budget</span>
              <span className="text-blue-600 cursor-pointer hover:underline">View →</span>
            </div>
          )}
          {metrics.quotationsWonPendingPJO === 0 && metrics.budgetExceededCount === 0 && (
            <p className="text-muted-foreground">No pending cross-department items</p>
          )}
        </div>
      </div>
    </div>
  )
}
