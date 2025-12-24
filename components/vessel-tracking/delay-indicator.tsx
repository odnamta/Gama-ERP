'use client';

import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  getDelaySeverity,
  DELAY_SEVERITY_COLORS,
  DELAY_SEVERITY_THRESHOLDS,
  DelaySeverity,
} from '@/types/agency';
import { AlertTriangle, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DelayIndicatorProps {
  delayHours: number;
  delayReason?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Badge component showing delay status and hours.
 * Color coding based on severity thresholds.
 * 
 * **Requirements: 8.1-8.5**
 */
export function DelayIndicator({
  delayHours,
  delayReason,
  showLabel = true,
  size = 'md',
  className,
}: DelayIndicatorProps) {
  const severity = getDelaySeverity(delayHours);
  
  // Get icon based on severity
  const getIcon = () => {
    const iconSize = size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4';
    
    switch (severity) {
      case 'none':
        return <CheckCircle2 className={cn(iconSize, 'text-green-600')} />;
      case 'minor':
        return <Clock className={cn(iconSize, 'text-yellow-600')} />;
      case 'moderate':
        return <AlertCircle className={cn(iconSize, 'text-orange-600')} />;
      case 'severe':
        return <AlertTriangle className={cn(iconSize, 'text-red-600')} />;
    }
  };

  // Get label text
  const getLabel = () => {
    if (delayHours <= 0) return 'On Time';
    if (delayHours < 1) return `+${Math.round(delayHours * 60)}m`;
    return `+${delayHours}h`;
  };

  // Get severity label
  const getSeverityLabel = (): string => {
    switch (severity) {
      case 'none':
        return 'On Time';
      case 'minor':
        return 'Minor Delay';
      case 'moderate':
        return 'Moderate Delay';
      case 'severe':
        return 'Severe Delay';
    }
  };

  // Size classes
  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-sm px-2 py-1',
    lg: 'text-base px-3 py-1.5',
  };

  const content = (
    <Badge
      variant="secondary"
      className={cn(
        DELAY_SEVERITY_COLORS[severity],
        sizeClasses[size],
        'inline-flex items-center gap-1',
        className
      )}
    >
      {getIcon()}
      {showLabel && <span>{getLabel()}</span>}
    </Badge>
  );

  // If there's a delay reason, wrap in tooltip
  if (delayReason || delayHours > 0) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {content}
          </TooltipTrigger>
          <TooltipContent>
            <div className="space-y-1">
              <p className="font-medium">{getSeverityLabel()}</p>
              {delayHours > 0 && (
                <p className="text-sm">
                  Delayed by {delayHours} hour{delayHours !== 1 ? 's' : ''}
                </p>
              )}
              {delayReason && (
                <p className="text-sm text-muted-foreground">
                  Reason: {delayReason}
                </p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return content;
}

/**
 * Compact delay badge for list views
 */
interface CompactDelayBadgeProps {
  delayHours: number;
  className?: string;
}

export function CompactDelayBadge({ delayHours, className }: CompactDelayBadgeProps) {
  if (delayHours <= 0) return null;

  const severity = getDelaySeverity(delayHours);

  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 text-xs font-medium',
        severity === 'minor' && 'text-yellow-600',
        severity === 'moderate' && 'text-orange-600',
        severity === 'severe' && 'text-red-600',
        className
      )}
    >
      <AlertTriangle className="h-3 w-3" />
      +{delayHours}h
    </span>
  );
}

/**
 * Delay summary card for dashboard views
 */
interface DelaySummaryProps {
  schedules: Array<{ delayHours: number; portName: string }>;
  className?: string;
}

export function DelaySummary({ schedules, className }: DelaySummaryProps) {
  const delayedSchedules = schedules.filter(s => s.delayHours > 0);
  const totalDelayHours = delayedSchedules.reduce((sum, s) => sum + s.delayHours, 0);
  const avgDelayHours = delayedSchedules.length > 0
    ? Math.round(totalDelayHours / delayedSchedules.length)
    : 0;

  // Count by severity
  const severityCounts: Record<DelaySeverity, number> = {
    none: 0,
    minor: 0,
    moderate: 0,
    severe: 0,
  };

  schedules.forEach(s => {
    const severity = getDelaySeverity(s.delayHours);
    severityCounts[severity]++;
  });

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Delay Summary</span>
        <span className="text-sm text-muted-foreground">
          {delayedSchedules.length} of {schedules.length} delayed
        </span>
      </div>

      {/* Severity breakdown */}
      <div className="flex gap-2">
        {severityCounts.severe > 0 && (
          <Badge className={DELAY_SEVERITY_COLORS.severe}>
            {severityCounts.severe} Severe
          </Badge>
        )}
        {severityCounts.moderate > 0 && (
          <Badge className={DELAY_SEVERITY_COLORS.moderate}>
            {severityCounts.moderate} Moderate
          </Badge>
        )}
        {severityCounts.minor > 0 && (
          <Badge className={DELAY_SEVERITY_COLORS.minor}>
            {severityCounts.minor} Minor
          </Badge>
        )}
        {severityCounts.none > 0 && (
          <Badge className={DELAY_SEVERITY_COLORS.none}>
            {severityCounts.none} On Time
          </Badge>
        )}
      </div>

      {/* Average delay */}
      {delayedSchedules.length > 0 && (
        <div className="text-sm text-muted-foreground">
          Average delay: {avgDelayHours} hours
        </div>
      )}
    </div>
  );
}

/**
 * Delay threshold legend
 */
export function DelayThresholdLegend({ className }: { className?: string }) {
  return (
    <div className={cn('flex flex-wrap gap-4 text-xs', className)}>
      <div className="flex items-center gap-1">
        <div className="w-3 h-3 rounded bg-green-100 border border-green-300" />
        <span>On Time (0h)</span>
      </div>
      <div className="flex items-center gap-1">
        <div className="w-3 h-3 rounded bg-yellow-100 border border-yellow-300" />
        <span>Minor ({DELAY_SEVERITY_THRESHOLDS.minor}+ hours)</span>
      </div>
      <div className="flex items-center gap-1">
        <div className="w-3 h-3 rounded bg-orange-100 border border-orange-300" />
        <span>Moderate ({DELAY_SEVERITY_THRESHOLDS.moderate}+ hours)</span>
      </div>
      <div className="flex items-center gap-1">
        <div className="w-3 h-3 rounded bg-red-100 border border-red-300" />
        <span>Severe ({DELAY_SEVERITY_THRESHOLDS.severe}+ hours)</span>
      </div>
    </div>
  );
}
