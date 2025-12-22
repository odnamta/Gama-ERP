import { Suspense } from 'react'
import { SchedulesClient } from './schedules-client'

export default function SchedulesPage() {
  return (
    <Suspense fallback={<SchedulesSkeleton />}>
      <SchedulesClient />
    </Suspense>
  )
}

function SchedulesSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-9 w-56 bg-muted animate-pulse rounded" />
          <div className="h-5 w-72 bg-muted animate-pulse rounded mt-2" />
        </div>
        <div className="h-10 w-40 bg-muted animate-pulse rounded" />
      </div>
      
      <div className="rounded-md border">
        <div className="h-12 bg-muted/50 border-b" />
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 border-b last:border-0" />
        ))}
      </div>
    </div>
  )
}
