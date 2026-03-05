'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  submitPurchaseOrder,
  approvePurchaseOrder,
  rejectPurchaseOrder,
  receivePurchaseOrder,
  cancelPurchaseOrder,
} from '@/lib/purchase-order-actions';
import { POStatus } from '@/types/purchase-order';
import { Send, CheckCircle, XCircle, PackageCheck, Ban, Loader2 } from 'lucide-react';

interface Props {
  poId: string;
  status: POStatus;
  canCreate: boolean;
  canApprove: boolean;
  canReceive: boolean;
}

export function POActions({ poId, status, canCreate, canApprove, canReceive }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const showActions =
    (status === 'draft' && canCreate) ||
    (status === 'submitted' && canApprove) ||
    (status === 'approved' && canReceive);

  if (!showActions) return null;

  async function handleAction(action: () => Promise<{ success: boolean; error?: string }>) {
    setLoading(true);
    const result = await action();
    setLoading(false);
    if (result.success) {
      router.refresh();
    } else {
      alert(result.error || 'Terjadi kesalahan');
    }
  }

  async function handleReject() {
    if (!rejectReason.trim()) return;
    setLoading(true);
    const result = await rejectPurchaseOrder(poId, rejectReason);
    setLoading(false);
    if (result.success) {
      setShowRejectDialog(false);
      router.refresh();
    } else {
      alert(result.error || 'Gagal menolak');
    }
  }

  return (
    <>
      <Card className="p-4">
        <div className="flex gap-2">
          {status === 'draft' && canCreate && (
            <>
              <Button
                onClick={() => handleAction(() => submitPurchaseOrder(poId))}
                disabled={loading}
              >
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                Submit PO
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleAction(() => cancelPurchaseOrder(poId))}
                disabled={loading}
              >
                <Ban className="mr-2 h-4 w-4" />
                Batalkan
              </Button>
            </>
          )}
          {status === 'submitted' && canApprove && (
            <>
              <Button
                onClick={() => handleAction(() => approvePurchaseOrder(poId))}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700"
              >
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
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
          {status === 'approved' && canReceive && (
            <Button
              onClick={() => handleAction(() => receivePurchaseOrder(poId))}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PackageCheck className="mr-2 h-4 w-4" />}
              Tandai Diterima
            </Button>
          )}
        </div>
      </Card>

      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tolak Purchase Order</DialogTitle>
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
    </>
  );
}
