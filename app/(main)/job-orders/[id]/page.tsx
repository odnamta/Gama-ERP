import { notFound } from 'next/navigation'
import { getJobOrder } from '../actions'
import { JODetailView } from '@/components/job-orders/jo-detail-view'

interface JobOrderDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function JobOrderDetailPage({ params }: JobOrderDetailPageProps) {
  const { id } = await params
  const jobOrder = await getJobOrder(id)

  if (!jobOrder) {
    notFound()
  }

  return <JODetailView jobOrder={jobOrder} />
}
