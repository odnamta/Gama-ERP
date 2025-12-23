'use client';

import { RiskLevel } from '@/types/predictive-analytics';
import { getRiskLevelColor, getRiskLevelEmoji } from '@/lib/predictive-analytics-utils';
import { cn } from '@/lib/utils';

interface RiskBadgeProps {
  level: RiskLevel;
  score?: number;
  showEmoji?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function RiskBadge({ level, score, showEmoji = true, size = 'md' }: RiskBadgeProps) {
  const colorClass = getRiskLevelColor(level);
  const emoji = getRiskLevelEmoji(level);
  
  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-sm px-2 py-1',
    lg: 'text-base px-3 py-1.5',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-medium capitalize',
        colorClass,
        sizeClasses[size]
      )}
    >
      {showEmoji && <span>{emoji}</span>}
      <span>{level}</span>
      {score !== undefined && (
        <span className="opacity-75">({Math.round(score)})</span>
      )}
    </span>
  );
}
