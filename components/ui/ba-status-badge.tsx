'use client'

import { Badge } from '@/components/ui/badge'
import { BAStatus } from '@/types'
import { getBAStatusLabel, getBAStatusColor } from '@/lib/ba-utils'
import { FileEdit, Clock, CheckCircle, Archive } from 'lucide-react'

interface BAStatusBadgeProps {
  status: BAStatus | string
}

const STATUS_ICONS: Record<BAStatus, React.ReactNode> = {
  draft: <FileEdit className="h-3 w-3" />,
  pending_signature: <Clock className="h-3 w-3" />,
  signed: <CheckCircle className="h-3 w-3" />,
  archived: <Archive className="h-3 w-3" />,
}

export function BAStatusBadge({ status }: BAStatusBadgeProps) {
  const baStatus = status as BAStatus
  const label = getBAStatusLabel(baStatus)
  const colorClass = getBAStatusColor(baStatus)
  const icon = STATUS_ICONS[baStatus]

  return (
    <Badge className={`${colorClass} flex items-center gap-1`} variant="outline">
      {icon}
      {label}
    </Badge>
  )
}
