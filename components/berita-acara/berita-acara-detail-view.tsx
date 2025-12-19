'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { BeritaAcaraWithRelations, BAStatus, CargoCondition } from '@/types'
import { parsePhotoUrls } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { BAStatusBadge } from '@/components/ui/ba-status-badge'
import { PhotoGallery } from './photo-gallery'
import { formatDate, formatDateTime } from '@/lib/pjo-utils'
import {
  getAvailableBATransitions,
  getBAStatusLabel,
  getCargoConditionLabel,
  getCargoConditionColor,
  canEditBA,
} from '@/lib/ba-utils'
import { updateBeritaAcaraStatus } from '@/app/(main)/job-orders/berita-acara-actions'
import { useToast } from '@/hooks/use-toast'
import { ArrowLeft, Edit, RefreshCw, Loader2 } from 'lucide-react'
import { BeritaAcaraPrintView } from './berita-acara-print-view'
import { PDFButtons } from '@/components/pdf/pdf-buttons'

interface BeritaAcaraDetailViewProps {
  beritaAcara: BeritaAcaraWithRelations
  joId: string
  showPrintView?: boolean
}

export function BeritaAcaraDetailView({
  beritaAcara,
  joId,
  showPrintView = false,
}: BeritaAcaraDetailViewProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isUpdating, setIsUpdating] = useState(false)
  const [showStatusDialog, setShowStatusDialog] = useState(false)

  const availableTransitions = getAvailableBATransitions(beritaAcara.status as BAStatus)
  const photos = parsePhotoUrls(beritaAcara.photo_urls)

  const handleStatusUpdate = async (newStatus: BAStatus) => {
    setIsUpdating(true)
    try {
      const result = await updateBeritaAcaraStatus(beritaAcara.id, newStatus)
      if (result.error) {
        toast({
          title: 'Error',
          description: result.error,
          variant: 'destructive',
        })
      } else {
        toast({
          title: 'Success',
          description: `Status updated to ${getBAStatusLabel(newStatus)}`,
        })
        setShowStatusDialog(false)
        router.refresh()
      }
    } finally {
      setIsUpdating(false)
    }
  }

  if (showPrintView) {
    return <BeritaAcaraPrintView beritaAcara={beritaAcara} />
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
          <h1 className="text-2xl font-bold">{beritaAcara.ba_number}</h1>
          <div className="mt-1 flex items-center gap-2">
            <BAStatusBadge status={beritaAcara.status as BAStatus} />
            <span className="text-sm text-muted-foreground">
              Created {formatDate(beritaAcara.created_at || '')}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          {canEditBA(beritaAcara.status as BAStatus) && (
            <Button variant="outline" asChild>
              <Link href={`/job-orders/${joId}/berita-acara/${beritaAcara.id}/edit`}>
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </Link>
            </Button>
          )}
          {availableTransitions.length > 0 && (
            <Button variant="outline" onClick={() => setShowStatusDialog(true)}>
              <RefreshCw className="h-4 w-4 mr-1" />
              Update Status
            </Button>
          )}
          <PDFButtons
            documentType="berita-acara"
            documentId={beritaAcara.id}
            documentNumber={beritaAcara.ba_number}
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
            {(beritaAcara.job_orders as { jo_number: string })?.jo_number || joId}
          </Link>
        </CardContent>
      </Card>

      {/* Handover Details */}
      <Card>
        <CardHeader>
          <CardTitle>Handover Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div>
            <Label className="text-muted-foreground">Handover Date</Label>
            <p className="font-medium">{formatDate(beritaAcara.handover_date)}</p>
          </div>
          <div>
            <Label className="text-muted-foreground">Location</Label>
            <p className="font-medium">{beritaAcara.location || '-'}</p>
          </div>
        </CardContent>
      </Card>

      {/* Work Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Work Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-muted-foreground">Work Description</Label>
            <p className="font-medium whitespace-pre-wrap">{beritaAcara.work_description || '-'}</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label className="text-muted-foreground">Cargo Condition</Label>
              <div className="mt-1">
                {beritaAcara.cargo_condition ? (
                  <Badge className={getCargoConditionColor(beritaAcara.cargo_condition as CargoCondition)} variant="outline">
                    {getCargoConditionLabel(beritaAcara.cargo_condition as CargoCondition)}
                  </Badge>
                ) : (
                  <span>-</span>
                )}
              </div>
            </div>
            <div>
              <Label className="text-muted-foreground">Condition Notes</Label>
              <p className="font-medium">{beritaAcara.condition_notes || '-'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Representatives */}
      <Card>
        <CardHeader>
          <CardTitle>Representatives</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div>
            <Label className="text-muted-foreground">Company Representative</Label>
            <p className="font-medium">{beritaAcara.company_representative || '-'}</p>
          </div>
          <div>
            <Label className="text-muted-foreground">Client Representative</Label>
            <p className="font-medium">{beritaAcara.client_representative || '-'}</p>
          </div>
        </CardContent>
      </Card>

      {/* Photos */}
      <Card>
        <CardHeader>
          <CardTitle>Photos</CardTitle>
        </CardHeader>
        <CardContent>
          <PhotoGallery photos={photos} />
        </CardContent>
      </Card>

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Timeline</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div>
            <Label className="text-muted-foreground">Created At</Label>
            <p className="font-medium">
              {beritaAcara.created_at ? formatDateTime(beritaAcara.created_at) : '-'}
            </p>
          </div>
          <div>
            <Label className="text-muted-foreground">Signed At</Label>
            <p className="font-medium">
              {beritaAcara.signed_at ? formatDateTime(beritaAcara.signed_at) : '-'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      {beritaAcara.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{beritaAcara.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Status Update Dialog */}
      <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Status</DialogTitle>
            <DialogDescription>
              Current status: {getBAStatusLabel(beritaAcara.status as BAStatus)}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            {availableTransitions.map((status) => (
              <Button
                key={status}
                onClick={() => handleStatusUpdate(status)}
                disabled={isUpdating}
                variant={status === 'signed' ? 'default' : 'outline'}
              >
                {isUpdating && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
                {getBAStatusLabel(status)}
              </Button>
            ))}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
