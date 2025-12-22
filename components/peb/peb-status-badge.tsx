'use client'

import { Badge } from '@/components/ui/badge'
import { PEBStatus, PEB_STATUS_LABELS } from '@/types/peb'
import { getStatusColor } from '@/lib/peb-utils'

interface PEBStatusBadgeProps {
  status: PEBStatus
}

export function PEBStatusBadge({ status }: PEBStatusBadgeProps) {
  return (
    <Badge className={getStatusColor(status)} variant="secondary">
      {PEB_STATUS_LABELS[status]}
    </Badge>
  )
}
