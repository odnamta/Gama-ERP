import Link from 'next/link'
import { InvoicesClient } from './invoices-client'
import { getUserProfile } from '@/lib/permissions-server'
import { canAccessFeature } from '@/lib/permissions'
import { buttonVariants } from '@/components/ui/button'
import { Plus } from 'lucide-react'

export default async function InvoicesPage() {
  const profile = await getUserProfile()
  const canCreate = canAccessFeature(profile, 'invoices.create')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Invoices</h2>
          <p className="text-muted-foreground">Manage customer invoices and billing</p>
        </div>
        {canCreate && (
          <Link href="/invoices/new" className={buttonVariants({ variant: 'default' })}>
            <Plus className="mr-2 h-4 w-4" />
            New Invoice
          </Link>
        )}
      </div>

      <InvoicesClient />
    </div>
  )
}
