'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { UnavailabilityTypeBadge } from '@/components/ui/resource-status-badge'
import { ConflictResult, ConflictDetail } from '@/types/resource-scheduling'
import { formatDate } from '@/lib/pjo-utils'
import { AlertTriangle, Calendar, Clock, FileText } from 'lucide-react'

interface ConflictDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  conflicts: ConflictResult
  onProceed?: () => void
  onCancel?: () => void
  title?: string
  description?: string
}

export function ConflictDialog({
  open,
  onOpenChange,
  conflicts,
  onProceed,
  onCancel,
  title = 'Scheduling Conflicts Detected',
  description = 'The following conflicts were found. You can proceed anyway or cancel to modify your selection.',
}: ConflictDialogProps) {
  const assignmentConflicts = conflicts.conflicts.filter((c) => c.type === 'assignment')
  const unavailabilityConflicts = conflicts.conflicts.filter((c) => c.type === 'unavailability')

  const handleProceed = () => {
    onProceed?.()
    onOpenChange(false)
  }

  const handleCancel = () => {
    onCancel?.()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4 max-h-[400px] overflow-y-auto">
          {/* Assignment Conflicts */}
          {assignmentConflicts.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Existing Assignments ({assignmentConflicts.length})
              </h4>
              {assignmentConflicts.map((conflict, idx) => (
                <ConflictCard key={idx} conflict={conflict} />
              ))}
            </div>
          )}

          {/* Unavailability Conflicts */}
          {unavailabilityConflicts.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Unavailable Dates ({unavailabilityConflicts.length})
              </h4>
              {unavailabilityConflicts.map((conflict, idx) => (
                <ConflictCard key={idx} conflict={conflict} />
              ))}
            </div>
          )}

          {/* Summary Alert */}
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Warning</AlertTitle>
            <AlertDescription>
              Proceeding with this action may result in over-allocation or scheduling issues.
              Please review the conflicts above before continuing.
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          {onProceed && (
            <Button variant="destructive" onClick={handleProceed}>
              Proceed Anyway
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function ConflictCard({ conflict }: { conflict: ConflictDetail }) {
  return (
    <div className="p-3 border rounded-lg bg-muted/50 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{formatDate(conflict.date)}</span>
        </div>
        {conflict.type === 'unavailability' && conflict.unavailability_type && (
          <UnavailabilityTypeBadge type={conflict.unavailability_type} />
        )}
        {conflict.type === 'assignment' && (
          <Badge variant="secondary">Assignment</Badge>
        )}
      </div>

      <p className="text-sm text-muted-foreground">{conflict.message}</p>

      {conflict.assignment && (
        <div className="text-xs space-y-1 pt-1 border-t">
          {conflict.assignment.task_description && (
            <p>
              <span className="text-muted-foreground">Task:</span>{' '}
              {conflict.assignment.task_description}
            </p>
          )}
          <p className="flex items-center gap-1">
            <Clock className="h-3 w-3 text-muted-foreground" />
            {formatDate(conflict.assignment.start_date)} - {formatDate(conflict.assignment.end_date)}
          </p>
          {conflict.assignment.planned_hours && (
            <p>
              <span className="text-muted-foreground">Hours:</span>{' '}
              {conflict.assignment.planned_hours}h planned
            </p>
          )}
        </div>
      )}
    </div>
  )
}
