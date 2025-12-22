'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ClipboardList, PlayCircle, Clock, CheckCircle } from 'lucide-react';
import { PermitStatistics } from '@/types/safety-document';

interface PermitSummaryCardsProps {
  statistics: PermitStatistics;
}

export function PermitSummaryCards({ statistics }: PermitSummaryCardsProps) {
  const cards = [
    {
      title: 'Total Izin',
      value: statistics.totalPermits,
      icon: ClipboardList,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Aktif',
      value: statistics.activePermits,
      icon: PlayCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Menunggu Persetujuan',
      value: statistics.pendingApproval,
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
    },
    {
      title: 'Selesai Bulan Ini',
      value: statistics.completedThisMonth,
      icon: CheckCircle,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
            <div className={`p-2 rounded-full ${card.bgColor}`}>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
