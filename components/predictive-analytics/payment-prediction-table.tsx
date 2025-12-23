'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PaymentPrediction } from '@/types/predictive-analytics';
import { formatPredictionCurrency } from '@/lib/predictive-analytics-utils';
import { RiskBadge } from './risk-badge';
import { ConfidenceIndicator } from './confidence-indicator';
import { format } from 'date-fns';

interface PaymentPredictionTableProps {
  data: PaymentPrediction[];
}

export function PaymentPredictionTable({ data }: PaymentPredictionTableProps) {
  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No payment predictions available. Generate predictions for pending invoices.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Invoice</TableHead>
          <TableHead>Customer</TableHead>
          <TableHead>Amount</TableHead>
          <TableHead>Due Date</TableHead>
          <TableHead>Predicted Payment</TableHead>
          <TableHead>Late Risk</TableHead>
          <TableHead>Confidence</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((prediction) => (
          <TableRow key={prediction.id}>
            <TableCell className="font-medium">
              {prediction.invoice?.invoice_number || 'Unknown'}
            </TableCell>
            <TableCell>
              {prediction.invoice?.customer_name || 'Unknown'}
            </TableCell>
            <TableCell>
              {prediction.invoice?.total_amount
                ? formatPredictionCurrency(prediction.invoice.total_amount)
                : '-'}
            </TableCell>
            <TableCell>
              {prediction.invoice?.due_date
                ? format(new Date(prediction.invoice.due_date), 'dd/MM/yyyy')
                : '-'}
            </TableCell>
            <TableCell>
              {prediction.predicted_payment_date
                ? format(new Date(prediction.predicted_payment_date), 'dd/MM/yyyy')
                : '-'}
              {prediction.days_to_payment_predicted !== null && (
                <span className="text-xs text-muted-foreground ml-1">
                  ({prediction.days_to_payment_predicted} days)
                </span>
              )}
            </TableCell>
            <TableCell>
              {prediction.late_payment_risk && (
                <RiskBadge level={prediction.late_payment_risk} showEmoji={true} size="sm" />
              )}
            </TableCell>
            <TableCell className="w-32">
              {prediction.confidence_level !== null && (
                <ConfidenceIndicator level={prediction.confidence_level} size="sm" />
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
