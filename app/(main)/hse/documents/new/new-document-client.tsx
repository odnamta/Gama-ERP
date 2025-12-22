'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { DocumentCategory, CreateDocumentInput } from '@/types/safety-document';
import { CategorySelect } from '@/components/safety-documents';
import { createSafetyDocument } from '@/lib/safety-document-actions';
import { calculateExpiryDate } from '@/lib/safety-document-utils';
import { useToast } from '@/hooks/use-toast';

interface NewDocumentClientProps {
  categories: DocumentCategory[];
}

export function NewDocumentClient({ categories }: NewDocumentClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<DocumentCategory | null>(null);
  const [formData, setFormData] = useState<CreateDocumentInput>({
    categoryId: '',
    title: '',
    description: '',
    content: '',
    effectiveDate: new Date().toISOString().split('T')[0],
    expiryDate: '',
    requiresAcknowledgment: false,
  });

  const handleCategoryChange = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    setSelectedCategory(category || null);
    
    let expiryDate = '';
    if (category?.defaultValidityDays && formData.effectiveDate) {
      const effective = new Date(formData.effectiveDate);
      const expiry = calculateExpiryDate(effective, category.defaultValidityDays);
      expiryDate = expiry.toISOString().split('T')[0];
    }

    setFormData({
      ...formData,
      categoryId,
      expiryDate,
    });
  };

  const handleEffectiveDateChange = (date: string) => {
    let expiryDate = formData.expiryDate;
    if (selectedCategory?.defaultValidityDays && date) {
      const effective = new Date(date);
      const expiry = calculateExpiryDate(effective, selectedCategory.defaultValidityDays);
      expiryDate = expiry.toISOString().split('T')[0];
    }

    setFormData({
      ...formData,
      effectiveDate: date,
      expiryDate,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const result = await createSafetyDocument(formData);
    setLoading(false);

    if (result.success && result.data) {
      toast({
        title: 'Berhasil',
        description: 'Dokumen berhasil dibuat',
      });
      router.push(`/hse/documents/${result.data.id}`);
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
        <Link href="/hse/documents">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Buat Dokumen Baru</h1>
          <p className="text-muted-foreground">
            Buat dokumen keselamatan baru
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informasi Dokumen</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Kategori *</Label>
                <CategorySelect
                  categories={categories}
                  value={formData.categoryId}
                  onValueChange={handleCategoryChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="title">Judul *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Judul dokumen"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Deskripsi</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Deskripsi singkat dokumen"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="effectiveDate">Tanggal Efektif *</Label>
                <Input
                  id="effectiveDate"
                  type="date"
                  value={formData.effectiveDate}
                  onChange={(e) => handleEffectiveDateChange(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expiryDate">
                  Tanggal Kadaluarsa
                  {selectedCategory?.requiresExpiry && ' *'}
                </Label>
                <Input
                  id="expiryDate"
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                  required={selectedCategory?.requiresExpiry}
                />
                {selectedCategory?.defaultValidityDays && (
                  <p className="text-xs text-muted-foreground">
                    Default: {selectedCategory.defaultValidityDays} hari dari tanggal efektif
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Konten Dokumen</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Isi dokumen (untuk toolbox talk, prosedur, dll.)"
                rows={8}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="requiresAcknowledgment"
                checked={formData.requiresAcknowledgment}
                onCheckedChange={(checked) => setFormData({ ...formData, requiresAcknowledgment: checked })}
              />
              <Label htmlFor="requiresAcknowledgment">
                Memerlukan pengakuan dari karyawan
              </Label>
            </div>

            <div className="flex justify-end gap-2">
              <Link href="/hse/documents">
                <Button type="button" variant="outline">
                  Batal
                </Button>
              </Link>
              <Button type="submit" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Simpan Dokumen
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
