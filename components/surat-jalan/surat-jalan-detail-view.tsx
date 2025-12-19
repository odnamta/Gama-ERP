'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { SuratJalanWithRelations, SJStatus } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { SJStatusBadge } from '@/components/ui/sj-status-badge'
import { formatDate, formatDateTime } from '@/lib/pjo-utils'
import { getAvailableSJTransitions, getSJStatusLabel } from '@/lib/sj-utils'
import { updateSuratJalanStatus } from '@/app/(main)/job-orders/surat-jalan-actions'
import { useToast } from '@/hooks/use-toast'
import { ArrowLeft, RefreshCw, Loader2 } from 'lucide-react'
import { SuratJalanPrintView } from './surat-jalan-print-view'
import { PDFButtons } from '@/components/pdf/pdf-buttons'

interface SuratJalanDetailViewProps {
  suratJalan: SuratJalanWithRelations
  joId: string
  showPrintView?: boolean
  showUpdateAction?: boolean
}

export function SuratJalanDetailView({
  suratJalan,
  joId,
  showPrintView = false,
  showUpdateAction = false,
}: SuratJalanDetailViewProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isUpdating, setIsUpdating] = useState(false)
  const [showStatusDialog, setShowStatusDialog] = useState(showUpdateAction)
  const [receiverName, setReceiverName] = useState('')

  const availableTransitions = getAvailableSJTransitions(suratJalan.status as SJStatus)

  const handleStatusUpdate = async (newStatus: SJStatus) => {
    setIsUpdating(true)
    try {
      const result = await updateSuratJalanStatus(
        suratJalan.id,
        newStatus,
        newStatus === 'delivered' ? receiverName : undefined
      )
      if (result.error) {
        toast({
          title: 'Error',
          description: result.error,
          variant: 'destructive',
        })
      } else {
        toast({
          title: 'Success',
          description: `Status updated to ${getSJStatusLabel(newStatus)}`,
        })
        setShowStatusDialog(false)
        router.refresh()
      }
    } finally {
      setIsUpdating(false)
    }
  }

  if (showPrintView) {
    return <SuratJalanPrintView suratJalan={suratJalan} />
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
          <h1 className="text-2xl font-bold">{suratJalan.sj_number}</h1>
          <div className="mt-1 flex items-center gap-2">
            <SJStatusBadge status={suratJalan.status as SJStatus} />
            <span className="text-sm text-muted-foreground">
              Issued {formatDate(suratJalan.issued_at || suratJalan.created_at || '')}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          {availableTransitions.length > 0 && (
            <Button variant="outline" onClick={() => setShowStatusDialog(true)}>
              <RefreshCw className="h-4 w-4 mr-1" />
              Update Status
            </Button>
          )}
          <PDFButtons
            documentType="surat-jalan"
            documentId={suratJalan.id}
            documentNumber={suratJalan.sj_number}
          />
        </div>
      </div>

      {/* Job Order Link */}
      <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
        <CardHeader>
          <CardTitle className="text-blue-800 dark:text-blue-400">Job Order</CardTitle>
        </CardHeader>
        <CardContent>
          <Link href={`/job-orders/${joId}`} className="text-blue-600 hover:underline font-medium">
            {(suratJalan.job_orders as { jo_number: string })?.jo_number || joId}
          </Link>
        </CardContent>
      </Card>

      {/* Delivery Details */}
      <Card>
        <CardHeader>
          <CardTitle>Delivery Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div>
            <Label className="text-muted-foreground">Delivery Date</Label>
            <p className="font-medium">{formatDate(suratJalan.delivery_date)}</p>
          </div>
          <div>
            <Label className="text-muted-foreground">Vehicle Plate</Label>
            <p className="font-medium">{suratJalan.vehicle_plate || '-'}</p>
          </div>
          <div>
            <Label className="text-muted-foreground">Driver Name</Label>
            <p className="font-medium">{suratJalan.driver_name || '-'}</p>
          </div>
          <div>
            <Label className="text-muted-foreground">Driver Phone</Label>
            <p className="font-medium">{suratJalan.driver_phone || '-'}</p>
          </div>
        </CardContent>
      </Card>

      {/* Route */}
      <Card>
        <CardHeader>
          <CardTitle>Route</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div>
            <Label className="text-muted-foreground">Origin</Label>
            <p className="font-medium">{suratJalan.origin || '-'}</p>
          </div>
          <div>
            <Label className="text-muted-foreground">Destination</Label>
            <p className="font-medium">{suratJalan.destination || '-'}</p>
          </div>
        </CardContent>
      </Card>

      {/* Cargo */}
      <Card>
        <CardHeader>
          <CardTitle>Cargo</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <Label className="text-muted-foreground">Description</Label>
            <p className="font-medium">{suratJalan.cargo_description || '-'}</p>
          </div>
          <div>
            <Label className="text-muted-foreground">Quantity</Label>
            <p className="font-medium">
              {suratJalan.quantity ? `${suratJalan.quantity} ${suratJalan.quantity_unit || ''}` : '-'}
            </p>
          </div>
          <div>
            <Label className="text-muted-foreground">Weight</Label>
            <p className="font-medium">
              {suratJalan.weight_kg ? `${suratJalan.weight_kg} kg` : '-'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Sender/Receiver */}
      <Card>
        <CardHeader>
          <CardTitle>Sender / Receiver</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div>
            <Label className="text-muted-foreground">Sender Name</Label>
            <p className="font-medium">{suratJalan.sender_name || '-'}</p>
          </div>
          <div>
            <Label className="text-muted-foreground">Receiver Name</Label>
            <p className="font-medium">{suratJalan.receiver_name || '-'}</p>
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
            <Label className="text-muted-foreground">Issued At</Label>
            <p className="font-medium">
              {suratJalan.issued_at ? formatDateTime(suratJalan.issued_at) : '-'}
            </p>
          </div>
          <div>
            <Label className="text-muted-foreground">Delivered At</Label>
            <p className="font-medium">
              {suratJalan.delivered_at ? formatDateTime(suratJalan.delivered_at) : '-'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      {suratJalan.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{suratJalan.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Status Update Dialog */}
      <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Status</DialogTitle>
            <DialogDescription>
              Current status: {getSJStatusLabel(suratJalan.status as SJStatus)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {availableTransitions.includes('delivered') && (
              <div className="space-y-2">
                <Label htmlFor="receiver_name">Receiver Name</Label>
                <Input
                  id="receiver_name"
                  value={receiverName}
                  onChange={(e) => setReceiverName(e.target.value)}
                  placeholder="Name of person receiving cargo"
                />
              </div>
            )}
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            {availableTransitions.map((status) => (
              <Button
                key={status}
                onClick={() => handleStatusUpdate(status)}
                disabled={isUpdating}
                variant={status === 'delivered' ? 'default' : 'outline'}
              >
                {isUpdating && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
                {getSJStatusLabel(status)}
              </Button>
            ))}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
