'use client'

import { useRouter } from 'next/navigation'
import { Eye, Edit } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  formatCurrencyCompact,
  formatMargin,
  getEngineeringStatusDisplay,
  type QuotationListItem,
} from '@/lib/sales-engineering-dashboard-utils'

interface RecentQuotationsTableProps {
  quotations: QuotationListItem[]
}

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  engineering_review: 'bg-amber-100 text-amber-700',
  ready: 'bg-blue-100 text-blue-700',
  submitted: 'bg-green-100 text-green-700',
  won: 'bg-emerald-100 text-emerald-700',
  lost: 'bg-red-100 text-red-700',
  cancelled: 'bg-gray-100 text-gray-500',
}

const statusLabels: Record<string, string> = {
  draft: 'Draft',
  engineering_review: 'Eng Review',
  ready: 'Ready',
  submitted: 'Submitted',
  won: 'Won',
  lost: 'Lost',
  cancelled: 'Cancelled',
}

export function RecentQuotationsTable({ quotations }: RecentQuotationsTableProps) {
  const router = useRouter()

  const handleView = (id: string) => {
    router.push(`/quotations/${id}`)
  }

  const handleEdit = (id: string) => {
    router.push(`/quotations/${id}/edit`)
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">Recent Quotations</CardTitle>
      </CardHeader>
      <CardContent>
        {quotations.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p className="text-sm">No quotations found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[120px]">Quote #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                  <TableHead className="text-right">Margin</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Eng</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quotations.map((quotation) => {
                  const engStatus = getEngineeringStatusDisplay(quotation.engineeringStatus)
                  const isEditable = quotation.status === 'draft' || quotation.status === 'engineering_review'

                  return (
                    <TableRow key={quotation.id}>
                      <TableCell className="font-medium text-sm">
                        {quotation.quotationNumber}
                      </TableCell>
                      <TableCell className="max-w-[150px] truncate text-sm">
                        {quotation.customerName}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {formatCurrencyCompact(quotation.totalRevenue)}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {formatMargin(quotation.grossMargin)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={`text-xs ${statusColors[quotation.status] || ''}`}
                        >
                          {statusLabels[quotation.status] || quotation.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <span
                          className={engStatus.colorClass}
                          title={engStatus.label}
                        >
                          {engStatus.icon}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        {isEditable ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(quotation.id)}
                            className="h-7 px-2"
                          >
                            <Edit className="h-3.5 w-3.5 mr-1" />
                            Edit
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleView(quotation.id)}
                            className="h-7 px-2"
                          >
                            <Eye className="h-3.5 w-3.5 mr-1" />
                            View
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
