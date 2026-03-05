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
import { getPurchaseOrders, getPOStats } from '@/lib/purchase-order-actions';
import { POStatus } from '@/types/purchase-order';
import { formatDate, formatCurrency } from '@/lib/utils/format';
import { Plus, FileText, Clock, CheckCircle, Send } from 'lucide-react';

function StatusBadge({ status }: { status: POStatus }) {
  switch (status) {
    case 'draft':
      return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Draft</Badge>;
    case 'submitted':
      return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Diajukan</Badge>;
    case 'approved':
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Disetujui</Badge>;
    case 'rejected':
      return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Ditolak</Badge>;
    case 'received':
      return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Diterima</Badge>;
    case 'cancelled':
      return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Dibatalkan</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export default async function PurchaseOrdersPage() {
  const [orders, stats] = await Promise.all([
    getPurchaseOrders(),
    getPOStats(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Purchase Orders</h1>
          <p className="text-muted-foreground">Kelola purchase order ke vendor</p>
        </div>
        <Button asChild>
          <Link href="/vendors/purchase-orders/new">
            <Plus className="mr-2 h-4 w-4" />
            Buat PO
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total PO</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Nilai: {formatCurrency(stats.totalValue)}
            </p>
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
                <TableHead>No. PO</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Tanggal Order</TableHead>
                <TableHead>Tanggal Kirim</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Belum ada purchase order
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((po) => (
                  <TableRow key={po.id}>
                    <TableCell>
                      <Link
                        href={`/vendors/purchase-orders/${po.id}`}
                        className="font-medium text-blue-600 hover:underline"
                      >
                        {po.po_number}
                      </Link>
                    </TableCell>
                    <TableCell>{po.vendor?.name || '-'}</TableCell>
                    <TableCell>{formatDate(po.order_date)}</TableCell>
                    <TableCell>{po.delivery_date ? formatDate(po.delivery_date) : '-'}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(po.total_amount)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={po.status} />
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
