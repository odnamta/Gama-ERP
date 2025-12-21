'use client';

/**
 * ProgressWidget Component
 * v0.34: Dashboard Widgets & Customization
 * 
 * Displays progress bars or gauges with optional segments.
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ProgressWidgetProps, ProgressData } from '@/types/widgets';

function formatCurrency(value: number): string {
  if (value >= 1000000000) {
    return `Rp ${(value / 1000000000).toFixed(1)}B`;
  }
  if (value >= 1000000) {
    return `Rp ${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `Rp ${(value / 1000).toFixed(1)}K`;
  }
  return `Rp ${value.toLocaleString()}`;
}

function SimpleProgress({ data }: { data: ProgressData }) {
  const percentage = data.target > 0 ? Math.min((data.current / data.target) * 100, 100) : 0;
  const isOverBudget = data.current > data.target;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{data.label}</span>
        <span className={cn(
          'font-medium',
          isOverBudget ? 'text-red-500' : 'text-foreground'
        )}>
          {Math.round(percentage)}%
        </span>
      </div>
      
      <Progress 
        value={percentage} 
        className={cn(
          'h-3',
          isOverBudget && '[&>div]:bg-red-500'
        )}
      />
      
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{formatCurrency(data.current)}</span>
        <span>of {formatCurrency(data.target)}</span>
      </div>
    </div>
  );
}

function SegmentedProgress({ data }: { data: ProgressData }) {
  const total = data.segments?.reduce((sum, s) => sum + s.value, 0) || 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{data.label}</span>
        <span className="font-medium">{formatCurrency(total)}</span>
      </div>
      
      {/* Stacked bar */}
      <div className="h-4 bg-muted rounded-full overflow-hidden flex">
        {data.segments?.map((segment, index) => {
          const width = total > 0 ? (segment.value / total) * 100 : 0;
          return (
            <div
              key={index}
              className="h-full transition-all duration-300"
              style={{ 
                width: `${width}%`,
                backgroundColor: segment.color,
              }}
              title={`${segment.label}: ${formatCurrency(segment.value)}`}
            />
          );
        })}
      </div>
      
      {/* Legend */}
      <div className="flex flex-wrap gap-3">
        {data.segments?.map((segment, index) => (
          <div key={index} className="flex items-center gap-1.5">
            <div 
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: segment.color }}
            />
            <span className="text-xs text-muted-foreground">
              {segment.label}: {formatCurrency(segment.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ProgressWidget({ data, isLoading, error, config, onRefresh }: ProgressWidgetProps) {
  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-12" />
            </div>
            <Skeleton className="h-3 w-full" />
            <div className="flex justify-between">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="h-full border-destructive/50">
        <CardContent className="p-4 h-full">
          <div className="flex flex-col items-center justify-center h-full text-center space-y-2">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <p className="text-sm text-muted-foreground">Failed to load</p>
            {onRefresh && (
              <Button variant="ghost" size="sm" onClick={onRefresh}>
                <RefreshCw className="h-4 w-4 mr-1" />
                Retry
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">{config.widget.widget_name}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{config.widget.widget_name}</CardTitle>
      </CardHeader>
      <CardContent>
        {data.segments && data.segments.length > 0 ? (
          <SegmentedProgress data={data} />
        ) : (
          <SimpleProgress data={data} />
        )}
      </CardContent>
    </Card>
  );
}

export default ProgressWidget;
