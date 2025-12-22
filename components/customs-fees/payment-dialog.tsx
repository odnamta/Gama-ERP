'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { markFeePaid } from '@/lib/fee-actions';
import { formatFeeAmount } from '@/lib/fee-utils';
import { CustomsFeeWithRelations, PaymentFormData, PAYMENT_METHODS, PAYMENT_METHOD_LABELS, PaymentMethod } from '@/types/customs-fees';
import { format } from 'date-fns';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PaymentDialogProps {
  fee: CustomsFeeWithRelations;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PaymentDialog({ fee, open, onOpenChange }: PaymentDialogProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [paymentDate, setPaymentDate] = useState<Date | undefined>(new Date());
  const [paymentMethod, setPaymentMethod] = useState<string>('');
  const [paymentReference, setPaymentReference] = useState('');
  const [ntpn, setNtpn] = useState('');
  const [ntb, setNtb] = useState('');
  const [billingCode, setBillingCode] = useState('');

  const isGovernmentFee = fee.fee_type?.is_government_fee ?? false;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentDate) return;

    setLoading(true);
    const data: PaymentFormData = {
      payment_date: format(paymentDate, 'yyyy-MM-dd'),
      payment_method: paymentMethod || undefined,
      payment_reference: paymentReference || undefined,
      ntpn: ntpn || undefined,
      ntb: ntb || undefined,
      billing_code: billingCode || undefined,
    };

    const result = await markFeePaid(fee.id, data);
    setLoading(false);

    if (result.success) {
      onOpenChange(false);
      router.refresh();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
          <DialogDescription>
            Record payment for {fee.fee_type?.fee_name} - {formatFeeAmount(fee.amount, fee.currency)}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Payment Date */}
          <div className="space-y-2">
            <Label>Payment Date *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !paymentDate && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {paymentDate ? format(paymentDate, 'dd/MM/yyyy') : 'Select date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={paymentDate}
                  onSelect={setPaymentDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Payment Method */}
          <div className="space-y-2">
            <Label>Payment Method</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger>
                <SelectValue placeholder="Select method" />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_METHODS.map((method) => (
                  <SelectItem key={method} value={method}>
                    {PAYMENT_METHOD_LABELS[method as PaymentMethod]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Payment Reference */}
          <div className="space-y-2">
            <Label>Payment Reference</Label>
            <Input
              value={paymentReference}
              onChange={(e) => setPaymentReference(e.target.value)}
              placeholder="Transaction ID or reference number"
            />
          </div>

          {/* Government Fee Fields */}
          {isGovernmentFee && (
            <>
              <div className="border-t pt-4">
                <p className="text-sm font-medium mb-3">Government Payment Details</p>
              </div>

              <div className="space-y-2">
                <Label>NTPN (Nomor Transaksi Penerimaan Negara)</Label>
                <Input
                  value={ntpn}
                  onChange={(e) => setNtpn(e.target.value)}
                  placeholder="Enter NTPN"
                />
              </div>

              <div className="space-y-2">
                <Label>NTB (Nomor Transaksi Bank)</Label>
                <Input
                  value={ntb}
                  onChange={(e) => setNtb(e.target.value)}
                  placeholder="Enter NTB"
                />
              </div>

              <div className="space-y-2">
                <Label>Billing Code</Label>
                <Input
                  value={billingCode}
                  onChange={(e) => setBillingCode(e.target.value)}
                  placeholder="Enter billing code"
                />
              </div>
            </>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !paymentDate}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Record Payment
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
