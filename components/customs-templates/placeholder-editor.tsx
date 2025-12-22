'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Plus, Trash2, Edit } from 'lucide-react';
import type { PlaceholderDefinition } from '@/types/customs-templates';
import { PIB_FIELD_SOURCES, PEB_FIELD_SOURCES } from '@/types/customs-templates';

interface PlaceholderEditorProps {
  placeholders: PlaceholderDefinition[];
  onChange: (placeholders: PlaceholderDefinition[]) => void;
}

const SOURCE_OPTIONS = [
  { value: 'manual', label: 'Manual Input' },
  { value: 'current_date', label: 'Current Date' },
  { value: 'pib_items', label: 'PIB Items (Array)' },
  { value: 'peb_items', label: 'PEB Items (Array)' },
  ...PIB_FIELD_SOURCES.map((s) => ({ value: s, label: s.replace('pib.', 'PIB: ') })),
  ...PEB_FIELD_SOURCES.map((s) => ({ value: s, label: s.replace('peb.', 'PEB: ') })),
];

export function PlaceholderEditor({ placeholders, onChange }: PlaceholderEditorProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [formData, setFormData] = useState<Partial<PlaceholderDefinition>>({
    key: '',
    label: '',
    source: 'manual',
    type: 'text',
  });

  const handleAdd = () => {
    setEditIndex(null);
    setFormData({ key: '', label: '', source: 'manual', type: 'text' });
    setDialogOpen(true);
  };

  const handleEdit = (index: number) => {
    setEditIndex(index);
    setFormData(placeholders[index]);
    setDialogOpen(true);
  };

  const handleDelete = (index: number) => {
    const newPlaceholders = [...placeholders];
    newPlaceholders.splice(index, 1);
    onChange(newPlaceholders);
  };

  const handleSave = () => {
    if (!formData.key || !formData.label || !formData.source) return;

    const placeholder: PlaceholderDefinition = {
      key: formData.key,
      label: formData.label,
      source: formData.source,
      type: formData.type,
    };

    // Determine type based on source
    if (formData.source === 'pib_items' || formData.source === 'peb_items') {
      placeholder.type = 'array';
    } else if (formData.source === 'current_date') {
      placeholder.type = 'date';
    }

    const newPlaceholders = [...placeholders];
    if (editIndex !== null) {
      newPlaceholders[editIndex] = placeholder;
    } else {
      newPlaceholders.push(placeholder);
    }

    onChange(newPlaceholders);
    setDialogOpen(false);
  };

  const getSourceLabel = (source: string) => {
    const option = SOURCE_OPTIONS.find((o) => o.value === source);
    return option?.label || source;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          Define placeholders that can be used in the template HTML.
        </p>
        <Button type="button" size="sm" onClick={handleAdd}>
          <Plus className="h-4 w-4 mr-2" />
          Add Placeholder
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Key</TableHead>
              <TableHead>Label</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="w-[100px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {placeholders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                  No placeholders defined. Click &quot;Add Placeholder&quot; to create one.
                </TableCell>
              </TableRow>
            ) : (
              placeholders.map((placeholder, index) => (
                <TableRow key={index}>
                  <TableCell className="font-mono text-sm">
                    {`{{${placeholder.key}}}`}
                  </TableCell>
                  <TableCell>{placeholder.label}</TableCell>
                  <TableCell className="text-sm">
                    {getSourceLabel(placeholder.source)}
                  </TableCell>
                  <TableCell className="text-sm capitalize">
                    {placeholder.type || 'text'}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(index)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(index)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editIndex !== null ? 'Edit Placeholder' : 'Add Placeholder'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="key">Key *</Label>
              <Input
                id="key"
                value={formData.key || ''}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    key: e.target.value.replace(/[^a-zA-Z0-9_]/g, ''),
                  }))
                }
                placeholder="e.g., shipper_name"
              />
              <p className="text-xs text-muted-foreground">
                Use in template as: {`{{${formData.key || 'key'}}}`}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="label">Label *</Label>
              <Input
                id="label"
                value={formData.label || ''}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, label: e.target.value }))
                }
                placeholder="e.g., Shipper Name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="source">Data Source *</Label>
              <Select
                value={formData.source || 'manual'}
                onValueChange={(v) =>
                  setFormData((prev) => ({ ...prev, source: v }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {SOURCE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {formData.source === 'manual' && (
              <div className="space-y-2">
                <Label htmlFor="type">Value Type</Label>
                <Select
                  value={formData.type || 'text'}
                  onValueChange={(v) =>
                    setFormData((prev) => ({
                      ...prev,
                      type: v as PlaceholderDefinition['type'],
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Text</SelectItem>
                    <SelectItem value="number">Number</SelectItem>
                    <SelectItem value="date">Date</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={!formData.key || !formData.label || !formData.source}
            >
              {editIndex !== null ? 'Update' : 'Add'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
