'use client'

import { BeritaAcaraWithRelations, parsePhotoUrls } from '@/types'
import { formatDate } from '@/lib/pjo-utils'
import { getBAStatusLabel, getCargoConditionLabel } from '@/lib/ba-utils'
import { CargoCondition } from '@/types'

interface BeritaAcaraPrintViewProps {
  beritaAcara: BeritaAcaraWithRelations
}

export function BeritaAcaraPrintView({ beritaAcara }: BeritaAcaraPrintViewProps) {
  const photoUrls = parsePhotoUrls(beritaAcara.photo_urls)

  return (
    <div className="print-container p-8 max-w-4xl mx-auto bg-white text-black">
      {/* Company Header */}
      <div className="text-center border-b-2 border-black pb-4 mb-6">
        <h1 className="text-2xl font-bold">PT. GAMA INTISAMUDERA</h1>
        <p className="text-sm">Heavy-Haul Logistics Services</p>
        <p className="text-xs text-gray-600">
          Jl. Example Address No. 123, Jakarta, Indonesia
        </p>
      </div>

      {/* Document Title */}
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold uppercase tracking-wide">BERITA ACARA</h2>
        <p className="text-lg font-semibold">{beritaAcara.ba_number}</p>
      </div>

      {/* Document Info */}
      <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
        <div>
          <p><span className="font-semibold">Tanggal Serah Terima:</span> {formatDate(beritaAcara.handover_date)}</p>
          <p><span className="font-semibold">Lokasi:</span> {beritaAcara.location || '-'}</p>
        </div>
        <div className="text-right">
          <p><span className="font-semibold">No. JO:</span> {beritaAcara.job_orders?.jo_number || '-'}</p>
          <p><span className="font-semibold">Status:</span> {getBAStatusLabel(beritaAcara.status as 'draft' | 'pending_signature' | 'signed' | 'archived')}</p>
        </div>
      </div>

      {/* Work Description */}
      <div className="border border-black p-4 mb-6">
        <h3 className="font-bold mb-2 border-b border-gray-300 pb-1">DESKRIPSI PEKERJAAN</h3>
        <p className="text-sm whitespace-pre-wrap">{beritaAcara.work_description || '-'}</p>
      </div>

      {/* Cargo Condition */}
      <div className="border border-black p-4 mb-6">
        <h3 className="font-bold mb-2 border-b border-gray-300 pb-1">KONDISI MUATAN</h3>
        <div className="text-sm">
          <p>
            <span className="font-semibold">Kondisi:</span>{' '}
            <span className={
              beritaAcara.cargo_condition === 'good' ? 'text-green-700 font-semibold' :
              beritaAcara.cargo_condition === 'minor_damage' ? 'text-yellow-700 font-semibold' :
              beritaAcara.cargo_condition === 'major_damage' ? 'text-red-700 font-semibold' : ''
            }>
              {beritaAcara.cargo_condition ? getCargoConditionLabel(beritaAcara.cargo_condition as CargoCondition) : '-'}
            </span>
          </p>
          {beritaAcara.condition_notes && (
            <div className="mt-2">
              <p className="font-semibold">Catatan Kondisi:</p>
              <p className="whitespace-pre-wrap">{beritaAcara.condition_notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Notes */}
      {beritaAcara.notes && (
        <div className="border border-black p-4 mb-6">
          <h3 className="font-bold mb-2 border-b border-gray-300 pb-1">CATATAN TAMBAHAN</h3>
          <p className="text-sm whitespace-pre-wrap">{beritaAcara.notes}</p>
        </div>
      )}

      {/* Photo Thumbnails */}
      {photoUrls.length > 0 && (
        <div className="border border-black p-4 mb-6">
          <h3 className="font-bold mb-2 border-b border-gray-300 pb-1">DOKUMENTASI FOTO ({photoUrls.length} foto)</h3>
          <div className="grid grid-cols-4 gap-2 mt-2">
            {photoUrls.slice(0, 8).map((url, index) => (
              <div key={index} className="aspect-square bg-gray-100 border border-gray-300 flex items-center justify-center text-xs text-gray-500">
                Foto {index + 1}
              </div>
            ))}
          </div>
          {photoUrls.length > 8 && (
            <p className="text-xs text-gray-500 mt-2">+ {photoUrls.length - 8} foto lainnya (lihat lampiran)</p>
          )}
        </div>
      )}

      {/* Signatures */}
      <div className="grid grid-cols-2 gap-8 mt-8">
        <div className="text-center border border-black p-4">
          <p className="font-semibold mb-2">Perwakilan Perusahaan</p>
          <p className="text-sm text-gray-600 mb-12">PT. Gama Intisamudera</p>
          <div className="border-t border-black pt-2">
            <p>{beritaAcara.company_representative || '________________________'}</p>
          </div>
          {beritaAcara.signed_at && (
            <p className="text-xs text-gray-500 mt-1">Ditandatangani: {formatDate(beritaAcara.signed_at)}</p>
          )}
        </div>
        <div className="text-center border border-black p-4">
          <p className="font-semibold mb-2">Perwakilan Klien</p>
          <p className="text-sm text-gray-600 mb-12">&nbsp;</p>
          <div className="border-t border-black pt-2">
            <p>{beritaAcara.client_representative || '________________________'}</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 pt-4 border-t border-gray-300 text-xs text-gray-500 text-center">
        <p>Dokumen ini dicetak dari sistem Gama ERP</p>
        <p>Dicetak pada: {new Date().toLocaleString('id-ID')}</p>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-container, .print-container * {
            visibility: visible;
          }
          .print-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          @page {
            margin: 1cm;
          }
        }
      `}</style>
    </div>
  )
}
