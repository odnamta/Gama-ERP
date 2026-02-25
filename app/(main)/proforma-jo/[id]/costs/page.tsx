import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { CostsClient } from './costs-client'
import { canEditCostItems } from '@/lib/pjo-utils'
import { PJOCostItem } from '@/types'

interface CostsPageProps {
  params: Promise<{ id: string }>
}

export default async function CostsPage({ params }: CostsPageProps) {
  const { id } = await params
  const supabase = await createClient()

  // Get current user and role
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) { notFound() }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('user_id', user.id)
    .single()

  const userRole = profile?.role || 'ops'

  // Fetch PJO with relations
  const { data: pjo, error: pjoError } = await supabase
    .from('proforma_job_orders')
    .select(`
      *,
      projects:project_id (
        id,
        name,
        customers:customer_id (
          id,
          name
        )
      )
    `)
    .eq('id', id)
    .eq('is_active', true)
    .single()

  if (pjoError || !pjo) {
    notFound()
  }

  // Fetch cost items
  const { data: costItems, error: costError } = await supabase
    .from('pjo_cost_items')
    .select('*')
    .eq('pjo_id', id)
    .order('created_at', { ascending: true })

  if (costError) {
  }

  // Determine if user can edit
  const canEdit = canEditCostItems(userRole, pjo.status, pjo.converted_to_jo)

  return (
    <CostsClient
      pjo={pjo}
      costItems={(costItems as PJOCostItem[]) || []}
      canEdit={canEdit}
    />
  )
}
