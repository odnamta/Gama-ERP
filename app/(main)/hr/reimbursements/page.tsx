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
import { getReimbursements, getReimbursementStats } from '@/lib/reimbursement-actions';
import { REIMBURSEMENT_CATEGORIES, ReimbursementStatus } from '@/types/reimbursement';
import { formatDate, formatCurrency } from '@/lib/utils/format';
import { Plus, Clock, CheckCircle, Banknote, FileText } from 'lucide-react';

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

function getCategoryLabel(category: string): string {
  return REIMBURSEMENT_CATEGORIES.find((c) => c.value === category)?.label || category;
}

export default async function ReimbursementsPage() {
  const [requests, stats] = await Promise.all([
    getReimbursements(),
    getReimbursementStats(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Reimbursement</h1>
          <p className="text-muted-foreground">Kelola klaim reimbursement karyawan</p>
        </div>
        <Button asChild>
          <Link href="/hr/reimbursements/new">
            <Plus className="mr-2 h-4 w-4" />
            Ajukan Reimbursement
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
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
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Disetujui</CardTitle>
            <CheckCircle className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.approved}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Dibayar</CardTitle>
            <Banknote className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.paid}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Total: {formatCurrency(stats.totalAmount)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No. Permintaan</TableHead>
                <TableHead>Karyawan</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead>Deskripsi</TableHead>
                <TableHead className="text-right">Jumlah</TableHead>
                <TableHead>Tgl Kwitansi</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    Belum ada pengajuan reimbursement
                  </TableCell>
                </TableRow>
              ) : (
                requests.map((req) => (
                  <TableRow key={req.id}>
                    <TableCell>
                      <Link
                        href={`/hr/reimbursements/${req.id}`}
                        className="font-medium text-blue-600 hover:underline"
                      >
                        {req.request_number}
                      </Link>
                    </TableCell>
                    <TableCell>{req.employee?.full_name || '-'}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{getCategoryLabel(req.category)}</Badge>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">{req.description}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(req.amount)}
                    </TableCell>
                    <TableCell>{formatDate(req.receipt_date)}</TableCell>
                    <TableCell>
                      <StatusBadge status={req.status} />
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
