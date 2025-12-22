'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatFeeAmount } from '@/lib/fee-utils';
import { FeeCategory, FEE_CATEGORY_LABELS } from '@/types/customs-fees';
import { PieChart } from 'lucide-react';

interface CostBreakdownChartProps {
  data: Record<FeeCategory, number>;
  currency?: string;
}

const categoryColors: Record<FeeCategory, { bg: string; text: string }> = {
  duty: { bg: 'bg-blue-500', text: 'text-blue-500' },
  tax: { bg: 'bg-purple-500', text: 'text-purple-500' },
  service: { bg: 'bg-green-500', text: 'text-green-500' },
  storage: { bg: 'bg-yellow-500', text: 'text-yellow-500' },
  penalty: { bg: 'bg-red-500', text: 'text-red-500' },
  other: { bg: 'bg-gray-500', text: 'text-gray-500' },
};

export function CostBreakdownChart({ data, currency = 'IDR' }: CostBreakdownChartProps) {
  const total = Object.values(data).reduce((sum, val) => sum + val, 0);
  
  // Filter out zero values and sort by amount descending
  const sortedCategories = (Object.entries(data) as [FeeCategory, number][])
    .filter(([_, amount]) => amount > 0)
    .sort((a, b) => b[1] - a[1]);

  if (total === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5" />
            Cost Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No cost data available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PieChart className="h-5 w-5" />
          Cost Breakdown
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Visual Bar Chart */}
        <div className="space-y-3">
          {sortedCategories.map(([category, amount]) => {
            const percentage = (amount / total) * 100;
            const colors = categoryColors[category];
            
            return (
              <div key={category} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{FEE_CATEGORY_LABELS[category]}</span>
                  <span className={colors.text}>{percentage.toFixed(1)}%</span>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full ${colors.bg} transition-all duration-500`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <div className="text-xs text-muted-foreground text-right">
                  {formatFeeAmount(amount, currency)}
                </div>
              </div>
            );
          })}
        </div>

        {/* Total */}
        <div className="border-t pt-4 mt-4">
          <div className="flex justify-between items-center">
            <span className="font-semibold">Total</span>
            <span className="text-xl font-bold">
              {formatFeeAmount(total, currency)}
            </span>
          </div>
        </div>

        {/* Legend */}
        <div className="border-t pt-4 mt-4">
          <p className="text-xs text-muted-foreground mb-2">Categories</p>
          <div className="flex flex-wrap gap-3">
            {sortedCategories.map(([category]) => {
              const colors = categoryColors[category];
              return (
                <div key={category} className="flex items-center gap-1.5">
                  <div className={`w-3 h-3 rounded-full ${colors.bg}`} />
                  <span className="text-xs">{FEE_CATEGORY_LABELS[category]}</span>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
