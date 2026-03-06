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
  checkEquipmentRequest,
  approveEquipmentRequest,
  rejectEquipmentRequest,
} from '@/lib/equipment-request-actions';
import { EquipmentRequestStatus } from '@/types/equipment-request';
import { ClipboardCheck, CheckCircle, XCircle, Loader2 } from 'lucide-react';

interface Props {
  requestId: string;
  status: EquipmentRequestStatus;
}

export function EquipmentRequestActions({ requestId, status }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  async function handleCheck() {
    setLoading(true);
    const result = await checkEquipmentRequest(requestId);
    setLoading(false);
    if (result.success) {
      router.refresh();
    } else {
      alert(result.error || 'Gagal memverifikasi');
    }
  }

  async function handleApprove() {
    setLoading(true);
    const result = await approveEquipmentRequest(requestId);
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
    const result = await rejectEquipmentRequest(requestId, rejectReason);
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
          {status === 'pending' && (
            <>
              <Button
                onClick={handleCheck}
                disabled={loading}
                className="bg-amber-600 hover:bg-amber-700"
              >
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <ClipboardCheck className="mr-2 h-4 w-4" />
                )}
                Verifikasi (Manager)
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
          {status === 'checked' && (
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
                Setujui (Approval)
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
        </div>
      </Card>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tolak Permintaan Peralatan</DialogTitle>
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
