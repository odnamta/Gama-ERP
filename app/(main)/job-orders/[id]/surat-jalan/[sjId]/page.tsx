import { notFound } from 'next/navigation'
import { getSuratJalan } from '@/app/(main)/job-orders/surat-jalan-actions'
import { SuratJalanDetailView } from '@/components/surat-jalan/surat-jalan-detail-view'

interface SuratJalanDetailPageProps {
  params: Promise<{ id: string; sjId: string }>
  searchParams: Promise<{ print?: string; action?: string }>
}

export default async function SuratJalanDetailPage({ params, searchParams }: SuratJalanDetailPageProps) {
  const { id, sjId } = await params
  const { print, action } = await searchParams
  
  const suratJalan = await getSuratJalan(sjId)

  if (!suratJalan) {
    notFound()
  }

  return (
    <SuratJalanDetailView
      suratJalan={suratJalan}
      joId={id}
      showPrintView={print === 'true'}
      showUpdateAction={action === 'update'}
    />
  )
}
