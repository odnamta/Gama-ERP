'use client';

import { Badge } from '@/components/ui/badge';
import { ValidityStatus } from '@/types/safety-document';
import { getValidityStatusColor, getValidityStatusLabel } from '@/lib/safety-document-utils';

interface ValidityBadgeProps {
  status: ValidityStatus;
  daysUntilExpiry?: number;
  className?: string;
}

export function ValidityBadge({ status, daysUntilExpiry, className }: ValidityBadgeProps) {
  const label = daysUntilExpiry !== undefined && status === 'expiring_soon'
    ? `${daysUntilExpiry} hari lagi`
    : getValidityStatusLabel(status);

  return (
    <Badge className={`${getValidityStatusColor(status)} ${className || ''}`}>
      {label}
    </Badge>
  );
}
