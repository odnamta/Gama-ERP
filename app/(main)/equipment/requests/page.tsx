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
import { getEquipmentRequests, getEquipmentRequestStats } from '@/lib/equipment-request-actions';
import { PRIORITY_LABELS, EquipmentRequestStatus, RequestPriority } from '@/types/equipment-request';
import { formatDate } from '@/lib/utils/format';
import { Plus, Clock, CheckCircle, XCircle, FileText } from 'lucide-react';

function StatusBadge({ status }: { status: EquipmentRequestStatus }) {
  switch (status) {
    case 'pending':
      return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pending</Badge>;
    case 'checked':
      return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">Diperiksa</Badge>;
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

function PriorityBadge({ priority }: { priority: RequestPriority }) {
  const colors: Record<string, string> = {
    low: 'bg-gray-100 text-gray-800',
    normal: 'bg-blue-100 text-blue-800',
    high: 'bg-orange-100 text-orange-800',
    urgent: 'bg-red-100 text-red-800',
  };
  return (
    <Badge className={`${colors[priority] || 'bg-gray-100 text-gray-800'} hover:${colors[priority]}`}>
      {PRIORITY_LABELS[priority] || priority}
    </Badge>
  );
}

export default async function EquipmentRequestsPage() {
  const [requests, stats] = await Promise.all([
    getEquipmentRequests(),
    getEquipmentRequestStats(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Permintaan Peralatan</h1>
          <p className="text-muted-foreground">Ajukan dan kelola permintaan peralatan/alat kerja</p>
        </div>
        <Button asChild>
          <Link href="/equipment/requests/new">
            <Plus className="mr-2 h-4 w-4" />
            Ajukan Permintaan
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
            <CardTitle className="text-sm font-medium">Menunggu</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
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
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Ditolak</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
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
                <TableHead>Pemohon</TableHead>
                <TableHead>Peralatan</TableHead>
                <TableHead>Periode</TableHead>
                <TableHead>Prioritas</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Belum ada permintaan peralatan
                  </TableCell>
                </TableRow>
              ) : (
                requests.map((req) => (
                  <TableRow key={req.id}>
                    <TableCell>
                      <Link
                        href={`/equipment/requests/${req.id}`}
                        className="font-medium text-blue-600 hover:underline"
                      >
                        {req.request_number}
                      </Link>
                    </TableCell>
                    <TableCell>{req.requester?.full_name || '-'}</TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {req.equipment_name || req.asset?.asset_name || '-'}
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatDate(req.usage_start_date)} - {formatDate(req.usage_end_date)}
                    </TableCell>
                    <TableCell>
                      <PriorityBadge priority={req.priority} />
                    </TableCell>
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
