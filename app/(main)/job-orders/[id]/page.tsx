import { notFound } from 'next/navigation'
import { getJobOrder } from '../actions'
import { JODetailView } from '@/components/job-orders/jo-detail-view'
import { getUserProfile } from '@/lib/permissions-server'

interface JobOrderDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function JobOrderDetailPage({ params }: JobOrderDetailPageProps) {
  const { id } = await params
  const [jobOrder, profile] = await Promise.all([
    getJobOrder(id),
    getUserProfile(),
  ])

  if (!jobOrder) {
    notFound()
  }

  return <JODetailView jobOrder={jobOrder} userRole={profile?.role} />
}
