'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  approveReimbursement,
  rejectReimbursement,
  markReimbursementPaid,
} from '@/lib/reimbursement-actions';
import { ReimbursementStatus } from '@/types/reimbursement';
import { CheckCircle, XCircle, Banknote, Loader2 } from 'lucide-react';

interface Props {
  requestId: string;
  status: ReimbursementStatus;
  canApprove: boolean;
  canPay: boolean;
}

export function ReimbursementActions({ requestId, status, canApprove, canPay }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showPayDialog, setShowPayDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [paymentReference, setPaymentReference] = useState('');

  async function handleApprove() {
    setLoading(true);
    const result = await approveReimbursement(requestId);
    setLoading(false);
    if (result.success) {
      router.refresh();
    } else {
      alert(result.error || 'Gagal menyetujui');
    }
  }

  async function handleReject() {
    if (!rejectReason.trim()) return;
    setLoading(true);
    const result = await rejectReimbursement(requestId, rejectReason);
    setLoading(false);
    if (result.success) {
      setShowRejectDialog(false);
      router.refresh();
    } else {
      alert(result.error || 'Gagal menolak');
    }
  }

  async function handlePay() {
    setLoading(true);
    const result = await markReimbursementPaid(requestId, paymentReference || undefined);
    setLoading(false);
    if (result.success) {
      setShowPayDialog(false);
      router.refresh();
    } else {
      alert(result.error || 'Gagal memproses pembayaran');
    }
  }

  return (
    <>
      <Card className="p-4">
        <div className="flex gap-2">
          {canApprove && status === 'pending' && (
            <>
              <Button
                onClick={handleApprove}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700"
              >
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="mr-2 h-4 w-4" />
                )}
                Setujui
              </Button>
              <Button
                variant="destructive"
                onClick={() => setShowRejectDialog(true)}
                disabled={loading}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Tolak
              </Button>
            </>
          )}
          {canPay && status === 'approved' && (
            <Button
              onClick={() => setShowPayDialog(true)}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Banknote className="mr-2 h-4 w-4" />
              Proses Pembayaran
            </Button>
          )}
        </div>
      </Card>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tolak Reimbursement</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Textarea
              placeholder="Alasan penolakan..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={loading || !rejectReason.trim()}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Tolak
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pay Dialog */}
      <Dialog open={showPayDialog} onOpenChange={setShowPayDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Proses Pembayaran</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Referensi Pembayaran (opsional)</Label>
            <Input
              placeholder="No. transfer / bukti bayar"
              value={paymentReference}
              onChange={(e) => setPaymentReference(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPayDialog(false)}>
              Batal
            </Button>
            <Button onClick={handlePay} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Konfirmasi Pembayaran
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
