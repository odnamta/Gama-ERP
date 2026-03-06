import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { getTimesheets } from '@/lib/timesheet-actions';
import { TimesheetStatus } from '@/types/timesheet';
import { formatDate } from '@/lib/utils/format';
import { Plus, FileText, Clock, CheckCircle, Send } from 'lucide-react';

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

export default async function TimesheetsPage() {
  const timesheets = await getTimesheets();

  const stats = {
    total: timesheets.length,
    draft: timesheets.filter((t) => t.status === 'draft').length,
    submitted: timesheets.filter((t) => t.status === 'submitted').length,
    approved: timesheets.filter((t) => t.status === 'approved').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Timesheet</h1>
          <p className="text-muted-foreground">Catatan waktu kerja peralatan rental</p>
        </div>
        <Button asChild>
          <Link href="/equipment/timesheets/new">
            <Plus className="mr-2 h-4 w-4" />
            Buat Timesheet
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Draft</CardTitle>
            <Clock className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.draft}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Diajukan</CardTitle>
            <Send className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.submitted}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Disetujui</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No. Timesheet</TableHead>
                <TableHead>Peralatan</TableHead>
                <TableHead>Operator</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead className="text-right">Jam Kerja</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {timesheets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Belum ada timesheet
                  </TableCell>
                </TableRow>
              ) : (
                timesheets.map((ts) => (
                  <TableRow key={ts.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell>
                      <Link
                        href={`/equipment/timesheets/${ts.id}`}
                        className="font-medium text-blue-600 hover:underline"
                      >
                        {ts.timesheet_number}
                      </Link>
                    </TableCell>
                    <TableCell>{ts.equipment_name}</TableCell>
                    <TableCell>{ts.operator_name || '-'}</TableCell>
                    <TableCell>{formatDate(ts.work_date)}</TableCell>
                    <TableCell className="text-right font-medium">
                      {ts.hours_worked} jam
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={ts.status} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
