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
import { submitReimbursement } from '@/lib/reimbursement-actions';
import { REIMBURSEMENT_CATEGORIES, ReimbursementCategory } from '@/types/reimbursement';
import { ArrowLeft, Loader2 } from 'lucide-react';

export default function NewReimbursementPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [employees, setEmployees] = useState<{ id: string; full_name: string; employee_code: string }[]>([]);

  const [formData, setFormData] = useState({
    employee_id: '',
    category: '' as ReimbursementCategory | '',
    amount: '',
    description: '',
    receipt_date: '',
    notes: '',
  });

  useEffect(() => {
    async function loadEmployees() {
      try {
        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();
        const { data } = await supabase
          .from('employees')
          .select('id, full_name, employee_code')
          .eq('status', 'active')
          .order('full_name');
        setEmployees(data || []);
      } catch (err) {
        console.error('Failed to load employees:', err);
      }
    }
    loadEmployees();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = await submitReimbursement({
      employee_id: formData.employee_id,
      category: formData.category as ReimbursementCategory,
      amount: parseFloat(formData.amount) || 0,
      description: formData.description,
      receipt_date: formData.receipt_date,
      notes: formData.notes || undefined,
    });

    setLoading(false);

    if (result.success) {
      router.push('/hr/reimbursements');
    } else {
      setError(result.error || 'Gagal mengajukan reimbursement');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/hr/reimbursements">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Ajukan Reimbursement</h1>
          <p className="text-muted-foreground">Isi formulir klaim reimbursement</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detail Reimbursement</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-800 bg-red-100 rounded-md">{error}</div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="employee_id">Karyawan *</Label>
                <Select
                  value={formData.employee_id}
                  onValueChange={(v) => setFormData((p) => ({ ...p, employee_id: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih karyawan" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.full_name} ({emp.employee_code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Kategori *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(v) =>
                    setFormData((p) => ({ ...p, category: v as ReimbursementCategory }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    {REIMBURSEMENT_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="amount">Jumlah (Rp) *</Label>
                <Input
                  id="amount"
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData((p) => ({ ...p, amount: e.target.value }))}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="receipt_date">Tanggal Kwitansi *</Label>
                <Input
                  id="receipt_date"
                  type="date"
                  value={formData.receipt_date}
                  onChange={(e) => setFormData((p) => ({ ...p, receipt_date: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Deskripsi *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                placeholder="Jelaskan detail pengeluaran"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Catatan</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData((p) => ({ ...p, notes: e.target.value }))}
                placeholder="Catatan tambahan (opsional)"
                rows={2}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Ajukan Reimbursement
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/hr/reimbursements">Batal</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
