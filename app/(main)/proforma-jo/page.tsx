import { createClient } from '@/lib/supabase/server'
import { PJOListClient } from './pjo-list-client'

export default async function ProformaJOPage() {
  const supabase = await createClient()

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

  return <PJOListClient pjos={pjos || []} />
}
