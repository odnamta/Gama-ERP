'use client';

import { Badge } from '@/components/ui/badge';
import { RiskLevel } from '@/types/safety-document';
import { getRiskLevelColor, getRiskLevelLabel } from '@/lib/safety-document-utils';

interface RiskLevelBadgeProps {
  level: RiskLevel;
  className?: string;
}

export function RiskLevelBadge({ level, className }: RiskLevelBadgeProps) {
  return (
    <Badge className={`${getRiskLevelColor(level)} ${className || ''}`}>
      {getRiskLevelLabel(level)}
    </Badge>
  );
}
