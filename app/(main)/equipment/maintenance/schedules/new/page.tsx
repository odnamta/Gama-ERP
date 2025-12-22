import { Suspense } from 'react'
import { NewScheduleClient } from './new-schedule-client'

export default function NewSchedulePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-12">Loading...</div>}>
      <NewScheduleClient />
    </Suspense>
  )
}
