'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Shield,
  AlertTriangle,
  Clock,
  CheckCircle2,
  AlertOctagon,
  ArrowUpCircle,
  MinusCircle,
  Eye,
} from 'lucide-react';
import { AuditFinding } from '@/types/audit';

interface FindingSummaryCardsProps {
  findings: AuditFinding[];
}

export function FindingSummaryCards({ findings }: FindingSummaryCardsProps) {
  const counts = useMemo(() => {
    const total = findings.length;
    const open = findings.filter((f) => f.status === 'open').length;
    const inProgress = findings.filter((f) => f.status === 'in_progress').length;
    const resolved = findings.filter(
      (f) => f.status === 'resolved' || f.status === 'closed' || f.status === 'verified'
    ).length;

    const critical = findings.filter((f) => f.severity === 'critical').length;
    const major = findings.filter((f) => f.severity === 'major').length;
    const minor = findings.filter((f) => f.severity === 'minor').length;
    const observation = findings.filter((f) => f.severity === 'observation').length;

    return { total, open, inProgress, resolved, critical, major, minor, observation };
  }, [findings]);

  const statusCards = [
    {
      title: 'Total Temuan',
      value: counts.total,
      icon: Shield,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Terbuka',
      value: counts.open,
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
    },
    {
      title: 'Dalam Proses',
      value: counts.inProgress,
      icon: Clock,
      color: 'text-amber-600',
      bgColor: 'bg-amber-100',
    },
    {
      title: 'Selesai',
      value: counts.resolved,
      icon: CheckCircle2,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
  ];

  const severityCards = [
    {
      title: 'Kritis',
      value: counts.critical,
      icon: AlertOctagon,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
    },
    {
      title: 'Mayor',
      value: counts.major,
      icon: ArrowUpCircle,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
    {
      title: 'Minor',
      value: counts.minor,
      icon: MinusCircle,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
    },
    {
      title: 'Observasi',
      value: counts.observation,
      icon: Eye,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
  ];

  return (
    <div className="space-y-4">
      {/* Status cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {statusCards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <div className={`p-2 rounded-full ${card.bgColor}`}>
                <card.icon className={`h-4 w-4 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${card.color}`}>{card.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Severity cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {severityCards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <div className={`p-2 rounded-full ${card.bgColor}`}>
                <card.icon className={`h-4 w-4 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${card.color}`}>{card.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
