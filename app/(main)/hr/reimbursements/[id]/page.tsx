import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getReimbursementById } from '@/lib/reimbursement-actions';
import { getUserProfile } from '@/lib/permissions-server';
import { canAccessFeature } from '@/lib/permissions';
import { REIMBURSEMENT_CATEGORIES, ReimbursementStatus } from '@/types/reimbursement';
import { formatDate, formatCurrency } from '@/lib/utils/format';
import { ArrowLeft } from 'lucide-react';
import { ReimbursementActions } from './actions-client';

function StatusBadge({ status }: { status: ReimbursementStatus }) {
  switch (status) {
    case 'pending':
      return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pending</Badge>;
    case 'approved':
      return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Disetujui</Badge>;
    case 'rejected':
      return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Ditolak</Badge>;
    case 'paid':
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Dibayar</Badge>;
    case 'cancelled':
      return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Dibatalkan</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export default async function ReimbursementDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [request, profile] = await Promise.all([
    getReimbursementById(id),
    getUserProfile(),
  ]);

  if (!request) notFound();

  const canApprove = canAccessFeature(profile, 'hr.reimbursement.approve');
  const canPay = canAccessFeature(profile, 'finance.reimbursement.pay');

  const categoryLabel =
    REIMBURSEMENT_CATEGORIES.find((c) => c.value === request.category)?.label || request.category;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/hr/reimbursements">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{request.request_number}</h1>
            <StatusBadge status={request.status} />
          </div>
          <p className="text-muted-foreground">Reimbursement</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Detail Klaim</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Karyawan</p>
              <p className="font-medium">{request.employee?.full_name || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Kategori</p>
              <p className="font-medium">{categoryLabel}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Jumlah</p>
              <p className="text-xl font-bold">{formatCurrency(request.amount)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Deskripsi</p>
              <p className="font-medium whitespace-pre-wrap">{request.description}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Tanggal Kwitansi</p>
              <p className="font-medium">{formatDate(request.receipt_date)}</p>
            </div>
            {request.notes && (
              <div>
                <p className="text-sm text-muted-foreground">Catatan</p>
                <p className="font-medium whitespace-pre-wrap">{request.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status & Persetujuan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Tanggal Pengajuan</p>
              <p className="font-medium">{formatDate(request.created_at)}</p>
            </div>
            {request.approved_by && request.approver && (
              <div>
                <p className="text-sm text-muted-foreground">
                  {request.status === 'rejected' ? 'Ditolak oleh' : 'Disetujui oleh'}
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
            {request.paid_at && (
              <div>
                <p className="text-sm text-muted-foreground">Dibayar pada</p>
                <p className="font-medium">{formatDate(request.paid_at)}</p>
              </div>
            )}
            {request.payment_reference && (
              <div>
                <p className="text-sm text-muted-foreground">Referensi Pembayaran</p>
                <p className="font-medium">{request.payment_reference}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      {((canApprove && request.status === 'pending') ||
        (canPay && request.status === 'approved')) && (
        <ReimbursementActions
          requestId={request.id}
          status={request.status}
          canApprove={canApprove}
          canPay={canPay}
        />
      )}
    </div>
  );
}
