'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { VendorInvoiceStatusBadge } from '@/components/ui/vendor-invoice-status-badge'
import { VerificationSection } from './verification-section'
import { VendorPaymentHistory } from './vendor-payment-history'
import { VendorPaymentForm } from './vendor-payment-form'
import {
  formatVendorInvoiceCurrency,
  formatVendorInvoiceDate,
  getExpenseCategoryLabel,
  isOverdue,
  isDueSoon,
  getDaysUntilDue,
  canEditVendorInvoices,
  canApproveVendorInvoices,
  canDeleteVendorInvoices,
} from '@/lib/vendor-invoice-utils'
import {
  getVendorInvoiceById,
  getVendorPayments,
  approveVendorInvoice,
  deleteVendorInvoice,
} from '@/app/(main)/finance/vendor-invoices/actions'
import type { VendorInvoiceWithRelations, VendorPaymentWithRecorder } from '@/types/vendor-invoices'
import {
  Edit,
  Trash2,
  CheckCircle,
  DollarSign,
  AlertTriangle,
  Clock,
  Loader2,
  ArrowLeft,
  ExternalLink,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'
import Link from 'next/link'

interface VendorInvoiceDetailViewProps {
  invoiceId: string
  userRole: string
}

export function VendorInvoiceDetailView({ invoiceId, userRole }: VendorInvoiceDetailViewProps) {
  const router = useRouter()
  const [invoice, setInvoice] = useState<VendorInvoiceWithRelations | null>(null)
  const [payments, setPayments] = useState<VendorPaymentWithRecorder[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isApproving, setIsApproving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showPaymentForm, setShowPaymentForm] = useState(false)

  const loadData = useCallback(async () => {
    setIsLoading(true)
    const [invoiceData, paymentsData] = await Promise.all([
      getVendorInvoiceById(invoiceId),
      getVendorPayments(invoiceId),
    ])
    setInvoice(invoiceData)
    setPayments(paymentsData)
    setIsLoading(false)
  }, [invoiceId])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleApprove = async () => {
    if (!invoice) return
    setIsApproving(true)
    try {
      const result = await approveVendorInvoice(invoice.id)
      if (result.error) {
        toast({ title: 'Error', description: result.error, variant: 'destructive' })
      } else {
        toast({ title: 'Success', description: 'Invoice approved' })
        loadData()
      }
    } finally {
      setIsApproving(false)
    }
  }

  const handleDelete = async () => {
    if (!invoice) return
    if (!confirm('Are you sure you want to delete this invoice?')) return

    setIsDeleting(true)
    try {
      const result = await deleteVendorInvoice(invoice.id)
      if (result.error) {
        toast({ title: 'Error', description: result.error, variant: 'destructive' })
      } else {
        toast({ title: 'Success', description: 'Invoice deleted' })
        router.push('/finance/vendor-invoices')
      }
    } finally {
      setIsDeleting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!invoice) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Invoice not found</p>
        <Button variant="link" onClick={() => router.push('/finance/vendor-invoices')}>
          Back to list
        </Button>
      </div>
    )
  }

  const overdue = isOverdue(invoice.due_date, invoice.status)
  const dueSoon = isDueSoon(invoice.due_date, invoice.status)
  const daysUntilDue = getDaysUntilDue(invoice.due_date)
  const amountDue = invoice.total_amount - invoice.amount_paid

  const canEdit = canEditVendorInvoices(userRole) && ['received', 'disputed'].includes(invoice.status)
  const canApprove = canApproveVendorInvoices(userRole) && invoice.status === 'verified'
  const canRecordPayment = canEditVendorInvoices(userRole) && ['approved', 'partial'].includes(invoice.status) && amountDue > 0
  const canDelete = canDeleteVendorInvoices(userRole) && invoice.status === 'received'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Button variant="ghost" size="sm" onClick={() => router.back()} className="mb-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{invoice.internal_ref}</h1>
            <VendorInvoiceStatusBadge status={invoice.status} />
          </div>
          <p className="text-muted-foreground mt-1">
            Vendor Invoice: {invoice.invoice_number}
          </p>
        </div>

        <div className="flex gap-2">
          {canEdit && (
            <Button variant="outline" onClick={() => router.push(`/finance/vendor-invoices/${invoice.id}/edit`)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
          {canApprove && (
            <Button onClick={handleApprove} disabled={isApproving}>
              {isApproving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
              Approve
            </Button>
          )}
          {canRecordPayment && (
            <Button onClick={() => setShowPaymentForm(true)}>
              <DollarSign className="h-4 w-4 mr-2" />
              Record Payment
            </Button>
          )}
          {canDelete && (
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
              Delete
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Invoice Details */}
          <Card>
            <CardHeader>
              <CardTitle>Invoice Details</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">Vendor</p>
                <p className="font-medium">{invoice.vendor?.vendor_name || '-'}</p>
                <p className="text-sm text-muted-foreground">{invoice.vendor?.vendor_code}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Invoice Number</p>
                <p className="font-mono">{invoice.invoice_number}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Invoice Date</p>
                <p>{formatVendorInvoiceDate(invoice.invoice_date)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Received Date</p>
                <p>{formatVendorInvoiceDate(invoice.received_date)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Due Date</p>
                <div className="flex items-center gap-2">
                  <span className={cn(overdue && 'text-red-600 font-medium')}>
                    {formatVendorInvoiceDate(invoice.due_date)}
                  </span>
                  {overdue && <AlertTriangle className="h-4 w-4 text-red-500" />}
                  {dueSoon && !overdue && <Clock className="h-4 w-4 text-yellow-500" />}
                </div>
                {daysUntilDue !== null && (
                  <p className={cn(
                    'text-sm',
                    overdue ? 'text-red-600' : dueSoon ? 'text-yellow-600' : 'text-muted-foreground'
                  )}>
                    {daysUntilDue < 0
                      ? `${Math.abs(daysUntilDue)} days overdue`
                      : daysUntilDue === 0
                      ? 'Due today'
                      : `${daysUntilDue} days left`}
                  </p>
                )}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Expense Category</p>
                <p>{getExpenseCategoryLabel(invoice.expense_category)}</p>
              </div>
              {invoice.description && (
                <div className="md:col-span-2">
                  <p className="text-sm text-muted-foreground">Description</p>
                  <p>{invoice.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Job References */}
          <Card>
            <CardHeader>
              <CardTitle>Job References</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <div>
                <p className="text-sm text-muted-foreground">Job Order</p>
                {invoice.job_order ? (
                  <Link href={`/job-orders/${invoice.job_order.id}`} className="font-mono text-primary hover:underline flex items-center gap-1">
                    {invoice.job_order.jo_number}
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                ) : (
                  <p className="text-muted-foreground">-</p>
                )}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">PJO</p>
                {invoice.pjo ? (
                  <Link href={`/proforma-jo/${invoice.pjo.id}`} className="font-mono text-primary hover:underline flex items-center gap-1">
                    {invoice.pjo.pjo_number}
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                ) : (
                  <p className="text-muted-foreground">-</p>
                )}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">BKK</p>
                {invoice.bkk ? (
                  <p className="font-mono">{invoice.bkk.bkk_number}</p>
                ) : (
                  <p className="text-muted-foreground">-</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Verification Section */}
          <VerificationSection invoice={invoice} onVerified={loadData} />

          {/* Payment History */}
          <VendorPaymentHistory
            payments={payments}
            canDelete={canDeleteVendorInvoices(userRole)}
            onPaymentDeleted={loadData}
          />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Amount Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Amount Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatVendorInvoiceCurrency(invoice.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax</span>
                <span>{formatVendorInvoiceCurrency(invoice.tax_amount)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-medium">
                <span>Total</span>
                <span>{formatVendorInvoiceCurrency(invoice.total_amount)}</span>
              </div>
              <div className="flex justify-between text-green-600">
                <span>Paid</span>
                <span>{formatVendorInvoiceCurrency(invoice.amount_paid)}</span>
              </div>
              <Separator />
              <div className={cn('flex justify-between font-bold text-lg', amountDue > 0 && 'text-red-600')}>
                <span>Amount Due</span>
                <span>{formatVendorInvoiceCurrency(amountDue)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Audit Info */}
          <Card>
            <CardHeader>
              <CardTitle>Audit Trail</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="text-muted-foreground">Created</p>
                <p>{formatVendorInvoiceDate(invoice.created_at)}</p>
                {invoice.creator && <p className="text-muted-foreground">{invoice.creator.full_name}</p>}
              </div>
              {invoice.verified_at && (
                <div>
                  <p className="text-muted-foreground">Verified</p>
                  <p>{formatVendorInvoiceDate(invoice.verified_at)}</p>
                  {invoice.verifier && <p className="text-muted-foreground">{invoice.verifier.full_name}</p>}
                </div>
              )}
              {invoice.approved_at && (
                <div>
                  <p className="text-muted-foreground">Approved</p>
                  <p>{formatVendorInvoiceDate(invoice.approved_at)}</p>
                  {invoice.approver && <p className="text-muted-foreground">{invoice.approver.full_name}</p>}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          {invoice.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{invoice.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Payment Form Dialog */}
      <VendorPaymentForm
        vendorInvoiceId={invoice.id}
        amountDue={amountDue}
        open={showPaymentForm}
        onOpenChange={setShowPaymentForm}
        onSuccess={loadData}
      />
    </div>
  )
}
