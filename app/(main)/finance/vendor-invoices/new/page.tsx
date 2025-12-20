import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { VendorInvoiceForm } from '@/components/vendor-invoices'
import { canEditVendorInvoices } from '@/lib/vendor-invoice-utils'

export const metadata: Metadata = {
  title: 'New Vendor Invoice | Gama ERP',
  description: 'Record a new vendor invoice',
}

export default async function NewVendorInvoicePage() {
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

  if (!profile || !canEditVendorInvoices(profile.role)) {
    redirect('/finance/vendor-invoices')
  }

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Record Vendor Invoice</h1>
        <p className="text-muted-foreground">
          Enter details of a new vendor invoice
        </p>
      </div>

      <VendorInvoiceForm />
    </div>
  )
}
