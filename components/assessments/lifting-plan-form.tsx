'use client';

// components/assessments/lifting-plan-form.tsx
// Lifting Plan form for Technical Assessments (v0.58)

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Loader2 } from 'lucide-react';
import { LiftingPlan, CreateLiftingPlanInput } from '@/types/assessment';
import { createLiftingPlan, updateLiftingPlan } from '@/lib/assessment-actions';

interface LiftingPlanFormProps {
  assessmentId: string;
  liftingPlan?: LiftingPlan;
  onSuccess: () => void;
  onCancel: () => void;
}

export function LiftingPlanForm({
  assessmentId,
  liftingPlan,
  onSuccess,
  onCancel,
}: LiftingPlanFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    lift_description: liftingPlan?.lift_description || '',
    load_weight_tons: liftingPlan?.load_weight_tons?.toString() || '',
    rigging_weight_tons: liftingPlan?.rigging_weight_tons?.toString() || '0',
    crane_type: liftingPlan?.crane_type || '',
    crane_capacity_tons: liftingPlan?.crane_capacity_tons?.toString() || '',
    crane_radius_m: liftingPlan?.crane_radius_m?.toString() || '',
    crane_boom_length_m: liftingPlan?.crane_boom_length_m?.toString() || '',
    crane_capacity_at_radius_tons: liftingPlan?.crane_capacity_at_radius_tons?.toString() || '',
    rigging_configuration: liftingPlan?.rigging_configuration || '',
    sling_type: liftingPlan?.sling_type || '',
    sling_capacity_tons: liftingPlan?.sling_capacity_tons?.toString() || '',
    sling_quantity: liftingPlan?.sling_quantity?.toString() || '',
    spreader_beam: liftingPlan?.spreader_beam || false,
    spreader_capacity_tons: liftingPlan?.spreader_capacity_tons?.toString() || '',
    crane_position: liftingPlan?.crane_position || '',
    load_pickup_position: liftingPlan?.load_pickup_position || '',
    load_set_position: liftingPlan?.load_set_position || '',
    ground_bearing_required_kpa: liftingPlan?.ground_bearing_required_kpa?.toString() || '',
    ground_preparation: liftingPlan?.ground_preparation || '',
    outrigger_mats: liftingPlan?.outrigger_mats ?? true,
    mat_size: liftingPlan?.mat_size || '',
    notes: liftingPlan?.notes || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const input: CreateLiftingPlanInput = {
        assessment_id: assessmentId,
        lift_description: formData.lift_description || undefined,
        load_weight_tons: parseFloat(formData.load_weight_tons),
        rigging_weight_tons: parseFloat(formData.rigging_weight_tons) || 0,
        crane_type: formData.crane_type || undefined,
        crane_capacity_tons: formData.crane_capacity_tons ? parseFloat(formData.crane_capacity_tons) : undefined,
        crane_radius_m: formData.crane_radius_m ? parseFloat(formData.crane_radius_m) : undefined,
        crane_boom_length_m: formData.crane_boom_length_m ? parseFloat(formData.crane_boom_length_m) : undefined,
        crane_capacity_at_radius_tons: formData.crane_capacity_at_radius_tons ? parseFloat(formData.crane_capacity_at_radius_tons) : undefined,
        rigging_configuration: formData.rigging_configuration || undefined,
        sling_type: formData.sling_type || undefined,
        sling_capacity_tons: formData.sling_capacity_tons ? parseFloat(formData.sling_capacity_tons) : undefined,
        sling_quantity: formData.sling_quantity ? parseInt(formData.sling_quantity) : undefined,
        spreader_beam: formData.spreader_beam,
        spreader_capacity_tons: formData.spreader_capacity_tons ? parseFloat(formData.spreader_capacity_tons) : undefined,
        crane_position: formData.crane_position || undefined,
        load_pickup_position: formData.load_pickup_position || undefined,
        load_set_position: formData.load_set_position || undefined,
        ground_bearing_required_kpa: formData.ground_bearing_required_kpa ? parseFloat(formData.ground_bearing_required_kpa) : undefined,
        ground_preparation: formData.ground_preparation || undefined,
        outrigger_mats: formData.outrigger_mats,
        mat_size: formData.mat_size || undefined,
        notes: formData.notes || undefined,
      };

      let result;
      if (liftingPlan) {
        result = await updateLiftingPlan(liftingPlan.id, input);
      } else {
        result = await createLiftingPlan(input);
      }

      if (!result.success) {
        setError(result.error || 'Failed to save lifting plan');
        return;
      }

      onSuccess();
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
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
          {error}
        </div>
      )}

      {/* Load Data */}
      <div className="space-y-4">
        <h4 className="font-medium">Load Data</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="load_weight_tons">Load Weight (tons) *</Label>
            <Input
              id="load_weight_tons"
              type="number"
              step="0.01"
              min="0"
              value={formData.load_weight_tons}
              onChange={(e) => setFormData({ ...formData, load_weight_tons: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="rigging_weight_tons">Rigging Weight (tons)</Label>
            <Input
              id="rigging_weight_tons"
              type="number"
              step="0.01"
              min="0"
              value={formData.rigging_weight_tons}
              onChange={(e) => setFormData({ ...formData, rigging_weight_tons: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lift_description">Lift Description</Label>
            <Input
              id="lift_description"
              value={formData.lift_description}
              onChange={(e) => setFormData({ ...formData, lift_description: e.target.value })}
              placeholder="e.g., Main lift - crane installation"
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* Crane Selection */}
      <div className="space-y-4">
        <h4 className="font-medium">Crane Selection</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="crane_type">Crane Type</Label>
            <Input
              id="crane_type"
              value={formData.crane_type}
              onChange={(e) => setFormData({ ...formData, crane_type: e.target.value })}
              placeholder="e.g., Liebherr LTM 1300-6.2"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="crane_capacity_tons">Crane Capacity (tons)</Label>
            <Input
              id="crane_capacity_tons"
              type="number"
              step="0.01"
              min="0"
              value={formData.crane_capacity_tons}
              onChange={(e) => setFormData({ ...formData, crane_capacity_tons: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="crane_radius_m">Working Radius (m)</Label>
            <Input
              id="crane_radius_m"
              type="number"
              step="0.1"
              min="0"
              value={formData.crane_radius_m}
              onChange={(e) => setFormData({ ...formData, crane_radius_m: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="crane_boom_length_m">Boom Length (m)</Label>
            <Input
              id="crane_boom_length_m"
              type="number"
              step="0.1"
              min="0"
              value={formData.crane_boom_length_m}
              onChange={(e) => setFormData({ ...formData, crane_boom_length_m: e.target.value })}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="crane_capacity_at_radius_tons">Capacity at Radius (tons)</Label>
            <Input
              id="crane_capacity_at_radius_tons"
              type="number"
              step="0.01"
              min="0"
              value={formData.crane_capacity_at_radius_tons}
              onChange={(e) => setFormData({ ...formData, crane_capacity_at_radius_tons: e.target.value })}
              placeholder="Crane capacity at the specified working radius"
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* Rigging Configuration */}
      <div className="space-y-4">
        <h4 className="font-medium">Rigging Configuration</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="rigging_configuration">Configuration</Label>
            <Input
              id="rigging_configuration"
              value={formData.rigging_configuration}
              onChange={(e) => setFormData({ ...formData, rigging_configuration: e.target.value })}
              placeholder="e.g., 4-point lift"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sling_type">Sling Type</Label>
            <Input
              id="sling_type"
              value={formData.sling_type}
              onChange={(e) => setFormData({ ...formData, sling_type: e.target.value })}
              placeholder="e.g., Wire rope sling"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sling_capacity_tons">Sling Capacity (tons)</Label>
            <Input
              id="sling_capacity_tons"
              type="number"
              step="0.01"
              min="0"
              value={formData.sling_capacity_tons}
              onChange={(e) => setFormData({ ...formData, sling_capacity_tons: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sling_quantity">Sling Quantity</Label>
            <Input
              id="sling_quantity"
              type="number"
              min="1"
              value={formData.sling_quantity}
              onChange={(e) => setFormData({ ...formData, sling_quantity: e.target.value })}
            />
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="spreader_beam"
              checked={formData.spreader_beam}
              onCheckedChange={(checked) => setFormData({ ...formData, spreader_beam: !!checked })}
            />
            <Label htmlFor="spreader_beam">Spreader Beam Required</Label>
          </div>
          {formData.spreader_beam && (
            <div className="space-y-2">
              <Label htmlFor="spreader_capacity_tons">Spreader Capacity (tons)</Label>
              <Input
                id="spreader_capacity_tons"
                type="number"
                step="0.01"
                min="0"
                value={formData.spreader_capacity_tons}
                onChange={(e) => setFormData({ ...formData, spreader_capacity_tons: e.target.value })}
              />
            </div>
          )}
        </div>
      </div>

      <Separator />

      {/* Ground Requirements */}
      <div className="space-y-4">
        <h4 className="font-medium">Ground Requirements</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="ground_bearing_required_kpa">Ground Bearing Required (kPa)</Label>
            <Input
              id="ground_bearing_required_kpa"
              type="number"
              step="1"
              min="0"
              value={formData.ground_bearing_required_kpa}
              onChange={(e) => setFormData({ ...formData, ground_bearing_required_kpa: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ground_preparation">Ground Preparation</Label>
            <Input
              id="ground_preparation"
              value={formData.ground_preparation}
              onChange={(e) => setFormData({ ...formData, ground_preparation: e.target.value })}
              placeholder="e.g., Compacted gravel"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="outrigger_mats"
              checked={formData.outrigger_mats}
              onCheckedChange={(checked) => setFormData({ ...formData, outrigger_mats: !!checked })}
            />
            <Label htmlFor="outrigger_mats">Outrigger Mats Required</Label>
          </div>
          {formData.outrigger_mats && (
            <div className="space-y-2">
              <Label htmlFor="mat_size">Mat Size</Label>
              <Input
                id="mat_size"
                value={formData.mat_size}
                onChange={(e) => setFormData({ ...formData, mat_size: e.target.value })}
                placeholder="e.g., 2m x 2m x 200mm"
              />
            </div>
          )}
        </div>
      </div>

      <Separator />

      {/* Notes */}
      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Additional notes or comments"
          rows={3}
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            liftingPlan ? 'Update Lift' : 'Add Lift'
          )}
        </Button>
      </div>
    </form>
  );
}
