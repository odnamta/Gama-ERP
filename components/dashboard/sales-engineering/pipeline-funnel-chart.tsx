'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  formatPipelineFunnelData,
  formatCurrencyCompact,
  type SalesPipelineSummary,
} from '@/lib/sales-engineering-dashboard-utils'

interface PipelineFunnelChartProps {
  summary: SalesPipelineSummary
}

export function PipelineFunnelChart({ summary }: PipelineFunnelChartProps) {
  const funnelData = formatPipelineFunnelData(summary)
  const maxValue = Math.max(...funnelData.map((d) => d.value), 1)

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">Pipeline Funnel</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {funnelData.map((item) => {
            const widthPercent = maxValue > 0 ? (item.value / maxValue) * 100 : 0
            return (
              <div key={item.stage} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-700">{item.label}</span>
                  <span className="text-gray-500">
                    {formatCurrencyCompact(item.value)} ({item.count})
                  </span>
                </div>
                <div className="h-6 bg-gray-100 rounded-md overflow-hidden">
                  <div
                    className={`h-full ${item.colorClass} transition-all duration-500 rounded-md`}
                    style={{ width: `${Math.max(widthPercent, 2)}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
