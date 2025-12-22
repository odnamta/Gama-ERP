import { Suspense } from 'react'
import { MaintenanceClient } from './maintenance-client'

export default function MaintenancePage() {
  return (
    <Suspense fallback={<MaintenancePageSkeleton />}>
      <MaintenanceClient />
    </Suspense>
  )
}

function MaintenancePageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-9 w-48 bg-muted animate-pulse rounded" />
          <div className="h-5 w-64 bg-muted animate-pulse rounded mt-2" />
        </div>
        <div className="h-10 w-40 bg-muted animate-pulse rounded" />
      </div>
      
      {/* Summary cards skeleton */}
      <div className="grid gap-4 md:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-lg border bg-card p-6">
            <div className="h-4 w-24 bg-muted animate-pulse rounded" />
            <div className="h-8 w-16 bg-muted animate-pulse rounded mt-2" />
          </div>
        ))}
      </div>
      
      {/* Tabs skeleton */}
      <div className="flex gap-2 border-b pb-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-10 w-24 bg-muted animate-pulse rounded" />
        ))}
      </div>
      
      {/* Content skeleton */}
      <div className="rounded-md border">
        <div className="h-12 bg-muted/50 border-b" />
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 border-b last:border-0" />
        ))}
      </div>
    </div>
  )
}
