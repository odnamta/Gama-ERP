'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { CheckCircle, AlertTriangle, Clock } from 'lucide-react'
import { BudgetAnalysis } from '@/types'
import { formatIDR } from '@/lib/pjo-utils'

interface BudgetSummaryProps {
  budget: BudgetAnalysis
  totalRevenue: number
}

export function BudgetSummary({ budget, totalRevenue }: BudgetSummaryProps) {
  const actualProfit = totalRevenue - budget.total_actual
  const actualMargin = totalRevenue > 0 ? (actualProfit / totalRevenue) * 100 : 0
  const estimatedProfit = totalRevenue - budget.total_estimated
  const estimatedMargin = totalRevenue > 0 ? (estimatedProfit / totalRevenue) * 100 : 0
  
  const confirmationProgress = budget.items_confirmed + budget.items_pending > 0
    ? (budget.items_confirmed / (budget.items_confirmed + budget.items_pending)) * 100
    : 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Budget Summary
          {budget.all_confirmed ? (
            <span className="flex items-center gap-1 text-green-600 text-sm font-normal">
              <CheckCircle className="h-4 w-4" />
              All costs confirmed
            </span>
          ) : budget.has_overruns ? (
            <span className="flex items-center gap-1 text-amber-600 text-sm font-normal">
              <AlertTriangle className="h-4 w-4" />
              {budget.items_over_budget} item(s) over budget
            </span>
          ) : (
            <span className="flex items-center gap-1 text-muted-foreground text-sm font-normal">
              <Clock className="h-4 w-4" />
              {budget.items_pending} item(s) pending
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Confirmation Progress */}
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span>Cost Confirmation Progress</span>
            <span>{budget.items_confirmed} / {budget.items_confirmed + budget.items_pending} items</span>
          </div>
          <Progress value={confirmationProgress} className="h-2" />
        </div>

        {/* Financial Summary Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Total Revenue</p>
            <p className="text-lg font-semibold">{formatIDR(totalRevenue)}</p>
          </div>
          
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Budget (Estimated)</p>
            <p className="text-lg font-semibold">{formatIDR(budget.total_estimated)}</p>
          </div>
          
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Actual Cost</p>
            <p className="text-lg font-semibold">
              {budget.items_confirmed > 0 ? formatIDR(budget.total_actual) : '-'}
            </p>
          </div>
          
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Variance</p>
            <p className={`text-lg font-semibold ${
              budget.total_variance > 0 ? 'text-amber-600' : 
              budget.total_variance < 0 ? 'text-green-600' : ''
            }`}>
              {budget.items_confirmed > 0 
                ? `${budget.total_variance >= 0 ? '+' : ''}${formatIDR(budget.total_variance)}`
                : '-'
              }
            </p>
          </div>
        </div>

        {/* Profit Comparison */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Estimated Profit</p>
            <p className={`text-xl font-bold ${estimatedProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatIDR(estimatedProfit)}
            </p>
            <p className="text-sm text-muted-foreground">
              Margin: {estimatedMargin.toFixed(1)}%
            </p>
          </div>
          
          {budget.all_confirmed && (
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Actual Profit</p>
              <p className={`text-xl font-bold ${actualProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatIDR(actualProfit)}
              </p>
              <p className="text-sm text-muted-foreground">
                Margin: {actualMargin.toFixed(1)}%
              </p>
            </div>
          )}
        </div>

        {/* Status Breakdown */}
        <div className="flex gap-4 pt-4 border-t text-sm">
          <div className="flex items-center gap-1">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span>{budget.items_under_budget + (budget.items_confirmed - budget.items_over_budget - budget.items_under_budget)} within budget</span>
          </div>
          <div className="flex items-center gap-1">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <span>{budget.items_over_budget} over budget</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>{budget.items_pending} pending</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
