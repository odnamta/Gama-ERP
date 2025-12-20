'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  formatVendorInvoiceCurrency,
  formatVariancePercent,
  VARIANCE_TOLERANCE_PERCENT,
} from '@/lib/vendor-invoice-utils'
import { verifyVendorInvoice, disputeVendorInvoice } from '@/app/(main)/finance/vendor-invoices/actions'
import type { VendorInvoiceWithRelations, VerificationResult } from '@/types/vendor-invoices'
import { CheckCircle2, XCircle, AlertTriangle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'

interface VerificationSectionProps {
  invoice: VendorInvoiceWithRelations
  onVerified?: () => void
}

export function VerificationSection({ invoice, onVerified }: VerificationSectionProps) {
  const [isVerifying, setIsVerifying] = useState(false)
  const [isDisputing, setIsDisputing] = useState(false)
  const [showDisputeForm, setShowDisputeForm] = useState(false)
  const [disputeReason, setDisputeReason] = useState('')
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null)

  const hasBkk = !!invoice.bkk
  const bkkAmount = invoice.bkk?.amount_spent ?? invoice.bkk?.amount_requested ?? 0
  const invoiceAmount = invoice.total_amount
  const variance = invoiceAmount - bkkAmount
  const variancePercent = bkkAmount > 0 ? (variance / bkkAmount) * 100 : 0
  const withinTolerance = Math.abs(variancePercent) <= VARIANCE_TOLERANCE_PERCENT

  const canVerify = invoice.status === 'received' && hasBkk
  const isVerified = invoice.status === 'verified'
  const isDisputed = invoice.status === 'disputed'

  const handleVerify = async () => {
    setIsVerifying(true)
    try {
      const result = await verifyVendorInvoice(invoice.id)
      if (result.error) {
        toast({ title: 'Error', description: result.error, variant: 'destructive' })
      } else if (result.result) {
        setVerificationResult(result.result)
        if (result.result.matched) {
          toast({ title: 'Success', description: 'Invoice verified successfully' })
        } else {
          toast({ title: 'Warning', description: 'Invoice marked as disputed due to variance', variant: 'destructive' })
        }
        onVerified?.()
      }
    } finally {
      setIsVerifying(false)
    }
  }

  const handleDispute = async () => {
    if (!disputeReason.trim()) {
      toast({ title: 'Error', description: 'Please provide a reason for the dispute', variant: 'destructive' })
      return
    }

    setIsDisputing(true)
    try {
      const result = await disputeVendorInvoice(invoice.id, disputeReason)
      if (result.error) {
        toast({ title: 'Error', description: result.error, variant: 'destructive' })
      } else {
        toast({ title: 'Success', description: 'Invoice marked as disputed' })
        setShowDisputeForm(false)
        setDisputeReason('')
        onVerified?.()
      }
    } finally {
      setIsDisputing(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          3-Way Match Verification
          {isVerified && <CheckCircle2 className="h-5 w-5 text-green-500" />}
          {isDisputed && <XCircle className="h-5 w-5 text-red-500" />}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!hasBkk ? (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div>
              <p className="font-medium text-yellow-800">No BKK Linked</p>
              <p className="text-sm text-yellow-700">
                Link a BKK (Bukti Kas Keluar) to this invoice to enable 3-way match verification.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Comparison Table */}
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-medium">Source</th>
                    <th className="px-4 py-2 text-right text-sm font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t">
                    <td className="px-4 py-3">
                      <div className="font-medium">BKK Amount</div>
                      <div className="text-xs text-muted-foreground">{invoice.bkk?.bkk_number}</div>
                    </td>
                    <td className="px-4 py-3 text-right font-mono">
                      {formatVendorInvoiceCurrency(bkkAmount)}
                    </td>
                  </tr>
                  <tr className="border-t">
                    <td className="px-4 py-3">
                      <div className="font-medium">Invoice Amount</div>
                      <div className="text-xs text-muted-foreground">{invoice.invoice_number}</div>
                    </td>
                    <td className="px-4 py-3 text-right font-mono">
                      {formatVendorInvoiceCurrency(invoiceAmount)}
                    </td>
                  </tr>
                  <tr className="border-t bg-muted/50">
                    <td className="px-4 py-3 font-medium">Variance</td>
                    <td className={cn(
                      'px-4 py-3 text-right font-mono font-medium',
                      withinTolerance ? 'text-green-600' : 'text-red-600'
                    )}>
                      {formatVendorInvoiceCurrency(variance)} ({formatVariancePercent(variancePercent)})
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Tolerance Info */}
            <div className={cn(
              'p-3 rounded-lg text-sm',
              withinTolerance ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
            )}>
              {withinTolerance ? (
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Variance is within {VARIANCE_TOLERANCE_PERCENT}% tolerance
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <XCircle className="h-4 w-4" />
                  Variance exceeds {VARIANCE_TOLERANCE_PERCENT}% tolerance - requires review
                </div>
              )}
            </div>

            {/* Verification Result */}
            {verificationResult && (
              <div className={cn(
                'p-4 rounded-lg border',
                verificationResult.matched ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
              )}>
                <p className={cn('font-medium', verificationResult.matched ? 'text-green-800' : 'text-red-800')}>
                  {verificationResult.matched ? 'Verification Passed' : 'Verification Failed'}
                </p>
                <p className={cn('text-sm', verificationResult.matched ? 'text-green-700' : 'text-red-700')}>
                  Variance: {formatVendorInvoiceCurrency(verificationResult.variance)} ({formatVariancePercent(verificationResult.variancePercent)})
                </p>
              </div>
            )}

            {/* Verification Notes */}
            {invoice.verification_notes && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium mb-1">Verification Notes</p>
                <p className="text-sm text-muted-foreground">{invoice.verification_notes}</p>
              </div>
            )}

            {/* Actions */}
            {canVerify && (
              <div className="flex gap-3">
                <Button onClick={handleVerify} disabled={isVerifying}>
                  {isVerifying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Verify Invoice
                </Button>
                <Button variant="outline" onClick={() => setShowDisputeForm(true)}>
                  Dispute
                </Button>
              </div>
            )}

            {/* Dispute Form */}
            {showDisputeForm && (
              <div className="space-y-3 p-4 border rounded-lg">
                <Label htmlFor="dispute_reason">Dispute Reason *</Label>
                <Textarea
                  id="dispute_reason"
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  placeholder="Explain why this invoice is being disputed..."
                  rows={3}
                />
                <div className="flex gap-2">
                  <Button onClick={handleDispute} variant="destructive" disabled={isDisputing}>
                    {isDisputing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Submit Dispute
                  </Button>
                  <Button variant="outline" onClick={() => setShowDisputeForm(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
