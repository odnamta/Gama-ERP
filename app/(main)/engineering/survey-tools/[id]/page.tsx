import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getSurveyToolLoanById } from '@/lib/survey-tool-loan-actions';
import { getUserProfile } from '@/lib/permissions-server';
import { canAccessFeature } from '@/lib/permissions';
import { LoanStatus } from '@/types/survey-tool-loan';
import { formatDate } from '@/lib/utils/format';
import { ArrowLeft } from 'lucide-react';
import { SurveyToolLoanActions } from './actions-client';

const CONDITION_LABELS: Record<string, string> = {
  good: 'Baik',
  fair: 'Cukup',
  needs_repair: 'Perlu Perbaikan',
};

function StatusBadge({ status }: { status: LoanStatus }) {
  switch (status) {
    case 'borrowed':
      return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Dipinjam</Badge>;
    case 'returned':
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Dikembalikan</Badge>;
    case 'overdue':
      return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Terlambat</Badge>;
    case 'lost':
      return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Hilang</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export default async function SurveyToolLoanDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [loan, profile] = await Promise.all([
    getSurveyToolLoanById(id),
    getUserProfile(),
  ]);

  if (!loan) notFound();

  const canManage = canAccessFeature(profile, 'assets.edit');

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/engineering/survey-tools">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{loan.loan_number}</h1>
            <StatusBadge status={loan.status} />
          </div>
          <p className="text-muted-foreground">Peminjaman Alat Survey</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Detail Alat</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Nama Alat</p>
              <p className="font-medium">{loan.tool_name}</p>
            </div>
            {loan.tool_serial_number && (
              <div>
                <p className="text-sm text-muted-foreground">Nomor Seri</p>
                <p className="font-medium">{loan.tool_serial_number}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground">Kondisi Saat Pinjam</p>
              <p className="font-medium">{CONDITION_LABELS[loan.loan_condition || ''] || loan.loan_condition || '-'}</p>
            </div>
            {loan.return_condition && (
              <div>
                <p className="text-sm text-muted-foreground">Kondisi Saat Kembali</p>
                <p className="font-medium">{CONDITION_LABELS[loan.return_condition] || loan.return_condition}</p>
              </div>
            )}
            {loan.job_order && (
              <div>
                <p className="text-sm text-muted-foreground">Job Order</p>
                <Link
                  href={`/job-orders/${loan.job_order.id}`}
                  className="font-medium text-blue-600 hover:underline"
                >
                  {loan.job_order.jo_number}
                </Link>
              </div>
            )}
            {loan.notes && (
              <div>
                <p className="text-sm text-muted-foreground">Catatan</p>
                <p className="font-medium whitespace-pre-wrap">{loan.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Info Peminjaman</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Peminjam</p>
              <p className="font-medium">{loan.borrower?.full_name || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Tanggal Pinjam</p>
              <p className="font-medium">{formatDate(loan.loan_date)}</p>
            </div>
            {loan.expected_return_date && (
              <div>
                <p className="text-sm text-muted-foreground">Estimasi Kembali</p>
                <p className="font-medium">{formatDate(loan.expected_return_date)}</p>
              </div>
            )}
            {loan.actual_return_date && (
              <div>
                <p className="text-sm text-muted-foreground">Tanggal Dikembalikan</p>
                <p className="font-medium">{formatDate(loan.actual_return_date)}</p>
              </div>
            )}
            {loan.issuer && (
              <div>
                <p className="text-sm text-muted-foreground">Dikeluarkan oleh</p>
                <p className="font-medium">{loan.issuer.full_name}</p>
              </div>
            )}
            {loan.receiver && (
              <div>
                <p className="text-sm text-muted-foreground">Diterima kembali oleh</p>
                <p className="font-medium">{loan.receiver.full_name}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      {canManage && ['borrowed', 'overdue'].includes(loan.status) && (
        <SurveyToolLoanActions loanId={loan.id} status={loan.status} />
      )}
    </div>
  );
}
