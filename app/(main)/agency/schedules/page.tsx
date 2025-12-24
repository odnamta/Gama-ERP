import { Suspense } from 'react';
import { SchedulesClient } from './schedules-client';

/**
 * Schedules list page with filters and upcoming arrivals view.
 * 
 * **Requirements: 2.1-2.8, 7.1-7.6**
 */
export default function SchedulesPage() {
  return (
    <Suspense fallback={<SchedulesPageSkeleton />}>
      <SchedulesClient />
    </Suspense>
  );
}

function SchedulesPageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-9 w-48 bg-muted animate-pulse rounded" />
          <div className="h-5 w-64 bg-muted animate-pulse rounded mt-2" />
        </div>
        <div className="h-10 w-36 bg-muted animate-pulse rounded" />
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
      <div className="flex gap-2">
        <div className="h-10 w-32 bg-muted animate-pulse rounded" />
        <div className="h-10 w-32 bg-muted animate-pulse rounded" />
      </div>
      
      {/* Table skeleton */}
      <div className="rounded-lg border bg-card">
        <div className="p-4 space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-muted animate-pulse rounded" />
          ))}
        </div>
      </div>
    </div>
  );
}
