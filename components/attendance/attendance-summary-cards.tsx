'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Users, UserCheck, Clock, UserX, Palmtree, CalendarOff } from 'lucide-react';
import { AttendanceSummary } from '@/types/attendance';

interface AttendanceSummaryCardsProps {
  summary: AttendanceSummary;
  isLoading?: boolean;
}

export function AttendanceSummaryCards({ summary, isLoading }: AttendanceSummaryCardsProps) {
  const cards = [
    {
      label: 'Total Staff',
      value: summary.total,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      label: 'Present',
      value: summary.present,
      icon: UserCheck,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      label: 'Late',
      value: summary.late,
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
    },
    {
      label: 'Absent',
      value: summary.absent,
      icon: UserX,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
    },
    {
      label: 'On Leave',
      value: summary.onLeave,
      icon: Palmtree,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      label: 'Holiday',
      value: summary.holiday,
      icon: CalendarOff,
      color: 'text-pink-600',
      bgColor: 'bg-pink-100',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {cards.map((card) => (
        <Card key={card.label}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${card.bgColor}`}>
                <card.icon className={`h-5 w-5 ${card.color}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{card.label}</p>
                <p className="text-2xl font-bold">
                  {isLoading ? '-' : card.value}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
