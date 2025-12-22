'use client';

import { Card, CardContent } from '@/components/ui/card';
import { FileText, Clock, CheckCircle, Truck, Flag } from 'lucide-react';
import { JmpStatusCounts } from '@/types/jmp';

interface JmpStatusCardsProps {
  counts: JmpStatusCounts;
}

export function JmpStatusCards({ counts }: JmpStatusCardsProps) {
  const cards = [
    {
      title: 'Draft',
      count: counts.draft,
      icon: FileText,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
    },
    {
      title: 'Pending Review',
      count: counts.pending_review,
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
    },
    {
      title: 'Approved',
      count: counts.approved,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Active',
      count: counts.active,
      icon: Truck,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Completed',
      count: counts.completed,
      icon: Flag,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      {cards.map((card) => (
        <Card key={card.title} className={card.bgColor}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{card.title}</p>
                <p className={`text-2xl font-bold ${card.color}`}>{card.count}</p>
              </div>
              <card.icon className={`h-8 w-8 ${card.color} opacity-50`} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
