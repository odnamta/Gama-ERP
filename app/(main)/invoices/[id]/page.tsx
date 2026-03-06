import { notFound } from 'next/navigation'
import { getInvoice, getRevenueReconciliation } from '../actions'
import { InvoiceDetailView } from '@/components/invoices/invoice-detail-view'
import { createClient } from '@/lib/supabase/server'

interface InvoiceDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function InvoiceDetailPage({ params }: InvoiceDetailPageProps) {
  const { id } = await params

  // Parallelize invoice fetch + auth check
  const supabase = await createClient()
  const [invoice, authResult] = await Promise.all([
    getInvoice(id),
    supabase.auth.getUser(),
  ])

  if (!invoice) {
    notFound()
  }

  const user = authResult.data.user

  // Parallelize profile fetch + reconciliation fetch
  const [profileResult, reconciliation] = await Promise.all([
    user
      ? supabase.from('user_profiles').select('role').eq('user_id', user.id).single()
      : Promise.resolve({ data: null }),
    invoice.jo_id
      ? getRevenueReconciliation(invoice.jo_id)
      : Promise.resolve(null),
  ])

  const userRole = profileResult.data?.role || 'viewer'

  return (
    <InvoiceDetailView
      invoice={invoice}
      userRole={userRole}
      reconciliation={reconciliation}
    />
  )
}
