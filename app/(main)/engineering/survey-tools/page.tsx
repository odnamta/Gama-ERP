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
import { getSurveyToolLoans, getSurveyToolLoanStats } from '@/lib/survey-tool-loan-actions';
import { LoanStatus } from '@/types/survey-tool-loan';
import { formatDate } from '@/lib/utils/format';
import { Plus, Package, ArrowUpFromLine, ArrowDownToLine, AlertTriangle } from 'lucide-react';

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

export default async function SurveyToolsPage() {
  const [loans, stats] = await Promise.all([
    getSurveyToolLoans(),
    getSurveyToolLoanStats(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Peminjaman Alat Survey</h1>
          <p className="text-muted-foreground">Tracking peminjaman dan pengembalian alat survey</p>
        </div>
        <Button asChild>
          <Link href="/engineering/survey-tools/new">
            <Plus className="mr-2 h-4 w-4" />
            Catat Peminjaman
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Dipinjam</CardTitle>
            <ArrowUpFromLine className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.borrowed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Dikembalikan</CardTitle>
            <ArrowDownToLine className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.returned}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Terlambat</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No. Peminjaman</TableHead>
                <TableHead>Alat</TableHead>
                <TableHead>Peminjam</TableHead>
                <TableHead>Tgl Pinjam</TableHead>
                <TableHead>Tgl Kembali</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loans.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Belum ada data peminjaman
                  </TableCell>
                </TableRow>
              ) : (
                loans.map((loan) => (
                  <TableRow key={loan.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell>
                      <Link
                        href={`/engineering/survey-tools/${loan.id}`}
                        className="font-medium text-blue-600 hover:underline"
                      >
                        {loan.loan_number}
                      </Link>
                    </TableCell>
                    <TableCell>{loan.tool_name}</TableCell>
                    <TableCell>{loan.borrower?.full_name || '-'}</TableCell>
                    <TableCell>{formatDate(loan.loan_date)}</TableCell>
                    <TableCell>
                      {loan.actual_return_date
                        ? formatDate(loan.actual_return_date)
                        : loan.expected_return_date
                          ? formatDate(loan.expected_return_date)
                          : '-'}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={loan.status} />
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
