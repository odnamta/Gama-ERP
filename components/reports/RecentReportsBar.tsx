'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Clock, History } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { getRecentReports } from '@/lib/reports/report-execution-service'
import { RecentReport } from '@/types/reports'
import { formatDistanceToNow } from 'date-fns'

interface RecentReportsBarProps {
  userId: string
  limit?: number
}

export function RecentReportsBar({ userId, limit = 5 }: RecentReportsBarProps) {
  const [recentReports, setRecentReports] = useState<RecentReport[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchRecentReports() {
      try {
        const reports = await getRecentReports(userId, limit)
        setRecentReports(reports)
      } catch (error) {
        console.error('Failed to fetch recent reports:', error)
      } finally {
        setLoading(false)
      }
    }

    if (userId) {
      fetchRecentReports()
    }
  }, [userId, limit])

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <History className="h-4 w-4" />
        <span>Loading recent reports...</span>
      </div>
    )
  }

  if (recentReports.length === 0) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <History className="h-4 w-4" />
        <span>No recently viewed reports</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Clock className="h-4 w-4" />
        <span>Recent:</span>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        {recentReports.map((report) => (
          <Link key={`${report.report_code}-${report.executed_at}`} href={report.href}>
            <Badge
              variant="secondary"
              className="cursor-pointer hover:bg-secondary/80 transition-colors"
            >
              {report.report_name}
              <span className="ml-1.5 text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(report.executed_at), { addSuffix: true })}
              </span>
            </Badge>
          </Link>
        ))}
      </div>
    </div>
  )
}
