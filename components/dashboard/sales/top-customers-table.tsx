'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatCurrencyShort } from '@/lib/utils/format'
import { type TopCustomer } from '@/lib/sales-dashboard-utils'

interface TopCustomersTableProps {
  customers: TopCustomer[]
  isLoading?: boolean
}

const trendConfig = {
  up: { icon: TrendingUp, className: 'text-green-600', prefix: '↑ +' },
  down: { icon: TrendingDown, className: 'text-red-600', prefix: '↓ -' },
  stable: { icon: Minus, className: 'text-muted-foreground', prefix: '→ ' },
}

export function TopCustomersTable({ customers, isLoading }: TopCustomersTableProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top Customers by Value (This Quarter)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Customers by Value (This Quarter)</CardTitle>
      </CardHeader>
      <CardContent>
        {customers.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No customer data available for this period.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">Rank</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead className="text-right">Total Value</TableHead>
                <TableHead className="text-right">Jobs</TableHead>
                <TableHead className="text-right">Avg Value</TableHead>
                <TableHead className="text-right">Trend</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.slice(0, 5).map((customer, index) => {
                const trend = trendConfig[customer.trend]

                return (
                  <TableRow 
                    key={customer.id}
                    className="cursor-pointer hover:bg-muted/50"
                  >
                    <TableCell className="font-medium">{index + 1}</TableCell>
                    <TableCell>
                      <Link 
                        href={`/customers/${customer.id}`}
                        className="hover:underline"
                      >
                        {customer.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrencyShort(customer.totalValue)}
                    </TableCell>
                    <TableCell className="text-right">{customer.jobCount}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrencyShort(customer.avgValue)}
                    </TableCell>
                    <TableCell className={cn('text-right', trend.className)}>
                      {trend.prefix}{customer.trendPercentage}%
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
