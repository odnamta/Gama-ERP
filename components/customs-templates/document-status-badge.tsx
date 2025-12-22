'use client';

import { Badge } from '@/components/ui/badge';
import type { GeneratedDocumentStatus } from '@/types/customs-templates';
import { DOCUMENT_STATUS_LABELS } from '@/types/customs-templates';

interface DocumentStatusBadgeProps {
  status: GeneratedDocumentStatus;
}

const statusVariants: Record<GeneratedDocumentStatus, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  draft: 'secondary',
  final: 'default',
  sent: 'outline',
  archived: 'secondary',
};

const statusColors: Record<GeneratedDocumentStatus, string> = {
  draft: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100',
  final: 'bg-green-100 text-green-800 hover:bg-green-100',
  sent: 'bg-blue-100 text-blue-800 hover:bg-blue-100',
  archived: 'bg-gray-100 text-gray-800 hover:bg-gray-100',
};

export function DocumentStatusBadge({ status }: DocumentStatusBadgeProps) {
  return (
    <Badge variant={statusVariants[status]} className={statusColors[status]}>
      {DOCUMENT_STATUS_LABELS[status]}
    </Badge>
  );
}
