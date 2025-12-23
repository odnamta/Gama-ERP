'use client';

// =====================================================
// v0.61: Sales Funnel Component
// =====================================================

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FunnelStage } from '@/types/executive-dashboard';
import { cn } from '@/lib/utils';

interface SalesFunnelProps {
  data: FunnelStage[];
  showValues?: boolean;
  className?: string;
}

export function SalesFunnel({
  data,
  showValues = true,
  className,
}: SalesFunnelProps) {
  // Find max count for scaling
  const maxCount = Math.max(...data.map(d => d.count), 1);

  // Format currency
  const formatCurrency = (value: number) => {
    if (value >= 1000000000) return `Rp ${(value / 1000000000).toFixed(1)}B`;
    if (value >= 1000000) return `Rp ${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `Rp ${(value / 1000).toFixed(0)}K`;
    return `Rp ${value.toLocaleString()}`;
  };

  // Colors for each stage
  const stageColors = [
    'bg-blue-500',
    'bg-blue-400',
    'bg-green-400',
    'bg-green-500',
    'bg-emerald-500',
  ];

  return (
    <Card className={cn('', className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">Sales Funnel</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {data.map((stage, index) => {
            const widthPercent = (stage.count / maxCount) * 100;
            
            return (
              <div key={stage.stage} className="flex items-center gap-4">
                {/* Bar */}
                <div className="flex-1">
                  <div
                    className={cn(
                      'h-8 rounded-r-lg transition-all duration-300 flex items-center px-3',
                      stageColors[index % stageColors.length]
                    )}
                    style={{ width: `${Math.max(widthPercent, 10)}%` }}
                  >
                    <span className="text-white text-sm font-medium truncate">
                      {stage.count}
                    </span>
                  </div>
                </div>

                {/* Label and value */}
                <div className="w-48 flex items-center justify-between">
                  <span className="text-sm font-medium">{stage.stage}</span>
                  {showValues && (
                    <span className="text-sm text-muted-foreground">
                      {formatCurrency(stage.value)}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary */}
        <div className="mt-4 pt-4 border-t flex justify-between text-sm">
          <span className="text-muted-foreground">
            Total Pipeline: {data.reduce((sum, s) => sum + s.count, 0)} deals
          </span>
          <span className="font-medium">
            {formatCurrency(data.reduce((sum, s) => sum + s.value, 0))}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

export default SalesFunnel;
