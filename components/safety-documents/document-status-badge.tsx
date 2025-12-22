'use client';

import { Badge } from '@/components/ui/badge';
import { DocumentStatus } from '@/types/safety-document';
import { getDocumentStatusColor, getDocumentStatusLabel } from '@/lib/safety-document-utils';

interface DocumentStatusBadgeProps {
  status: DocumentStatus;
  className?: string;
}

export function DocumentStatusBadge({ status, className }: DocumentStatusBadgeProps) {
  return (
    <Badge className={`${getDocumentStatusColor(status)} ${className || ''}`}>
      {getDocumentStatusLabel(status)}
    </Badge>
  );
}
