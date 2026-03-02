import type { ComponentProps } from 'react'
import { redirect } from 'next/navigation'
import { getUserProfile } from '@/lib/permissions-server'
import { guardPage, profileHasRole } from '@/lib/auth-utils'
import { createClient } from '@/lib/supabase/server'
import { DisbursementsClient } from './disbursements-client'
import { ExplorerReadOnlyBanner } from '@/components/layout/explorer-read-only-banner'

export const metadata = {
  title: 'Disbursements | Gama ERP',
  description: 'Cash disbursement management (BKK)',
}

async function fetchBKKRecords() {
  const supabase = await createClient()
  const result = await (supabase
    .from('bukti_kas_keluar' as any)
    .select(`
      *,
      job_orders:jo_id (jo_number, customer_name),
      vendors:vendor_id (vendor_name, vendor_code),
      requested_by_profile:user_profiles!bukti_kas_keluar_requested_by_fkey (full_name),
      approved_by_profile:user_profiles!bukti_kas_keluar_approved_by_fkey (full_name)
    `)
    .order('created_at', { ascending: false })
    .limit(200) as any)

  return result
}

async function fetchBKKStats() {
  const supabase = await createClient()
  const { data } = await (supabase
    .from('bukti_kas_keluar' as any)
    .select('status, amount_requested') as any)

  const records = (data || []) as { status: string; amount_requested: number }[]
  const aggregate = (statuses: string[]) => {
    const filtered = records.filter(r => statuses.includes(r.status))
    return {
      count: filtered.length,
      amount: filtered.reduce((sum, r) => sum + Number(r.amount_requested || 0), 0),
    }
  }

  const all = aggregate(['draft', 'pending', 'approved', 'released', 'settled', 'rejected', 'cancelled'])
  const pending = aggregate(['pending'])
  const approved = aggregate(['approved'])
  const released = aggregate(['released'])
  const settled = aggregate(['settled'])

  return {
    totalCount: all.count, totalAmount: all.amount,
    pendingCount: pending.count, pendingAmount: pending.amount,
    approvedCount: approved.count, approvedAmount: approved.amount,
    releasedCount: released.count, releasedAmount: released.amount,
    settledCount: settled.count, settledAmount: settled.amount,
  }
}

export default async function DisbursementsPage() {
  const profile = await getUserProfile()

  // Check permissions
  const allowedRoles = ['owner', 'director', 'marketing_manager', 'finance_manager', 'operations_manager', 'finance', 'administration']
  const { explorerReadOnly } = await guardPage(profileHasRole(profile, allowedRoles))

  const [{ data: bkks, error }, serverStats] = await Promise.all([
    fetchBKKRecords(),
    fetchBKKStats(),
  ])

  if (error) {
  }

  return (
    <>
      {explorerReadOnly && <ExplorerReadOnlyBanner />}
      <DisbursementsClient initialData={(bkks ?? []) as unknown as ComponentProps<typeof DisbursementsClient>['initialData']} userRole={profile?.role || 'viewer'} serverStats={serverStats} />
    </>
  )
}
