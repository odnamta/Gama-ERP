import { createClient } from '@/lib/supabase/server'
import { CustomersClient } from './customers-client'

export default async function CustomersPage() {
  const supabase = await createClient()

  const { data: customers, error } = await supabase
    .from('customers')
    .select('*')
    .eq('is_active', true)
    .order('name')

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Customers</h2>
          <p className="text-muted-foreground">Manage customer accounts and contacts</p>
        </div>
        <div className="rounded-md border border-destructive bg-destructive/10 p-4">
          <p className="text-sm text-destructive">Failed to load customers: {error.message}</p>
        </div>
      </div>
    )
  }

  return <CustomersClient customers={customers || []} />
}
