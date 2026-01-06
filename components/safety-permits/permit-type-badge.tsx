'use client';

import { Badge } from '@/components/ui/badge';
import { PermitType } from '@/types/safety-document';
import { getPermitTypeLabel } from '@/lib/safety-document-utils';
import { Flame, Box, ArrowUp, Shovel, Zap, Construction } from 'lucide-react';

interface PermitTypeBadgeProps {
  type: PermitType;
  className?: string;
}

const typeIcons: Record<PermitType, React.ReactNode> = {
  hot_work: <Flame className="h-3 w-3" />,
  confined_space: <Box className="h-3 w-3" />,
  height_work: <ArrowUp className="h-3 w-3" />,
  excavation: <Shovel className="h-3 w-3" />,
  electrical: <Zap className="h-3 w-3" />,
  lifting: <Construction className="h-3 w-3" />,
};

const typeColors: Record<PermitType, string> = {
  hot_work: 'bg-orange-100 text-orange-800',
  confined_space: 'bg-purple-100 text-purple-800',
  height_work: 'bg-blue-100 text-blue-800',
  excavation: 'bg-amber-100 text-amber-800',
  electrical: 'bg-yellow-100 text-yellow-800',
  lifting: 'bg-indigo-100 text-indigo-800',
};

export function PermitTypeBadge({ type, className }: PermitTypeBadgeProps) {
  return (
    <Badge className={`${typeColors[type]} ${className || ''} gap-1`}>
      {typeIcons[type]}
      {getPermitTypeLabel(type)}
    </Badge>
  );
}
