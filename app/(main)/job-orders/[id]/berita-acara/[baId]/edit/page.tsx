import { notFound, redirect } from 'next/navigation'
import { getJobOrder } from '@/app/(main)/job-orders/actions'
import { getBeritaAcara } from '@/app/(main)/job-orders/berita-acara-actions'
import { BeritaAcaraForm } from '@/components/berita-acara/berita-acara-form'
import { canEditBA } from '@/lib/ba-utils'
import { BAStatus } from '@/types'

interface EditBeritaAcaraPageProps {
  params: Promise<{ id: string; baId: string }>
}

export default async function EditBeritaAcaraPage({ params }: EditBeritaAcaraPageProps) {
  const { id, baId } = await params
  
  const [jobOrder, beritaAcara] = await Promise.all([
    getJobOrder(id),
    getBeritaAcara(baId),
  ])

  if (!jobOrder || !beritaAcara) {
    notFound()
  }

  // Only allow editing in draft status
  if (!canEditBA(beritaAcara.status as BAStatus)) {
    redirect(`/job-orders/${id}/berita-acara/${baId}`)
  }

  return (
    <div className="space-y-6">
      <BeritaAcaraForm
        joId={id}
        joNumber={jobOrder.jo_number}
        existingBA={beritaAcara}
      />
    </div>
  )
}
