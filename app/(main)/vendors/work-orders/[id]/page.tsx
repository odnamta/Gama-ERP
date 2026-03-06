import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getSPKById } from '@/lib/spk-actions';
import { getUserProfile } from '@/lib/permissions-server';
import { canAccessFeature } from '@/lib/permissions';
import { SPKStatus } from '@/types/vendor-work-order';
import { formatDate, formatCurrency } from '@/lib/utils/format';
import { ArrowLeft } from 'lucide-react';
import { SPKActions } from './actions-client';

function StatusBadge({ status }: { status: SPKStatus }) {
  switch (status) {
    case 'draft':
      return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Draft</Badge>;
    case 'issued':
      return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Diterbitkan</Badge>;
    case 'in_progress':
      return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Berjalan</Badge>;
    case 'completed':
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Selesai</Badge>;
    case 'cancelled':
      return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Dibatalkan</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export default async function WorkOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [spk, profile] = await Promise.all([
    getSPKById(id),
    getUserProfile(),
  ]);

  if (!spk) notFound();

  const canManage = canAccessFeature(profile, 'vendors.edit');

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/vendors/work-orders">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{spk.spk_number}</h1>
            <StatusBadge status={spk.status} />
          </div>
          <p className="text-muted-foreground">Surat Perintah Kerja</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Detail Pekerjaan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Vendor</p>
              <p className="font-medium">
                {spk.vendor ? `${spk.vendor.vendor_code} - ${spk.vendor.vendor_name}` : '-'}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Deskripsi Pekerjaan</p>
              <p className="font-medium whitespace-pre-wrap">{spk.work_description}</p>
            </div>
            {spk.location && (
              <div>
                <p className="text-sm text-muted-foreground">Lokasi</p>
                <p className="font-medium">{spk.location}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground">Jadwal Pelaksanaan</p>
              <p className="font-medium">
                {formatDate(spk.scheduled_start)} - {formatDate(spk.scheduled_end)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Nilai Kesepakatan</p>
              <p className="font-medium">{formatCurrency(spk.agreed_amount)}</p>
            </div>
            {spk.job_order && (
              <div>
                <p className="text-sm text-muted-foreground">Job Order</p>
                <Link
                  href={`/job-orders/${spk.job_order.id}`}
                  className="font-medium text-blue-600 hover:underline"
                >
                  {spk.job_order.jo_number}
                </Link>
              </div>
            )}
            {spk.notes && (
              <div>
                <p className="text-sm text-muted-foreground">Catatan</p>
                <p className="font-medium whitespace-pre-wrap">{spk.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status & Penerbitan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Tanggal Dibuat</p>
              <p className="font-medium">{formatDate(spk.created_at)}</p>
            </div>
            {spk.issued_by && spk.issuer && (
              <div>
                <p className="text-sm text-muted-foreground">Diterbitkan oleh</p>
                <p className="font-medium">{spk.issuer.full_name}</p>
                {spk.issued_at && (
                  <p className="text-xs text-muted-foreground">{formatDate(spk.issued_at)}</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      {canManage && ['draft', 'issued', 'in_progress'].includes(spk.status) && (
        <SPKActions spkId={spk.id} status={spk.status} />
      )}
    </div>
  );
}
