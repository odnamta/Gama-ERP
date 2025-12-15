'use client'

import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { SummaryItem } from '@/types/reports'
import { formatCurrency, formatPercentage, formatNumber } from '@/lib/reports/report-utils'

interface ReportSummaryProps {
  items: SummaryItem[]
  layout?: 'horizontal' | 'vertical'
}

export function ReportSummary({ items, layout = 'horizontal' }: ReportSummaryProps) {
  const formatValue = (item: SummaryItem): string => {
    const value = item.value
    if (typeof value === 'string') return value
    
    switch (item.format) {
      case 'currency':
        return formatCurrency(value)
      case 'percentage':
        return formatPercentage(value)
      case 'number':
        return formatNumber(value)
      default:
        return String(value)
    }
  }

  const getHighlightClass = (highlight?: SummaryItem['highlight']): string => {
    switch (highlight) {
      case 'positive':
        return 'text-green-600'
      case 'negative':
        return 'text-red-600'
      default:
        return ''
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div
          className={cn(
            'gap-6',
            layout === 'horizontal' ? 'flex flex-wrap' : 'space-y-4'
          )}
        >
          {items.map((item, index) => (
            <div
              key={index}
              className={cn(
                layout === 'horizontal' && 'flex-1 min-w-[150px]'
              )}
            >
              <p className="text-sm text-muted-foreground">{item.label}</p>
              <p className={cn('text-2xl font-bold', getHighlightClass(item.highlight))}>
                {formatValue(item)}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
