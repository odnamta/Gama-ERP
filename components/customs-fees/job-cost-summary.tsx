'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { formatFeeAmount } from '@/lib/fee-utils';
import { JobCustomsCostSummary, FEE_CATEGORY_LABELS, FeeCategory } from '@/types/customs-fees';
import { Receipt, CheckCircle, Clock } from 'lucide-react';

interface JobCostSummaryProps {
  summary: JobCustomsCostSummary;
}

const categoryColors: Record<FeeCategory, string> = {
  duty: 'bg-blue-500',
  tax: 'bg-purple-500',
  service: 'bg-green-500',
  storage: 'bg-yellow-500',
  penalty: 'bg-red-500',
  other: 'bg-gray-500',
};

export function JobCostSummary({ summary }: JobCostSummaryProps) {
  const categories: { key: keyof JobCustomsCostSummary; category: FeeCategory }[] = [
    { key: 'total_duties', category: 'duty' },
    { key: 'total_taxes', category: 'tax' },
    { key: 'total_services', category: 'service' },
    { key: 'total_storage', category: 'storage' },
    { key: 'total_penalties', category: 'penalty' },
  ];

  const paidPercentage = summary.total_customs_cost > 0
    ? (summary.total_paid / summary.total_customs_cost) * 100
    : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Receipt className="h-5 w-5" />
          Customs Cost Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Total */}
        <div className="text-center p-4 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">Total Customs Cost</p>
          <p className="text-3xl font-bold">
            {formatFeeAmount(summary.total_customs_cost, 'IDR')}
          </p>
        </div>

        {/* Payment Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Payment Progress</span>
            <span className="font-medium">{paidPercentage.toFixed(0)}%</span>
          </div>
          <Progress value={paidPercentage} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3 text-green-500" />
              Paid: {formatFeeAmount(summary.total_paid, 'IDR')}
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3 text-yellow-500" />
              Pending: {formatFeeAmount(summary.total_pending, 'IDR')}
            </div>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="space-y-3">
          <p className="text-sm font-medium">Cost Breakdown</p>
          {categories.map(({ key, category }) => {
            const amount = summary[key] as number;
            const percentage = summary.total_customs_cost > 0
              ? (amount / summary.total_customs_cost) * 100
              : 0;

            if (amount === 0) return null;

            return (
              <div key={category} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {FEE_CATEGORY_LABELS[category]}
                  </span>
                  <span className="font-medium">
                    {formatFeeAmount(amount, 'IDR')}
                  </span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full ${categoryColors[category]}`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
