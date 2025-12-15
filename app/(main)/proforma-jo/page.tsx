import { createClient } from '@/lib/supabase/server'
import { PJOListClient } from './pjo-list-client'
import { getUserProfile } from '@/lib/permissions-server'

export default async function ProformaJOPage() {
  const supabase = await createClient()
  const profile = await getUserProfile()

  const { data: pjos } = await supabase
    .from('proforma_job_orders')
    .select(`
      *,
      projects (
        id,
        name,
        customers (
          id,
          name
        )
      )
    `)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  return (
    <PJOListClient
      pjos={pjos || []}
      canSeeRevenue={profile?.can_see_revenue ?? false}
      canCreatePJO={profile?.can_create_pjo ?? false}
    />
  )
}
