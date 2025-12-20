'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, UserCheck, Clock, UserPlus } from 'lucide-react';
import { EmployeeSummaryStats } from '@/types/employees';

interface EmployeeSummaryCardsProps {
  stats: EmployeeSummaryStats;
}

export function EmployeeSummaryCards({ stats }: EmployeeSummaryCardsProps) {
  const cards = [
    {
      title: 'Total Employees',
      value: stats.total,
      icon: Users,
      description: 'All employees',
    },
    {
      title: 'Active',
      value: stats.active,
      icon: UserCheck,
      description: 'Currently active',
      className: 'text-green-600',
    },
    {
      title: 'On Leave',
      value: stats.onLeave,
      icon: Clock,
      description: 'Currently on leave',
      className: 'text-yellow-600',
    },
    {
      title: 'New (MTD)',
      value: stats.newThisMonth,
      icon: UserPlus,
      description: 'Joined this month',
      className: 'text-blue-600',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
            <card.icon className={`h-4 w-4 text-muted-foreground ${card.className || ''}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${card.className || ''}`}>{card.value}</div>
            <p className="text-xs text-muted-foreground">{card.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
