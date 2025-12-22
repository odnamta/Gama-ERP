'use client'

import { Badge } from '@/components/ui/badge'
import { PIBStatus } from '@/types/pib'
import { formatPIBStatus, getPIBStatusColor } from '@/lib/pib-utils'

interface PIBStatusBadgeProps {
  status: PIBStatus
}

export function PIBStatusBadge({ status }: PIBStatusBadgeProps) {
  return (
    <Badge variant="outline" className={getPIBStatusColor(status)}>
      {formatPIBStatus(status)}
    </Badge>
  )
}
