import { notFound } from 'next/navigation';
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
import { getPurchaseOrderById } from '@/lib/purchase-order-actions';
import { getUserProfile } from '@/lib/permissions-server';
import { canAccessFeature } from '@/lib/permissions';
import { POStatus } from '@/types/purchase-order';
import { formatDate, formatCurrency } from '@/lib/utils/format';
import { ArrowLeft, FileDown, Pencil } from 'lucide-react';
import { POActions } from './actions-client';

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

export default async function PurchaseOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [po, profile] = await Promise.all([
    getPurchaseOrderById(id),
    getUserProfile(),
  ]);

  if (!po) notFound();

  const canCreate = canAccessFeature(profile, 'vendors.po.create');
  const canApprove = canAccessFeature(profile, 'vendors.po.approve');
  const canReceive = canAccessFeature(profile, 'vendors.po.receive');

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/vendors/purchase-orders">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{po.po_number}</h1>
            <StatusBadge status={po.status} />
          </div>
          <p className="text-muted-foreground">Purchase Order</p>
        </div>
        <div className="flex gap-2">
          {po.status === 'draft' && canCreate && (
            <Button variant="outline" asChild>
              <Link href={`/vendors/purchase-orders/${id}/edit`}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </Button>
          )}
          {!['draft', 'cancelled'].includes(po.status) && (
            <Button variant="outline" asChild>
              <a href={`/api/pdf/purchase-order/${id}`} target="_blank" rel="noopener noreferrer">
                <FileDown className="mr-2 h-4 w-4" />
                Download PDF
              </a>
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Detail PO</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Vendor</p>
              <p className="font-medium">{po.vendor?.name || '-'}</p>
              {po.vendor?.contact_person && (
                <p className="text-sm text-muted-foreground">{po.vendor.contact_person}</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Tanggal Order</p>
                <p className="font-medium">{formatDate(po.order_date)}</p>
              </div>
              {po.delivery_date && (
                <div>
                  <p className="text-sm text-muted-foreground">Tanggal Kirim</p>
                  <p className="font-medium">{formatDate(po.delivery_date)}</p>
                </div>
              )}
            </div>
            {po.payment_terms && (
              <div>
                <p className="text-sm text-muted-foreground">Syarat Pembayaran</p>
                <p className="font-medium">{po.payment_terms}</p>
              </div>
            )}
            {po.delivery_address && (
              <div>
                <p className="text-sm text-muted-foreground">Alamat Pengiriman</p>
                <p className="font-medium whitespace-pre-wrap">{po.delivery_address}</p>
              </div>
            )}
            {po.notes && (
              <div>
                <p className="text-sm text-muted-foreground">Catatan</p>
                <p className="font-medium whitespace-pre-wrap">{po.notes}</p>
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
              <p className="font-medium">{formatDate(po.created_at)}</p>
            </div>
            {po.approver && (
              <div>
                <p className="text-sm text-muted-foreground">
                  {po.status === 'rejected' ? 'Ditolak oleh' : 'Disetujui oleh'}
                </p>
                <p className="font-medium">{po.approver.full_name}</p>
                {po.approved_at && (
                  <p className="text-xs text-muted-foreground">{formatDate(po.approved_at)}</p>
                )}
              </div>
            )}
            {po.rejection_reason && (
              <div>
                <p className="text-sm text-muted-foreground">Alasan Penolakan</p>
                <p className="font-medium text-red-600">{po.rejection_reason}</p>
              </div>
            )}
            {po.received_at && (
              <div>
                <p className="text-sm text-muted-foreground">Diterima pada</p>
                <p className="font-medium">{formatDate(po.received_at)}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Line Items Table */}
      <Card>
        <CardHeader>
          <CardTitle>Item Pesanan</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[5%]">No</TableHead>
                <TableHead className="w-[40%]">Deskripsi</TableHead>
                <TableHead className="w-[10%] text-right">Qty</TableHead>
                <TableHead className="w-[10%]">Satuan</TableHead>
                <TableHead className="w-[17%] text-right">Harga Satuan</TableHead>
                <TableHead className="w-[18%] text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(po.line_items || []).map((item, idx) => (
                <TableRow key={item.id || idx}>
                  <TableCell>{idx + 1}</TableCell>
                  <TableCell>{item.item_description}</TableCell>
                  <TableCell className="text-right">{item.quantity}</TableCell>
                  <TableCell>{item.unit}</TableCell>
                  <TableCell className="text-right">{formatCurrency(item.unit_price)}</TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(item.total_price)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="p-4 flex justify-end">
            <div className="w-64 space-y-1">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>{formatCurrency(po.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>PPN 11%</span>
                <span>{formatCurrency(po.tax_amount)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg border-t pt-1">
                <span>Total</span>
                <span>{formatCurrency(po.total_amount)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <POActions
        poId={po.id}
        status={po.status}
        canCreate={canCreate}
        canApprove={canApprove}
        canReceive={canReceive}
      />
    </div>
  );
}
