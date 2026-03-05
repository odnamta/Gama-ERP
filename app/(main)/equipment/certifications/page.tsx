import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { getCertificationDocuments, getCertificationStats } from '@/lib/asset-document-actions';
import { getAssetDocumentTypeLabel } from '@/lib/asset-utils';
import { formatDate } from '@/lib/utils/format';
import { DocumentExpiryStatus } from '@/types/assets';
import { ShieldCheck, AlertTriangle, XCircle, FileCheck } from 'lucide-react';

function ExpiryBadge({ status }: { status: DocumentExpiryStatus }) {
  switch (status) {
    case 'valid':
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Berlaku</Badge>;
    case 'expiring_soon':
      return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">Segera Kedaluwarsa</Badge>;
    case 'expired':
      return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Kedaluwarsa</Badge>;
    case 'no_expiry':
      return <Badge variant="outline">Tanpa Kedaluwarsa</Badge>;
    default:
      return <Badge variant="outline">-</Badge>;
  }
}

export default async function CertificationsPage() {
  const [documents, stats] = await Promise.all([
    getCertificationDocuments(),
    getCertificationStats(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Sertifikasi & SILO Alat Berat</h1>
        <p className="text-muted-foreground">
          Kelola dokumen sertifikasi dan SILO seluruh aset perusahaan
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Dokumen</CardTitle>
            <FileCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Berlaku</CardTitle>
            <ShieldCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.valid}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Segera Kedaluwarsa</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{stats.expiringSoon}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Kedaluwarsa</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.expired}</div>
          </CardContent>
        </Card>
      </div>

      {/* Documents Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Aset</TableHead>
                <TableHead>Kode Aset</TableHead>
                <TableHead>Tipe</TableHead>
                <TableHead>Nama Dokumen</TableHead>
                <TableHead>Tanggal Terbit</TableHead>
                <TableHead>Kedaluwarsa</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    Belum ada dokumen sertifikasi atau SILO
                  </TableCell>
                </TableRow>
              ) : (
                documents.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell className="font-medium">{doc.asset_name}</TableCell>
                    <TableCell className="text-muted-foreground">{doc.asset_code}</TableCell>
                    <TableCell>{getAssetDocumentTypeLabel(doc.document_type)}</TableCell>
                    <TableCell>{doc.document_name}</TableCell>
                    <TableCell>{doc.issue_date ? formatDate(doc.issue_date) : '-'}</TableCell>
                    <TableCell>{doc.expiry_date ? formatDate(doc.expiry_date) : '-'}</TableCell>
                    <TableCell>
                      <ExpiryBadge status={doc.expiry_status} />
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
