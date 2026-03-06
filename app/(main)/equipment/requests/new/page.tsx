'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { submitEquipmentRequest } from '@/lib/equipment-request-actions';
import { PRIORITY_LABELS, RequestPriority } from '@/types/equipment-request';
import { ArrowLeft, Loader2 } from 'lucide-react';

export default function NewEquipmentRequestPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    equipment_name: '',
    usage_start_date: '',
    usage_end_date: '',
    business_justification: '',
    priority: 'normal' as RequestPriority,
    notes: '',
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await submitEquipmentRequest({
      equipment_name: form.equipment_name,
      usage_start_date: form.usage_start_date,
      usage_end_date: form.usage_end_date,
      business_justification: form.business_justification,
      priority: form.priority,
      notes: form.notes || undefined,
    });

    setLoading(false);

    if (result.success) {
      router.push('/equipment/requests');
    } else {
      setError(result.error || 'Gagal mengajukan permintaan');
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/equipment/requests">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Ajukan Permintaan Peralatan</h1>
          <p className="text-muted-foreground">Isi formulir di bawah untuk mengajukan permintaan peralatan</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Detail Permintaan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="equipment_name">Nama Peralatan *</Label>
              <Input
                id="equipment_name"
                value={form.equipment_name}
                onChange={(e) => setForm({ ...form, equipment_name: e.target.value })}
                placeholder="Contoh: Crane 50 Ton, Trailer Lowbed, dll."
                required
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="usage_start_date">Tanggal Mulai *</Label>
                <Input
                  id="usage_start_date"
                  type="date"
                  value={form.usage_start_date}
                  onChange={(e) => setForm({ ...form, usage_start_date: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="usage_end_date">Tanggal Selesai *</Label>
                <Input
                  id="usage_end_date"
                  type="date"
                  value={form.usage_end_date}
                  onChange={(e) => setForm({ ...form, usage_end_date: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Prioritas</Label>
              <Select
                value={form.priority}
                onValueChange={(v) => setForm({ ...form, priority: v as RequestPriority })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.entries(PRIORITY_LABELS) as [RequestPriority, string][]).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="business_justification">Justifikasi Kebutuhan *</Label>
              <Textarea
                id="business_justification"
                value={form.business_justification}
                onChange={(e) => setForm({ ...form, business_justification: e.target.value })}
                placeholder="Jelaskan alasan permintaan peralatan ini..."
                rows={3}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Catatan (opsional)</Label>
              <Textarea
                id="notes"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Catatan tambahan..."
                rows={2}
              />
            </div>

            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}

            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Ajukan Permintaan
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Batal
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
