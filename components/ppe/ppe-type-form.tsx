'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { PPEType, CreatePPETypeInput, UpdatePPETypeInput, PPE_CATEGORIES } from '@/types/ppe';
import { createPPEType, updatePPEType } from '@/lib/ppe-actions';
import { formatPPECategory } from '@/lib/ppe-utils';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface PPETypeFormProps {
  ppeType?: PPEType | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function PPETypeForm({ ppeType, open, onOpenChange, onSuccess }: PPETypeFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreatePPETypeInput>({
    ppe_code: ppeType?.ppe_code || '',
    ppe_name: ppeType?.ppe_name || '',
    description: ppeType?.description || '',
    category: ppeType?.category || 'body',
    replacement_interval_days: ppeType?.replacement_interval_days ?? null,
    is_mandatory: ppeType?.is_mandatory || false,
    has_sizes: ppeType?.has_sizes ?? true,
    available_sizes: ppeType?.available_sizes || [],
    unit_cost: ppeType?.unit_cost ?? null,
  });
  const [sizesInput, setSizesInput] = useState(
    ppeType?.available_sizes?.join(', ') || ''
  );

  const isEditing = !!ppeType;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const sizes = sizesInput
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      const data = {
        ...formData,
        available_sizes: sizes,
      };

      if (isEditing && ppeType) {
        await updatePPEType(ppeType.id, data as UpdatePPETypeInput);
        toast.success('PPE type updated successfully');
      } else {
        await createPPEType(data);
        toast.success('PPE type created successfully');
      }

      onOpenChange(false);
      onSuccess?.();
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save PPE type');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit PPE Type' : 'Add PPE Type'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the PPE type details below.'
              : 'Enter the details for the new PPE type.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ppe_code">PPE Code</Label>
              <Input
                id="ppe_code"
                value={formData.ppe_code}
                onChange={e =>
                  setFormData({ ...formData, ppe_code: e.target.value.toUpperCase() })
                }
                placeholder="e.g., HELMET"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={value =>
                  setFormData({ ...formData, category: value as any })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {PPE_CATEGORIES.map(cat => (
                    <SelectItem key={cat} value={cat}>
                      {formatPPECategory(cat)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ppe_name">PPE Name</Label>
            <Input
              id="ppe_name"
              value={formData.ppe_name}
              onChange={e => setFormData({ ...formData, ppe_name: e.target.value })}
              placeholder="e.g., Safety Helmet"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description || ''}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="Optional description..."
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="replacement_interval">Replacement Interval (days)</Label>
              <Input
                id="replacement_interval"
                type="number"
                value={formData.replacement_interval_days ?? ''}
                onChange={e =>
                  setFormData({
                    ...formData,
                    replacement_interval_days: e.target.value
                      ? parseInt(e.target.value)
                      : null,
                  })
                }
                placeholder="e.g., 365"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit_cost">Unit Cost (IDR)</Label>
              <Input
                id="unit_cost"
                type="number"
                value={formData.unit_cost ?? ''}
                onChange={e =>
                  setFormData({
                    ...formData,
                    unit_cost: e.target.value ? parseFloat(e.target.value) : null,
                  })
                }
                placeholder="e.g., 150000"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Switch
                id="is_mandatory"
                checked={formData.is_mandatory}
                onCheckedChange={checked =>
                  setFormData({ ...formData, is_mandatory: checked })
                }
              />
              <Label htmlFor="is_mandatory">Mandatory PPE</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="has_sizes"
                checked={formData.has_sizes}
                onCheckedChange={checked =>
                  setFormData({ ...formData, has_sizes: checked })
                }
              />
              <Label htmlFor="has_sizes">Has Sizes</Label>
            </div>
          </div>

          {formData.has_sizes && (
            <div className="space-y-2">
              <Label htmlFor="sizes">Available Sizes (comma-separated)</Label>
              <Input
                id="sizes"
                value={sizesInput}
                onChange={e => setSizesInput(e.target.value)}
                placeholder="e.g., S, M, L, XL"
              />
            </div>
          )}

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
              {isEditing ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
