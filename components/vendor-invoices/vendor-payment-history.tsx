'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  formatVendorInvoiceCurrency,
  formatVendorInvoiceDate,
  getPaymentMethodLabel,
} from '@/lib/vendor-invoice-utils'
import { deleteVendorPayment } from '@/app/(main)/finance/vendor-invoices/actions'
import type { VendorPaymentWithRecorder } from '@/types/vendor-invoices'
import { Trash2, Loader2 } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface VendorPaymentHistoryProps {
  payments: VendorPaymentWithRecorder[]
  canDelete?: boolean
  onPaymentDeleted?: () => void
}

export function VendorPaymentHistory({
  payments,
  canDelete = false,
  onPaymentDeleted,
}: VendorPaymentHistoryProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const handleDelete = async (paymentId: string) => {
    setDeletingId(paymentId)
    try {
      const result = await deleteVendorPayment(paymentId)
      if (result.error) {
        toast({ title: 'Error', description: result.error, variant: 'destructive' })
      } else {
        toast({ title: 'Success', description: 'Payment deleted' })
        onPaymentDeleted?.()
      }
    } finally {
      setDeletingId(null)
      setConfirmDeleteId(null)
    }
  }

  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0)

  if (payments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">No payments recorded yet.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Payment History</CardTitle>
          <div className="text-sm">
            <span className="text-muted-foreground">Total Paid: </span>
            <span className="font-medium">{formatVendorInvoiceCurrency(totalPaid)}</span>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Recorded By</TableHead>
                {canDelete && <TableHead className="w-[60px]"></TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>{formatVendorInvoiceDate(payment.payment_date)}</TableCell>
                  <TableCell>{getPaymentMethodLabel(payment.payment_method)}</TableCell>
                  <TableCell className="font-mono text-sm">
                    {payment.reference_number || '-'}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatVendorInvoiceCurrency(payment.amount)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {payment.recorder?.full_name || '-'}
                  </TableCell>
                  {canDelete && (
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setConfirmDeleteId(payment.id)}
                        disabled={deletingId === payment.id}
                      >
                        {deletingId === payment.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4 text-destructive" />
                        )}
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AlertDialog open={!!confirmDeleteId} onOpenChange={() => setConfirmDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Payment?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete the payment record and update the invoice balance. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmDeleteId && handleDelete(confirmDeleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
