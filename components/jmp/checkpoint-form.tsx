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
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { CheckpointFormData, JmpCheckpoint, CheckpointLocationType } from '@/types/jmp';
import { Loader2 } from 'lucide-react';

interface CheckpointFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  checkpoint?: JmpCheckpoint;
  onSubmit: (data: CheckpointFormData) => Promise<void>;
}

const LOCATION_TYPES: { value: CheckpointLocationType; label: string }[] = [
  { value: 'departure', label: 'Departure Point' },
  { value: 'waypoint', label: 'Waypoint' },
  { value: 'rest_stop', label: 'Rest Stop' },
  { value: 'checkpoint', label: 'Checkpoint' },
  { value: 'fuel_stop', label: 'Fuel Stop' },
  { value: 'arrival', label: 'Arrival Point' },
];

export function CheckpointForm({ open, onOpenChange, checkpoint, onSubmit }: CheckpointFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CheckpointFormData>({
    locationName: checkpoint?.locationName || '',
    locationType: checkpoint?.locationType || 'waypoint',
    kmFromStart: checkpoint?.kmFromStart,
    coordinates: checkpoint?.coordinates || '',
    plannedArrival: checkpoint?.plannedArrival?.slice(0, 16) || '',
    plannedDeparture: checkpoint?.plannedDeparture?.slice(0, 16) || '',
    stopDurationMinutes: checkpoint?.stopDurationMinutes,
    activities: checkpoint?.activities || '',
    reportRequired: checkpoint?.reportRequired || false,
    reportTo: checkpoint?.reportTo || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(formData);
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{checkpoint ? 'Edit Checkpoint' : 'Add Checkpoint'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="locationName">Location Name *</Label>
              <Input
                id="locationName"
                value={formData.locationName}
                onChange={(e) => setFormData({ ...formData, locationName: e.target.value })}
                placeholder="e.g., Toll Gate Surabaya"
                required
              />
            </div>
            <div>
              <Label htmlFor="locationType">Type *</Label>
              <Select
                value={formData.locationType}
                onValueChange={(value) => setFormData({ ...formData, locationType: value as CheckpointLocationType })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LOCATION_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="kmFromStart">KM from Start</Label>
              <Input
                id="kmFromStart"
                type="number"
                step="0.1"
                value={formData.kmFromStart || ''}
                onChange={(e) => setFormData({ ...formData, kmFromStart: parseFloat(e.target.value) || undefined })}
              />
            </div>
            <div className="col-span-2">
              <Label htmlFor="coordinates">Coordinates</Label>
              <Input
                id="coordinates"
                value={formData.coordinates || ''}
                onChange={(e) => setFormData({ ...formData, coordinates: e.target.value })}
                placeholder="-7.2575, 112.7521"
              />
            </div>
            <div>
              <Label htmlFor="plannedArrival">Planned Arrival</Label>
              <Input
                id="plannedArrival"
                type="datetime-local"
                value={formData.plannedArrival || ''}
                onChange={(e) => setFormData({ ...formData, plannedArrival: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="plannedDeparture">Planned Departure</Label>
              <Input
                id="plannedDeparture"
                type="datetime-local"
                value={formData.plannedDeparture || ''}
                onChange={(e) => setFormData({ ...formData, plannedDeparture: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="stopDurationMinutes">Stop Duration (min)</Label>
              <Input
                id="stopDurationMinutes"
                type="number"
                value={formData.stopDurationMinutes || ''}
                onChange={(e) => setFormData({ ...formData, stopDurationMinutes: parseInt(e.target.value) || undefined })}
              />
            </div>
            <div className="col-span-2">
              <Label htmlFor="activities">Activities</Label>
              <Textarea
                id="activities"
                value={formData.activities || ''}
                onChange={(e) => setFormData({ ...formData, activities: e.target.value })}
                placeholder="Rest, refuel, driver change..."
                rows={2}
              />
            </div>
            <div className="col-span-2 flex items-center gap-2">
              <Checkbox
                id="reportRequired"
                checked={formData.reportRequired}
                onCheckedChange={(checked) => setFormData({ ...formData, reportRequired: !!checked })}
              />
              <Label htmlFor="reportRequired">Report Required</Label>
            </div>
            {formData.reportRequired && (
              <div className="col-span-2">
                <Label htmlFor="reportTo">Report To</Label>
                <Input
                  id="reportTo"
                  value={formData.reportTo || ''}
                  onChange={(e) => setFormData({ ...formData, reportTo: e.target.value })}
                  placeholder="Control room, Manager..."
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {checkpoint ? 'Update' : 'Add'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
