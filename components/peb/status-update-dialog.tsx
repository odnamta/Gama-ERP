'use client'

import { useState } from 'react'
import { PEBStatus, PEBStatusUpdateData, PEB_STATUS_LABELS } from '@/types/peb'
import { getNextAllowedStatuses } from '@/lib/peb-utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2 } from 'lucide-react'

interface StatusUpdateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentStatus: PEBStatus
  onStatusUpdate: (newStatus: PEBStatus, data?: PEBStatusUpdateData) => Promise<void>
}

export function StatusUpdateDialog({
  open,
  onOpenChange,
  currentStatus,
  onStatusUpdate,
}: StatusUpdateDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState<PEBStatus | ''>('')
  const [ajuNumber, setAjuNumber] = useState('')
  const [pebNumber, setPebNumber] = useState('')
  const [npeNumber, setNpeNumber] = useState('')
  const [npeDate, setNpeDate] = useState('')
  const [notes, setNotes] = useState('')

  const allowedStatuses = getNextAllowedStatuses(currentStatus)

  const handleSubmit = async () => {
    if (!selectedStatus) return

    setIsLoading(true)
    try {
      const data: PEBStatusUpdateData = { notes: notes || undefined }

      if (selectedStatus === 'submitted' && ajuNumber) {
        data.aju_number = ajuNumber
      }
      if (selectedStatus === 'approved') {
        if (npeNumber) data.npe_number = npeNumber
        if (npeDate) data.npe_date = npeDate
      }
      if (pebNumber) {
        data.peb_number = pebNumber
      }

      await onStatusUpdate(selectedStatus, data)
      onOpenChange(false)
      resetForm()
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setSelectedStatus('')
    setAjuNumber('')
    setPebNumber('')
    setNpeNumber('')
    setNpeDate('')
    setNotes('')
  }

  const showAjuField = selectedStatus === 'submitted'
  const showNpeFields = selectedStatus === 'approved'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update Status</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="rounded-md bg-muted p-3">
            <div className="text-xs text-muted-foreground">Current Status</div>
            <div className="font-medium">{PEB_STATUS_LABELS[currentStatus]}</div>
          </div>

          <div className="space-y-2">
            <Label>New Status *</Label>
            <Select
              value={selectedStatus}
              onValueChange={(v) => setSelectedStatus(v as PEBStatus)}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select new status" />
              </SelectTrigger>
              <SelectContent>
                {allowedStatuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    {PEB_STATUS_LABELS[status]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {allowedStatuses.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No status transitions available from current status.
              </p>
            )}
          </div>

          {showAjuField && (
            <div className="space-y-2">
              <Label htmlFor="aju_number">AJU Number</Label>
              <Input
                id="aju_number"
                value={ajuNumber}
                onChange={(e) => setAjuNumber(e.target.value)}
                placeholder="Enter AJU number"
                disabled={isLoading}
              />
            </div>
          )}

          {showNpeFields && (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="npe_number">NPE Number</Label>
                <Input
                  id="npe_number"
                  value={npeNumber}
                  onChange={(e) => setNpeNumber(e.target.value)}
                  placeholder="Enter NPE number"
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="npe_date">NPE Date</Label>
                <Input
                  id="npe_date"
                  type="date"
                  value={npeDate}
                  onChange={(e) => setNpeDate(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="peb_number">PEB Number (optional)</Label>
            <Input
              id="peb_number"
              value={pebNumber}
              onChange={(e) => setPebNumber(e.target.value)}
              placeholder="Enter PEB number if available"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes..."
              rows={2}
              disabled={isLoading}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading || !selectedStatus}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              'Update Status'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
