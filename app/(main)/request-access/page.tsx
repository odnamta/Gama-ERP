// =====================================================
// v0.84: REQUEST ACCESS PAGE - Server Component
// =====================================================
// Requirements: 1.1, 2.3
// - Redirect users without role to this page
// - Redirect users with valid roles to dashboard

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUserRoleRequest } from './actions'
import { RequestAccessClient } from './request-access-client'
import { UserRole } from '@/types/permissions'

export const metadata = {
  title: 'Request Access | GAMA ERP',
  description: 'Request access to GAMA ERP system',
}

/**
 * Valid roles that grant access to the system
 * Users with these roles should be redirected to dashboard
 */
const VALID_ROLES: UserRole[] = [
  'owner',
  'director',
  'marketing_manager',
  'finance_manager',
  'operations_manager',
  'sysadmin',
  'administration',
  'finance',
  'marketing',
  'ops',
  'engineer',
  'hr',
  'hse',
  'agency',
  'customs',
]

export default async function RequestAccessPage() {
  const supabase = await createClient()

  // 1. Check if user is authenticated
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    // Not authenticated - redirect to login
    redirect('/login')
  }

  // 2. Check if user already has a valid role in user_profiles
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  // If user has a valid role, redirect to dashboard (Requirement 2.3)
  if (profile?.role && VALID_ROLES.includes(profile.role as UserRole)) {
    redirect('/dashboard')
  }

  // 3. Fetch existing role request if any
  const existingRequest = await getUserRoleRequest()

  // If request was approved, redirect to dashboard
  // (This handles the case where role was just assigned)
  if (existingRequest?.status === 'approved') {
    redirect('/dashboard')
  }

  // 4. Get user email and name from auth
  const userEmail = user.email || ''
  const userName = user.user_metadata?.full_name || 
                   user.user_metadata?.name || 
                   null

  // 5. Render RequestAccessClient with initial data
  return (
    <RequestAccessClient
      userEmail={userEmail}
      userName={userName}
      existingRequest={existingRequest}
    />
  )
}
