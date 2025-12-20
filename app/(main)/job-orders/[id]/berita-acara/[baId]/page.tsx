import { notFound } from 'next/navigation'
import { getBeritaAcara } from '@/app/(main)/job-orders/berita-acara-actions'
import { BeritaAcaraDetailView } from '@/components/berita-acara/berita-acara-detail-view'

interface BeritaAcaraDetailPageProps {
  params: Promise<{ id: string; baId: string }>
  searchParams: Promise<{ print?: string }>
}

export default async function BeritaAcaraDetailPage({ params, searchParams }: BeritaAcaraDetailPageProps) {
  const { id, baId } = await params
  const { print } = await searchParams
  
  const beritaAcara = await getBeritaAcara(baId)

  if (!beritaAcara) {
    notFound()
  }

  return (
    <BeritaAcaraDetailView
      beritaAcara={beritaAcara}
      joId={id}
      showPrintView={print === 'true'}
    />
  )
}
