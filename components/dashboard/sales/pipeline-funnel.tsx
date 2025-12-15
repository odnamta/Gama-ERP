'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowRight, CheckCircle, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { type PipelineStage } from '@/lib/sales-dashboard-utils'

interface PipelineFunnelProps {
  stages: PipelineStage[]
  isLoading?: boolean
}

function formatCurrency(value: number): string {
  if (value >= 1000000000) {
    return `${(value / 1000000000).toFixed(1)}B`
  }
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(0)}M`
  }
  return value.toLocaleString('id-ID')
}

const stageConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  draft: { label: 'DRAFT', color: 'text-gray-700', bgColor: 'bg-gray-100 border-gray-300' },
  pending_approval: { label: 'PENDING', color: 'text-yellow-700', bgColor: 'bg-yellow-50 border-yellow-300' },
  approved: { label: 'APPROVED', color: 'text-blue-700', bgColor: 'bg-blue-50 border-blue-300' },
  converted: { label: 'CONVERTED', color: 'text-green-700', bgColor: 'bg-green-50 border-green-300' },
  rejected: { label: 'REJECTED', color: 'text-red-700', bgColor: 'bg-red-50 border-red-300' },
}

export function PipelineFunnel({ stages, isLoading }: PipelineFunnelProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Quotation Pipeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex-1">
                <div className="h-24 bg-muted animate-pulse rounded" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  // Calculate conversion rates for display
  const draftStage = stages.find(s => s.status === 'draft')
  const approvedStage = stages.find(s => s.status === 'approved')
  const convertedStage = stages.find(s => s.status === 'converted')
  const rejectedStage = stages.find(s => s.status === 'rejected')

  const totalDecided = (convertedStage?.count || 0) + (rejectedStage?.count || 0)
  const overallWinRate = totalDecided > 0 
    ? ((convertedStage?.count || 0) / totalDecided * 100).toFixed(0)
    : '0'

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quotation Pipeline</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-stretch gap-2 mb-4">
          {stages.map((stage, index) => {
            const config = stageConfig[stage.status]
            const isTerminal = stage.status === 'converted' || stage.status === 'rejected'
            const showArrow = index < stages.length - 2 // Don't show arrow before terminal stages
            
            return (
              <div key={stage.status} className="flex items-center">
                <div className={cn(
                  'flex flex-col items-center justify-center p-4 rounded-lg border-2 min-w-[100px]',
                  config.bgColor
                )}>
                  <div className="flex items-center gap-1 mb-1">
                    {stage.status === 'converted' && <CheckCircle className="h-4 w-4 text-green-600" />}
                    {stage.status === 'rejected' && <XCircle className="h-4 w-4 text-red-600" />}
                    <span className={cn('text-xs font-semibold', config.color)}>
                      {config.label}
                    </span>
                  </div>
                  <div className={cn('text-2xl font-bold', config.color)}>
                    {stage.count}
                  </div>
                  <div className={cn('text-xs', config.color)}>
                    {formatCurrency(stage.value)}
                  </div>
                </div>
                {showArrow && !isTerminal && (
                  <ArrowRight className="h-5 w-5 text-muted-foreground mx-1" />
                )}
              </div>
            )
          })}
        </div>
        
        <div className="text-sm text-muted-foreground border-t pt-3">
          <span className="font-medium">Conversion:</span>
          {' '}Draft→Approved: {draftStage?.conversionRate?.toFixed(0) || 0}%
          {' | '}Approved→Won: {approvedStage?.conversionRate?.toFixed(0) || 0}%
          {' | '}Overall Win Rate: {overallWinRate}%
        </div>
      </CardContent>
    </Card>
  )
}
