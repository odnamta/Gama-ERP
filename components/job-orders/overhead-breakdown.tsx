'use client';

// Overhead Breakdown Component for Job Order Detail (v0.26)

import type { JobOverheadAllocationWithCategory } from '@/types/overhead';
import { formatCurrency } from '@/lib/overhead-utils';

interface OverheadBreakdownProps {
  allocations: JobOverheadAllocationWithCategory[];
  total: number;
}

export function OverheadBreakdown({ allocations, total }: OverheadBreakdownProps) {
  if (allocations.length === 0) {
    return (
      <div className="text-sm text-muted-foreground italic">
        No overhead allocated. Click &quot;Recalculate Overhead&quot; to allocate.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {allocations.map((allocation) => (
        <div key={allocation.id} className="flex justify-between text-sm">
          <span className="text-muted-foreground">
            {allocation.category?.category_name || 'Unknown'} ({allocation.allocation_rate?.toFixed(1)}%)
          </span>
          <span>{formatCurrency(Number(allocation.allocated_amount))}</span>
        </div>
      ))}
      <div className="flex justify-between text-sm font-medium border-t pt-2">
        <span>Total Overhead</span>
        <span>{formatCurrency(total)}</span>
      </div>
    </div>
  );
}
