'use client'

import { useRouter } from 'next/navigation'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { VendorInvoiceStatusBadge } from '@/components/ui/vendor-invoice-status-badge'
import {
  formatVendorInvoiceCurrency,
  formatVendorInvoiceDate,
  isOverdue,
  isDueSoon,
  getDaysUntilDue,
} from '@/lib/vendor-invoice-utils'
import type { VendorInvoiceWithRelations } from '@/types/vendor-invoices'
import { Eye, AlertTriangle, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

interface VendorInvoiceTableProps {
  invoices: VendorInvoiceWithRelations[]
  isLoading?: boolean
}

export function VendorInvoiceTable({ invoices, isLoading }: VendorInvoiceTableProps) {
  const router = useRouter()

  if (isLoading) {
    return (
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Internal Ref</TableHead>
              <TableHead>Vendor</TableHead>
              <TableHead>Invoice #</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(5)].map((_, i) => (
              <TableRow key={i}>
                {[...Array(8)].map((_, j) => (
                  <TableCell key={j}>
                    <div className="h-4 bg-muted animate-pulse rounded w-20" />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )
  }

  if (invoices.length === 0) {
    return (
      <div className="border rounded-lg p-8 text-center text-muted-foreground">
        No vendor invoices found
      </div>
    )
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Internal Ref</TableHead>
            <TableHead>Vendor</TableHead>
            <TableHead>Invoice #</TableHead>
            <TableHead>Description</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead>Due Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[80px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.map((invoice) => {
            const overdue = isOverdue(invoice.due_date, invoice.status)
            const dueSoon = isDueSoon(invoice.due_date, invoice.status)
            const daysUntilDue = getDaysUntilDue(invoice.due_date)

            return (
              <TableRow
                key={invoice.id}
                className={cn(
                  'cursor-pointer hover:bg-muted/50',
                  overdue && 'bg-red-50'
                )}
                onClick={() => router.push(`/finance/vendor-invoices/${invoice.id}`)}
              >
                <TableCell className="font-mono text-sm">
                  {invoice.internal_ref}
                </TableCell>
                <TableCell>
                  <div className="font-medium">{invoice.vendor?.vendor_name || '-'}</div>
                  <div className="text-xs text-muted-foreground">
                    {invoice.vendor?.vendor_code}
                  </div>
                </TableCell>
                <TableCell className="font-mono text-sm">
                  {invoice.invoice_number}
                </TableCell>
                <TableCell className="max-w-[200px] truncate">
                  {invoice.description || '-'}
                </TableCell>
                <TableCell className="text-right">
                  <div className="font-medium">
                    {formatVendorInvoiceCurrency(invoice.total_amount)}
                  </div>
                  {invoice.amount_paid > 0 && (
                    <div className="text-xs text-muted-foreground">
                      Paid: {formatVendorInvoiceCurrency(invoice.amount_paid)}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className={cn(overdue && 'text-red-600 font-medium')}>
                      {formatVendorInvoiceDate(invoice.due_date)}
                    </span>
                    {overdue && (
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                    )}
                    {dueSoon && !overdue && (
                      <Clock className="h-4 w-4 text-yellow-500" />
                    )}
                  </div>
                  {daysUntilDue !== null && (
                    <div className={cn(
                      'text-xs',
                      overdue ? 'text-red-600' : dueSoon ? 'text-yellow-600' : 'text-muted-foreground'
                    )}>
                      {daysUntilDue < 0
                        ? `${Math.abs(daysUntilDue)} days overdue`
                        : daysUntilDue === 0
                        ? 'Due today'
                        : `${daysUntilDue} days left`}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <VendorInvoiceStatusBadge status={invoice.status} />
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation()
                      router.push(`/finance/vendor-invoices/${invoice.id}`)
                    }}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
