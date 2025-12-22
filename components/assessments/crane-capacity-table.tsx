'use client';

// components/assessments/crane-capacity-table.tsx
// Crane capacity table for Lifting Plans (v0.58)

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import { LiftingPlan } from '@/types/assessment';
import { formatWeight, formatPercentage, requiresAdditionalReview } from '@/lib/assessment-utils';

interface CraneCapacityTableProps {
  liftingPlan: LiftingPlan;
}

interface CapacityRow {
  parameter: string;
  value: string;
  limit: string;
  utilization: string;
  status: 'ok' | 'warning' | 'na';
}

export function CraneCapacityTable({ liftingPlan }: CraneCapacityTableProps) {
  const utilizationPct = liftingPlan.utilization_percentage;
  const isHighUtilization = utilizationPct ? requiresAdditionalReview(utilizationPct) : false;

  const rows: CapacityRow[] = [
    {
      parameter: 'Total Lifted Weight',
      value: formatWeight(liftingPlan.total_lifted_weight_tons),
      limit: '-',
      utilization: '-',
      status: 'na',
    },
    {
      parameter: 'Working Radius',
      value: liftingPlan.crane_radius_m ? `${liftingPlan.crane_radius_m} m` : '-',
      limit: '-',
      utilization: '-',
      status: 'na',
    },
    {
      parameter: 'Boom Length',
      value: liftingPlan.crane_boom_length_m ? `${liftingPlan.crane_boom_length_m} m` : '-',
      limit: '-',
      utilization: '-',
      status: 'na',
    },
    {
      parameter: 'Capacity at Radius',
      value: formatWeight(liftingPlan.crane_capacity_at_radius_tons),
      limit: '-',
      utilization: '-',
      status: 'na',
    },
    {
      parameter: 'Crane Utilization',
      value: formatPercentage(utilizationPct),
      limit: '80%',
      utilization: formatPercentage(utilizationPct),
      status: utilizationPct ? (utilizationPct <= 80 ? 'ok' : 'warning') : 'na',
    },
  ];

  // Add sling capacity if available
  if (liftingPlan.sling_capacity_tons) {
    const loadPerSling = liftingPlan.sling_quantity && liftingPlan.sling_quantity > 0
      ? (liftingPlan.total_lifted_weight_tons || 0) / liftingPlan.sling_quantity
      : null;
    const slingUtilization = loadPerSling
      ? (loadPerSling / liftingPlan.sling_capacity_tons) * 100
      : null;

    rows.push({
      parameter: 'Sling Capacity',
      value: formatWeight(liftingPlan.sling_capacity_tons),
      limit: formatWeight(liftingPlan.sling_capacity_tons),
      utilization: slingUtilization ? formatPercentage(slingUtilization) : '-',
      status: slingUtilization ? (slingUtilization <= 80 ? 'ok' : 'warning') : 'na',
    });
  }

  // Add spreader beam capacity if available
  if (liftingPlan.spreader_beam && liftingPlan.spreader_capacity_tons) {
    const spreaderUtilization = liftingPlan.total_lifted_weight_tons
      ? (liftingPlan.total_lifted_weight_tons / liftingPlan.spreader_capacity_tons) * 100
      : null;

    rows.push({
      parameter: 'Spreader Beam Capacity',
      value: formatWeight(liftingPlan.spreader_capacity_tons),
      limit: formatWeight(liftingPlan.spreader_capacity_tons),
      utilization: spreaderUtilization ? formatPercentage(spreaderUtilization) : '-',
      status: spreaderUtilization ? (spreaderUtilization <= 80 ? 'ok' : 'warning') : 'na',
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium">Crane Capacity Analysis</h4>
        {isHighUtilization && (
          <Badge variant="destructive" className="flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            High Utilization - Review Required
          </Badge>
        )}
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Parameter</TableHead>
              <TableHead>Value</TableHead>
              <TableHead>Limit</TableHead>
              <TableHead>Utilization</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, index) => (
              <TableRow key={index}>
                <TableCell className="font-medium">{row.parameter}</TableCell>
                <TableCell>{row.value}</TableCell>
                <TableCell>{row.limit}</TableCell>
                <TableCell>{row.utilization}</TableCell>
                <TableCell>
                  {row.status === 'ok' && (
                    <Badge variant="outline" className="text-green-600">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      OK
                    </Badge>
                  )}
                  {row.status === 'warning' && (
                    <Badge variant="destructive">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Review
                    </Badge>
                  )}
                  {row.status === 'na' && (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Summary */}
      <div className="p-4 bg-muted/50 rounded-lg">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Crane Type</p>
            <p className="font-medium">{liftingPlan.crane_type || '-'}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Max Capacity</p>
            <p className="font-medium">{formatWeight(liftingPlan.crane_capacity_tons)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Rigging Config</p>
            <p className="font-medium">{liftingPlan.rigging_configuration || '-'}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Overall Status</p>
            <p className="font-medium">
              {isHighUtilization ? (
                <span className="text-red-600">Requires Review</span>
              ) : utilizationPct ? (
                <span className="text-green-600">Within Limits</span>
              ) : (
                '-'
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
