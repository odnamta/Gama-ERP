'use client';

import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, XCircle, LogOut, Ban } from 'lucide-react';
import { EmployeeStatus } from '@/types/employees';

interface EmployeeStatusBadgeProps {
  status: EmployeeStatus;
}

const statusConfig: Record<
  EmployeeStatus,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ElementType; className?: string }
> = {
  active: {
    label: 'Active',
    variant: 'outline',
    icon: CheckCircle,
    className: 'text-green-600 border-green-600',
  },
  on_leave: {
    label: 'On Leave',
    variant: 'outline',
    icon: Clock,
    className: 'text-yellow-600 border-yellow-600',
  },
  suspended: {
    label: 'Suspended',
    variant: 'outline',
    icon: Ban,
    className: 'text-orange-600 border-orange-600',
  },
  resigned: {
    label: 'Resigned',
    variant: 'secondary',
    icon: LogOut,
  },
  terminated: {
    label: 'Terminated',
    variant: 'destructive',
    icon: XCircle,
  },
};

export function EmployeeStatusBadge({ status }: EmployeeStatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.active;
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className={`gap-1 ${config.className || ''}`}>
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}
