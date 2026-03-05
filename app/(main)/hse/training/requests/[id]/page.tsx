import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getTrainingRequestById } from '@/lib/training-request-actions';
import { getUserProfile } from '@/lib/permissions-server';
import { canAccessFeature } from '@/lib/permissions';
import { formatDate, formatCurrency } from '@/lib/utils/format';
import { TrainingRequestStatus } from '@/types/training-request';
import { ArrowLeft } from 'lucide-react';
import { TrainingRequestActions } from './actions-client';

function StatusBadge({ status }: { status: TrainingRequestStatus }) {
  switch (status) {
    case 'pending':
      return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pending</Badge>;
    case 'approved':
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Disetujui</Badge>;
    case 'rejected':
      return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Ditolak</Badge>;
    case 'cancelled':
      return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Dibatalkan</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export default async function TrainingRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [request, profile] = await Promise.all([
    getTrainingRequestById(id),
    getUserProfile(),
  ]);

  if (!request) notFound();

  const canManage = canAccessFeature(profile, 'hse.training.manage');

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/hse/training/requests">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{request.request_number}</h1>
            <StatusBadge status={request.status} />
          </div>
          <p className="text-muted-foreground">Permintaan Training</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Detail Permintaan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Karyawan</p>
              <p className="font-medium">{request.employee?.full_name || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Training</p>
              <p className="font-medium">
                {request.course?.course_name || request.custom_course_name || '-'}
              </p>
            </div>
            {request.training_provider && (
              <div>
                <p className="text-sm text-muted-foreground">Provider</p>
                <p className="font-medium">{request.training_provider}</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Tanggal Mulai</p>
                <p className="font-medium">{formatDate(request.training_date_start)}</p>
              </div>
              {request.training_date_end && (
                <div>
                  <p className="text-sm text-muted-foreground">Tanggal Selesai</p>
                  <p className="font-medium">{formatDate(request.training_date_end)}</p>
                </div>
              )}
            </div>
            {request.estimated_cost && (
              <div>
                <p className="text-sm text-muted-foreground">Estimasi Biaya</p>
                <p className="font-medium">{formatCurrency(request.estimated_cost)}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Justifikasi & Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Justifikasi</p>
              <p className="font-medium whitespace-pre-wrap">{request.justification}</p>
            </div>
            {request.notes && (
              <div>
                <p className="text-sm text-muted-foreground">Catatan</p>
                <p className="font-medium whitespace-pre-wrap">{request.notes}</p>
              </div>
            )}
            {request.approved_by && request.approver && (
              <div>
                <p className="text-sm text-muted-foreground">
                  {request.status === 'approved' ? 'Disetujui oleh' : 'Ditolak oleh'}
                </p>
                <p className="font-medium">{request.approver.full_name}</p>
                {request.approved_at && (
                  <p className="text-xs text-muted-foreground">{formatDate(request.approved_at)}</p>
                )}
              </div>
            )}
            {request.rejection_reason && (
              <div>
                <p className="text-sm text-muted-foreground">Alasan Penolakan</p>
                <p className="font-medium text-red-600">{request.rejection_reason}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground">Tanggal Pengajuan</p>
              <p className="font-medium">{formatDate(request.created_at)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action buttons */}
      {canManage && request.status === 'pending' && (
        <TrainingRequestActions requestId={request.id} />
      )}
    </div>
  );
}
