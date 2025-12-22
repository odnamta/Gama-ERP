'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { RecordInspectionInput, PPECondition, InspectionAction } from '@/types/ppe';
import { recordInspection } from '@/lib/ppe-actions';
import { formatCondition, formatInspectionAction } from '@/lib/ppe-utils';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface InspectionFormProps {
  issuanceId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function InspectionForm({
  issuanceId,
  open,
  onOpenChange,
  onSuccess,
}: InspectionFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<RecordInspectionInput>({
    issuance_id: issuanceId,
    inspection_date: new Date().toISOString().split('T')[0],
    condition: 'good',
    findings: null,
    action_required: 'none',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await recordInspection({
        ...formData,
        issuance_id: issuanceId,
      });
      toast.success('Inspection recorded successfully');
      onOpenChange(false);
      setFormData({
        issuance_id: issuanceId,
        inspection_date: new Date().toISOString().split('T')[0],
        condition: 'good',
        findings: null,
        action_required: 'none',
      });
      onSuccess?.();
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to record inspection');
    } finally {
      setLoading(false);
    }
  };

  const conditions: PPECondition[] = ['good', 'fair', 'poor', 'failed'];
  const actions: InspectionAction[] = ['none', 'clean', 'repair', 'replace'];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Record Inspection</DialogTitle>
          <DialogDescription>
            Record the results of a PPE inspection.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="inspection_date">Inspection Date</Label>
            <Input
              id="inspection_date"
              type="date"
              value={formData.inspection_date}
              onChange={e =>
                setFormData({ ...formData, inspection_date: e.target.value })
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="condition">Condition</Label>
            <Select
              value={formData.condition}
              onValueChange={value =>
                setFormData({ ...formData, condition: value as PPECondition })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {conditions.map(condition => (
                  <SelectItem key={condition} value={condition}>
                    {formatCondition(condition)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="findings">Findings (Optional)</Label>
            <Textarea
              id="findings"
              value={formData.findings || ''}
              onChange={e =>
                setFormData({ ...formData, findings: e.target.value || null })
              }
              placeholder="Describe any issues found..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="action_required">Action Required</Label>
            <Select
              value={formData.action_required || 'none'}
              onValueChange={value =>
                setFormData({ ...formData, action_required: value as InspectionAction })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {actions.map(action => (
                  <SelectItem key={action} value={action}>
                    {formatInspectionAction(action)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Record Inspection
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
