'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { createTimesheet } from '@/lib/timesheet-actions';
import { ArrowLeft, Loader2 } from 'lucide-react';

export default function NewTimesheetPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    equipment_name: '',
    operator_name: '',
    work_date: '',
    start_time: '',
    end_time: '',
    hours_worked: '',
    work_description: '',
    location: '',
    notes: '',
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await createTimesheet({
      equipment_name: form.equipment_name,
      operator_name: form.operator_name || undefined,
      work_date: form.work_date,
      start_time: form.start_time || undefined,
      end_time: form.end_time || undefined,
      hours_worked: form.hours_worked ? parseFloat(form.hours_worked) : undefined,
      work_description: form.work_description || undefined,
      location: form.location || undefined,
      notes: form.notes || undefined,
    });

    setLoading(false);

    if (result.success && result.data) {
      router.push(`/equipment/timesheets/${result.data.id}`);
    } else {
      setError(result.error || 'Gagal membuat timesheet');
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/equipment/timesheets">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Buat Timesheet</h1>
          <p className="text-muted-foreground">Catat waktu kerja peralatan rental</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Detail Timesheet</CardTitle>
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
                <Label htmlFor="operator_name">Nama Operator</Label>
                <Input
                  id="operator_name"
                  value={form.operator_name}
                  onChange={(e) => setForm({ ...form, operator_name: e.target.value })}
                  placeholder="Nama operator"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="work_date">Tanggal Kerja *</Label>
                <Input
                  id="work_date"
                  type="date"
                  value={form.work_date}
                  onChange={(e) => setForm({ ...form, work_date: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="start_time">Jam Mulai</Label>
                <Input
                  id="start_time"
                  type="time"
                  value={form.start_time}
                  onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_time">Jam Selesai</Label>
                <Input
                  id="end_time"
                  type="time"
                  value={form.end_time}
                  onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hours_worked">Total Jam Kerja</Label>
                <Input
                  id="hours_worked"
                  type="number"
                  step="0.5"
                  min="0"
                  value={form.hours_worked}
                  onChange={(e) => setForm({ ...form, hours_worked: e.target.value })}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Lokasi</Label>
              <Input
                id="location"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="Lokasi pekerjaan"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="work_description">Deskripsi Pekerjaan</Label>
              <Textarea
                id="work_description"
                value={form.work_description}
                onChange={(e) => setForm({ ...form, work_description: e.target.value })}
                placeholder="Jelaskan pekerjaan yang dilakukan..."
                rows={3}
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
                Buat Timesheet
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
