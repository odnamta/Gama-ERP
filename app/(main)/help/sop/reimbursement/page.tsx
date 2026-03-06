import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function SOPReimbursementPage() {
  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/help/sop">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">SOP Reimbursement</h1>
          <p className="text-muted-foreground">Prosedur pengajuan dan penyelesaian reimbursement biaya operasional</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>1. Ketentuan Umum</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <ul className="list-disc pl-5 space-y-2">
            <li>Reimbursement adalah penggantian biaya yang telah dikeluarkan karyawan untuk kepentingan operasional perusahaan.</li>
            <li>Pengajuan reimbursement harus dilakukan <strong>maksimal 14 hari</strong> setelah pengeluaran terjadi.</li>
            <li>Setiap pengajuan harus disertai <strong>bukti pengeluaran asli</strong> (nota, kwitansi, atau invoice).</li>
            <li>Reimbursement tanpa bukti pengeluaran yang sah <strong>tidak akan diproses</strong>.</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>2. Kategori Biaya yang Dapat Di-reimburse</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Transportasi:</strong> BBM, tol, parkir, transportasi umum terkait pekerjaan</li>
            <li><strong>Akomodasi:</strong> Penginapan untuk perjalanan dinas (sesuai plafon)</li>
            <li><strong>Konsumsi:</strong> Makan dan minum saat lembur atau perjalanan dinas</li>
            <li><strong>Operasional:</strong> Bahan habis pakai, perlengkapan kerja mendesak</li>
            <li><strong>Komunikasi:</strong> Pulsa/data terkait operasional (sesuai kebijakan)</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>3. Prosedur Pengajuan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <ol className="list-decimal pl-5 space-y-3">
            <li>
              <strong>Karyawan mengajukan reimbursement melalui ERP</strong>
              <p className="text-muted-foreground mt-1">
                Buka menu <em>HR → Reimbursement → Ajukan Baru</em>. Isi formulir dengan lengkap: kategori, jumlah, deskripsi, dan lampirkan foto bukti pengeluaran.
              </p>
            </li>
            <li>
              <strong>Verifikasi oleh Manager Divisi</strong>
              <p className="text-muted-foreground mt-1">
                Manager divisi memverifikasi kesesuaian biaya dengan kegiatan operasional. Status berubah menjadi &quot;Diperiksa&quot;.
              </p>
            </li>
            <li>
              <strong>Persetujuan oleh HR/Finance</strong>
              <p className="text-muted-foreground mt-1">
                Tim HR/Finance memeriksa kelengkapan dokumen dan kesesuaian dengan kebijakan. Status berubah menjadi &quot;Disetujui&quot;.
              </p>
            </li>
            <li>
              <strong>Pembayaran oleh Finance</strong>
              <p className="text-muted-foreground mt-1">
                Setelah disetujui, Finance memproses pembayaran. Status berubah menjadi &quot;Dibayar&quot;. Pembayaran dilakukan melalui transfer bank pada jadwal pembayaran berikutnya.
              </p>
            </li>
          </ol>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>4. Alur Persetujuan</CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          <div className="flex items-center gap-2 flex-wrap text-center">
            <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-medium">Pending</div>
            <span className="text-muted-foreground">→</span>
            <div className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-xs font-medium">Diperiksa (Manager)</div>
            <span className="text-muted-foreground">→</span>
            <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium">Disetujui (HR/Finance)</div>
            <span className="text-muted-foreground">→</span>
            <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium">Dibayar</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>5. Ketentuan Penolakan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>Pengajuan reimbursement dapat ditolak jika:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Bukti pengeluaran tidak valid atau tidak jelas</li>
            <li>Pengeluaran tidak terkait dengan kegiatan operasional</li>
            <li>Melebihi plafon yang ditetapkan tanpa persetujuan sebelumnya</li>
            <li>Pengajuan melewati batas waktu 14 hari</li>
          </ul>
          <p className="text-muted-foreground mt-2">
            Jika ditolak, karyawan akan menerima notifikasi beserta alasan penolakan dan dapat mengajukan ulang dengan perbaikan.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
