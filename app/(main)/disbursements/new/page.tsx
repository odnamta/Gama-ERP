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
  
  const { data: vendors } = await supabase
    .from('vendors')
    .select('id, vendor_name, vendor_code, bank_name, bank_account, bank_account_name')
    .eq('is_active', true)
    .order('vendor_name')

  const { data: jobOrders } = await supabase
    .from('job_orders')
    .select('id, jo_number')
    .in('status', ['active', 'in_progress', 'pending', 'completed'])
    .order('created_at', { ascending: false })
    .limit(100)

  return (
    <NewDisbursementForm
      vendors={vendors || []}
      jobOrders={jobOrders || []}
      userId={profile?.id || ''}
    />
  )
}
