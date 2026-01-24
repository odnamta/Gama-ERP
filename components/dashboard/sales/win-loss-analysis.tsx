'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { formatCurrencyShort } from '@/lib/utils/format'
import { type WinLossData } from '@/lib/sales-dashboard-utils'

interface WinLossAnalysisProps {
  data: WinLossData
  isLoading?: boolean
}

interface ProgressBarProps {
  label: string
  count: number
  value: number
  percentage: number
  color: string
  bgColor: string
}

function ProgressBar({ label, count, value, percentage, color, bgColor }: ProgressBarProps) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className={cn('font-medium', color)}>
          {label}: {count} ({formatCurrencyShort(value)})
        </span>
        <span className={cn('font-medium', color)}>{percentage}%</span>
      </div>
      <div className="h-4 bg-muted rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all', bgColor)}
          style={{ width: `${Math.max(percentage, 2)}%` }}
        />
      </div>
    </div>
  )
}

export function WinLossAnalysis({ data, isLoading }: WinLossAnalysisProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Win/Loss Analysis (Last 3 Months)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-8 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Win/Loss Analysis (Last 3 Months)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <ProgressBar
            label="Won"
            count={data.won.count}
            value={data.won.value}
            percentage={data.won.percentage}
            color="text-green-600"
            bgColor="bg-green-500"
          />
          <ProgressBar
            label="Lost"
            count={data.lost.count}
            value={data.lost.value}
            percentage={data.lost.percentage}
            color="text-red-600"
            bgColor="bg-red-500"
          />
          <ProgressBar
            label="Pending"
            count={data.pending.count}
            value={data.pending.value}
            percentage={data.pending.percentage}
            color="text-yellow-600"
            bgColor="bg-yellow-500"
          />
        </div>

        {data.lossReasons.length > 0 && (
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium mb-2">Common Loss Reasons:</h4>
            <ul className="space-y-1">
              {data.lossReasons.slice(0, 4).map((reason, index) => (
                <li key={index} className="text-sm text-muted-foreground flex items-center gap-2">
                  <span className="text-red-500">•</span>
                  {reason.reason} ({reason.count})
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
