'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  RouteSurveyWithRelations,
  FeasibilityAssessment,
  Feasibility,
  EscortType,
  PermitRequirement,
} from '@/types/survey';
import { FEASIBILITY_LABELS } from '@/lib/survey-utils';
import { completeSurvey } from '@/lib/survey-actions';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface FeasibilityFormProps {
  survey: RouteSurveyWithRelations;
  onClose: () => void;
  onSuccess: () => void;
}

export function FeasibilityForm({ survey, onClose, onSuccess }: FeasibilityFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FeasibilityAssessment>({
    feasibility: survey.feasibility || 'feasible',
    feasibilityNotes: survey.feasibilityNotes || '',
    routeDistanceKm: survey.routeDistanceKm || 0,
    estimatedTravelTimeHours: survey.estimatedTravelTimeHours || 0,
    permitsRequired: survey.permitsRequired || [],
    escortRequired: survey.escortRequired || false,
    escortType: survey.escortType,
    escortVehiclesCount: survey.escortVehiclesCount,
    travelTimeRestrictions: survey.travelTimeRestrictions || '',
    surveyCost: survey.surveyCost,
    permitCostEstimate: survey.permitCostEstimate,
    escortCostEstimate: survey.escortCostEstimate,
    roadRepairCostEstimate: survey.roadRepairCostEstimate,
    totalRouteCostEstimate: survey.totalRouteCostEstimate || 0,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Calculate total cost
      const totalCost =
        (formData.surveyCost || 0) +
        (formData.permitCostEstimate || 0) +
        (formData.escortCostEstimate || 0) +
        (formData.roadRepairCostEstimate || 0);

      const result = await completeSurvey(survey.id, {
        ...formData,
        totalRouteCostEstimate: totalCost,
      });

      if (result.success) {
        toast.success('Survey completed successfully');
        onSuccess();
      } else {
        toast.error(result.error || 'Failed to complete survey');
      }
    } catch {
      toast.error('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof FeasibilityAssessment, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNumberChange = (field: keyof FeasibilityAssessment, value: string) => {
    const numValue = value === '' ? undefined : parseFloat(value);
    handleChange(field, numValue);
  };

  const addPermit = () => {
    const newPermit: PermitRequirement = {
      type: '',
      authority: '',
      estimatedDays: 0,
      estimatedCost: 0,
    };
    handleChange('permitsRequired', [...formData.permitsRequired, newPermit]);
  };

  const updatePermit = (index: number, field: keyof PermitRequirement, value: unknown) => {
    const updated = [...formData.permitsRequired];
    updated[index] = { ...updated[index], [field]: value };
    handleChange('permitsRequired', updated);
  };

  const removePermit = (index: number) => {
    const updated = formData.permitsRequired.filter((_, i) => i !== index);
    handleChange('permitsRequired', updated);
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Complete Survey - Feasibility Assessment</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Feasibility */}
          <Card>
            <CardHeader>
              <CardTitle>Feasibility Assessment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Feasibility *</Label>
                <Select
                  value={formData.feasibility}
                  onValueChange={(v) => handleChange('feasibility', v as Feasibility)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(FEASIBILITY_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="feasibilityNotes">Notes *</Label>
                <Textarea
                  id="feasibilityNotes"
                  value={formData.feasibilityNotes}
                  onChange={(e) => handleChange('feasibilityNotes', e.target.value)}
                  placeholder="Describe the route feasibility assessment..."
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Route Details */}
          <Card>
            <CardHeader>
              <CardTitle>Route Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="routeDistanceKm">Distance (km) *</Label>
                  <Input
                    id="routeDistanceKm"
                    type="number"
                    step="0.1"
                    min="0"
                    value={formData.routeDistanceKm || ''}
                    onChange={(e) => handleNumberChange('routeDistanceKm', e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="estimatedTravelTimeHours">Est. Travel Time (hours) *</Label>
                  <Input
                    id="estimatedTravelTimeHours"
                    type="number"
                    step="0.5"
                    min="0"
                    value={formData.estimatedTravelTimeHours || ''}
                    onChange={(e) => handleNumberChange('estimatedTravelTimeHours', e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="travelTimeRestrictions">Travel Time Restrictions</Label>
                <Textarea
                  id="travelTimeRestrictions"
                  value={formData.travelTimeRestrictions}
                  onChange={(e) => handleChange('travelTimeRestrictions', e.target.value)}
                  placeholder="e.g., Night travel only, Avoid rush hours..."
                />
              </div>
            </CardContent>
          </Card>

          {/* Escort Requirements */}
          <Card>
            <CardHeader>
              <CardTitle>Escort Requirements</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Switch
                  id="escortRequired"
                  checked={formData.escortRequired}
                  onCheckedChange={(v) => handleChange('escortRequired', v)}
                />
                <Label htmlFor="escortRequired">Escort Required</Label>
              </div>
              {formData.escortRequired && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Escort Type</Label>
                    <Select
                      value={formData.escortType || 'police'}
                      onValueChange={(v) => handleChange('escortType', v as EscortType)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="police">Police</SelectItem>
                        <SelectItem value="private">Private</SelectItem>
                        <SelectItem value="both">Both</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="escortVehiclesCount">Number of Vehicles</Label>
                    <Input
                      id="escortVehiclesCount"
                      type="number"
                      min="1"
                      value={formData.escortVehiclesCount || ''}
                      onChange={(e) => handleNumberChange('escortVehiclesCount', e.target.value)}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Permits */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Required Permits</CardTitle>
              <Button type="button" variant="outline" size="sm" onClick={addPermit}>
                <Plus className="h-4 w-4 mr-1" /> Add Permit
              </Button>
            </CardHeader>
            <CardContent>
              {formData.permitsRequired.length === 0 ? (
                <p className="text-sm text-muted-foreground">No permits added.</p>
              ) : (
                <div className="space-y-4">
                  {formData.permitsRequired.map((permit, index) => (
                    <div key={index} className="grid grid-cols-5 gap-2 items-end border p-3 rounded">
                      <div className="space-y-1">
                        <Label className="text-xs">Type</Label>
                        <Input
                          value={permit.type}
                          onChange={(e) => updatePermit(index, 'type', e.target.value)}
                          placeholder="e.g., Oversize"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Authority</Label>
                        <Input
                          value={permit.authority}
                          onChange={(e) => updatePermit(index, 'authority', e.target.value)}
                          placeholder="e.g., LLAJ"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Days</Label>
                        <Input
                          type="number"
                          min="0"
                          value={permit.estimatedDays || ''}
                          onChange={(e) => updatePermit(index, 'estimatedDays', parseInt(e.target.value) || 0)}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Cost (IDR)</Label>
                        <Input
                          type="number"
                          min="0"
                          value={permit.estimatedCost || ''}
                          onChange={(e) => updatePermit(index, 'estimatedCost', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <Button type="button" variant="ghost" size="icon" onClick={() => removePermit(index)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Cost Estimates */}
          <Card>
            <CardHeader>
              <CardTitle>Cost Estimates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="surveyCost">Survey Cost (IDR)</Label>
                  <Input
                    id="surveyCost"
                    type="number"
                    min="0"
                    value={formData.surveyCost || ''}
                    onChange={(e) => handleNumberChange('surveyCost', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="permitCostEstimate">Permit Cost (IDR)</Label>
                  <Input
                    id="permitCostEstimate"
                    type="number"
                    min="0"
                    value={formData.permitCostEstimate || ''}
                    onChange={(e) => handleNumberChange('permitCostEstimate', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="escortCostEstimate">Escort Cost (IDR)</Label>
                  <Input
                    id="escortCostEstimate"
                    type="number"
                    min="0"
                    value={formData.escortCostEstimate || ''}
                    onChange={(e) => handleNumberChange('escortCostEstimate', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="roadRepairCostEstimate">Road Repair Cost (IDR)</Label>
                  <Input
                    id="roadRepairCostEstimate"
                    type="number"
                    min="0"
                    value={formData.roadRepairCostEstimate || ''}
                    onChange={(e) => handleNumberChange('roadRepairCostEstimate', e.target.value)}
                  />
                </div>
              </div>
              <div className="mt-4 p-3 bg-muted rounded">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Total Estimated Cost:</span>
                  <span className="text-lg font-bold">
                    IDR {(
                      (formData.surveyCost || 0) +
                      (formData.permitCostEstimate || 0) +
                      (formData.escortCostEstimate || 0) +
                      (formData.roadRepairCostEstimate || 0)
                    ).toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Complete Survey
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
