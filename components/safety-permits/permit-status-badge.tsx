'use client';

import { Badge } from '@/components/ui/badge';
import { PermitStatus } from '@/types/safety-document';
import { getPermitStatusColor, getPermitStatusLabel } from '@/lib/safety-document-utils';

interface PermitStatusBadgeProps {
  status: PermitStatus;
  className?: string;
}

export function PermitStatusBadge({ status, className }: PermitStatusBadgeProps) {
  return (
    <Badge className={`${getPermitStatusColor(status)} ${className || ''}`}>
      {getPermitStatusLabel(status)}
    </Badge>
  );
}
