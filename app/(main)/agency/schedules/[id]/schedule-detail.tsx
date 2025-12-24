'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Ship,
  MapPin,
  Calendar,
  Clock,
  AlertTriangle,
  Anchor,
  Package,
  FileText,
  ExternalLink,
} from 'lucide-react';
import {
  VesselSchedule,
  Vessel,
  SCHEDULE_STATUS_LABELS,
  SCHEDULE_STATUS_COLORS,
  SCHEDULE_TYPE_LABELS,
  getDelaySeverity,
  DELAY_SEVERITY_COLORS,
} from '@/types/agency';
import { deleteSchedule } from '@/app/actions/vessel-tracking-actions';
import { useToast } from '@/hooks/use-toast';
import { DelayIndicator } from '@/components/vessel-tracking/delay-indicator';
import { format, parseISO } from 'date-fns';


interface ScheduleDetailProps {
  schedule: VesselSchedule;
  vessel?: Vessel;
}

/**
 * Schedule detail page component.
 * Shows schedule information including times, cutoffs, and delay status.
 * 
 * **Requirements: 2.1-2.8**
 */
export function ScheduleDetail({ schedule, vessel }: ScheduleDetailProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    const result = await deleteSchedule(schedule.id);
    if (result.success) {
      toast({
        title: 'Success',
        description: 'Schedule deleted successfully',
      });
      router.push('/agency/schedules');
    } else {
      toast({
        title: 'Error',
        description: result.error || 'Failed to delete schedule',
        variant: 'destructive',
      });
      setIsDeleting(false);
    }
    setDeleteDialogOpen(false);
  };

  // Format date/time for display
  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return '-';
    try {
      return format(parseISO(dateStr), 'dd MMM yyyy HH:mm');
    } catch {
      return dateStr;
    }
  };

  // Get delay severity for styling
  const delaySeverity = getDelaySeverity(schedule.delayHours);
  const hasDelay = schedule.delayHours > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/agency/schedules')}
            className="mb-2"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Schedules
          </Button>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <MapPin className="h-8 w-8" />
              {schedule.portName}
            </h1>
            <Badge className={SCHEDULE_STATUS_COLORS[schedule.status]}>
              {SCHEDULE_STATUS_LABELS[schedule.status]}
            </Badge>
            {schedule.scheduleType !== 'scheduled' && (
              <Badge variant="outline">
                {SCHEDULE_TYPE_LABELS[schedule.scheduleType]}
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground">
            {schedule.terminal && `Terminal: ${schedule.terminal}`}
            {schedule.terminal && schedule.berth && ' • '}
            {schedule.berth && `Berth: ${schedule.berth}`}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push(`/agency/schedules/${schedule.id}/edit`)}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      {/* Delay Alert */}
      {hasDelay && (
        <Card className={`border-l-4 ${DELAY_SEVERITY_COLORS[delaySeverity]}`}>
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5" />
              <div>
                <p className="font-medium">
                  Delay: {schedule.delayHours > 0 ? '+' : ''}{schedule.delayHours} hours
                </p>
                {schedule.delayReason && (
                  <p className="text-sm text-muted-foreground">{schedule.delayReason}</p>
                )}
              </div>
              <DelayIndicator
                delayHours={schedule.delayHours}
                delayReason={schedule.delayReason}
                size="lg"
                className="ml-auto"
              />
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Vessel & Voyage Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ship className="h-5 w-5" />
              Vessel & Voyage
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Vessel</p>
                <p className="font-medium">
                  {vessel?.vesselName || schedule.vessel?.vesselName || 'Unknown'}
                </p>
                {(vessel?.imoNumber || schedule.vessel?.imoNumber) && (
                  <p className="text-xs text-muted-foreground font-mono">
                    IMO: {vessel?.imoNumber || schedule.vessel?.imoNumber}
                  </p>
                )}
              </div>
              {schedule.vesselId && (
                <Link href={`/agency/vessels/${schedule.vesselId}`}>
                  <Button variant="ghost" size="sm">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </Link>
              )}
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Voyage Number</p>
              <p className="font-medium font-mono">{schedule.voyageNumber}</p>
            </div>
            {schedule.serviceName && (
              <div>
                <p className="text-sm text-muted-foreground">Service</p>
                <p className="font-medium">
                  {schedule.serviceName}
                  {schedule.serviceCode && ` (${schedule.serviceCode})`}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Port Call Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Anchor className="h-5 w-5" />
              Port Call Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Port</p>
              <p className="font-medium">{schedule.portName}</p>
              {schedule.port?.portCode && (
                <p className="text-xs text-muted-foreground">
                  Code: {schedule.port.portCode}
                </p>
              )}
            </div>
            {schedule.terminal && (
              <div>
                <p className="text-sm text-muted-foreground">Terminal</p>
                <p className="font-medium">{schedule.terminal}</p>
              </div>
            )}
            {schedule.berth && (
              <div>
                <p className="text-sm text-muted-foreground">Berth</p>
                <p className="font-medium">{schedule.berth}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Arrival Times */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Arrival Times
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Scheduled (ETA)</p>
                <p className="font-medium">{formatDateTime(schedule.scheduledArrival)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Actual (ATA)</p>
                <p className={`font-medium ${hasDelay ? 'text-orange-600' : ''}`}>
                  {formatDateTime(schedule.actualArrival)}
                </p>
              </div>
            </div>
            {hasDelay && (
              <div className={`p-3 rounded-md ${DELAY_SEVERITY_COLORS[delaySeverity]}`}>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="font-medium">
                    Delay: {schedule.delayHours > 0 ? '+' : ''}{schedule.delayHours} hours
                  </span>
                </div>
                {schedule.delayReason && (
                  <p className="text-sm mt-1">{schedule.delayReason}</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Departure Times */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Departure Times
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Scheduled (ETD)</p>
                <p className="font-medium">{formatDateTime(schedule.scheduledDeparture)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Actual (ATD)</p>
                <p className="font-medium">{formatDateTime(schedule.actualDeparture)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cutoff Times */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Cutoff Times
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Cargo Cutoff</p>
                <p className="font-medium">{formatDateTime(schedule.cargoCutoff)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Doc Cutoff</p>
                <p className="font-medium">{formatDateTime(schedule.docCutoff)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">VGM Cutoff</p>
                <p className="font-medium">{formatDateTime(schedule.vgmCutoff)}</p>
              </div>
            </div>
            {!schedule.cargoCutoff && !schedule.docCutoff && !schedule.vgmCutoff && (
              <p className="text-muted-foreground">No cutoff times specified</p>
            )}
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {schedule.notes ? (
              <p className="whitespace-pre-wrap">{schedule.notes}</p>
            ) : (
              <p className="text-muted-foreground">No notes</p>
            )}
          </CardContent>
        </Card>

        {/* Record Info */}
        <Card>
          <CardHeader>
            <CardTitle>Record Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Created</p>
              <p className="font-medium">{formatDateTime(schedule.createdAt)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Last Updated</p>
              <p className="font-medium">{formatDateTime(schedule.updatedAt)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Schedule</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this schedule for {schedule.portName}?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
