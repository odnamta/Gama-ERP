'use client'

import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

interface ReportSkeletonProps {
  showFilters?: boolean
  showSummary?: boolean
  rows?: number
}

export function ReportSkeleton({
  showFilters = true,
  showSummary = true,
  rows = 5,
}: ReportSkeletonProps) {
  return (
    <div className="space-y-6">
      {/* Filters skeleton */}
      {showFilters && (
        <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
          <Skeleton className="h-10 w-[160px]" />
          <Skeleton className="h-10 w-[140px]" />
          <Skeleton className="h-10 w-[140px]" />
          <Skeleton className="h-10 w-[100px]" />
        </div>
      )}

      {/* Summary skeleton */}
      {showSummary && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex-1">
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-8 w-32" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Table skeleton */}
      <Card>
        <CardHeader>
          <div className="flex gap-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-4 flex-1" />
            ))}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: rows }).map((_, i) => (
              <div key={i} className="flex gap-4">
                {[1, 2, 3, 4, 5].map((j) => (
                  <Skeleton key={j} className="h-6 flex-1" />
                ))}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
