'use client';

// =====================================================
// v0.61: KPI Section Component
// =====================================================

import { KPICard } from './kpi-card';
import { KPIValue, KPICategory } from '@/types/executive-dashboard';
import { cn } from '@/lib/utils';
import {
  DollarSign,
  TrendingUp,
  Truck,
  Users,
  Shield,
  BarChart3,
} from 'lucide-react';

interface KPISectionProps {
  title: string;
  category: KPICategory;
  kpis: KPIValue[];
  icon?: React.ReactNode;
  className?: string;
}

// Category icons
const categoryIcons: Record<KPICategory, React.ReactNode> = {
  financial: <DollarSign className="h-5 w-5" />,
  sales: <TrendingUp className="h-5 w-5" />,
  operational: <Truck className="h-5 w-5" />,
  hr: <Users className="h-5 w-5" />,
  hse: <Shield className="h-5 w-5" />,
  customer: <BarChart3 className="h-5 w-5" />,
};

// Category colors
const categoryColors: Record<KPICategory, string> = {
  financial: 'text-green-600',
  sales: 'text-blue-600',
  operational: 'text-orange-600',
  hr: 'text-purple-600',
  hse: 'text-red-600',
  customer: 'text-cyan-600',
};

export function KPISection({
  title,
  category,
  kpis,
  icon,
  className,
}: KPISectionProps) {
  if (kpis.length === 0) return null;

  const Icon = icon || categoryIcons[category];

  return (
    <div className={cn('space-y-4', className)}>
      {/* Section Header */}
      <div className="flex items-center gap-2">
        <span className={cn('p-1.5 rounded-lg bg-muted', categoryColors[category])}>
          {Icon}
        </span>
        <h2 className="text-lg font-semibold uppercase tracking-wide">
          {title}
        </h2>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <KPICard key={kpi.kpiCode} kpiValue={kpi} />
        ))}
      </div>
    </div>
  );
}

export default KPISection;
