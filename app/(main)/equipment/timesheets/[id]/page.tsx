import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getTimesheetById } from '@/lib/timesheet-actions';
import { getUserProfile } from '@/lib/permissions-server';
import { canAccessFeature } from '@/lib/permissions';
import { TimesheetStatus } from '@/types/timesheet';
import { formatDate } from '@/lib/utils/format';
import { ArrowLeft } from 'lucide-react';
import { TimesheetActions } from './actions-client';

function StatusBadge({ status }: { status: TimesheetStatus }) {
  switch (status) {
    case 'draft':
      return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Draft</Badge>;
    case 'submitted':
      return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Diajukan</Badge>;
    case 'approved':
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Disetujui</Badge>;
    case 'rejected':
      return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Ditolak</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export default async function TimesheetDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [ts, profile] = await Promise.all([
    getTimesheetById(id),
    getUserProfile(),
  ]);

  if (!ts) notFound();

  const canManage = canAccessFeature(profile, 'assets.edit');

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/equipment/timesheets">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{ts.timesheet_number}</h1>
            <StatusBadge status={ts.status} />
          </div>
          <p className="text-muted-foreground">Timesheet Peralatan</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Detail Timesheet</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Peralatan</p>
              <p className="font-medium">{ts.equipment_name}</p>
            </div>
            {ts.operator_name && (
              <div>
                <p className="text-sm text-muted-foreground">Operator</p>
                <p className="font-medium">{ts.operator_name}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground">Tanggal Kerja</p>
              <p className="font-medium">{formatDate(ts.work_date)}</p>
            </div>
            {(ts.start_time || ts.end_time) && (
              <div>
                <p className="text-sm text-muted-foreground">Waktu</p>
                <p className="font-medium">
                  {ts.start_time || '-'} s/d {ts.end_time || '-'}
                </p>
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground">Total Jam Kerja</p>
              <p className="font-medium">{ts.hours_worked} jam</p>
            </div>
            {ts.location && (
              <div>
                <p className="text-sm text-muted-foreground">Lokasi</p>
                <p className="font-medium">{ts.location}</p>
              </div>
            )}
            {ts.work_description && (
              <div>
                <p className="text-sm text-muted-foreground">Deskripsi Pekerjaan</p>
                <p className="font-medium whitespace-pre-wrap">{ts.work_description}</p>
              </div>
            )}
            {ts.job_order && (
              <div>
                <p className="text-sm text-muted-foreground">Job Order</p>
                <Link
                  href={`/job-orders/${ts.job_order.id}`}
                  className="font-medium text-blue-600 hover:underline"
                >
                  {ts.job_order.jo_number}
                </Link>
              </div>
            )}
            {ts.notes && (
              <div>
                <p className="text-sm text-muted-foreground">Catatan</p>
                <p className="font-medium whitespace-pre-wrap">{ts.notes}</p>
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
              <p className="text-sm text-muted-foreground">Tanggal Dibuat</p>
              <p className="font-medium">{formatDate(ts.created_at)}</p>
            </div>
            {ts.submitted_by && ts.submitter && (
              <div>
                <p className="text-sm text-muted-foreground">Diajukan oleh</p>
                <p className="font-medium">{ts.submitter.full_name}</p>
              </div>
            )}
            {ts.approved_by && ts.approver && (
              <div>
                <p className="text-sm text-muted-foreground">
                  {ts.status === 'rejected' ? 'Ditolak oleh' : 'Disetujui oleh'}
                </p>
                <p className="font-medium">{ts.approver.full_name}</p>
                {ts.approved_at && (
                  <p className="text-xs text-muted-foreground">{formatDate(ts.approved_at)}</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      {(ts.status === 'draft' || (canManage && ts.status === 'submitted')) && (
        <TimesheetActions
          timesheetId={ts.id}
          status={ts.status}
          canManage={canManage}
        />
      )}
    </div>
  );
}
