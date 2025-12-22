'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatFeeAmount } from '@/lib/fee-utils';
import { FeeStatistics } from '@/types/customs-fees';
import { Receipt, Clock, CheckCircle, AlertCircle } from 'lucide-react';

interface FeeSummaryCardsProps {
  statistics: FeeStatistics;
}

export function FeeSummaryCards({ statistics }: FeeSummaryCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Fees</CardTitle>
          <Receipt className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{statistics.total_fees}</div>
          <p className="text-xs text-muted-foreground">
            All recorded fees
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pending</CardTitle>
          <Clock className="h-4 w-4 text-yellow-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{statistics.total_pending}</div>
          <p className="text-xs text-muted-foreground">
            {formatFeeAmount(statistics.pending_amount, 'IDR')}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Paid</CardTitle>
          <CheckCircle className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{statistics.total_paid}</div>
          <p className="text-xs text-muted-foreground">
            {formatFeeAmount(statistics.paid_amount, 'IDR')}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
          <AlertCircle className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">
            {formatFeeAmount(statistics.pending_amount, 'IDR')}
          </div>
          <p className="text-xs text-muted-foreground">
            Awaiting payment
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
