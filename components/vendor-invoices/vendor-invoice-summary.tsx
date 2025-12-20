'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatVendorInvoiceCurrency } from '@/lib/vendor-invoice-utils'
import type { APSummaryWithAging } from '@/types/vendor-invoices'
import { 
  DollarSign, 
  Clock, 
  AlertTriangle, 
  CheckCircle2,
  FileQuestion
} from 'lucide-react'

interface VendorInvoiceSummaryProps {
  summary: APSummaryWithAging
  isLoading?: boolean
}

export function VendorInvoiceSummary({ summary, isLoading }: VendorInvoiceSummaryProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {[...Array(5)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-24 bg-muted animate-pulse rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-32 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const cards = [
    {
      title: 'Total Unpaid',
      value: formatVendorInvoiceCurrency(summary.totalUnpaid),
      icon: DollarSign,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Due Today',
      value: formatVendorInvoiceCurrency(summary.dueToday),
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
    },
    {
      title: 'Overdue',
      value: formatVendorInvoiceCurrency(summary.overdue),
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
    },
    {
      title: 'Paid This Month',
      value: formatVendorInvoiceCurrency(summary.paidMTD),
      icon: CheckCircle2,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Pending Verification',
      value: summary.pendingVerification.toString(),
      icon: FileQuestion,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
  ]

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {cards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <div className={`p-2 rounded-full ${card.bgColor}`}>
                <card.icon className={`h-4 w-4 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Aging Buckets */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Aging Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-4 text-center">
            <div>
              <div className="text-xs text-muted-foreground mb-1">Current</div>
              <div className="text-lg font-semibold text-green-600">
                {formatVendorInvoiceCurrency(summary.aging.current)}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">1-30 Days</div>
              <div className="text-lg font-semibold text-yellow-600">
                {formatVendorInvoiceCurrency(summary.aging.days1to30)}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">31-60 Days</div>
              <div className="text-lg font-semibold text-orange-600">
                {formatVendorInvoiceCurrency(summary.aging.days31to60)}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">61-90 Days</div>
              <div className="text-lg font-semibold text-red-500">
                {formatVendorInvoiceCurrency(summary.aging.days61to90)}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">90+ Days</div>
              <div className="text-lg font-semibold text-red-700">
                {formatVendorInvoiceCurrency(summary.aging.days90plus)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
