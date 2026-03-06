'use client';

import { useState, useEffect } from 'react';
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
import { createSPK } from '@/lib/spk-actions';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface VendorOption {
  id: string;
  vendor_name: string;
  vendor_code: string;
}

export default function NewWorkOrderPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [vendors, setVendors] = useState<VendorOption[]>([]);

  const [form, setForm] = useState({
    vendor_id: '',
    work_description: '',
    location: '',
    scheduled_start: '',
    scheduled_end: '',
    agreed_amount: '',
    notes: '',
  });

  useEffect(() => {
    async function loadVendors() {
      const supabase = createClient();
      const { data } = await supabase
        .from('vendors')
        .select('id, vendor_name, vendor_code')
        .eq('is_active', true)
        .order('vendor_name');
      setVendors((data || []) as VendorOption[]);
    }
    loadVendors();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await createSPK({
      vendor_id: form.vendor_id,
      work_description: form.work_description,
      location: form.location || undefined,
      scheduled_start: form.scheduled_start,
      scheduled_end: form.scheduled_end,
      agreed_amount: form.agreed_amount ? parseFloat(form.agreed_amount) : undefined,
      notes: form.notes || undefined,
    });

    setLoading(false);

    if (result.success && result.data) {
      router.push(`/vendors/work-orders/${result.data.id}`);
    } else {
      setError(result.error || 'Gagal membuat SPK');
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/vendors/work-orders">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Buat SPK Baru</h1>
          <p className="text-muted-foreground">Surat Perintah Kerja untuk vendor</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Detail SPK</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="vendor_id">Vendor *</Label>
              <Select
                value={form.vendor_id}
                onValueChange={(v) => setForm({ ...form, vendor_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih vendor..." />
                </SelectTrigger>
                <SelectContent>
                  {vendors.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.vendor_code} - {v.vendor_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="work_description">Deskripsi Pekerjaan *</Label>
              <Textarea
                id="work_description"
                value={form.work_description}
                onChange={(e) => setForm({ ...form, work_description: e.target.value })}
                placeholder="Jelaskan detail pekerjaan yang akan dilakukan vendor..."
                rows={3}
                required
              />
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

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="scheduled_start">Tanggal Mulai *</Label>
                <Input
                  id="scheduled_start"
                  type="date"
                  value={form.scheduled_start}
                  onChange={(e) => setForm({ ...form, scheduled_start: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="scheduled_end">Tanggal Selesai *</Label>
                <Input
                  id="scheduled_end"
                  type="date"
                  value={form.scheduled_end}
                  onChange={(e) => setForm({ ...form, scheduled_end: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="agreed_amount">Nilai Kesepakatan (Rp)</Label>
              <Input
                id="agreed_amount"
                type="number"
                value={form.agreed_amount}
                onChange={(e) => setForm({ ...form, agreed_amount: e.target.value })}
                placeholder="0"
                min="0"
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
                Buat SPK
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
