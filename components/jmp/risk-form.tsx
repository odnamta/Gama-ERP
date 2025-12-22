'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
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
import { Badge } from '@/components/ui/badge';
import { RiskFormData, JmpRiskAssessment, RiskCategory, Likelihood, Consequence, RiskLevel } from '@/types/jmp';
import { calculateRiskLevel, getRiskLevelColor, formatRiskLevel } from '@/lib/jmp-utils';
import { Loader2 } from 'lucide-react';

interface RiskFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  risk?: JmpRiskAssessment;
  onSubmit: (data: RiskFormData) => Promise<void>;
}

const RISK_CATEGORIES: { value: RiskCategory; label: string }[] = [
  { value: 'road_condition', label: 'Road Condition' },
  { value: 'weather', label: 'Weather' },
  { value: 'traffic', label: 'Traffic' },
  { value: 'mechanical', label: 'Mechanical' },
  { value: 'security', label: 'Security' },
  { value: 'health', label: 'Health' },
  { value: 'environmental', label: 'Environmental' },
  { value: 'schedule', label: 'Schedule' },
  { value: 'permit', label: 'Permit' },
];

const LIKELIHOODS: { value: Likelihood; label: string }[] = [
  { value: 'rare', label: 'Rare' },
  { value: 'unlikely', label: 'Unlikely' },
  { value: 'possible', label: 'Possible' },
  { value: 'likely', label: 'Likely' },
  { value: 'almost_certain', label: 'Almost Certain' },
];

const CONSEQUENCES: { value: Consequence; label: string }[] = [
  { value: 'insignificant', label: 'Insignificant' },
  { value: 'minor', label: 'Minor' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'major', label: 'Major' },
  { value: 'catastrophic', label: 'Catastrophic' },
];

export function RiskForm({ open, onOpenChange, risk, onSubmit }: RiskFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<RiskFormData>({
    riskCategory: risk?.riskCategory || 'road_condition',
    riskDescription: risk?.riskDescription || '',
    likelihood: risk?.likelihood || 'possible',
    consequence: risk?.consequence || 'moderate',
    controlMeasures: risk?.controlMeasures || '',
    residualRiskLevel: risk?.residualRiskLevel,
    responsible: risk?.responsible || '',
  });
  const [calculatedRisk, setCalculatedRisk] = useState<RiskLevel>('medium');

  useEffect(() => {
    setCalculatedRisk(calculateRiskLevel(formData.likelihood, formData.consequence));
  }, [formData.likelihood, formData.consequence]);

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
          <DialogTitle>{risk ? 'Edit Risk' : 'Add Risk'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="riskCategory">Category *</Label>
            <Select
              value={formData.riskCategory}
              onValueChange={(value) => setFormData({ ...formData, riskCategory: value as RiskCategory })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RISK_CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="riskDescription">Description *</Label>
            <Textarea
              id="riskDescription"
              value={formData.riskDescription}
              onChange={(e) => setFormData({ ...formData, riskDescription: e.target.value })}
              placeholder="Describe the risk..."
              required
              rows={2}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="likelihood">Likelihood *</Label>
              <Select
                value={formData.likelihood}
                onValueChange={(value) => setFormData({ ...formData, likelihood: value as Likelihood })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LIKELIHOODS.map((l) => (
                    <SelectItem key={l.value} value={l.value}>
                      {l.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="consequence">Consequence *</Label>
              <Select
                value={formData.consequence}
                onValueChange={(value) => setFormData({ ...formData, consequence: value as Consequence })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CONSEQUENCES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Calculated Risk Level:</span>
            <Badge className={getRiskLevelColor(calculatedRisk)}>
              {formatRiskLevel(calculatedRisk)}
            </Badge>
          </div>
          <div>
            <Label htmlFor="controlMeasures">Control Measures *</Label>
            <Textarea
              id="controlMeasures"
              value={formData.controlMeasures}
              onChange={(e) => setFormData({ ...formData, controlMeasures: e.target.value })}
              placeholder="Describe control measures to mitigate this risk..."
              required
              rows={3}
            />
          </div>
          <div>
            <Label htmlFor="responsible">Responsible Person</Label>
            <Input
              id="responsible"
              value={formData.responsible || ''}
              onChange={(e) => setFormData({ ...formData, responsible: e.target.value })}
              placeholder="Who is responsible for managing this risk?"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {risk ? 'Update' : 'Add'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
