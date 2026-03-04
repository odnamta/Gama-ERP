import { Suspense } from 'react'
import { getCurrentUserProfile, guardPage } from '@/lib/auth-utils'
import { NewMaintenanceClient } from './new-maintenance-client'

export default async function NewMaintenancePage() {
  const profile = await getCurrentUserProfile()
  const { explorerReadOnly } = await guardPage(!!profile)
  if (explorerReadOnly) {
    const { redirect } = await import('next/navigation')
    redirect('/equipment/maintenance')
  }

  return (
    <Suspense fallback={<div className="flex items-center justify-center py-12">Loading...</div>}>
      <NewMaintenanceClient />
    </Suspense>
  )
}
