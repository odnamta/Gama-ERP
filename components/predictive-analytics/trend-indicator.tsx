'use client';

import { RevenueTrend } from '@/types/predictive-analytics';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TrendIndicatorProps {
  trend: RevenueTrend;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function TrendIndicator({ trend, showLabel = true, size = 'md' }: TrendIndicatorProps) {
  const config = {
    increasing: {
      icon: TrendingUp,
      color: 'text-green-600',
      label: 'Increasing',
    },
    stable: {
      icon: Minus,
      color: 'text-gray-500',
      label: 'Stable',
    },
    decreasing: {
      icon: TrendingDown,
      color: 'text-red-600',
      label: 'Decreasing',
    },
  };

  const { icon: Icon, color, label } = config[trend];

  const sizeClasses = {
    sm: { icon: 'h-3 w-3', text: 'text-xs' },
    md: { icon: 'h-4 w-4', text: 'text-sm' },
    lg: { icon: 'h-5 w-5', text: 'text-base' },
  };

  return (
    <span className={cn('inline-flex items-center gap-1', color)}>
      <Icon className={sizeClasses[size].icon} />
      {showLabel && <span className={sizeClasses[size].text}>{label}</span>}
    </span>
  );
}
