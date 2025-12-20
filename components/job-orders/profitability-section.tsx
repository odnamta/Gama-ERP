'use client';

// Profitability Section Component for Job Order Detail (v0.26)

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { OverheadBreakdown } from './overhead-breakdown';
import { useToast } from '@/hooks/use-toast';
import type { JobOverheadAllocationWithCategory } from '@/types/overhead';
import { formatCurrency } from '@/lib/overhead-utils';
import { recalculateJobOverhead } from '@/app/(main)/job-orders/overhead-actions';

interface ProfitabilitySectionProps {
  joId: string;
  revenue: number;
  directCosts: number;
  totalOverhead: number;
  netProfit: number;
  netMargin: number;
  overheadBreakdown: JobOverheadAllocationWithCategory[];
  onRecalculated?: () => void;
}

export function ProfitabilitySection({
  joId,
  revenue,
  directCosts,
  totalOverhead,
  netProfit,
  netMargin,
  overheadBreakdown,
  onRecalculated,
}: ProfitabilitySectionProps) {
  const [isRecalculating, setIsRecalculating] = useState(false);
  const { toast } = useToast();

  const grossProfit = revenue - directCosts;
  const grossMargin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;

  const handleRecalculate = async () => {
    setIsRecalculating(true);
    try {
      const result = await recalculateJobOverhead(joId);
      
      if (result.error) {
        toast({
          title: 'Error',
          description: result.error,
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Overhead Recalculated',
        description: 'Job overhead has been recalculated successfully.',
      });

      // Trigger refresh
      if (onRecalculated) {
        onRecalculated();
      } else {
        // Fallback: reload the page
        window.location.reload();
      }
    } finally {
      setIsRecalculating(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg">Profitability Analysis</CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRecalculate}
          disabled={isRecalculating}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRecalculating ? 'animate-spin' : ''}`} />
          Recalculate Overhead
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Revenue */}
        <div className="flex justify-between text-lg font-semibold">
          <span>Revenue</span>
          <span>{formatCurrency(revenue)}</span>
        </div>

        <div className="border-t pt-4 space-y-2">
          {/* Direct Costs */}
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Total Direct Costs</span>
            <span>{formatCurrency(directCosts)}</span>
          </div>

          {/* Gross Profit */}
          <div className="flex justify-between font-medium">
            <span>Gross Profit</span>
            <span className={grossProfit >= 0 ? 'text-green-600' : 'text-red-600'}>
              {formatCurrency(grossProfit)} ({grossMargin.toFixed(1)}%)
            </span>
          </div>
        </div>

        <div className="border-t pt-4">
          {/* Overhead Breakdown */}
          <div className="mb-2 text-sm font-medium">Allocated Overhead:</div>
          <OverheadBreakdown
            allocations={overheadBreakdown}
            total={totalOverhead}
          />
        </div>

        <div className="border-t pt-4">
          {/* Net Profit */}
          <div className="flex justify-between text-lg font-bold">
            <span>Net Profit</span>
            <span className={netProfit >= 0 ? 'text-green-600' : 'text-red-600'}>
              {formatCurrency(netProfit)}
            </span>
          </div>
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Net Margin</span>
            <span>{netMargin.toFixed(1)}%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
