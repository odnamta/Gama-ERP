'use client'

import { Badge } from '@/components/ui/badge'
import { SJStatus } from '@/types'
import { getSJStatusLabel, getSJStatusColor } from '@/lib/sj-utils'
import { Truck, Package, CheckCircle, RotateCcw } from 'lucide-react'

interface SJStatusBadgeProps {
  status: SJStatus | string
}

const STATUS_ICONS: Record<SJStatus, React.ReactNode> = {
  issued: <Package className="h-3 w-3" />,
  in_transit: <Truck className="h-3 w-3" />,
  delivered: <CheckCircle className="h-3 w-3" />,
  returned: <RotateCcw className="h-3 w-3" />,
}

export function SJStatusBadge({ status }: SJStatusBadgeProps) {
  const sjStatus = status as SJStatus
  const label = getSJStatusLabel(sjStatus)
  const colorClass = getSJStatusColor(sjStatus)
  const icon = STATUS_ICONS[sjStatus]

  return (
    <Badge className={`${colorClass} flex items-center gap-1`} variant="outline">
      {icon}
      {label}
    </Badge>
  )
}
