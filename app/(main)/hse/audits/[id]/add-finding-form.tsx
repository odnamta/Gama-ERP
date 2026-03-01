'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { createFinding } from '@/lib/audit-actions';
import { FINDING_SEVERITIES, RISK_LEVELS } from '@/types/audit';
import type { FindingSeverity, RiskLevel } from '@/types/audit';

interface AddFindingFormProps {
  auditId: string;
}

export function AddFindingForm({ auditId }: AddFindingFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [severity, setSeverity] = useState<FindingSeverity>('minor');
  const [category, setCategory] = useState('');
  const [findingDescription, setFindingDescription] = useState('');
  const [locationDetail, setLocationDetail] = useState('');
  const [riskLevel, setRiskLevel] = useState<RiskLevel | ''>('');
  const [potentialConsequence, setPotentialConsequence] = useState('');
  const [correctiveAction, setCorrectiveAction] = useState('');
  const [dueDate, setDueDate] = useState('');

  const resetForm = () => {
    setSeverity('minor');
    setCategory('');
    setFindingDescription('');
    setLocationDetail('');
    setRiskLevel('');
    setPotentialConsequence('');
    setCorrectiveAction('');
    setDueDate('');
  };

  const handleSubmit = async () => {
    if (!findingDescription.trim()) {
      toast({ title: 'Error', description: 'Deskripsi temuan wajib diisi', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createFinding({
        audit_id: auditId,
        severity,
        category: category || undefined,
        finding_description: findingDescription,
        location_detail: locationDetail || undefined,
        risk_level: (riskLevel || undefined) as RiskLevel | undefined,
        potential_consequence: potentialConsequence || undefined,
        corrective_action: correctiveAction || undefined,
        due_date: dueDate || undefined,
      });

      if (result.error) {
        toast({ title: 'Error', description: result.error, variant: 'destructive' });
      } else {
        toast({ title: 'Berhasil', description: 'Temuan berhasil ditambahkan' });
        resetForm();
        setDialogOpen(false);
        router.refresh();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Button onClick={() => setDialogOpen(true)} size="sm">
        <Plus className="mr-2 h-4 w-4" />
        Tambah Temuan
      </Button>

      <Dialog open={dialogOpen} onOpenChange={(open) => {
        setDialogOpen(open);
        if (!open) resetForm();
      }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tambah Temuan Baru</DialogTitle>
            <DialogDescription>
              Tambahkan temuan hasil audit. Field bertanda * wajib diisi.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Severity */}
            <div className="space-y-2">
              <Label htmlFor="severity">Severity *</Label>
              <Select value={severity} onValueChange={(v) => setSeverity(v as FindingSeverity)}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih severity" />
                </SelectTrigger>
                <SelectContent>
                  {FINDING_SEVERITIES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Finding Description */}
            <div className="space-y-2">
              <Label htmlFor="finding_description">Deskripsi Temuan *</Label>
              <Textarea
                id="finding_description"
                value={findingDescription}
                onChange={(e) => setFindingDescription(e.target.value)}
                placeholder="Jelaskan temuan yang ditemukan..."
                rows={3}
              />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category">Kategori</Label>
              <Input
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Contoh: keselamatan, lingkungan, dll"
              />
            </div>

            {/* Location Detail */}
            <div className="space-y-2">
              <Label htmlFor="location_detail">Detail Lokasi</Label>
              <Input
                id="location_detail"
                value={locationDetail}
                onChange={(e) => setLocationDetail(e.target.value)}
                placeholder="Lokasi spesifik temuan"
              />
            </div>

            {/* Risk Level */}
            <div className="space-y-2">
              <Label htmlFor="risk_level">Tingkat Risiko</Label>
              <Select value={riskLevel} onValueChange={(v) => setRiskLevel(v as RiskLevel)}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih tingkat risiko" />
                </SelectTrigger>
                <SelectContent>
                  {RISK_LEVELS.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r.charAt(0).toUpperCase() + r.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Potential Consequence */}
            <div className="space-y-2">
              <Label htmlFor="potential_consequence">Potensi Konsekuensi</Label>
              <Textarea
                id="potential_consequence"
                value={potentialConsequence}
                onChange={(e) => setPotentialConsequence(e.target.value)}
                placeholder="Konsekuensi yang mungkin terjadi..."
                rows={2}
              />
            </div>

            {/* Corrective Action */}
            <div className="space-y-2">
              <Label htmlFor="corrective_action">Tindakan Korektif</Label>
              <Textarea
                id="corrective_action"
                value={correctiveAction}
                onChange={(e) => setCorrectiveAction(e.target.value)}
                placeholder="Tindakan korektif yang direkomendasikan..."
                rows={2}
              />
            </div>

            {/* Due Date */}
            <div className="space-y-2">
              <Label htmlFor="due_date">Batas Waktu</Label>
              <Input
                id="due_date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={isSubmitting}>
              Batal
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? 'Menyimpan...' : 'Simpan Temuan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
