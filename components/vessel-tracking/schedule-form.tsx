'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Ship, Calendar, Clock, AlertCircle, MapPin } from 'lucide-react';
import {
  ScheduleFormData,
  ScheduleType,
  ScheduleStatus,
  Vessel,
  Port,
  SCHEDULE_TYPES,
  SCHEDULE_TYPE_LABELS,
  SCHEDULE_STATUSES,
  SCHEDULE_STATUS_LABELS,
} from '@/types/agency';

// Form validation schema
export const scheduleFormSchema = z.object({
  vesselId: z.string().min(1, 'Vessel is required'),
  voyageNumber: z.string().min(1, 'Voyage number is required'),
  serviceName: z.string().optional(),
  serviceCode: z.string().optional(),
  scheduleType: z.string().optional(),
  portId: z.string().optional(),
  portName: z.string().min(1, 'Port name is required'),
  terminal: z.string().optional(),
  berth: z.string().optional(),
  scheduledArrival: z.string().optional(),
  scheduledDeparture: z.string().optional(),
  actualArrival: z.string().optional(),
  actualDeparture: z.string().optional(),
  cargoCutoff: z.string().optional(),
  docCutoff: z.string().optional(),
  vgmCutoff: z.string().optional(),
  status: z.string().optional(),
  delayReason: z.string().optional(),
  notes: z.string().optional(),
});

export type ScheduleFormValues = z.infer<typeof scheduleFormSchema>;

interface ScheduleFormProps {
  initialData?: ScheduleFormData | null;
  vessels: Vessel[];
  ports: Port[];
  onSubmit: (data: ScheduleFormData) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
  mode: 'create' | 'edit';
}

/**
 * Form for creating and editing vessel schedules.
 * Includes date/time pickers for all time fields.
 * 
 * **Requirements: 2.1-2.4**
 */
export function ScheduleForm({
  initialData,
  vessels,
  ports,
  onSubmit,
  onCancel,
  isLoading,
  mode,
}: ScheduleFormProps) {
  const [activeTab, setActiveTab] = useState('voyage');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Format datetime for input
  const formatDateTimeForInput = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return date.toISOString().slice(0, 16);
    } catch {
      return '';
    }
  };

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ScheduleFormValues>({
    resolver: zodResolver(scheduleFormSchema) as never,
    defaultValues: {
      vesselId: initialData?.vesselId || '',
      voyageNumber: initialData?.voyageNumber || '',
      serviceName: initialData?.serviceName || '',
      serviceCode: initialData?.serviceCode || '',
      scheduleType: initialData?.scheduleType || 'scheduled',
      portId: initialData?.portId || '',
      portName: initialData?.portName || '',
      terminal: initialData?.terminal || '',
      berth: initialData?.berth || '',
      scheduledArrival: formatDateTimeForInput(initialData?.scheduledArrival),
      scheduledDeparture: formatDateTimeForInput(initialData?.scheduledDeparture),
      actualArrival: formatDateTimeForInput(initialData?.actualArrival),
      actualDeparture: formatDateTimeForInput(initialData?.actualDeparture),
      cargoCutoff: formatDateTimeForInput(initialData?.cargoCutoff),
      docCutoff: formatDateTimeForInput(initialData?.docCutoff),
      vgmCutoff: formatDateTimeForInput(initialData?.vgmCutoff),
      status: initialData?.status || 'scheduled',
      delayReason: initialData?.delayReason || '',
      notes: initialData?.notes || '',
    },
  });

  const watchedVesselId = watch('vesselId');
  const watchedScheduleType = watch('scheduleType');
  const watchedStatus = watch('status');
  const watchedPortId = watch('portId');

  // Handle port selection - auto-fill port name
  const handlePortChange = (portId: string) => {
    setValue('portId', portId);
    const selectedPort = ports.find(p => p.id === portId);
    if (selectedPort) {
      setValue('portName', selectedPort.portName);
    }
  };

  const handleFormSubmit = async (data: ScheduleFormValues) => {
    setValidationErrors([]);
    const errors: string[] = [];

    // Validate that at least one time is provided
    if (!data.scheduledArrival && !data.scheduledDeparture) {
      errors.push('At least one scheduled time (arrival or departure) is required');
    }

    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    const formData: ScheduleFormData = {
      vesselId: data.vesselId,
      voyageNumber: data.voyageNumber,
      serviceName: data.serviceName || undefined,
      serviceCode: data.serviceCode || undefined,
      scheduleType: (data.scheduleType as ScheduleType) || 'scheduled',
      portId: data.portId || undefined,
      portName: data.portName,
      terminal: data.terminal || undefined,
      berth: data.berth || undefined,
      scheduledArrival: data.scheduledArrival ? new Date(data.scheduledArrival).toISOString() : undefined,
      scheduledDeparture: data.scheduledDeparture ? new Date(data.scheduledDeparture).toISOString() : undefined,
      actualArrival: data.actualArrival ? new Date(data.actualArrival).toISOString() : undefined,
      actualDeparture: data.actualDeparture ? new Date(data.actualDeparture).toISOString() : undefined,
      cargoCutoff: data.cargoCutoff ? new Date(data.cargoCutoff).toISOString() : undefined,
      docCutoff: data.docCutoff ? new Date(data.docCutoff).toISOString() : undefined,
      vgmCutoff: data.vgmCutoff ? new Date(data.vgmCutoff).toISOString() : undefined,
      status: (data.status as ScheduleStatus) || 'scheduled',
      delayReason: data.delayReason || undefined,
      notes: data.notes || undefined,
    };

    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-red-800">Please fix the following errors:</p>
                <ul className="list-disc list-inside text-sm text-red-700 mt-1">
                  {validationErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="voyage" className="flex items-center gap-2">
            <Ship className="h-4 w-4" />
            Voyage Info
          </TabsTrigger>
          <TabsTrigger value="schedule" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Schedule
          </TabsTrigger>
          <TabsTrigger value="cutoffs" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Cutoffs
          </TabsTrigger>
        </TabsList>

        {/* Voyage Info Tab */}
        <TabsContent value="voyage" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Vessel & Voyage</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="vesselId">Vessel *</Label>
                <Select
                  value={watchedVesselId || ''}
                  onValueChange={(value) => setValue('vesselId', value)}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select vessel" />
                  </SelectTrigger>
                  <SelectContent>
                    {vessels.map((vessel) => (
                      <SelectItem key={vessel.id} value={vessel.id}>
                        {vessel.vesselName}
                        {vessel.imoNumber && ` (IMO: ${vessel.imoNumber})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.vesselId && (
                  <p className="text-sm text-destructive">{errors.vesselId.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="voyageNumber">Voyage Number *</Label>
                <Input
                  id="voyageNumber"
                  {...register('voyageNumber')}
                  placeholder="e.g., 2401E"
                  disabled={isLoading}
                />
                {errors.voyageNumber && (
                  <p className="text-sm text-destructive">{errors.voyageNumber.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="scheduleType">Schedule Type</Label>
                <Select
                  value={watchedScheduleType || 'scheduled'}
                  onValueChange={(value) => setValue('scheduleType', value)}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {SCHEDULE_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {SCHEDULE_TYPE_LABELS[type]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={watchedStatus || 'scheduled'}
                  onValueChange={(value) => setValue('status', value)}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {SCHEDULE_STATUSES.map((status) => (
                      <SelectItem key={status} value={status}>
                        {SCHEDULE_STATUS_LABELS[status]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="serviceName">Service Name</Label>
                <Input
                  id="serviceName"
                  {...register('serviceName')}
                  placeholder="e.g., Asia-Europe Express"
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="serviceCode">Service Code</Label>
                <Input
                  id="serviceCode"
                  {...register('serviceCode')}
                  placeholder="e.g., AEX"
                  disabled={isLoading}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Port Call Details
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="portId">Port (from database)</Label>
                <Select
                  value={watchedPortId || '__none__'}
                  onValueChange={(v) => handlePortChange(v === '__none__' ? '' : v)}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select port (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Manual entry</SelectItem>
                    {ports.map((port) => (
                      <SelectItem key={port.id} value={port.id}>
                        {port.portName} ({port.portCode})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Select from database or enter manually below
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="portName">Port Name *</Label>
                <Input
                  id="portName"
                  {...register('portName')}
                  placeholder="e.g., Singapore"
                  disabled={isLoading}
                />
                {errors.portName && (
                  <p className="text-sm text-destructive">{errors.portName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="terminal">Terminal</Label>
                <Input
                  id="terminal"
                  {...register('terminal')}
                  placeholder="e.g., PSA Terminal"
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="berth">Berth</Label>
                <Input
                  id="berth"
                  {...register('berth')}
                  placeholder="e.g., Berth 12"
                  disabled={isLoading}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Schedule Tab */}
        <TabsContent value="schedule" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Arrival Times</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="scheduledArrival">Scheduled Arrival (ETA)</Label>
                <Input
                  id="scheduledArrival"
                  type="datetime-local"
                  {...register('scheduledArrival')}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="actualArrival">Actual Arrival (ATA)</Label>
                <Input
                  id="actualArrival"
                  type="datetime-local"
                  {...register('actualArrival')}
                  disabled={isLoading}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Departure Times</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="scheduledDeparture">Scheduled Departure (ETD)</Label>
                <Input
                  id="scheduledDeparture"
                  type="datetime-local"
                  {...register('scheduledDeparture')}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="actualDeparture">Actual Departure (ATD)</Label>
                <Input
                  id="actualDeparture"
                  type="datetime-local"
                  {...register('actualDeparture')}
                  disabled={isLoading}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Delay Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="delayReason">Delay Reason</Label>
                <Textarea
                  id="delayReason"
                  {...register('delayReason')}
                  placeholder="Reason for delay (if applicable)"
                  rows={2}
                  disabled={isLoading}
                />
                <p className="text-xs text-muted-foreground">
                  Delay hours are calculated automatically when actual times differ from scheduled times
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cutoffs Tab */}
        <TabsContent value="cutoffs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Cutoff Times</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="cargoCutoff">Cargo Cutoff</Label>
                <Input
                  id="cargoCutoff"
                  type="datetime-local"
                  {...register('cargoCutoff')}
                  disabled={isLoading}
                />
                <p className="text-xs text-muted-foreground">
                  Deadline for cargo delivery
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="docCutoff">Documentation Cutoff</Label>
                <Input
                  id="docCutoff"
                  type="datetime-local"
                  {...register('docCutoff')}
                  disabled={isLoading}
                />
                <p className="text-xs text-muted-foreground">
                  Deadline for shipping instructions
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="vgmCutoff">VGM Cutoff</Label>
                <Input
                  id="vgmCutoff"
                  type="datetime-local"
                  {...register('vgmCutoff')}
                  disabled={isLoading}
                />
                <p className="text-xs text-muted-foreground">
                  Verified Gross Mass deadline
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  {...register('notes')}
                  placeholder="Any additional notes about this port call..."
                  rows={3}
                  disabled={isLoading}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Form Actions */}
      <div className="flex justify-end gap-4 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {mode === 'create' ? 'Create Schedule' : 'Update Schedule'}
        </Button>
      </div>
    </form>
  );
}
