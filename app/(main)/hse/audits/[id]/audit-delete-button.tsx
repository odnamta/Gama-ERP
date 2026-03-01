'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { useToast } from '@/hooks/use-toast';
import { deactivateAudit } from '@/lib/audit-actions';

interface AuditDeleteButtonProps {
  auditId: string;
  auditNumber: string;
  status: string;
}

export function AuditDeleteButton({ auditId, auditNumber, status }: AuditDeleteButtonProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Only show for scheduled audits (audits start as 'scheduled', no 'draft' status)
  const canDelete = status === 'scheduled';
  if (!canDelete) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deactivateAudit(auditId);
      if (result.error) {
        toast({ title: 'Error', description: result.error, variant: 'destructive' });
      } else {
        toast({ title: 'Success', description: 'Audit berhasil dihapus' });
        router.push('/hse/audits');
      }
    } finally {
      setIsDeleting(false);
      setDialogOpen(false);
    }
  };

  return (
    <>
      <Button variant="destructive" onClick={() => setDialogOpen(true)}>
        <Trash2 className="mr-2 h-4 w-4" />
        Hapus Audit
      </Button>

      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Audit</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus audit {auditNumber}?
              Audit akan dinonaktifkan dan tidak akan muncul di daftar.
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
