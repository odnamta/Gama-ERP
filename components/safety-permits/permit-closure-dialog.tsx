'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { CheckCircle, Loader2 } from 'lucide-react';
import { closePermit } from '@/lib/safety-permit-actions';
import { useToast } from '@/hooks/use-toast';

interface PermitClosureDialogProps {
  permitId: string;
  onSuccess: () => void;
}

export function PermitClosureDialog({ permitId, onSuccess }: PermitClosureDialogProps) {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleClose = async () => {
    if (!notes.trim()) {
      toast({
        title: 'Error',
        description: 'Catatan penutupan wajib diisi',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    const result = await closePermit(permitId, notes);
    setLoading(false);

    if (result.success) {
      toast({ title: 'Berhasil', description: 'Izin kerja berhasil ditutup' });
      setOpen(false);
      setNotes('');
      onSuccess();
    } else {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <CheckCircle className="h-4 w-4" />
          Tutup Izin Kerja
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tutup Izin Kerja</DialogTitle>
          <DialogDescription>
            Pastikan semua pekerjaan telah selesai dan area kerja sudah aman sebelum menutup izin.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="notes">Catatan Penutupan *</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Deskripsi kondisi akhir pekerjaan, catatan keselamatan, dll."
              rows={4}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Batal
          </Button>
          <Button onClick={handleClose} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Tutup Izin
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
