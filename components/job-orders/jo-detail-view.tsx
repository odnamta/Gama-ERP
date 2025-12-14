'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { JobOrderWithRelations } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { JOStatusBadge } from '@/components/ui/jo-status-badge'
import { formatIDR, formatDate, formatDateTime } from '@/lib/pjo-utils'
import { markCompleted, submitToFinance } from '@/app/(main)/job-orders/actions'
import { useToast } from '@/hooks/use-toast'
import { CheckCircle, Send, FileText, ArrowLeft } from 'lucide-react'

interface JODetailViewProps {
  jobOrder: JobOrderWithRelations
}

export function JODetailView({ jobOrder }: JODetailViewProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const pjo = jobOrder.proforma_job_orders
  const profit = (jobOrder.final_revenue ?? jobOrder.amount ?? 0) - (jobOrder.final_cost ?? 0)
  const margin = jobOrder.final_revenue && jobOrder.final_revenue > 0
    ? (profit / jobOrder.final_revenue) * 100
    : 0

  async function handleMarkCompleted() {
    setIsLoading(true)
    try {
      const result = await markCompleted(jobOrder.id)
      if (result.error) {
        toast({ title: 'Error', description: result.error, variant: 'destructive' })
      } else {
        toast({ title: 'Success', description: 'Job Order marked as completed' })
        router.refresh()
      }
    } finally {
      setIsLoading(false)
    }
  }

  async function handleSubmitToFinance() {
    setIsLoading(true)
    try {
      const result = await submitToFinance(jobOrder.id)
      if (result.error) {
        toast({ title: 'Error', description: result.error, variant: 'destructive' })
      } else {
        toast({ title: 'Success', description: 'Job Order submitted to finance' })
        router.refresh()
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Button variant="ghost" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          </div>
          <h1 className="text-2xl font-bold">{jobOrder.jo_number}</h1>
          <div className="mt-1 flex items-center gap-2">
            <JOStatusBadge status={jobOrder.status} />
            {jobOrder.converted_from_pjo_at && (
              <span className="text-sm text-muted-foreground">
                Created {formatDate(jobOrder.converted_from_pjo_at)}
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          {(jobOrder.status === 'active' || jobOrder.status === 'in_progress') && (
            <Button onClick={handleMarkCompleted} disabled={isLoading}>
              <CheckCircle className="mr-2 h-4 w-4" />
              Mark Completed
            </Button>
          )}
          {jobOrder.status === 'completed' && (
            <Button onClick={handleSubmitToFinance} disabled={isLoading}>
              <Send className="mr-2 h-4 w-4" />
              Submit to Finance
            </Button>
          )}
          {jobOrder.status === 'submitted_to_finance' && (
            <Button disabled>
              <FileText className="mr-2 h-4 w-4" />
              Create Invoice
            </Button>
          )}
        </div>
      </div>

      {/* Source PJO */}
      {pjo && (
        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
          <CardHeader>
            <CardTitle className="text-blue-800 dark:text-blue-400">Source PJO</CardTitle>
          </CardHeader>
          <CardContent>
            <Link href={`/proforma-jo/${pjo.id}`} className="text-blue-600 hover:underline font-medium">
              {pjo.pjo_number}
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div>
            <Label className="text-muted-foreground">Customer</Label>
            <p className="font-medium">
              {jobOrder.customers ? (
                <Link href={`/customers/${jobOrder.customers.id}`} className="hover:underline">
                  {jobOrder.customers.name}
                </Link>
              ) : (
                '-'
              )}
            </p>
          </div>
          <div>
            <Label className="text-muted-foreground">Project</Label>
            <p className="font-medium">
              {jobOrder.projects ? (
                <Link href={`/projects/${jobOrder.projects.id}`} className="hover:underline">
                  {jobOrder.projects.name}
                </Link>
              ) : (
                '-'
              )}
            </p>
          </div>
          <div>
            <Label className="text-muted-foreground">Description</Label>
            <p className="font-medium">{jobOrder.description || pjo?.commodity || '-'}</p>
          </div>
          {pjo?.quantity && (
            <div>
              <Label className="text-muted-foreground">Quantity</Label>
              <p className="font-medium">{pjo.quantity} {pjo.quantity_unit || ''}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Logistics (from PJO) */}
      {pjo && (
        <Card>
          <CardHeader>
            <CardTitle>Logistics</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div>
              <Label className="text-muted-foreground">Point of Loading (POL)</Label>
              <p className="font-medium">{pjo.pol || '-'}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Point of Destination (POD)</Label>
              <p className="font-medium">{pjo.pod || '-'}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">ETD</Label>
              <p className="font-medium">
                {pjo.etd ? formatDate(pjo.etd) : '-'}
              </p>
            </div>
            <div>
              <Label className="text-muted-foreground">ETA</Label>
              <p className="font-medium">
                {pjo.eta ? formatDate(pjo.eta) : '-'}
              </p>
            </div>
            <div>
              <Label className="text-muted-foreground">Carrier Type</Label>
              <p className="font-medium">{pjo.carrier_type || '-'}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Financials */}
      <Card>
        <CardHeader>
          <CardTitle>Final Financials</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <Label className="text-muted-foreground">Final Revenue</Label>
            <p className="text-lg font-semibold">{formatIDR(jobOrder.final_revenue ?? jobOrder.amount ?? 0)}</p>
          </div>
          <div>
            <Label className="text-muted-foreground">Final Cost</Label>
            <p className="text-lg font-semibold">{jobOrder.final_cost ? formatIDR(jobOrder.final_cost) : '-'}</p>
          </div>
          <div>
            <Label className="text-muted-foreground">Final Profit</Label>
            <p className={`text-lg font-semibold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {jobOrder.final_cost ? formatIDR(profit) : '-'}
            </p>
          </div>
          <div>
            <Label className="text-muted-foreground">Final Margin</Label>
            <p className={`text-lg font-semibold ${margin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {jobOrder.final_cost ? `${margin.toFixed(2)}%` : '-'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Timeline</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div>
            <Label className="text-muted-foreground">Created from PJO</Label>
            <p className="font-medium">
              {jobOrder.converted_from_pjo_at
                ? formatDateTime(jobOrder.converted_from_pjo_at)
                : '-'}
            </p>
          </div>
          <div>
            <Label className="text-muted-foreground">Completed</Label>
            <p className="font-medium">
              {jobOrder.completed_at
                ? formatDateTime(jobOrder.completed_at)
                : '-'}
            </p>
          </div>
          <div>
            <Label className="text-muted-foreground">Submitted to Finance</Label>
            <p className="font-medium">
              {jobOrder.submitted_to_finance_at
                ? formatDateTime(jobOrder.submitted_to_finance_at)
                : '-'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      {(jobOrder.notes || pjo?.notes) && (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{jobOrder.notes || pjo?.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
