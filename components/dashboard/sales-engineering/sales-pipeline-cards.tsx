'use client'

import { FileText, Wrench, Send, Trophy, TrendingUp } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import {
  formatCurrencyCompact,
  formatPercentage,
  type SalesPipelineSummary,
} from '@/lib/sales-engineering-dashboard-utils'

interface SalesPipelineCardsProps {
  summary: SalesPipelineSummary
}

export function SalesPipelineCards({ summary }: SalesPipelineCardsProps) {
  const cards = [
    {
      title: 'Draft',
      icon: FileText,
      count: summary.draftCount,
      value: summary.draftValue,
      iconBg: 'bg-slate-100',
      iconColor: 'text-slate-600',
    },
    {
      title: 'Eng Review',
      icon: Wrench,
      count: summary.engReviewCount,
      value: summary.engReviewValue,
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600',
    },
    {
      title: 'Submitted',
      icon: Send,
      count: summary.submittedCount,
      value: summary.submittedValue,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
    },
    {
      title: 'Won MTD',
      icon: Trophy,
      count: summary.wonMTD,
      value: summary.wonValueMTD,
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
    },
    {
      title: 'Win Rate',
      icon: TrendingUp,
      count: null,
      value: null,
      percentage: summary.winRate90d,
      subtitle: '(90 days)',
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${card.iconBg}`}>
                <card.icon className={`h-5 w-5 ${card.iconColor}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-500 truncate">
                  {card.title}
                </p>
                {card.percentage !== undefined ? (
                  <>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatPercentage(card.percentage, 0)}
                    </p>
                    {card.subtitle && (
                      <p className="text-xs text-gray-400">{card.subtitle}</p>
                    )}
                  </>
                ) : (
                  <>
                    <p className="text-2xl font-bold text-gray-900">{card.count}</p>
                    <p className="text-sm text-gray-500">
                      {formatCurrencyCompact(card.value || 0)}
                    </p>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
