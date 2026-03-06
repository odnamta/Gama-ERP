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
import { getSPKList } from '@/lib/spk-actions';
import { SPKStatus } from '@/types/vendor-work-order';
import { formatDate, formatCurrency } from '@/lib/utils/format';
import { Plus, FileText, Clock, CheckCircle, Send } from 'lucide-react';

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

export default async function WorkOrdersPage() {
  const orders = await getSPKList();

  const stats = {
    total: orders.length,
    draft: orders.filter((o) => o.status === 'draft').length,
    issued: orders.filter((o) => o.status === 'issued' || o.status === 'in_progress').length,
    completed: orders.filter((o) => o.status === 'completed').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Surat Perintah Kerja (SPK)</h1>
          <p className="text-muted-foreground">Kelola SPK untuk vendor</p>
        </div>
        <Button asChild>
          <Link href="/vendors/work-orders/new">
            <Plus className="mr-2 h-4 w-4" />
            Buat SPK
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total SPK</CardTitle>
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
            <CardTitle className="text-sm font-medium">Aktif</CardTitle>
            <Send className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.issued}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Selesai</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No. SPK</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Deskripsi Pekerjaan</TableHead>
                <TableHead>Jadwal</TableHead>
                <TableHead className="text-right">Nilai</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Belum ada SPK
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((spk) => (
                  <TableRow key={spk.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell>
                      <Link
                        href={`/vendors/work-orders/${spk.id}`}
                        className="font-medium text-blue-600 hover:underline"
                      >
                        {spk.spk_number}
                      </Link>
                    </TableCell>
                    <TableCell>{spk.vendor?.vendor_name || '-'}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{spk.work_description}</TableCell>
                    <TableCell className="text-sm">
                      {formatDate(spk.scheduled_start)} - {formatDate(spk.scheduled_end)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(spk.agreed_amount)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={spk.status} />
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
