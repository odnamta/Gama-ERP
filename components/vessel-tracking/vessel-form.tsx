'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Ship, Ruler, Building2, AlertCircle } from 'lucide-react';
import {
  VesselFormData,
  VesselType,
  VesselStatus,
  ShippingLine,
  VESSEL_TYPES,
  VESSEL_TYPE_LABELS,
  VESSEL_STATUSES,
  VESSEL_STATUS_LABELS,
} from '@/types/agency';
import { validateIMO, validateMMSI } from '@/lib/vessel-tracking-utils';

// Form validation schema
export const vesselFormSchema = z.object({
  vesselName: z.string().min(1, 'Vessel name is required'),
  imoNumber: z.string().optional().refine(
    (val) => !val || /^\d{7}$/.test(val),
    { message: 'IMO number must be exactly 7 digits' }
  ),
  mmsi: z.string().optional().refine(
    (val) => !val || /^\d{9}$/.test(val),
    { message: 'MMSI must be exactly 9 digits' }
  ),
  vesselType: z.string().optional(),
  flag: z.string().optional(),
  callSign: z.string().optional(),
  lengthM: z.coerce.number().min(0).optional().or(z.literal('')),
  beamM: z.coerce.number().min(0).optional().or(z.literal('')),
  draftM: z.coerce.number().min(0).optional().or(z.literal('')),
  grossTonnage: z.coerce.number().min(0).optional().or(z.literal('')),
  deadweightTons: z.coerce.number().min(0).optional().or(z.literal('')),
  teuCapacity: z.coerce.number().min(0).optional().or(z.literal('')),
  owner: z.string().optional(),
  operator: z.string().optional(),
  shippingLineId: z.string().optional(),
  currentStatus: z.string().optional(),
  lastPort: z.string().optional(),
  nextPort: z.string().optional(),
});

export type VesselFormValues = z.infer<typeof vesselFormSchema>;

interface VesselFormProps {
  initialData?: VesselFormData | null;
  shippingLines: ShippingLine[];
  onSubmit: (data: VesselFormData) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
  mode: 'create' | 'edit';
}

/**
 * Form for creating and editing vessels.
 * Includes validation for IMO and MMSI formats.
 * 
 * **Requirements: 1.1-1.5**
 */
export function VesselForm({
  initialData,
  shippingLines,
  onSubmit,
  onCancel,
  isLoading,
  mode,
}: VesselFormProps) {
  const [activeTab, setActiveTab] = useState('identification');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<VesselFormValues>({
    resolver: zodResolver(vesselFormSchema) as never,
    defaultValues: {
      vesselName: initialData?.vesselName || '',
      imoNumber: initialData?.imoNumber || '',
      mmsi: initialData?.mmsi || '',
      vesselType: initialData?.vesselType || '',
      flag: initialData?.flag || '',
      callSign: initialData?.callSign || '',
      lengthM: initialData?.lengthM || '',
      beamM: initialData?.beamM || '',
      draftM: initialData?.draftM || '',
      grossTonnage: initialData?.grossTonnage || '',
      deadweightTons: initialData?.deadweightTons || '',
      teuCapacity: initialData?.teuCapacity || '',
      owner: initialData?.owner || '',
      operator: initialData?.operator || '',
      shippingLineId: initialData?.shippingLineId || '',
      currentStatus: initialData?.currentStatus || '',
      lastPort: initialData?.lastPort || '',
      nextPort: initialData?.nextPort || '',
    },
  });

  const watchedVesselType = watch('vesselType');
  const watchedCurrentStatus = watch('currentStatus');
  const watchedShippingLineId = watch('shippingLineId');

  const handleFormSubmit = async (data: VesselFormValues) => {
    setValidationErrors([]);
    const errors: string[] = [];

    // Validate IMO if provided
    if (data.imoNumber) {
      const imoValidation = validateIMO(data.imoNumber);
      if (!imoValidation.isValid) {
        errors.push(...imoValidation.errors.map(e => e.message));
      }
    }

    // Validate MMSI if provided
    if (data.mmsi) {
      const mmsiValidation = validateMMSI(data.mmsi);
      if (!mmsiValidation.isValid) {
        errors.push(...mmsiValidation.errors.map(e => e.message));
      }
    }

    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    const formData: VesselFormData = {
      vesselName: data.vesselName,
      imoNumber: data.imoNumber || undefined,
      mmsi: data.mmsi || undefined,
      vesselType: (data.vesselType as VesselType) || undefined,
      flag: data.flag || undefined,
      callSign: data.callSign || undefined,
      lengthM: data.lengthM ? Number(data.lengthM) : undefined,
      beamM: data.beamM ? Number(data.beamM) : undefined,
      draftM: data.draftM ? Number(data.draftM) : undefined,
      grossTonnage: data.grossTonnage ? Number(data.grossTonnage) : undefined,
      deadweightTons: data.deadweightTons ? Number(data.deadweightTons) : undefined,
      teuCapacity: data.teuCapacity ? Number(data.teuCapacity) : undefined,
      owner: data.owner || undefined,
      operator: data.operator || undefined,
      shippingLineId: data.shippingLineId || undefined,
      currentStatus: (data.currentStatus as VesselStatus) || undefined,
      lastPort: data.lastPort || undefined,
      nextPort: data.nextPort || undefined,
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
          <TabsTrigger value="identification" className="flex items-center gap-2">
            <Ship className="h-4 w-4" />
            Identification
          </TabsTrigger>
          <TabsTrigger value="specifications" className="flex items-center gap-2">
            <Ruler className="h-4 w-4" />
            Specifications
          </TabsTrigger>
          <TabsTrigger value="ownership" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Ownership
          </TabsTrigger>
        </TabsList>

        {/* Identification Tab */}
        <TabsContent value="identification" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Vessel Identity</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="vesselName">Vessel Name *</Label>
                <Input
                  id="vesselName"
                  {...register('vesselName')}
                  placeholder="e.g., MSC OSCAR"
                  disabled={isLoading}
                />
                {errors.vesselName && (
                  <p className="text-sm text-destructive">{errors.vesselName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="vesselType">Vessel Type</Label>
                <Select
                  value={watchedVesselType || ''}
                  onValueChange={(value) => setValue('vesselType', value)}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select vessel type" />
                  </SelectTrigger>
                  <SelectContent>
                    {VESSEL_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {VESSEL_TYPE_LABELS[type]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="imoNumber">IMO Number</Label>
                <Input
                  id="imoNumber"
                  {...register('imoNumber')}
                  placeholder="7 digits (e.g., 9321483)"
                  maxLength={7}
                  disabled={isLoading}
                />
                {errors.imoNumber && (
                  <p className="text-sm text-destructive">{errors.imoNumber.message}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  International Maritime Organization unique identifier
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="mmsi">MMSI</Label>
                <Input
                  id="mmsi"
                  {...register('mmsi')}
                  placeholder="9 digits (e.g., 123456789)"
                  maxLength={9}
                  disabled={isLoading}
                />
                {errors.mmsi && (
                  <p className="text-sm text-destructive">{errors.mmsi.message}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Maritime Mobile Service Identity for radio identification
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="callSign">Call Sign</Label>
                <Input
                  id="callSign"
                  {...register('callSign')}
                  placeholder="e.g., 3FQP9"
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="flag">Flag State</Label>
                <Input
                  id="flag"
                  {...register('flag')}
                  placeholder="e.g., Panama"
                  disabled={isLoading}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Current Status</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="currentStatus">Status</Label>
                <Select
                  value={watchedCurrentStatus || ''}
                  onValueChange={(value) => setValue('currentStatus', value)}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {VESSEL_STATUSES.map((status) => (
                      <SelectItem key={status} value={status}>
                        {VESSEL_STATUS_LABELS[status]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastPort">Last Port</Label>
                <Input
                  id="lastPort"
                  {...register('lastPort')}
                  placeholder="e.g., Singapore"
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nextPort">Next Port</Label>
                <Input
                  id="nextPort"
                  {...register('nextPort')}
                  placeholder="e.g., Jakarta"
                  disabled={isLoading}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Specifications Tab */}
        <TabsContent value="specifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Dimensions</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="lengthM">Length (m)</Label>
                <Input
                  id="lengthM"
                  type="number"
                  min="0"
                  step="0.01"
                  {...register('lengthM')}
                  placeholder="e.g., 395.4"
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="beamM">Beam (m)</Label>
                <Input
                  id="beamM"
                  type="number"
                  min="0"
                  step="0.01"
                  {...register('beamM')}
                  placeholder="e.g., 59.0"
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="draftM">Draft (m)</Label>
                <Input
                  id="draftM"
                  type="number"
                  min="0"
                  step="0.01"
                  {...register('draftM')}
                  placeholder="e.g., 16.0"
                  disabled={isLoading}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Capacity</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="grossTonnage">Gross Tonnage (GT)</Label>
                <Input
                  id="grossTonnage"
                  type="number"
                  min="0"
                  {...register('grossTonnage')}
                  placeholder="e.g., 197362"
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="deadweightTons">Deadweight (DWT)</Label>
                <Input
                  id="deadweightTons"
                  type="number"
                  min="0"
                  {...register('deadweightTons')}
                  placeholder="e.g., 199744"
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="teuCapacity">TEU Capacity</Label>
                <Input
                  id="teuCapacity"
                  type="number"
                  min="0"
                  {...register('teuCapacity')}
                  placeholder="e.g., 19224"
                  disabled={isLoading}
                />
                <p className="text-xs text-muted-foreground">
                  Twenty-foot Equivalent Units
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Ownership Tab */}
        <TabsContent value="ownership" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Ownership & Operation</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="owner">Owner</Label>
                <Input
                  id="owner"
                  {...register('owner')}
                  placeholder="Vessel owner company"
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="operator">Operator</Label>
                <Input
                  id="operator"
                  {...register('operator')}
                  placeholder="Vessel operator company"
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="shippingLineId">Linked Shipping Line</Label>
                <Select
                  value={watchedShippingLineId || ''}
                  onValueChange={(value) => setValue('shippingLineId', value)}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select shipping line (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {shippingLines.map((line) => (
                      <SelectItem key={line.id} value={line.id}>
                        {line.lineName} ({line.lineCode})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Link this vessel to a shipping line in your database
                </p>
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
          {mode === 'create' ? 'Create Vessel' : 'Update Vessel'}
        </Button>
      </div>
    </form>
  );
}
