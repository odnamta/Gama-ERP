'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, ExternalLink } from 'lucide-react'
import { formatIDR } from '@/lib/pjo-utils'
import { cn } from '@/lib/utils'
import { type BudgetAlertItem } from '@/lib/manager-dashboard-utils'

interface BudgetAlertsTableProps {
  alerts: BudgetAlertItem[]
  isLoading?: boolean
}

const CATEGORY_LABELS: Record<string, string> = {
  trucking: 'Trucking',
  port_charges: 'Port Charges',
  documentation: 'Documentation',
  handling: 'Handling',
  customs: 'Customs',
  insurance: 'Insurance',
  storage: 'Storage',
  labor: 'Labor / Crew',
  fuel: 'Fuel',
  tolls: 'Tolls',
  other: 'Other'
}

export function BudgetAlertsTable({ alerts, isLoading }: BudgetAlertsTableProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Budget Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (alerts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Budget Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
            <p className="text-green-600 font-medium">All items within budget</p>
            <p className="text-sm text-muted-foreground">No cost overruns detected</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Budget Alerts</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>PJO #</TableHead>
              <TableHead>Cost Item</TableHead>
              <TableHead className="text-right">Budget</TableHead>
              <TableHead className="text-right">Actual</TableHead>
              <TableHead className="text-right">Over By</TableHead>
              <TableHead className="text-center">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {alerts.map((alert) => (
              <TableRow key={alert.id}>
                <TableCell>
                  <Link 
                    href={`/proforma-jo/${alert.pjo_id}`}
                    className="text-blue-600 hover:underline font-medium"
                  >
                    {alert.pjo_number}
                  </Link>
                </TableCell>
                <TableCell>{CATEGORY_LABELS[alert.category] || alert.category}</TableCell>
                <TableCell className="text-right">{formatIDR(alert.budgetAmount)}</TableCell>
                <TableCell className="text-right">{formatIDR(alert.actualAmount)}</TableCell>
                <TableCell className="text-right">
                  <Badge 
                    variant="destructive" 
                    className={cn(
                      alert.overByPercentage > 20 && 'bg-red-600',
                      alert.overByPercentage <= 20 && alert.overByPercentage > 10 && 'bg-orange-500',
                      alert.overByPercentage <= 10 && 'bg-yellow-500'
                    )}
                  >
                    +{alert.overByPercentage.toFixed(1)}%
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                  <Button
                    size="sm"
                    variant="outline"
                    asChild
                  >
                    <Link href={`/proforma-jo/${alert.pjo_id}`}>
                      <ExternalLink className="h-4 w-4 mr-1" />
                      Review
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
