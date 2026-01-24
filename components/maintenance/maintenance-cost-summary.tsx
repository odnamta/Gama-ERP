'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MaintenanceCostSummary as CostSummaryType } from '@/types/maintenance'
import { formatCurrency, formatDate } from '@/lib/utils/format'

interface MaintenanceCostSummaryProps {
  data: CostSummaryType[]
  title?: string
}

export function MaintenanceCostSummary({ data, title = 'Cost Summary by Asset' }: MaintenanceCostSummaryProps) {
  const totals = data.reduce(
    (acc, row) => ({
      maintenanceCount: acc.maintenanceCount + row.maintenanceCount,
      totalLabor: acc.totalLabor + row.totalLabor,
      totalParts: acc.totalParts + row.totalParts,
      totalExternal: acc.totalExternal + row.totalExternal,
      totalCost: acc.totalCost + row.totalCost,
    }),
    { maintenanceCount: 0, totalLabor: 0, totalParts: 0, totalExternal: 0, totalCost: 0 }
  )

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8 text-muted-foreground">
          No cost data available for the selected period
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Asset</TableHead>
              <TableHead>Month</TableHead>
              <TableHead className="text-center">Count</TableHead>
              <TableHead className="text-right">Labor</TableHead>
              <TableHead className="text-right">Parts</TableHead>
              <TableHead className="text-right">External</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row, index) => (
              <TableRow key={`${row.assetId}-${row.month}-${index}`}>
                <TableCell>
                  <div>
                    <span className="font-medium">{row.assetCode}</span>
                    <span className="text-muted-foreground ml-2">{row.assetName}</span>
                  </div>
                </TableCell>
                <TableCell>{formatDate(row.month + '-01')}</TableCell>
                <TableCell className="text-center">{row.maintenanceCount}</TableCell>
                <TableCell className="text-right">{formatCurrency(row.totalLabor)}</TableCell>
                <TableCell className="text-right">{formatCurrency(row.totalParts)}</TableCell>
                <TableCell className="text-right">{formatCurrency(row.totalExternal)}</TableCell>
                <TableCell className="text-right font-medium">{formatCurrency(row.totalCost)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={2} className="font-medium">Total</TableCell>
              <TableCell className="text-center font-medium">{totals.maintenanceCount}</TableCell>
              <TableCell className="text-right font-medium">{formatCurrency(totals.totalLabor)}</TableCell>
              <TableCell className="text-right font-medium">{formatCurrency(totals.totalParts)}</TableCell>
              <TableCell className="text-right font-medium">{formatCurrency(totals.totalExternal)}</TableCell>
              <TableCell className="text-right font-bold">{formatCurrency(totals.totalCost)}</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </CardContent>
    </Card>
  )
}
