'use client';

import { Card, CardContent } from '@/components/ui/card';
import { SurveyStatusCounts, SurveyStatus } from '@/types/survey';
import { ClipboardList, Calendar, Search, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SurveyStatusCardsProps {
  counts: SurveyStatusCounts;
  selectedStatus: SurveyStatus | 'all';
  onStatusSelect: (status: SurveyStatus | 'all') => void;
}

export function SurveyStatusCards({
  counts,
  selectedStatus,
  onStatusSelect,
}: SurveyStatusCardsProps) {
  const cards = [
    {
      status: 'requested' as const,
      label: 'Requested',
      count: counts.requested,
      icon: ClipboardList,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
    },
    {
      status: 'scheduled' as const,
      label: 'Scheduled',
      count: counts.scheduled,
      icon: Calendar,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
    },
    {
      status: 'in_progress' as const,
      label: 'In Progress',
      count: counts.in_progress,
      icon: Search,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
    },
    {
      status: 'completed' as const,
      label: 'Completed (MTD)',
      count: counts.completed,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        const isSelected = selectedStatus === card.status;

        return (
          <Card
            key={card.status}
            className={cn(
              'cursor-pointer transition-all hover:shadow-md',
              isSelected && `ring-2 ring-offset-2 ${card.borderColor}`
            )}
            onClick={() => onStatusSelect(isSelected ? 'all' : card.status)}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={cn('p-2 rounded-lg', card.bgColor)}>
                  <Icon className={cn('h-5 w-5', card.color)} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{card.label}</p>
                  <p className="text-2xl font-bold">{card.count}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
