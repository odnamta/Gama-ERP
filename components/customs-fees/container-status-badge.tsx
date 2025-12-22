'use client';

import { Badge } from '@/components/ui/badge';
import { getContainerStatusVariant } from '@/lib/fee-utils';
import { ContainerStatus, CONTAINER_STATUS_LABELS } from '@/types/customs-fees';

interface ContainerStatusBadgeProps {
  status: ContainerStatus;
}

export function ContainerStatusBadge({ status }: ContainerStatusBadgeProps) {
  return (
    <Badge variant={getContainerStatusVariant(status)}>
      {CONTAINER_STATUS_LABELS[status]}
    </Badge>
  );
}
