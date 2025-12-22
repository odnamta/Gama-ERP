'use client'

import { useState } from 'react'
import { PIBStatus, StatusUpdateData } from '@/types/pib'
import { formatPIBStatus, getNextAllowedStatuses } from '@/lib/pib-utils'
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
  currentStatus: PIBStatus
  onStatusUpdate: (newStatus: PIBStatus, data?: StatusUpdateData) => Promise<void>
}

export function StatusUpdateDialog({
  open,
  onOpenChange,
  currentStatus,
  onStatusUpdate,
}: StatusUpdateDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState<PIBStatus | ''>('')
  const [ajuNumber, setAjuNumber] = useState('')
  const [pibNumber, setPibNumber] = useState('')
  const [sppbNumber, setSppbNumber] = useState('')
  const [sppbDate, setSppbDate] = useState('')
  const [notes, setNotes] = useState('')

  const allowedStatuses = getNextAllowedStatuses(currentStatus)

  const handleSubmit = async () => {
    if (!selectedStatus) return

    setIsLoading(true)
    try {
      const data: StatusUpdateData = { notes: notes || undefined }

      // Add status-specific data
      if (selectedStatus === 'submitted' && ajuNumber) {
        data.aju_number = ajuNumber
      }
      if (selectedStatus === 'duties_paid' && pibNumber) {
        data.pib_number = pibNumber
      }
      if (selectedStatus === 'released') {
        if (sppbNumber) data.sppb_number = sppbNumber
        if (sppbDate) data.sppb_date = sppbDate
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
    setPibNumber('')
    setSppbNumber('')
    setSppbDate('')
    setNotes('')
  }

  const showAjuField = selectedStatus === 'submitted'
  const showPibField = selectedStatus === 'duties_paid'
  const showSppbFields = selectedStatus === 'released'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update Status</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Current Status */}
          <div className="rounded-md bg-muted p-3">
            <div className="text-xs text-muted-foreground">Current Status</div>
            <div className="font-medium">{formatPIBStatus(currentStatus)}</div>
          </div>

          {/* New Status Selection */}
          <div className="space-y-2">
            <Label>New Status *</Label>
            <Select
              value={selectedStatus}
              onValueChange={(v) => setSelectedStatus(v as PIBStatus)}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select new status" />
              </SelectTrigger>
              <SelectContent>
                {allowedStatuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    {formatPIBStatus(status)}
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

          {/* AJU Number (for submitted) */}
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

          {/* PIB Number (for duties_paid) */}
          {showPibField && (
            <div className="space-y-2">
              <Label htmlFor="pib_number">PIB Number</Label>
              <Input
                id="pib_number"
                value={pibNumber}
                onChange={(e) => setPibNumber(e.target.value)}
                placeholder="Enter PIB number"
                disabled={isLoading}
              />
            </div>
          )}

          {/* SPPB Fields (for released) */}
          {showSppbFields && (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="sppb_number">SPPB Number</Label>
                <Input
                  id="sppb_number"
                  value={sppbNumber}
                  onChange={(e) => setSppbNumber(e.target.value)}
                  placeholder="Enter SPPB number"
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sppb_date">SPPB Date</Label>
                <Input
                  id="sppb_date"
                  type="date"
                  value={sppbDate}
                  onChange={(e) => setSppbDate(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>
          )}

          {/* Notes */}
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
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading || !selectedStatus}
          >
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
