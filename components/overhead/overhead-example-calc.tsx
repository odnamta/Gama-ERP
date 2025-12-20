'use client';

// Overhead Example Calculation Component (v0.26)

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/overhead-utils';

interface OverheadExampleCalcProps {
  totalRate: number;
  sampleRevenue?: number;
}

export function OverheadExampleCalc({
  totalRate,
  sampleRevenue = 100_000_000,
}: OverheadExampleCalcProps) {
  // Sample calculation values
  const directCostRate = 70; // 70% of revenue as direct costs
  const directCosts = sampleRevenue * (directCostRate / 100);
  const grossProfit = sampleRevenue - directCosts;
  const grossMargin = (grossProfit / sampleRevenue) * 100;
  const allocatedOverhead = sampleRevenue * (totalRate / 100);
  const netProfit = grossProfit - allocatedOverhead;
  const netMargin = (netProfit / sampleRevenue) * 100;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium">Example Calculation</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          For a job with Revenue = {formatCurrency(sampleRevenue)}:
        </p>
        
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Revenue:</span>
            <span className="font-medium">{formatCurrency(sampleRevenue)}</span>
          </div>
          
          <div className="flex justify-between text-muted-foreground">
            <span>- Direct Costs ({directCostRate}%):</span>
            <span>{formatCurrency(directCosts)}</span>
          </div>
          
          <div className="border-t pt-2 flex justify-between">
            <span>= Gross Profit:</span>
            <span className="font-medium">
              {formatCurrency(grossProfit)} ({grossMargin.toFixed(1)}%)
            </span>
          </div>
          
          <div className="flex justify-between text-muted-foreground">
            <span>- Allocated Overhead ({totalRate.toFixed(1)}%):</span>
            <span>{formatCurrency(allocatedOverhead)}</span>
          </div>
          
          <div className="border-t pt-2 flex justify-between font-semibold">
            <span>= Net Profit:</span>
            <span className={netProfit >= 0 ? 'text-green-600' : 'text-red-600'}>
              {formatCurrency(netProfit)} ({netMargin.toFixed(1)}%)
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
