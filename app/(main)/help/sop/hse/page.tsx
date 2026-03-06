import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function SOPHSEPage() {
  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/help/sop">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">SOP HSE (K3)</h1>
          <p className="text-muted-foreground">Kebijakan Keselamatan, Kesehatan Kerja, dan Lingkungan</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>1. Kebijakan Umum K3</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>PT. Gama Intisamudera berkomitmen untuk:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Menjamin keselamatan dan kesehatan seluruh karyawan, kontraktor, dan pihak terkait di lingkungan kerja.</li>
            <li>Mematuhi peraturan perundang-undangan K3 yang berlaku.</li>
            <li>Melakukan perbaikan berkelanjutan terhadap sistem manajemen K3.</li>
            <li>Menyediakan sumber daya yang memadai untuk pelaksanaan program K3.</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>2. Alat Pelindung Diri (APD)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p><strong>Wajib digunakan di area kerja/proyek:</strong></p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Helm keselamatan</strong> — di seluruh area proyek dan lapangan</li>
            <li><strong>Sepatu safety</strong> — di area proyek, gudang, dan pelabuhan</li>
            <li><strong>Rompi reflektif</strong> — saat bekerja di jalan atau area kendaraan berat</li>
            <li><strong>Sarung tangan</strong> — saat menangani material berat atau berbahaya</li>
            <li><strong>Kacamata pelindung</strong> — saat ada risiko percikan atau debu</li>
            <li><strong>Ear plug/muff</strong> — di area dengan kebisingan tinggi (&gt;85 dB)</li>
          </ul>
          <p className="text-muted-foreground mt-2">
            Pelanggaran penggunaan APD akan dicatat dan dilaporkan. Pelanggaran berulang dapat dikenakan sanksi sesuai peraturan perusahaan.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>3. Prosedur Sebelum Pekerjaan (Pre-Job)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <ol className="list-decimal pl-5 space-y-3">
            <li>
              <strong>Toolbox Meeting / Safety Briefing</strong>
              <p className="text-muted-foreground mt-1">
                Wajib dilakukan sebelum memulai pekerjaan. Bahas: scope pekerjaan, potensi bahaya, tindakan pencegahan, APD yang diperlukan.
              </p>
            </li>
            <li>
              <strong>Job Safety Analysis (JSA)</strong>
              <p className="text-muted-foreground mt-1">
                Untuk pekerjaan berisiko tinggi, lakukan JSA tertulis. Identifikasi bahaya di setiap langkah kerja dan tentukan tindakan pengendalian.
              </p>
            </li>
            <li>
              <strong>Pemeriksaan Peralatan</strong>
              <p className="text-muted-foreground mt-1">
                Periksa kondisi peralatan dan alat berat sebelum digunakan. Peralatan rusak atau tidak layak <strong>dilarang digunakan</strong>.
              </p>
            </li>
            <li>
              <strong>Izin Kerja (Work Permit)</strong>
              <p className="text-muted-foreground mt-1">
                Pekerjaan berisiko tinggi (kerja panas, ketinggian, ruang terbatas) memerlukan izin kerja tertulis dari HSE.
              </p>
            </li>
          </ol>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>4. Prosedur Pelaporan Insiden</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <ol className="list-decimal pl-5 space-y-3">
            <li>
              <strong>Amankan lokasi</strong> — Pastikan area aman dari bahaya lanjutan.
            </li>
            <li>
              <strong>Berikan pertolongan pertama</strong> — Tangani korban sesuai kemampuan. Hubungi layanan medis jika diperlukan.
            </li>
            <li>
              <strong>Laporkan segera</strong> — Laporkan insiden ke atasan langsung dan tim HSE dalam waktu <strong>maksimal 1 jam</strong>.
            </li>
            <li>
              <strong>Dokumentasi</strong> — Catat insiden di ERP melalui menu <em>HSE → Insiden → Laporkan Insiden</em>. Sertakan foto, saksi, dan kronologi.
            </li>
            <li>
              <strong>Investigasi</strong> — Tim HSE akan melakukan investigasi untuk menentukan akar masalah dan tindakan perbaikan.
            </li>
          </ol>
          <p className="text-muted-foreground mt-2">
            <strong>Seluruh insiden wajib dilaporkan</strong>, termasuk near miss (hampir celaka). Pelaporan near miss membantu mencegah insiden serius di masa depan.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>5. Prosedur Darurat</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Kebakaran:</strong> Bunyikan alarm → Evakuasi → Kumpul di titik muster → Hubungi pemadam kebakaran</li>
            <li><strong>Kecelakaan kerja:</strong> Amankan lokasi → P3K → Hubungi ambulans → Laporkan ke HSE</li>
            <li><strong>Tumpahan B3:</strong> Isolasi area → Gunakan spill kit → Laporkan ke HSE → Bersihkan sesuai prosedur</li>
          </ul>
          <p className="text-muted-foreground mt-2">
            Nomor darurat dan lokasi titik kumpul tersedia di papan informasi K3 di setiap area kerja.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>6. Audit dan Inspeksi</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Inspeksi harian:</strong> Supervisor memeriksa kondisi area kerja dan penggunaan APD.</li>
            <li><strong>Audit internal:</strong> Dilakukan secara berkala oleh tim HSE untuk memastikan kepatuhan terhadap SOP.</li>
            <li><strong>Audit eksternal:</strong> Dilakukan oleh pihak ketiga atau instansi pemerintah sesuai jadwal.</li>
          </ul>
          <p className="text-muted-foreground mt-2">
            Hasil audit dicatat di ERP melalui menu <em>HSE → Audit</em>. Temuan harus ditindaklanjuti sesuai tenggat waktu yang ditetapkan.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
