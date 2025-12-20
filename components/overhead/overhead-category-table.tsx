'use client';

// Overhead Category Table Component (v0.26)

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Pencil, Check, X } from 'lucide-react';
import type { OverheadCategory } from '@/types/overhead';
import { getAllocationMethodDisplay } from '@/lib/overhead-utils';

interface OverheadCategoryTableProps {
  categories: OverheadCategory[];
  totalRate: number;
  onRateChange: (categoryId: string, rate: number) => Promise<void>;
  onActiveToggle: (categoryId: string, isActive: boolean) => Promise<void>;
}

export function OverheadCategoryTable({
  categories,
  totalRate,
  onRateChange,
  onActiveToggle,
}: OverheadCategoryTableProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [loading, setLoading] = useState<string | null>(null);

  const handleEditStart = (category: OverheadCategory) => {
    setEditingId(category.id);
    setEditValue(category.default_rate.toString());
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditValue('');
  };

  const handleEditSave = async (categoryId: string) => {
    const rate = parseFloat(editValue);
    if (isNaN(rate) || rate < 0 || rate > 100) {
      return;
    }

    setLoading(categoryId);
    try {
      await onRateChange(categoryId, rate);
      setEditingId(null);
      setEditValue('');
    } finally {
      setLoading(null);
    }
  };

  const handleToggle = async (categoryId: string, isActive: boolean) => {
    setLoading(categoryId);
    try {
      await onActiveToggle(categoryId, isActive);
    } finally {
      setLoading(null);
    }
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[200px]">Category</TableHead>
          <TableHead>Method</TableHead>
          <TableHead className="w-[120px]">Rate</TableHead>
          <TableHead className="w-[80px] text-center">Active</TableHead>
          <TableHead className="w-[80px]">Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {categories.map((category) => (
          <TableRow key={category.id}>
            <TableCell className="font-medium">
              {category.category_name}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {getAllocationMethodDisplay(category.allocation_method)}
            </TableCell>
            <TableCell>
              {editingId === category.id ? (
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="w-20 h-8"
                    autoFocus
                  />
                  <span className="text-muted-foreground">%</span>
                </div>
              ) : (
                <span>{category.default_rate.toFixed(1)}%</span>
              )}
            </TableCell>
            <TableCell className="text-center">
              <Switch
                checked={category.is_active}
                onCheckedChange={(checked) => handleToggle(category.id, checked)}
                disabled={loading === category.id}
              />
            </TableCell>
            <TableCell>
              {editingId === category.id ? (
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleEditSave(category.id)}
                    disabled={loading === category.id}
                  >
                    <Check className="h-4 w-4 text-green-600" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={handleEditCancel}
                    disabled={loading === category.id}
                  >
                    <X className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleEditStart(category)}
                  disabled={loading === category.id}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell colSpan={2} className="font-semibold">
            Total Overhead Rate
          </TableCell>
          <TableCell className="font-semibold">
            {totalRate.toFixed(1)}%
          </TableCell>
          <TableCell colSpan={2} />
        </TableRow>
      </TableFooter>
    </Table>
  );
}
