'use client'

import { useRouter } from 'next/navigation'
import { Wrench, ChevronRight, AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  groupAssessmentsByType,
  type EngineeringWorkloadSummary,
} from '@/lib/sales-engineering-dashboard-utils'

interface EngineeringWorkloadCardProps {
  summary: EngineeringWorkloadSummary
}

export function EngineeringWorkloadCard({ summary }: EngineeringWorkloadCardProps) {
  const router = useRouter()
  const assessmentGroups = groupAssessmentsByType(summary)

  const handleViewQueue = () => {
    router.push('/quotations?tab=engineering')
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Wrench className="h-4 w-4 text-blue-500" />
            Engineering Workload
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Pending Assessments Total */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Pending Assessments:</span>
            <Badge
              variant={summary.pendingAssessments > 0 ? 'default' : 'secondary'}
              className={summary.pendingAssessments > 5 ? 'bg-amber-500' : ''}
            >
              {summary.pendingAssessments}
            </Badge>
          </div>

          {/* Assessment Type Breakdown */}
          <div className="space-y-2">
            {assessmentGroups.map((group) => {
              const widthPercent = group.maxCount > 0 ? (group.count / group.maxCount) * 100 : 0
              return (
                <div key={group.type} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">{group.label}</span>
                    <span className="font-medium text-gray-900">{group.count}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 transition-all duration-500 rounded-full"
                      style={{ width: `${Math.max(widthPercent, group.count > 0 ? 5 : 0)}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>

          {/* Completed MTD */}
          <div className="flex items-center justify-between pt-2 border-t">
            <span className="text-sm text-gray-600">Completed this month:</span>
            <span className="font-medium text-green-600">{summary.completedMTD}</span>
          </div>

          {/* Complex Projects */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3 text-amber-500" />
              Complex Projects in Pipeline:
            </span>
            <Badge variant="outline" className="border-amber-300 text-amber-700">
              {summary.complexInPipeline}
            </Badge>
          </div>
        </div>

        <Button
          variant="ghost"
          className="w-full mt-4 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
          onClick={handleViewQueue}
        >
          View Engineering Queue
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </CardContent>
    </Card>
  )
}
