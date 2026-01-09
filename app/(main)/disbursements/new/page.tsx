import { redirect } from 'next/navigation'
import { getUserProfile } from '@/lib/permissions-server'
import { createClient } from '@/lib/supabase/server'
import { NewDisbursementForm } from './new-disbursement-form'

export const metadata = {
  title: 'New Disbursement | Gama ERP',
  description: 'Create new cash disbursement (BKK)',
}

export default async function NewDisbursementPage() {
  const profile = await getUserProfile()

  // Only finance/administration can create
  const canCreate = ['owner', 'director', 'finance', 'administration'].includes(profile?.role || '')
  if (!canCreate) {
    redirect('/disbursements')
  }

  // Fetch vendors and job orders for selection
  const supabase = await createClient()
  
  const [vendorsResult, jobOrdersResult] = await Promise.all([
    supabase
      .from('vendors')
      .select('id, name, vendor_code, bank_name, bank_account, bank_account_name')
      .eq('status', 'active')
      .order('name'),
    supabase
      .from('job_orders')
      .select('id, jo_number, customer_name')
      .in('status', ['active', 'in_progress', 'pending', 'completed'])
      .order('created_at', { ascending: false })
      .limit(100),
  ])

  return (
    <NewDisbursementForm
      vendors={vendorsResult.data || []}
      jobOrders={jobOrdersResult.data || []}
      userId={profile?.id || ''}
    />
  )
}
