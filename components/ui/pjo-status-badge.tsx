'use client'

import { cn } from '@/lib/utils'
import { PJOStatus } from '@/types'

const pjoStatusConfig: Record<PJOStatus, { label: string; className: string }> = {
  draft: {
    label: 'Draft',
    className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  },
  pending_approval: {
    label: 'Pending Approval',
    className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  },
  approved: {
    label: 'Approved',
    className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  },
  rejected: {
    label: 'Rejected',
    className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  },
}

export function getPJOStatusColor(status: PJOStatus): string {
  return pjoStatusConfig[status]?.className || pjoStatusConfig.draft.className
}

export function getPJOStatusLabel(status: PJOStatus): string {
  return pjoStatusConfig[status]?.label || status
}

interface PJOStatusBadgeProps {
  status: PJOStatus | string
  className?: string
}

export function PJOStatusBadge({ status, className }: PJOStatusBadgeProps) {
  const validStatus = (Object.keys(pjoStatusConfig).includes(status) ? status : 'draft') as PJOStatus
  const config = pjoStatusConfig[validStatus]

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  )
}
