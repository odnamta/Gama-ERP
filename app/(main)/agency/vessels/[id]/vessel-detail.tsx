'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Ruler,
  Building2,
  MapPin,
  Navigation,
  Calendar,
  Flag,
  Hash,
  Anchor,
  Clock,
} from 'lucide-react';
import {
  Vessel,
  VesselSchedule,
  VesselPositionRecord,
  VESSEL_TYPE_LABELS,
  VESSEL_STATUS_LABELS,
  VESSEL_STATUS_COLORS,
} from '@/types/agency';
import { deleteVessel } from '@/app/actions/vessel-tracking-actions';
import { useToast } from '@/hooks/use-toast';
import { ScheduleTimeline } from '@/components/vessel-tracking/schedule-timeline';
import { PositionMap, PositionHistoryMap } from '@/components/vessel-tracking/position-map';
import { format, parseISO } from 'date-fns';

interface VesselDetailProps {
  vessel: Vessel;
  schedules: VesselSchedule[];
  positionHistory: VesselPositionRecord[];
}

/**
 * Vessel detail page component.
 * Shows vessel information, schedules, and position history.
 * 
 * **Requirements: 1.1-1.7, 3.5**
 */
export function VesselDetail({ vessel, schedules, positionHistory }: VesselDetailProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    const result = await deleteVessel(vessel.id);
    if (result.success) {
      toast({
        title: 'Success',
        description: 'Vessel deactivated successfully',
      });
      router.push('/agency/vessels');
    } else {
      toast({
        title: 'Error',
        description: result.error || 'Failed to deactivate vessel',
        variant: 'destructive',
      });
      setIsDeleting(false);
    }
    setDeleteDialogOpen(false);
  };

  // Group schedules by voyage
  const schedulesByVoyage = schedules.reduce((acc, schedule) => {
    const key = schedule.voyageNumber;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(schedule);
    return acc;
  }, {} as Record<string, VesselSchedule[]>);

  // Format position history for map
  const positionHistoryForMap = positionHistory.map(p => ({
    lat: p.latitude,
    lng: p.longitude,
    timestamp: p.timestamp,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/agency/vessels')}
            className="mb-2"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Vessels
          </Button>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{vessel.vesselName}</h1>
            {vessel.currentStatus && (
              <Badge className={VESSEL_STATUS_COLORS[vessel.currentStatus]}>
                {VESSEL_STATUS_LABELS[vessel.currentStatus]}
              </Badge>
            )}
            {!vessel.isActive && (
              <Badge variant="secondary">Inactive</Badge>
            )}
          </div>
          {vessel.imoNumber && (
            <p className="text-muted-foreground font-mono">IMO: {vessel.imoNumber}</p>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push(`/agency/vessels/${vessel.id}/edit`)}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
            <Trash2 className="mr-2 h-4 w-4" />
            Deactivate
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="schedules">Schedules ({schedules.length})</TabsTrigger>
          <TabsTrigger value="position">Position History ({positionHistory.length})</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Identification */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Ship className="h-5 w-5" />
                  Identification
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {vessel.vesselType && (
                  <div className="flex items-center gap-2">
                    <Ship className="h-4 w-4 text-muted-foreground" />
                    <span>{VESSEL_TYPE_LABELS[vessel.vesselType]}</span>
                  </div>
                )}
                {vessel.flag && (
                  <div className="flex items-center gap-2">
                    <Flag className="h-4 w-4 text-muted-foreground" />
                    <span>{vessel.flag}</span>
                  </div>
                )}
                {vessel.callSign && (
                  <div className="flex items-center gap-2">
                    <Hash className="h-4 w-4 text-muted-foreground" />
                    <span className="font-mono">{vessel.callSign}</span>
                  </div>
                )}
                {vessel.mmsi && (
                  <div className="flex items-center gap-2">
                    <Anchor className="h-4 w-4 text-muted-foreground" />
                    <span className="font-mono">MMSI: {vessel.mmsi}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Current Position */}
            <PositionMap
              position={vessel.currentPosition}
              vessel={vessel}
              title="Current Position"
            />

            {/* Specifications */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Ruler className="h-5 w-5" />
                  Specifications
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {vessel.lengthM && (
                    <div>
                      <p className="text-sm text-muted-foreground">Length</p>
                      <p className="font-medium">{vessel.lengthM} m</p>
                    </div>
                  )}
                  {vessel.beamM && (
                    <div>
                      <p className="text-sm text-muted-foreground">Beam</p>
                      <p className="font-medium">{vessel.beamM} m</p>
                    </div>
                  )}
                  {vessel.draftM && (
                    <div>
                      <p className="text-sm text-muted-foreground">Draft</p>
                      <p className="font-medium">{vessel.draftM} m</p>
                    </div>
                  )}
                  {vessel.grossTonnage && (
                    <div>
                      <p className="text-sm text-muted-foreground">Gross Tonnage</p>
                      <p className="font-medium">{vessel.grossTonnage.toLocaleString()} GT</p>
                    </div>
                  )}
                  {vessel.deadweightTons && (
                    <div>
                      <p className="text-sm text-muted-foreground">Deadweight</p>
                      <p className="font-medium">{vessel.deadweightTons.toLocaleString()} DWT</p>
                    </div>
                  )}
                  {vessel.teuCapacity && (
                    <div>
                      <p className="text-sm text-muted-foreground">TEU Capacity</p>
                      <p className="font-medium">{vessel.teuCapacity.toLocaleString()} TEU</p>
                    </div>
                  )}
                </div>
                {!vessel.lengthM && !vessel.beamM && !vessel.draftM && 
                 !vessel.grossTonnage && !vessel.deadweightTons && !vessel.teuCapacity && (
                  <p className="text-muted-foreground">No specifications recorded</p>
                )}
              </CardContent>
            </Card>

            {/* Ownership */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Ownership & Operation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {vessel.owner && (
                  <div>
                    <p className="text-sm text-muted-foreground">Owner</p>
                    <p className="font-medium">{vessel.owner}</p>
                  </div>
                )}
                {vessel.operator && (
                  <div>
                    <p className="text-sm text-muted-foreground">Operator</p>
                    <p className="font-medium">{vessel.operator}</p>
                  </div>
                )}
                {vessel.shippingLine && (
                  <div>
                    <p className="text-sm text-muted-foreground">Linked Shipping Line</p>
                    <p className="font-medium">
                      {vessel.shippingLine.lineName} ({vessel.shippingLine.lineCode})
                    </p>
                  </div>
                )}
                {!vessel.owner && !vessel.operator && !vessel.shippingLine && (
                  <p className="text-muted-foreground">No ownership information recorded</p>
                )}
              </CardContent>
            </Card>

            {/* Route Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Route Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {vessel.lastPort && (
                  <div>
                    <p className="text-sm text-muted-foreground">Last Port</p>
                    <p className="font-medium">{vessel.lastPort}</p>
                  </div>
                )}
                {vessel.nextPort && (
                  <div>
                    <p className="text-sm text-muted-foreground">Next Port</p>
                    <p className="font-medium">{vessel.nextPort}</p>
                  </div>
                )}
                {!vessel.lastPort && !vessel.nextPort && (
                  <p className="text-muted-foreground">No route information available</p>
                )}
              </CardContent>
            </Card>

            {/* Metadata */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Record Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Created</p>
                  <p className="font-medium">
                    {format(parseISO(vessel.createdAt), 'dd MMM yyyy HH:mm')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Last Updated</p>
                  <p className="font-medium">
                    {format(parseISO(vessel.updatedAt), 'dd MMM yyyy HH:mm')}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Schedules Tab */}
        <TabsContent value="schedules" className="space-y-6">
          {Object.keys(schedulesByVoyage).length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No schedules found for this vessel</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => router.push('/agency/schedules/new')}
                >
                  Create Schedule
                </Button>
              </CardContent>
            </Card>
          ) : (
            Object.entries(schedulesByVoyage).map(([voyageNumber, voyageSchedules]) => (
              <ScheduleTimeline
                key={voyageNumber}
                schedules={voyageSchedules}
                vesselName={vessel.vesselName}
                voyageNumber={voyageNumber}
              />
            ))
          )}
        </TabsContent>

        {/* Position History Tab */}
        <TabsContent value="position" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Position Track Map */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Navigation className="h-5 w-5" />
                  Position Track
                </CardTitle>
              </CardHeader>
              <CardContent>
                <PositionHistoryMap positions={positionHistoryForMap} />
              </CardContent>
            </Card>

            {/* Position History List */}
            <Card>
              <CardHeader>
                <CardTitle>Position History</CardTitle>
              </CardHeader>
              <CardContent>
                {positionHistory.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    No position history available
                  </p>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {positionHistory.map((position) => (
                      <div
                        key={position.id}
                        className="flex items-start justify-between p-3 border rounded-lg"
                      >
                        <div className="space-y-1">
                          <p className="font-mono text-sm">
                            {position.latitude.toFixed(5)}°, {position.longitude.toFixed(5)}°
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(parseISO(position.timestamp), 'dd MMM yyyy HH:mm')}
                          </p>
                        </div>
                        <div className="text-right text-sm">
                          {position.course !== undefined && (
                            <p>Course: {position.course}°</p>
                          )}
                          {position.speedKnots !== undefined && (
                            <p>Speed: {position.speedKnots} kn</p>
                          )}
                          <Badge variant="outline" className="mt-1">
                            {position.source}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate Vessel</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to deactivate &quot;{vessel.vesselName}&quot;?
              The vessel will be hidden from active lists but historical data will be preserved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deactivating...' : 'Deactivate'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
