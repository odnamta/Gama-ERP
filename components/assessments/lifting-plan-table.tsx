'use client';

// components/assessments/lifting-plan-table.tsx
// Lifting plan summary table for Technical Assessments (v0.58)

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, AlertTriangle, CheckCircle } from 'lucide-react';
import { LiftingPlan } from '@/types/assessment';
import { formatWeight, formatPercentage, requiresAdditionalReview } from '@/lib/assessment-utils';

interface LiftingPlanTableProps {
  liftingPlans: LiftingPlan[];
  canEdit: boolean;
  onEdit?: (plan: LiftingPlan) => void;
  onDelete?: (planId: string) => void;
}

export function LiftingPlanTable({
  liftingPlans,
  canEdit,
  onEdit,
  onDelete,
}: LiftingPlanTableProps) {
  if (liftingPlans.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No lifting plans configured
      </div>
    );
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Lift #</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Load Weight</TableHead>
            <TableHead>Total Weight</TableHead>
            <TableHead>Crane</TableHead>
            <TableHead>Utilization</TableHead>
            <TableHead>Status</TableHead>
            {canEdit && <TableHead className="w-[100px]">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {liftingPlans.map((plan) => {
            const isHighUtilization = plan.utilization_percentage
              ? requiresAdditionalReview(plan.utilization_percentage)
              : false;

            return (
              <TableRow key={plan.id}>
                <TableCell className="font-medium">#{plan.lift_number}</TableCell>
                <TableCell className="max-w-[200px] truncate">
                  {plan.lift_description || '-'}
                </TableCell>
                <TableCell>{formatWeight(plan.load_weight_tons)}</TableCell>
                <TableCell className="font-medium">
                  {formatWeight(plan.total_lifted_weight_tons)}
                </TableCell>
                <TableCell className="max-w-[150px] truncate">
                  {plan.crane_type || '-'}
                </TableCell>
                <TableCell>
                  <span className={isHighUtilization ? 'text-red-600 font-medium' : ''}>
                    {formatPercentage(plan.utilization_percentage)}
                  </span>
                </TableCell>
                <TableCell>
                  {plan.utilization_percentage ? (
                    isHighUtilization ? (
                      <Badge variant="destructive" className="flex items-center gap-1 w-fit">
                        <AlertTriangle className="h-3 w-3" />
                        Review
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="flex items-center gap-1 text-green-600 w-fit">
                        <CheckCircle className="h-3 w-3" />
                        OK
                      </Badge>
                    )
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                {canEdit && (
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit?.(plan)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete?.(plan.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                )}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
