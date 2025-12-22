'use client';

// components/assessments/axle-load-table.tsx
// Axle load distribution table for Technical Assessments (v0.58)

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import { AxleLoad } from '@/types/assessment';
import { formatPercentage } from '@/lib/assessment-utils';

interface AxleLoadTableProps {
  axleLoads: AxleLoad[];
  showProgress?: boolean;
}

export function AxleLoadTable({ axleLoads, showProgress = true }: AxleLoadTableProps) {
  if (!axleLoads || axleLoads.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No axle load data available
      </div>
    );
  }

  const getUtilizationColor = (pct: number) => {
    if (pct <= 70) return 'bg-green-500';
    if (pct <= 85) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Axle #</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Load (tons)</TableHead>
            <TableHead>Max Allowed (tons)</TableHead>
            {showProgress && <TableHead className="w-[150px]">Utilization</TableHead>}
            <TableHead>%</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {axleLoads.map((axle, index) => {
            const isOverLimit = axle.load_tons > axle.max_allowed_tons;
            const utilizationPct = axle.utilization_pct;

            return (
              <TableRow key={index} className={isOverLimit ? 'bg-red-50' : ''}>
                <TableCell className="font-medium">{axle.axle_number}</TableCell>
                <TableCell className="capitalize">{axle.axle_type}</TableCell>
                <TableCell className={isOverLimit ? 'text-red-600 font-medium' : ''}>
                  {axle.load_tons.toFixed(2)}
                </TableCell>
                <TableCell>{axle.max_allowed_tons.toFixed(2)}</TableCell>
                {showProgress && (
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress
                        value={Math.min(utilizationPct, 100)}
                        className="h-2"
                        indicatorClassName={getUtilizationColor(utilizationPct)}
                      />
                    </div>
                  </TableCell>
                )}
                <TableCell className={isOverLimit ? 'text-red-600 font-medium' : ''}>
                  {formatPercentage(utilizationPct)}
                </TableCell>
                <TableCell>
                  {isOverLimit ? (
                    <Badge variant="destructive" className="flex items-center gap-1 w-fit">
                      <AlertTriangle className="h-3 w-3" />
                      Over
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="flex items-center gap-1 text-green-600 w-fit">
                      <CheckCircle className="h-3 w-3" />
                      OK
                    </Badge>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
