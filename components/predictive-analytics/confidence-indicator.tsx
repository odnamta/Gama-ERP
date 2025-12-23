'use client';

import { cn } from '@/lib/utils';
import { formatConfidence } from '@/lib/predictive-analytics-utils';

interface ConfidenceIndicatorProps {
  level: number;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function ConfidenceIndicator({ level, showLabel = true, size = 'md' }: ConfidenceIndicatorProps) {
  const getColorClass = (confidence: number) => {
    if (confidence >= 80) return 'bg-green-500';
    if (confidence >= 60) return 'bg-yellow-500';
    if (confidence >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const sizeClasses = {
    sm: { bar: 'h-1.5', text: 'text-xs' },
    md: { bar: 'h-2', text: 'text-sm' },
    lg: { bar: 'h-3', text: 'text-base' },
  };

  return (
    <div className="flex items-center gap-2">
      <div className={cn('flex-1 bg-gray-200 rounded-full overflow-hidden', sizeClasses[size].bar)}>
        <div
          className={cn('h-full rounded-full transition-all', getColorClass(level))}
          style={{ width: `${Math.min(100, Math.max(0, level))}%` }}
        />
      </div>
      {showLabel && (
        <span className={cn('font-medium text-gray-600', sizeClasses[size].text)}>
          {formatConfidence(level)}
        </span>
      )}
    </div>
  );
}
