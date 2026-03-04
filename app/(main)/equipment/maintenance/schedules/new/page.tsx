import { Suspense } from 'react'
import { getCurrentUserProfile, guardPage } from '@/lib/auth-utils'
import { NewScheduleClient } from './new-schedule-client'

export default async function NewSchedulePage() {
  const profile = await getCurrentUserProfile()
  const { explorerReadOnly } = await guardPage(!!profile)
  if (explorerReadOnly) {
    const { redirect } = await import('next/navigation')
    redirect('/equipment/maintenance/schedules')
  }

  return (
    <Suspense fallback={<div className="flex items-center justify-center py-12">Loading...</div>}>
      <NewScheduleClient />
    </Suspense>
  )
}
