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
import { createSurveyToolLoan } from '@/lib/survey-tool-loan-actions';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface EmployeeOption {
  id: string;
  full_name: string;
}

export default function NewSurveyToolLoanPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);

  const [form, setForm] = useState({
    tool_name: '',
    tool_serial_number: '',
    borrower_id: '',
    loan_date: new Date().toISOString().split('T')[0],
    expected_return_date: '',
    loan_condition: 'good',
    notes: '',
  });

  useEffect(() => {
    async function loadEmployees() {
      const supabase = createClient();
      const { data } = await supabase
        .from('user_profiles')
        .select('id, full_name')
        .eq('is_active', true)
        .order('full_name');
      setEmployees((data || []) as EmployeeOption[]);
    }
    loadEmployees();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await createSurveyToolLoan({
      tool_name: form.tool_name,
      tool_serial_number: form.tool_serial_number || undefined,
      borrower_id: form.borrower_id,
      loan_date: form.loan_date,
      expected_return_date: form.expected_return_date || undefined,
      loan_condition: form.loan_condition,
      notes: form.notes || undefined,
    });

    setLoading(false);

    if (result.success && result.data) {
      router.push(`/engineering/survey-tools/${result.data.id}`);
    } else {
      setError(result.error || 'Gagal mencatat peminjaman');
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/engineering/survey-tools">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Catat Peminjaman Alat</h1>
          <p className="text-muted-foreground">Pencatatan peminjaman alat survey</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Detail Peminjaman</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tool_name">Nama Alat *</Label>
              <Input
                id="tool_name"
                value={form.tool_name}
                onChange={(e) => setForm({ ...form, tool_name: e.target.value })}
                placeholder="Contoh: Total Station, GPS RTK, Theodolite, dll."
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tool_serial_number">Nomor Seri</Label>
              <Input
                id="tool_serial_number"
                value={form.tool_serial_number}
                onChange={(e) => setForm({ ...form, tool_serial_number: e.target.value })}
                placeholder="Serial number alat"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="borrower_id">Peminjam *</Label>
              <Select
                value={form.borrower_id}
                onValueChange={(v) => setForm({ ...form, borrower_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih peminjam..." />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="loan_date">Tanggal Pinjam *</Label>
                <Input
                  id="loan_date"
                  type="date"
                  value={form.loan_date}
                  onChange={(e) => setForm({ ...form, loan_date: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expected_return_date">Estimasi Kembali</Label>
                <Input
                  id="expected_return_date"
                  type="date"
                  value={form.expected_return_date}
                  onChange={(e) => setForm({ ...form, expected_return_date: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="loan_condition">Kondisi Saat Pinjam</Label>
              <Select
                value={form.loan_condition}
                onValueChange={(v) => setForm({ ...form, loan_condition: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="good">Baik</SelectItem>
                  <SelectItem value="fair">Cukup</SelectItem>
                  <SelectItem value="needs_repair">Perlu Perbaikan</SelectItem>
                </SelectContent>
              </Select>
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
                Catat Peminjaman
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
