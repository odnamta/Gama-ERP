'use client';

import { useState } from 'react';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { JSAHazard, RiskLevel, JSAHazardInput } from '@/types/safety-document';
import { addJSAHazard, updateJSAHazard } from '@/lib/safety-document-actions';
import { useToast } from '@/hooks/use-toast';

interface JSAHazardFormProps {
  documentId: string;
  hazard?: JSAHazard;
  nextStepNumber: number;
  onSuccess: () => void;
  onCancel: () => void;
}

export function JSAHazardForm({
  documentId,
  hazard,
  nextStepNumber,
  onSuccess,
  onCancel,
}: JSAHazardFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<JSAHazardInput>({
    stepNumber: hazard?.stepNumber || nextStepNumber,
    workStep: hazard?.workStep || '',
    hazards: hazard?.hazards || '',
    consequences: hazard?.consequences || '',
    riskLevel: hazard?.riskLevel,
    controlMeasures: hazard?.controlMeasures || '',
    responsible: hazard?.responsible || '',
  });
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const result = hazard
      ? await updateJSAHazard(hazard.id, formData)
      : await addJSAHazard(documentId, formData);

    setLoading(false);

    if (result.success) {
      toast({
        title: 'Berhasil',
        description: hazard ? 'Langkah JSA berhasil diperbarui' : 'Langkah JSA berhasil ditambahkan',
      });
      onSuccess();
    } else {
      toast({
        title: 'Error',
        description: result.error,
        variant: 'destructive',
      });
    }
  };

  const riskLevels: { value: RiskLevel; label: string }[] = [
    { value: 'low', label: 'Rendah' },
    { value: 'medium', label: 'Sedang' },
    { value: 'high', label: 'Tinggi' },
    { value: 'extreme', label: 'Ekstrem' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{hazard ? 'Edit Langkah JSA' : 'Tambah Langkah JSA'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="stepNumber">Nomor Langkah</Label>
              <Input
                id="stepNumber"
                type="number"
                min={1}
                value={formData.stepNumber}
                onChange={(e) => setFormData({ ...formData, stepNumber: parseInt(e.target.value) || 1 })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="riskLevel">Tingkat Risiko</Label>
              <Select
                value={formData.riskLevel}
                onValueChange={(value) => setFormData({ ...formData, riskLevel: value as RiskLevel })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih tingkat risiko" />
                </SelectTrigger>
                <SelectContent>
                  {riskLevels.map((level) => (
                    <SelectItem key={level.value} value={level.value}>
                      {level.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="workStep">Langkah Kerja *</Label>
            <Textarea
              id="workStep"
              value={formData.workStep}
              onChange={(e) => setFormData({ ...formData, workStep: e.target.value })}
              placeholder="Deskripsi langkah kerja"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="hazards">Bahaya *</Label>
            <Textarea
              id="hazards"
              value={formData.hazards}
              onChange={(e) => setFormData({ ...formData, hazards: e.target.value })}
              placeholder="Identifikasi bahaya pada langkah ini"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="consequences">Konsekuensi</Label>
            <Textarea
              id="consequences"
              value={formData.consequences}
              onChange={(e) => setFormData({ ...formData, consequences: e.target.value })}
              placeholder="Konsekuensi jika bahaya terjadi"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="controlMeasures">Tindakan Pengendalian *</Label>
            <Textarea
              id="controlMeasures"
              value={formData.controlMeasures}
              onChange={(e) => setFormData({ ...formData, controlMeasures: e.target.value })}
              placeholder="Tindakan untuk mengendalikan bahaya"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="responsible">Penanggung Jawab</Label>
            <Input
              id="responsible"
              value={formData.responsible}
              onChange={(e) => setFormData({ ...formData, responsible: e.target.value })}
              placeholder="Nama atau jabatan penanggung jawab"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              Batal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Menyimpan...' : hazard ? 'Perbarui' : 'Tambah'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
