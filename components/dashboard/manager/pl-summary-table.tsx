'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { formatIDR } from '@/lib/pjo-utils'
import { cn } from '@/lib/utils'
import { type PLSummaryRow } from '@/lib/manager-dashboard-utils'

interface PLSummaryTableProps {
  rows: PLSummaryRow[]
  isLoading?: boolean
}

function formatVariance(value: number, isMargin?: boolean): string {
  const prefix = value > 0 ? '+' : ''
  if (isMargin) {
    return `${prefix}${value.toFixed(1)}pp`
  }
  return `${prefix}${value.toFixed(1)}%`
}

export function PLSummaryTable({ rows, isLoading }: PLSummaryTableProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>P&L Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>P&L Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">Category</TableHead>
              <TableHead className="text-right">This Month</TableHead>
              <TableHead className="text-right">Last Month</TableHead>
              <TableHead className="text-right">Variance</TableHead>
              <TableHead className="text-right">YTD</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, index) => {
              const isMarginRow = row.category === 'Margin %'
              const isRevenueRow = row.category === 'Revenue'
              const isProfitRow = row.category === 'Gross Profit'
              
              return (
                <TableRow 
                  key={index}
                  className={cn(
                    row.isSubtotal && 'bg-muted/50 font-medium',
                    row.isTotal && 'font-bold',
                    (isRevenueRow || isProfitRow) && 'border-t-2'
                  )}
                >
                  <TableCell className={cn(row.isTotal && 'font-bold')}>
                    {row.category}
                  </TableCell>
                  <TableCell className="text-right">
                    {isMarginRow ? `${row.thisMonth.toFixed(1)}%` : formatIDR(row.thisMonth)}
                  </TableCell>
                  <TableCell className="text-right">
                    {isMarginRow ? `${row.lastMonth.toFixed(1)}%` : formatIDR(row.lastMonth)}
                  </TableCell>
                  <TableCell className={cn(
                    'text-right',
                    row.variance > 0 && (isRevenueRow || isProfitRow) && 'text-green-600',
                    row.variance < 0 && (isRevenueRow || isProfitRow) && 'text-red-600',
                    row.variance > 0 && !isRevenueRow && !isProfitRow && !isMarginRow && 'text-red-600',
                    row.variance < 0 && !isRevenueRow && !isProfitRow && !isMarginRow && 'text-green-600'
                  )}>
                    {formatVariance(row.variance, isMarginRow)}
                  </TableCell>
                  <TableCell className="text-right">
                    {isMarginRow ? `${row.ytd.toFixed(1)}%` : formatIDR(row.ytd)}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
