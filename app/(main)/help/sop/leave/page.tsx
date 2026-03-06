import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function SOPLeavePage() {
  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/help/sop">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">SOP Pengajuan Cuti</h1>
          <p className="text-muted-foreground">Prosedur pengajuan dan persetujuan cuti karyawan</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>1. Jenis Cuti</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Cuti Tahunan:</strong> 12 hari kerja per tahun (setelah masa kerja 1 tahun). Hak cuti yang tidak digunakan hangus di akhir tahun.</li>
            <li><strong>Cuti Sakit:</strong> Sesuai kebutuhan dengan surat keterangan dokter (untuk sakit lebih dari 2 hari berturut-turut).</li>
            <li><strong>Cuti Melahirkan:</strong> 3 bulan untuk karyawan wanita (1.5 bulan sebelum dan 1.5 bulan setelah melahirkan).</li>
            <li><strong>Cuti Menikah:</strong> 3 hari kerja.</li>
            <li><strong>Cuti Kedukaan:</strong> 2 hari kerja (keluarga inti), 1 hari kerja (keluarga lainnya).</li>
            <li><strong>Cuti Khusus:</strong> Sesuai ketentuan perundang-undangan yang berlaku.</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>2. Ketentuan Pengajuan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <ul className="list-disc pl-5 space-y-2">
            <li>Cuti tahunan harus diajukan <strong>minimal 3 hari kerja</strong> sebelum tanggal cuti.</li>
            <li>Cuti lebih dari 3 hari berturut-turut harus diajukan <strong>minimal 1 minggu</strong> sebelumnya.</li>
            <li>Cuti sakit mendadak harus dilaporkan pada hari yang sama melalui atasan langsung.</li>
            <li>Pengajuan cuti di periode sibuk (akhir bulan, tutup buku) dapat ditunda jika bertentangan dengan kebutuhan operasional.</li>
            <li>Sisa cuti tahunan dapat dicek melalui ERP di menu <em>HR → Cuti</em>.</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>3. Prosedur Pengajuan Melalui ERP</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <ol className="list-decimal pl-5 space-y-3">
            <li>
              <strong>Buka menu HR → Cuti → Ajukan Cuti</strong>
              <p className="text-muted-foreground mt-1">
                Isi formulir pengajuan: jenis cuti, tanggal mulai, tanggal selesai, dan alasan/keterangan.
              </p>
            </li>
            <li>
              <strong>Lampirkan dokumen pendukung (jika diperlukan)</strong>
              <p className="text-muted-foreground mt-1">
                Cuti sakit: surat dokter. Cuti melahirkan: surat keterangan hamil. Cuti menikah: undangan.
              </p>
            </li>
            <li>
              <strong>Submit pengajuan</strong>
              <p className="text-muted-foreground mt-1">
                Pengajuan akan diteruskan ke atasan langsung untuk persetujuan.
              </p>
            </li>
            <li>
              <strong>Tunggu persetujuan</strong>
              <p className="text-muted-foreground mt-1">
                Atasan akan menerima notifikasi dan memeriksa pengajuan. Proses persetujuan maksimal 2 hari kerja.
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
            <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium">Disetujui (Atasan)</div>
            <span className="text-muted-foreground">atau</span>
            <div className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-xs font-medium">Ditolak</div>
          </div>
          <p className="text-muted-foreground mt-3">
            Karyawan akan menerima notifikasi mengenai status pengajuan cuti.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>5. Kewajiban Sebelum Cuti</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <ul className="list-disc pl-5 space-y-2">
            <li>Selesaikan atau serahterimakan pekerjaan yang sedang berjalan kepada rekan kerja atau atasan.</li>
            <li>Informasikan jadwal cuti kepada rekan tim dan pihak terkait.</li>
            <li>Pastikan tidak ada deadline kritis yang bertepatan dengan periode cuti.</li>
            <li>Siapkan contact person yang dapat dihubungi untuk urusan mendesak.</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>6. Ketentuan Pembatalan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <ul className="list-disc pl-5 space-y-2">
            <li>Cuti yang sudah disetujui dapat dibatalkan oleh karyawan melalui ERP sebelum tanggal cuti dimulai.</li>
            <li>Pembatalan cuti akan mengembalikan saldo cuti yang telah dikurangi.</li>
            <li>Dalam kondisi darurat operasional, perusahaan dapat meminta karyawan menunda cuti dengan kompensasi yang disepakati.</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
