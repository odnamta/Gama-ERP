'use client';

// components/assessments/axle-calc-form.tsx
// Form for creating/editing Axle Load Calculations (v0.58)

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { AxleLoadCalculation, CreateAxleCalcInput } from '@/types/assessment';
import { createAxleCalculation, updateAxleCalculation } from '@/lib/assessment-actions';

interface AxleCalcFormProps {
  assessmentId: string;
  axleCalculation?: AxleLoadCalculation;
  onSuccess: () => void;
  onCancel: () => void;
}

const TRAILER_TYPES = [
  { value: 'lowbed', label: 'Lowbed' },
  { value: 'flatbed', label: 'Flatbed' },
  { value: 'modular', label: 'Modular Trailer' },
  { value: 'extendable', label: 'Extendable' },
  { value: 'dolly', label: 'Dolly' },
  { value: 'other', label: 'Other' },
];

const PRIME_MOVER_TYPES = [
  { value: '6x4', label: '6x4 Prime Mover' },
  { value: '6x6', label: '6x6 Prime Mover' },
  { value: '8x4', label: '8x4 Prime Mover' },
  { value: '8x6', label: '8x6 Prime Mover' },
  { value: '10x4', label: '10x4 Prime Mover' },
  { value: 'other', label: 'Other' },
];

export function AxleCalcForm({
  assessmentId,
  axleCalculation,
  onSuccess,
  onCancel,
}: AxleCalcFormProps) {
  const isEditing = !!axleCalculation;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [configurationName, setConfigurationName] = useState(axleCalculation?.configuration_name || '');
  const [trailerType, setTrailerType] = useState(axleCalculation?.trailer_type || '');
  const [trailerAxleCount, setTrailerAxleCount] = useState(axleCalculation?.trailer_axle_count?.toString() || '');
  const [trailerAxleSpacing, setTrailerAxleSpacing] = useState(axleCalculation?.trailer_axle_spacing_m?.toString() || '');
  const [trailerTareWeight, setTrailerTareWeight] = useState(axleCalculation?.trailer_tare_weight_tons?.toString() || '');
  const [primeMoverType, setPrimeMoverType] = useState(axleCalculation?.prime_mover_type || '');
  const [primeMoverAxleCount, setPrimeMoverAxleCount] = useState(axleCalculation?.prime_mover_axle_count?.toString() || '');
  const [primeMoverWeight, setPrimeMoverWeight] = useState(axleCalculation?.prime_mover_weight_tons?.toString() || '');
  const [cargoWeight, setCargoWeight] = useState(axleCalculation?.cargo_weight_tons?.toString() || '');
  const [cargoCogFromFront, setCargoCogFromFront] = useState(axleCalculation?.cargo_cog_from_front_m?.toString() || '');
  const [notes, setNotes] = useState(axleCalculation?.notes || '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const input: CreateAxleCalcInput = {
        assessment_id: assessmentId,
        configuration_name: configurationName || undefined,
        trailer_type: trailerType || undefined,
        trailer_axle_count: trailerAxleCount ? parseInt(trailerAxleCount) : undefined,
        trailer_axle_spacing_m: trailerAxleSpacing ? parseFloat(trailerAxleSpacing) : undefined,
        trailer_tare_weight_tons: trailerTareWeight ? parseFloat(trailerTareWeight) : undefined,
        prime_mover_type: primeMoverType || undefined,
        prime_mover_axle_count: primeMoverAxleCount ? parseInt(primeMoverAxleCount) : undefined,
        prime_mover_weight_tons: primeMoverWeight ? parseFloat(primeMoverWeight) : undefined,
        cargo_weight_tons: cargoWeight ? parseFloat(cargoWeight) : 0,
        cargo_cog_from_front_m: cargoCogFromFront ? parseFloat(cargoCogFromFront) : undefined,
        notes: notes || undefined,
      };

      let result;
      if (isEditing && axleCalculation) {
        result = await updateAxleCalculation(axleCalculation.id, input);
      } else {
        result = await createAxleCalculation(input);
      }

      if (result.success) {
        onSuccess();
      } else {
        setError(result.error || 'Failed to save axle calculation');
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
          {error}
        </div>
      )}

      {/* Configuration Name */}
      <div className="space-y-2">
        <Label htmlFor="configurationName">Configuration Name</Label>
        <Input
          id="configurationName"
          value={configurationName}
          onChange={(e) => setConfigurationName(e.target.value)}
          placeholder="e.g., Option A - 6-axle lowbed"
        />
      </div>

      {/* Trailer Section */}
      <div className="space-y-4">
        <h4 className="font-medium border-b pb-2">Trailer Specifications</h4>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="trailerType">Trailer Type</Label>
            <Select value={trailerType} onValueChange={setTrailerType}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {TRAILER_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="trailerAxleCount">Axle Count *</Label>
            <Input
              id="trailerAxleCount"
              type="number"
              min="1"
              max="20"
              value={trailerAxleCount}
              onChange={(e) => setTrailerAxleCount(e.target.value)}
              placeholder="e.g., 6"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="trailerAxleSpacing">Axle Spacing (m)</Label>
            <Input
              id="trailerAxleSpacing"
              type="number"
              step="0.01"
              min="0"
              value={trailerAxleSpacing}
              onChange={(e) => setTrailerAxleSpacing(e.target.value)}
              placeholder="e.g., 1.5"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="trailerTareWeight">Tare Weight (tons)</Label>
            <Input
              id="trailerTareWeight"
              type="number"
              step="0.01"
              min="0"
              value={trailerTareWeight}
              onChange={(e) => setTrailerTareWeight(e.target.value)}
              placeholder="e.g., 25"
            />
          </div>
        </div>
      </div>

      {/* Prime Mover Section */}
      <div className="space-y-4">
        <h4 className="font-medium border-b pb-2">Prime Mover Specifications</h4>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="primeMoverType">Prime Mover Type</Label>
            <Select value={primeMoverType} onValueChange={setPrimeMoverType}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {PRIME_MOVER_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="primeMoverAxleCount">Axle Count *</Label>
            <Input
              id="primeMoverAxleCount"
              type="number"
              min="1"
              max="6"
              value={primeMoverAxleCount}
              onChange={(e) => setPrimeMoverAxleCount(e.target.value)}
              placeholder="e.g., 3"
              required
            />
          </div>

          <div className="space-y-2 col-span-2">
            <Label htmlFor="primeMoverWeight">Weight (tons)</Label>
            <Input
              id="primeMoverWeight"
              type="number"
              step="0.01"
              min="0"
              value={primeMoverWeight}
              onChange={(e) => setPrimeMoverWeight(e.target.value)}
              placeholder="e.g., 12"
            />
          </div>
        </div>
      </div>

      {/* Cargo Section */}
      <div className="space-y-4">
        <h4 className="font-medium border-b pb-2">Cargo</h4>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="cargoWeight">Cargo Weight (tons) *</Label>
            <Input
              id="cargoWeight"
              type="number"
              step="0.01"
              min="0"
              value={cargoWeight}
              onChange={(e) => setCargoWeight(e.target.value)}
              placeholder="e.g., 150"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cargoCogFromFront">COG from Front (m)</Label>
            <Input
              id="cargoCogFromFront"
              type="number"
              step="0.01"
              min="0"
              value={cargoCogFromFront}
              onChange={(e) => setCargoCogFromFront(e.target.value)}
              placeholder="e.g., 5.5"
            />
            <p className="text-xs text-muted-foreground">
              Center of gravity distance from front of trailer
            </p>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Additional notes about this configuration..."
          rows={3}
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {isEditing ? 'Update' : 'Add'} Configuration
        </Button>
      </div>
    </form>
  );
}
