import { notFound } from 'next/navigation'
import { getJobOrder } from '../../../actions'
import { BeritaAcaraForm } from '@/components/berita-acara/berita-acara-form'

interface NewBeritaAcaraPageProps {
  params: Promise<{ id: string }>
}

export default async function NewBeritaAcaraPage({ params }: NewBeritaAcaraPageProps) {
  const { id } = await params
  const jobOrder = await getJobOrder(id)

  if (!jobOrder) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <BeritaAcaraForm
        joId={id}
        joNumber={jobOrder.jo_number}
      />
    </div>
  )
}
