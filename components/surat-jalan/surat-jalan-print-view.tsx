'use client'

import { SuratJalanWithRelations } from '@/types'
import { formatDate } from '@/lib/pjo-utils'
import { getSJStatusLabel } from '@/lib/sj-utils'

interface SuratJalanPrintViewProps {
  suratJalan: SuratJalanWithRelations
}

export function SuratJalanPrintView({ suratJalan }: SuratJalanPrintViewProps) {
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
        <h2 className="text-xl font-bold uppercase tracking-wide">SURAT JALAN</h2>
        <p className="text-lg font-semibold">{suratJalan.sj_number}</p>
      </div>

      {/* Document Info */}
      <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
        <div>
          <p><span className="font-semibold">Tanggal Pengiriman:</span> {formatDate(suratJalan.delivery_date)}</p>
          <p><span className="font-semibold">Status:</span> {getSJStatusLabel(suratJalan.status as 'issued' | 'in_transit' | 'delivered' | 'returned')}</p>
        </div>
        <div className="text-right">
          <p><span className="font-semibold">No. JO:</span> {suratJalan.job_orders?.jo_number || '-'}</p>
          <p><span className="font-semibold">Diterbitkan:</span> {suratJalan.issued_at ? formatDate(suratJalan.issued_at) : '-'}</p>
        </div>
      </div>

      {/* Vehicle & Driver Info */}
      <div className="border border-black p-4 mb-6">
        <h3 className="font-bold mb-2 border-b border-gray-300 pb-1">INFORMASI KENDARAAN & PENGEMUDI</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p><span className="font-semibold">No. Polisi:</span> {suratJalan.vehicle_plate || '-'}</p>
            <p><span className="font-semibold">Nama Pengemudi:</span> {suratJalan.driver_name || '-'}</p>
          </div>
          <div>
            <p><span className="font-semibold">No. Telepon:</span> {suratJalan.driver_phone || '-'}</p>
          </div>
        </div>
      </div>

      {/* Route Info */}
      <div className="border border-black p-4 mb-6">
        <h3 className="font-bold mb-2 border-b border-gray-300 pb-1">RUTE PENGIRIMAN</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="font-semibold">Asal:</p>
            <p>{suratJalan.origin || '-'}</p>
          </div>
          <div>
            <p className="font-semibold">Tujuan:</p>
            <p>{suratJalan.destination || '-'}</p>
          </div>
        </div>
      </div>

      {/* Cargo Info */}
      <div className="border border-black p-4 mb-6">
        <h3 className="font-bold mb-2 border-b border-gray-300 pb-1">INFORMASI MUATAN</h3>
        <div className="text-sm">
          <p><span className="font-semibold">Deskripsi:</span> {suratJalan.cargo_description || '-'}</p>
          <div className="grid grid-cols-3 gap-4 mt-2">
            <p><span className="font-semibold">Jumlah:</span> {suratJalan.quantity || '-'} {suratJalan.quantity_unit || ''}</p>
            <p><span className="font-semibold">Berat:</span> {suratJalan.weight_kg ? `${suratJalan.weight_kg} kg` : '-'}</p>
          </div>
        </div>
      </div>

      {/* Notes */}
      {suratJalan.notes && (
        <div className="border border-black p-4 mb-6">
          <h3 className="font-bold mb-2 border-b border-gray-300 pb-1">CATATAN</h3>
          <p className="text-sm whitespace-pre-wrap">{suratJalan.notes}</p>
        </div>
      )}

      {/* Signatures */}
      <div className="grid grid-cols-2 gap-8 mt-8">
        <div className="text-center">
          <p className="font-semibold mb-16">Pengirim</p>
          <div className="border-t border-black pt-2">
            <p>{suratJalan.sender_name || '________________________'}</p>
          </div>
        </div>
        <div className="text-center">
          <p className="font-semibold mb-16">Penerima</p>
          <div className="border-t border-black pt-2">
            <p>{suratJalan.receiver_name || '________________________'}</p>
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
