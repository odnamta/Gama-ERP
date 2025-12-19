'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatIDR } from '@/lib/pjo-utils'
import { PaymentSummary } from '@/types/payments'
import { Wallet, CheckCircle2, Clock } from 'lucide-react'

interface PaymentSummaryCardProps {
  summary: PaymentSummary
}

export function PaymentSummaryCard({ summary }: PaymentSummaryCardProps) {
  const isPaid = summary.remaining_balance <= 0
  const hasPayments = summary.amount_paid > 0

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Wallet className="h-5 w-5" />
          Payment Summary
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Invoice Total</span>
            <span className="font-medium">{formatIDR(summary.invoice_total)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Amount Paid</span>
            <span className={`font-medium ${hasPayments ? 'text-green-600' : ''}`}>
              {formatIDR(summary.amount_paid)}
            </span>
          </div>
          <div className="border-t pt-3 flex justify-between items-center">
            <span className="font-semibold flex items-center gap-2">
              {isPaid ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  Fully Paid
                </>
              ) : (
                <>
                  <Clock className="h-4 w-4 text-amber-600" />
                  Remaining
                </>
              )}
            </span>
            <span className={`font-bold text-lg ${isPaid ? 'text-green-600' : 'text-amber-600'}`}>
              {formatIDR(summary.remaining_balance)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
