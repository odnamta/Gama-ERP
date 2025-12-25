import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getRetentionSummary, getArchiveHistory } from '@/app/actions/retention-actions'
import { RetentionClient } from './retention-client'

/**
 * Storage and Retention Page - Server Component
 * 
 * v0.76: System Audit & Logging Module
 * Requirements: 8.1, 8.2, 8.3, 8.4
 * 
 * Provides:
 * - Storage statistics display
 * - Retention configuration
 * - Archive controls
 */
export default async function RetentionPage() {
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
  
  // Only admin and owner can access retention settings
  const isAuthorized = profile && ['admin', 'owner'].includes(profile.role)
  if (!isAuthorized) {
    redirect('/dashboard')
  }
  
  // Fetch initial data in parallel
  const [summaryResult, archiveHistoryResult] = await Promise.all([
    getRetentionSummary(),
    getArchiveHistory(20),
  ])
  
  // Prepare initial data
  const summary = summaryResult.success && summaryResult.data
    ? summaryResult.data
    : null
  
  const archiveHistory = archiveHistoryResult.success && archiveHistoryResult.data
    ? archiveHistoryResult.data
    : []

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Storage & Retention</h2>
        <p className="text-muted-foreground">
          Manage audit log storage, configure retention policies, and archive old records
        </p>
      </div>

      <RetentionClient
        initialSummary={summary}
        archiveHistory={archiveHistory}
        currentUser={{
          id: profile.id,
          email: profile.email,
          role: profile.role,
        }}
      />
    </div>
  )
}
