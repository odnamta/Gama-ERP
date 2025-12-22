'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PPEDashboardMetrics } from '@/types/ppe';
import {
  HardHat,
  Package,
  AlertTriangle,
  Clock,
  Users,
  ShieldAlert,
} from 'lucide-react';

interface PPEDashboardCardsProps {
  metrics: PPEDashboardMetrics;
}

export function PPEDashboardCards({ metrics }: PPEDashboardCardsProps) {
  const cards = [
    {
      title: 'Active Issuances',
      value: metrics.totalActiveIssuances,
      icon: HardHat,
      href: '/hse/ppe/issuance',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'PPE Types',
      value: metrics.totalPPETypes,
      icon: Package,
      href: '/hse/ppe/types',
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'Replacements Due Soon',
      value: metrics.replacementsDueSoon,
      icon: Clock,
      href: '/hse/ppe/replacement',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
      alert: metrics.replacementsDueSoon > 0,
    },
    {
      title: 'Overdue Replacements',
      value: metrics.replacementsOverdue,
      icon: AlertTriangle,
      href: '/hse/ppe/replacement',
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      alert: metrics.replacementsOverdue > 0,
    },
    {
      title: 'Employees Missing PPE',
      value: metrics.employeesMissingPPE,
      icon: Users,
      href: '/hse/ppe/compliance',
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      alert: metrics.employeesMissingPPE > 0,
    },
    {
      title: 'Low Stock Items',
      value: metrics.lowStockItems,
      icon: ShieldAlert,
      href: '/hse/ppe/inventory',
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      alert: metrics.lowStockItems > 0,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {cards.map(card => (
        <Link key={card.title} href={card.href}>
          <Card className={`hover:shadow-md transition-shadow cursor-pointer ${card.alert ? 'border-red-200' : ''}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <div className={`p-2 rounded-full ${card.bgColor}`}>
                <card.icon className={`h-4 w-4 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${card.alert ? 'text-red-600' : ''}`}>
                {card.value}
              </div>
              {card.alert && (
                <p className="text-xs text-red-600 mt-1">Requires attention</p>
              )}
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
