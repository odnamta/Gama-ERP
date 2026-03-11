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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  approveTrainingRequest,
  rejectTrainingRequest,
  deleteTrainingRequest,
} from '@/lib/training-request-actions';
import { CheckCircle, XCircle, Trash2, Loader2 } from 'lucide-react';

interface TrainingRequestActionsProps {
  requestId: string;
  requestNumber: string;
  showApproveReject: boolean;
  showDelete: boolean;
}

export function TrainingRequestActions({
  requestId,
  requestNumber,
  showApproveReject,
  showDelete,
}: TrainingRequestActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleApprove() {
    setLoading(true);
    const result = await approveTrainingRequest(requestId);
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
    const result = await rejectTrainingRequest(requestId, rejectReason);
    setLoading(false);
    if (result.success) {
      setShowRejectDialog(false);
      router.refresh();
    } else {
      alert(result.error || 'Gagal menolak');
    }
  }

  async function handleDelete() {
    setIsDeleting(true);
    const result = await deleteTrainingRequest(requestId);
    setIsDeleting(false);
    if (result.success) {
      setShowDeleteDialog(false);
      router.push('/hse/training/requests');
    } else {
      alert(result.error || 'Gagal menghapus');
    }
  }

  return (
    <>
      <Card className="p-4">
        <div className="flex gap-2">
          {showApproveReject && (
            <>
              <Button onClick={handleApprove} disabled={loading || isDeleting} className="bg-green-600 hover:bg-green-700">
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                Setujui
              </Button>
              <Button
                variant="destructive"
                onClick={() => setShowRejectDialog(true)}
                disabled={loading || isDeleting}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Tolak
              </Button>
            </>
          )}
          {showDelete && (
            <Button
              variant="destructive"
              onClick={() => setShowDeleteDialog(true)}
              disabled={loading || isDeleting}
              className={showApproveReject ? 'ml-auto' : ''}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Hapus Request
            </Button>
          )}
        </div>
      </Card>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tolak Permintaan Training</DialogTitle>
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Request</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus training request &quot;{requestNumber}&quot;?
              Request akan ditandai sebagai tidak aktif dan tidak akan muncul di daftar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Menghapus...' : 'Hapus'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
