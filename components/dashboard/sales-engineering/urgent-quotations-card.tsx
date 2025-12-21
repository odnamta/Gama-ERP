'use client'

import { useRouter } from 'next/navigation'
import { Bell, ChevronRight, Clock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  formatCurrencyCompact,
  formatDaysToDeadline,
  getDeadlineUrgencyClass,
  isDeadlineCritical,
  type QuotationListItem,
} from '@/lib/sales-engineering-dashboard-utils'

interface UrgentQuotationsCardProps {
  quotations: QuotationListItem[]
}

export function UrgentQuotationsCard({ quotations }: UrgentQuotationsCardProps) {
  const router = useRouter()

  const handleQuotationClick = (id: string) => {
    router.push(`/quotations/${id}`)
  }

  const handleViewAll = () => {
    router.push('/quotations?filter=urgent')
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Bell className="h-4 w-4 text-amber-500" />
            Urgent: Deadline Approaching
          </CardTitle>
          {quotations.length > 0 && (
            <Badge variant="secondary" className="bg-amber-100 text-amber-700">
              {quotations.length}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {quotations.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            <Clock className="h-8 w-8 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">No urgent deadlines</p>
          </div>
        ) : (
          <div className="space-y-2">
            {quotations.map((quotation) => (
              <button
                key={quotation.id}
                onClick={() => handleQuotationClick(quotation.id)}
                className="w-full text-left p-3 rounded-lg border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900 text-sm">
                        {quotation.quotationNumber}
                      </span>
                      {isDeadlineCritical(quotation.daysToDeadline) && (
                        <Badge variant="destructive" className="text-xs px-1.5 py-0">
                          Critical
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 truncate">
                      {quotation.customerName}
                    </p>
                    <p className="text-xs text-gray-400 truncate">
                      {quotation.cargoDescription || 'No description'}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-medium text-gray-900">
                      {formatCurrencyCompact(quotation.totalRevenue)}
                    </p>
                    <p className={`text-xs ${getDeadlineUrgencyClass(quotation.daysToDeadline)}`}>
                      <Clock className="h-3 w-3 inline mr-1" />
                      {formatDaysToDeadline(quotation.daysToDeadline)}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0 mt-1" />
                </div>
              </button>
            ))}
          </div>
        )}

        <Button
          variant="ghost"
          className="w-full mt-3 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
          onClick={handleViewAll}
        >
          View All Quotations
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </CardContent>
    </Card>
  )
}
