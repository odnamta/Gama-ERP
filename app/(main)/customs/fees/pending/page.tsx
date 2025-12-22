import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PendingPaymentsList } from '@/components/customs-fees/pending-payments-list';
import { getPendingPayments } from '@/lib/fee-actions';

export default async function PendingPaymentsPage() {
  const pendingFees = await getPendingPayments();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Pending Payments</h1>
        <p className="text-muted-foreground">
          Customs fees awaiting payment
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Outstanding Fees</CardTitle>
        </CardHeader>
        <CardContent>
          <PendingPaymentsList fees={pendingFees} />
        </CardContent>
      </Card>
    </div>
  );
}
