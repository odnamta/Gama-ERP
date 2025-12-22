import { Suspense } from 'react'
import { NewMaintenanceClient } from './new-maintenance-client'

export default function NewMaintenancePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-12">Loading...</div>}>
      <NewMaintenanceClient />
    </Suspense>
  )
}
