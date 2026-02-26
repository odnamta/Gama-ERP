'use server'

/**
 * Centralized auth helpers for the profile → employee lookup chain.
 *
 * Database FK chain:
 *   auth.users.id → user_profiles.user_id → user_profiles.id → employees.user_id
 *
 * Previously this 3-query pattern was duplicated in 10+ server action files.
 * Import from here instead.
 */

import { createClient } from '@/lib/supabase/server'
import { getUserProfile } from '@/lib/permissions-server'

export interface CurrentEmployee {
  profileId: string
  employeeId: string
  fullName: string
}

/**
 * Get the current user's employee record.
 * Combines: auth.getUser() → user_profiles → employees in one call.
 * Returns null if any step fails (not authenticated, no profile, no employee).
 */
export async function getCurrentEmployee(): Promise<CurrentEmployee | null> {
  const profile = await getUserProfile()
  if (!profile) return null

  const supabase = await createClient()
  const { data: employee } = await supabase
    .from('employees')
    .select('id, full_name')
    .eq('user_id', profile.id)
    .single()

  if (!employee) return null

  return {
    profileId: profile.id,
    employeeId: employee.id,
    fullName: employee.full_name,
  }
}

/**
 * Get only the employee ID for the current user.
 * Use when you only need the ID for FK references.
 */
export async function getCurrentEmployeeId(): Promise<string | null> {
  const emp = await getCurrentEmployee()
  return emp?.employeeId ?? null
}

/**
 * Get the current user's profile ID (user_profiles.id, NOT auth UUID).
 * Use for FK references that point to user_profiles.
 */
export async function getCurrentProfileId(): Promise<string | null> {
  const profile = await getUserProfile()
  return profile?.id ?? null
}
