'use client';

// Overhead Settings Form Component (v0.26)

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { OverheadCategoryTable } from './overhead-category-table';
import { OverheadExampleCalc } from './overhead-example-calc';
import { BatchRecalculation } from './batch-recalculation';
import { useToast } from '@/hooks/use-toast';
import type { OverheadCategory } from '@/types/overhead';
import {
  updateOverheadCategoryRate,
  toggleOverheadCategoryActive,
} from '@/app/(main)/finance/settings/overhead/actions';

interface OverheadSettingsFormProps {
  initialCategories: OverheadCategory[];
  initialTotalRate: number;
}

export function OverheadSettingsForm({
  initialCategories,
  initialTotalRate,
}: OverheadSettingsFormProps) {
  const [categories, setCategories] = useState(initialCategories);
  const [totalRate, setTotalRate] = useState(initialTotalRate);
  const { toast } = useToast();

  // Recalculate total rate from categories
  const recalculateTotalRate = (cats: OverheadCategory[]) => {
    return cats
      .filter(c => c.is_active && c.allocation_method === 'revenue_percentage')
      .reduce((sum, c) => sum + (c.default_rate || 0), 0);
  };

  const handleRateChange = async (categoryId: string, rate: number) => {
    const result = await updateOverheadCategoryRate(categoryId, rate);
    
    if (result.error) {
      toast({
        title: 'Error',
        description: result.error,
        variant: 'destructive',
      });
      return;
    }

    // Update local state
    const updatedCategories = categories.map(c =>
      c.id === categoryId ? { ...c, default_rate: rate } : c
    );
    setCategories(updatedCategories);
    setTotalRate(recalculateTotalRate(updatedCategories));

    toast({
      title: 'Rate Updated',
      description: 'Overhead rate has been updated successfully.',
    });
  };

  const handleActiveToggle = async (categoryId: string, isActive: boolean) => {
    const result = await toggleOverheadCategoryActive(categoryId, isActive);
    
    if (result.error) {
      toast({
        title: 'Error',
        description: result.error,
        variant: 'destructive',
      });
      return;
    }

    // Update local state
    const updatedCategories = categories.map(c =>
      c.id === categoryId ? { ...c, is_active: isActive } : c
    );
    setCategories(updatedCategories);
    setTotalRate(recalculateTotalRate(updatedCategories));

    toast({
      title: isActive ? 'Category Enabled' : 'Category Disabled',
      description: `Category has been ${isActive ? 'enabled' : 'disabled'}.`,
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Allocation Method</CardTitle>
          <CardDescription>
            Configure how overhead costs are allocated to jobs.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
              <div className="w-4 h-4 mt-0.5 rounded-full bg-primary flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-white" />
              </div>
              <div>
                <p className="font-medium">Revenue Percentage (Recommended)</p>
                <p className="text-sm text-muted-foreground">
                  Each job absorbs overhead based on its revenue contribution
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-3 rounded-lg border opacity-50">
              <div className="w-4 h-4 mt-0.5 rounded-full border-2 border-muted-foreground" />
              <div>
                <p className="font-medium">Fixed Per Job</p>
                <p className="text-sm text-muted-foreground">
                  Each job absorbs a fixed overhead amount (coming soon)
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-3 rounded-lg border opacity-50">
              <div className="w-4 h-4 mt-0.5 rounded-full border-2 border-muted-foreground" />
              <div>
                <p className="font-medium">Manual Allocation</p>
                <p className="text-sm text-muted-foreground">
                  Manually allocate overhead to specific jobs (coming soon)
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Overhead Categories</CardTitle>
          <CardDescription>
            Configure overhead categories and their allocation rates.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <OverheadCategoryTable
            categories={categories}
            totalRate={totalRate}
            onRateChange={handleRateChange}
            onActiveToggle={handleActiveToggle}
          />
        </CardContent>
      </Card>

      <OverheadExampleCalc totalRate={totalRate} />

      <BatchRecalculation />
    </div>
  );
}
