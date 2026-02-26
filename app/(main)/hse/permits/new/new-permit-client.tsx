'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { CreatePermitInput, PermitType, PERMIT_TYPE_LABELS } from '@/types/safety-document';
import { createSafetyPermit } from '@/lib/safety-permit-actions';
import { useToast } from '@/hooks/use-toast';

interface NewPermitClientProps {
  jobOrders: { id: string; jo_number: string }[];
  readOnly?: boolean;
}

const PPE_OPTIONS = [
  { id: 'helmet', label: 'Helm Keselamatan' },
  { id: 'safety_glasses', label: 'Kacamata Keselamatan' },
  { id: 'face_shield', label: 'Pelindung Wajah' },
  { id: 'ear_plugs', label: 'Pelindung Telinga' },
  { id: 'respirator', label: 'Respirator' },
  { id: 'gloves', label: 'Sarung Tangan' },
  { id: 'safety_shoes', label: 'Sepatu Keselamatan' },
  { id: 'safety_vest', label: 'Rompi Keselamatan' },
  { id: 'harness', label: 'Full Body Harness' },
  { id: 'fire_blanket', label: 'Selimut Api' },
];

const NO_JO_VALUE = '__none__';

export function NewPermitClient({ jobOrders, readOnly }: NewPermitClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreatePermitInput>({
    permitType: 'hot_work',
    workDescription: '',
    workLocation: '',
    validFrom: new Date().toISOString().slice(0, 16),
    validTo: '',
    requiredPPE: [],
    specialPrecautions: '',
    emergencyProcedures: '',
  });

  const handlePPEChange = (ppeId: string, checked: boolean) => {
    const currentPPE = formData.requiredPPE || [];
    if (checked) {
      setFormData({ ...formData, requiredPPE: [...currentPPE, ppeId] });
    } else {
      setFormData({ ...formData, requiredPPE: currentPPE.filter(p => p !== ppeId) });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (readOnly) return;
    setLoading(true);

    const result = await createSafetyPermit(formData);
    setLoading(false);

    if (result.success && result.data) {
      toast({
        title: 'Berhasil',
        description: 'Izin kerja berhasil dibuat',
      });
      router.push(`/hse/permits/${result.data.id}`);
    } else {
      toast({
        title: 'Error',
        description: result.error,
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/hse/permits">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Buat Izin Kerja Baru</h1>
          <p className="text-muted-foreground">
            Buat permit to work untuk pekerjaan berbahaya
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Informasi Pekerjaan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="permitType">Jenis Izin *</Label>
                <Select
                  value={formData.permitType}
                  onValueChange={(value) => setFormData({ ...formData, permitType: value as PermitType })}
                  disabled={readOnly}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih jenis izin" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PERMIT_TYPE_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="jobOrderId">Job Order (Opsional)</Label>
                <Select
                  value={formData.jobOrderId || NO_JO_VALUE}
                  onValueChange={(value) => setFormData({ ...formData, jobOrderId: value === NO_JO_VALUE ? undefined : value })}
                  disabled={readOnly}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih job order" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_JO_VALUE}>Tidak terkait JO</SelectItem>
                    {jobOrders.map((jo) => (
                      <SelectItem key={jo.id} value={jo.id}>
                        {jo.jo_number}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="workDescription">Deskripsi Pekerjaan *</Label>
              <Textarea
                id="workDescription"
                value={formData.workDescription}
                onChange={(e) => setFormData({ ...formData, workDescription: e.target.value })}
                placeholder="Jelaskan pekerjaan yang akan dilakukan"
                rows={3}
                required
                disabled={readOnly}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="workLocation">Lokasi Pekerjaan *</Label>
              <Input
                id="workLocation"
                value={formData.workLocation}
                onChange={(e) => setFormData({ ...formData, workLocation: e.target.value })}
                placeholder="Lokasi spesifik pekerjaan"
                required
                disabled={readOnly}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="validFrom">Berlaku Dari *</Label>
                <Input
                  id="validFrom"
                  type="datetime-local"
                  value={formData.validFrom}
                  onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                  required
                  disabled={readOnly}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="validTo">Berlaku Sampai *</Label>
                <Input
                  id="validTo"
                  type="datetime-local"
                  value={formData.validTo}
                  onChange={(e) => setFormData({ ...formData, validTo: e.target.value })}
                  required
                  disabled={readOnly}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Persyaratan Keselamatan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>APD yang Diperlukan</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {PPE_OPTIONS.map((ppe) => (
                  <div key={ppe.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={ppe.id}
                      checked={formData.requiredPPE?.includes(ppe.id)}
                      onCheckedChange={(checked) => handlePPEChange(ppe.id, checked as boolean)}
                      disabled={readOnly}
                    />
                    <Label htmlFor={ppe.id} className="text-sm font-normal cursor-pointer">
                      {ppe.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="specialPrecautions">Tindakan Pencegahan Khusus</Label>
              <Textarea
                id="specialPrecautions"
                value={formData.specialPrecautions}
                onChange={(e) => setFormData({ ...formData, specialPrecautions: e.target.value })}
                placeholder="Tindakan pencegahan khusus yang harus diambil"
                rows={3}
                disabled={readOnly}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="emergencyProcedures">Prosedur Darurat</Label>
              <Textarea
                id="emergencyProcedures"
                value={formData.emergencyProcedures}
                onChange={(e) => setFormData({ ...formData, emergencyProcedures: e.target.value })}
                placeholder="Prosedur yang harus diikuti dalam keadaan darurat"
                rows={3}
                disabled={readOnly}
              />
            </div>
          </CardContent>
        </Card>

        {!readOnly && (
          <div className="flex justify-end gap-2">
            <Link href="/hse/permits">
              <Button type="button" variant="outline">
                Batal
              </Button>
            </Link>
            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Ajukan Izin Kerja
            </Button>
          </div>
        )}
      </form>
    </div>
  );
}
