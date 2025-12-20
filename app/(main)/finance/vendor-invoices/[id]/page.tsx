import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { VendorInvoiceDetailView } from '@/components/vendor-invoices'
import { canViewVendorInvoices } from '@/lib/vendor-invoice-utils'

export const metadata: Metadata = {
  title: 'Vendor Invoice Details | Gama ERP',
  description: 'View vendor invoice details',
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function VendorInvoiceDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('user_id', user.id)
    .single()

  if (!profile || !canViewVendorInvoices(profile.role)) {
    redirect('/dashboard')
  }

  return (
    <div className="container mx-auto py-6">
      <VendorInvoiceDetailView invoiceId={id} userRole={profile.role} />
    </div>
  )
}
