import { Suspense } from 'react'
import { MaintenanceDetailClient } from './maintenance-detail-client'

interface MaintenanceDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function MaintenanceDetailPage({ params }: MaintenanceDetailPageProps) {
  const { id } = await params
  
  return (
    <Suspense fallback={<MaintenanceDetailSkeleton />}>
      <MaintenanceDetailClient recordId={id} />
    </Suspense>
  )
}

function MaintenanceDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="h-10 w-10 bg-muted animate-pulse rounded" />
        <div>
          <div className="h-8 w-64 bg-muted animate-pulse rounded" />
          <div className="h-5 w-48 bg-muted animate-pulse rounded mt-2" />
        </div>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-lg border bg-card p-6">
            <div className="h-5 w-32 bg-muted animate-pulse rounded mb-4" />
            <div className="space-y-2">
              <div className="h-4 w-full bg-muted animate-pulse rounded" />
              <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
