import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getLoginHistory, getLoginHistoryFilterOptions, getLoginHistorySummary, getRecentFailedLogins } from '@/app/actions/login-history-actions'
import { LoginHistoryClient } from './login-history-client'

/**
 * Login History Page - Server Component
 * 
 * v0.76: System Audit & Logging Module
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
 * 
 * Provides:
 * - Initial data fetch for login history
 * - Authentication and authorization check
 * - Filter options for dropdowns
 * - Session statistics summary
 * - Recent failed login alerts
 */
export default async function LoginHistoryPage() {
  const supabase = await createClient()
  
  // Check authentication
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }
  
  // Get user profile and check authorization
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('id, role, email, full_name')
    .eq('user_id', user.id)
    .single()
  
  // Only admin, owner, and manager can access login history
  const isAuthorized = profile && ['admin', 'owner', 'manager'].includes(profile.role)
  if (!isAuthorized) {
    redirect('/dashboard')
  }
  
  // Fetch initial data in parallel
  const [
    historyResult,
    filterOptionsResult,
    summaryResult,
    recentFailedResult,
    usersResult,
  ] = await Promise.all([
    getLoginHistory({}, { page: 1, page_size: 25 }),
    getLoginHistoryFilterOptions(),
    getLoginHistorySummary(7), // Last 7 days
    getRecentFailedLogins(60, 20), // Last 60 minutes, max 20
    // Get users for filter dropdown
    supabase
      .from('user_profiles')
      .select('id, email, full_name')
      .order('full_name', { ascending: true }),
  ])
  
  // Prepare initial data
  const initialData = historyResult.success && historyResult.data
    ? historyResult.data
    : { data: [], total: 0, page: 1, page_size: 25, total_pages: 0 }
  
  const filterOptions = filterOptionsResult.success && filterOptionsResult.data
    ? filterOptionsResult.data
    : { loginMethods: [], deviceTypes: [], browsers: [], operatingSystems: [] }
  
  const summary = summaryResult.success && summaryResult.data
    ? summaryResult.data
    : {
        totalLogins: 0,
        successfulLogins: 0,
        failedLogins: 0,
        uniqueUsers: 0,
        averageSessionDuration: 0,
      }
  
  const recentFailedLogins = recentFailedResult.success && recentFailedResult.data
    ? recentFailedResult.data
    : []
  
  const users = (usersResult.data || []).map(u => ({
    id: u.id,
    email: u.email || '',
    name: u.full_name || u.email || '',
  }))

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Login History</h2>
        <p className="text-muted-foreground">
          Track user authentication events, session activity, and security alerts
        </p>
      </div>

      <LoginHistoryClient
        initialData={initialData}
        filterOptions={filterOptions}
        summary={summary}
        recentFailedLogins={recentFailedLogins}
        users={users}
        currentUser={{
          id: profile.id,
          email: profile.email,
          role: profile.role,
        }}
      />
    </div>
  )
}
