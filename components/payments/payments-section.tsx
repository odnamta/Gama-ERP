'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { PaymentSummaryCard } from './payment-summary-card'
import { PaymentHistory } from './payment-history'
import { RecordPaymentDialog } from './record-payment-dialog'
import { PaymentWithRecorder, PaymentFormData, PaymentSummary } from '@/types/payments'
import { recordPayment, getPayments, deletePayment } from '@/app/(main)/invoices/payment-actions'
import { calculatePaymentSummary } from '@/lib/payment-utils'
import { useToast } from '@/hooks/use-toast'
import { Plus, Wallet } from 'lucide-react'

interface PaymentsSectionProps {
  invoiceId: string
  invoiceNumber: string
  customerName: string
  totalAmount: number
  amountPaid: number
  canRecordPayment: boolean
}

export function PaymentsSection({
  invoiceId,
  invoiceNumber,
  customerName,
  totalAmount,
  amountPaid: initialAmountPaid,
  canRecordPayment: canRecord,
}: PaymentsSectionProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [payments, setPayments] = useState<PaymentWithRecorder[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [summary, setSummary] = useState<PaymentSummary>(() =>
    calculatePaymentSummary(totalAmount, initialAmountPaid)
  )

  // Fetch payments on mount
  useEffect(() => {
    async function fetchPayments() {
      setIsLoading(true)
      try {
        const data = await getPayments(invoiceId)
        setPayments(data)
        
        // Recalculate summary based on actual payments
        const totalPaid = data.reduce((sum, p) => sum + Number(p.amount), 0)
        setSummary(calculatePaymentSummary(totalAmount, totalPaid))
      } finally {
        setIsLoading(false)
      }
    }
    fetchPayments()
  }, [invoiceId, totalAmount])

  const handleRecordPayment = async (data: PaymentFormData) => {
    const result = await recordPayment(data)
    
    if (result.error) {
      toast({
        title: 'Error',
        description: result.error,
        variant: 'destructive',
      })
      throw new Error(result.error)
    }

    toast({
      title: 'Payment Recorded',
      description: 'Payment has been recorded successfully.',
    })

    // Refresh payments list
    const updatedPayments = await getPayments(invoiceId)
    setPayments(updatedPayments)
    
    // Recalculate summary
    const totalPaid = updatedPayments.reduce((sum, p) => sum + Number(p.amount), 0)
    setSummary(calculatePaymentSummary(totalAmount, totalPaid))
    
    // Refresh the page to update invoice status
    router.refresh()
  }

  const handleDeletePayment = async (paymentId: string) => {
    const result = await deletePayment(paymentId)
    
    if (result.error) {
      toast({
        title: 'Error',
        description: result.error,
        variant: 'destructive',
      })
      return
    }

    toast({
      title: 'Payment Deleted',
      description: 'Payment has been deleted successfully.',
    })

    // Refresh payments list
    const updatedPayments = await getPayments(invoiceId)
    setPayments(updatedPayments)
    
    // Recalculate summary
    const totalPaid = updatedPayments.reduce((sum, p) => sum + Number(p.amount), 0)
    setSummary(calculatePaymentSummary(totalAmount, totalPaid))
    
    // Refresh the page to update invoice status
    router.refresh()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          Payments
        </h2>
        {canRecord && summary.remaining_balance > 0 && (
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Record Payment
          </Button>
        )}
      </div>

      <PaymentSummaryCard summary={summary} />

      {isLoading ? (
        <div className="text-center py-4 text-muted-foreground">
          Loading payments...
        </div>
      ) : (
        <PaymentHistory
          payments={payments}
          onDelete={handleDeletePayment}
          canDelete={canRecord}
        />
      )}

      <RecordPaymentDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        invoiceId={invoiceId}
        invoiceNumber={invoiceNumber}
        customerName={customerName}
        remainingBalance={summary.remaining_balance}
        onSubmit={handleRecordPayment}
      />
    </div>
  )
}
