import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

type JOStatus = 'pending' | 'active' | 'in_progress' | 'completed' | 'submitted_to_finance' | 'invoiced' | 'closed' | 'cancelled'

const statusConfig: Record<JOStatus, { label: string; className: string }> = {
  pending: {
    label: 'Pending',
    className: 'bg-gray-100 text-gray-800 hover:bg-gray-100',
  },
  active: {
    label: 'Active',
    className: 'bg-blue-100 text-blue-800 hover:bg-blue-100',
  },
  in_progress: {
    label: 'In Progress',
    className: 'bg-blue-100 text-blue-800 hover:bg-blue-100',
  },
  completed: {
    label: 'Completed',
    className: 'bg-green-100 text-green-800 hover:bg-green-100',
  },
  submitted_to_finance: {
    label: 'Submitted to Finance',
    className: 'bg-purple-100 text-purple-800 hover:bg-purple-100',
  },
  invoiced: {
    label: 'Invoiced',
    className: 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100',
  },
  closed: {
    label: 'Closed',
    className: 'bg-gray-100 text-gray-800 hover:bg-gray-100',
  },
  cancelled: {
    label: 'Cancelled',
    className: 'bg-red-100 text-red-800 hover:bg-red-100',
  },
}

interface JOStatusBadgeProps {
  status: string
  className?: string
}

export function JOStatusBadge({ status, className }: JOStatusBadgeProps) {
  const config = statusConfig[status as JOStatus] || {
    label: status,
    className: 'bg-gray-100 text-gray-800',
  }

  return (
    <Badge variant="outline" className={cn(config.className, className)}>
      {config.label}
    </Badge>
  )
}
