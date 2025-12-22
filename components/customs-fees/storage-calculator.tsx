'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { calculateStorageDays, calculateStorageFee, formatFeeAmount } from '@/lib/fee-utils';
import { ContainerTracking } from '@/types/customs-fees';
import { Calculator } from 'lucide-react';

interface StorageCalculatorProps {
  container: ContainerTracking;
}

export function StorageCalculator({ container }: StorageCalculatorProps) {
  if (!container.free_time_end || !container.gate_out_date) {
    return null;
  }

  const storageDays = calculateStorageDays(container.free_time_end, container.gate_out_date);
  const dailyRate = container.daily_rate || 0;
  const totalFee = calculateStorageFee(storageDays, dailyRate);

  if (storageDays <= 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            Storage Calculation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-green-600">
            Container released within free time. No storage charges.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Calculator className="h-4 w-4" />
          Storage Calculation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Storage Days</span>
          <span className="font-medium">{storageDays} days</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Daily Rate</span>
          <span className="font-medium">{formatFeeAmount(dailyRate, 'IDR')}</span>
        </div>
        <div className="border-t pt-2 flex justify-between">
          <span className="font-medium">Total Storage Fee</span>
          <span className="font-bold text-red-600">{formatFeeAmount(totalFee, 'IDR')}</span>
        </div>
      </CardContent>
    </Card>
  );
}
