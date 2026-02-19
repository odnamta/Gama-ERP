import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { canViewEmployees } from '@/lib/permissions'
import { UserProfile } from '@/types/permissions'

export default async function HRLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get user profile to check role
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!profile) {
    redirect('/login')
  }

  // Check if user can access HR module
  // Allow access in explorer mode (co-builder competition read-only browsing)
  const cookieStore = await cookies()
  const isExplorer = cookieStore.get('gama-explorer-mode')?.value === 'true'

  if (!canViewEmployees(profile as unknown as UserProfile) && !isExplorer) {
    redirect('/dashboard')
  }

  return <>{children}</>
}
