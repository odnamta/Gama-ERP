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
import { toast } from 'sonner';
import { deleteMedicalCheckup } from '@/lib/medical-checkup-actions';

interface McuDeleteButtonProps {
  checkupId: string;
  employeeName: string;
}

export function McuDeleteButton({ checkupId, employeeName }: McuDeleteButtonProps) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteMedicalCheckup(checkupId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('Data MCU berhasil dihapus');
        router.push('/hse/medical-checkups');
      }
    } finally {
      setIsDeleting(false);
      setDialogOpen(false);
    }
  };

  return (
    <>
      <Button variant="destructive" size="sm" onClick={() => setDialogOpen(true)}>
        <Trash2 className="mr-2 h-4 w-4" />
        Hapus
      </Button>

      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Data MCU</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus data medical checkup untuk{' '}
              <strong>{employeeName}</strong>? Data akan dinonaktifkan dan tidak
              akan muncul di daftar.
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
