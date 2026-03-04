import { notFound } from 'next/navigation'
import { getJobOrder } from '../../../actions'
import { getJODataForSJ } from '../../../surat-jalan-actions'
import { SuratJalanForm } from '@/components/surat-jalan/surat-jalan-form'
import { getCurrentUserProfile, guardPage } from '@/lib/auth-utils';

interface NewSuratJalanPageProps {
  params: Promise<{ id: string }>
}

export default async function NewSuratJalanPage({ params }: NewSuratJalanPageProps) {

  const profile = await getCurrentUserProfile();
  const { explorerReadOnly } = await guardPage(!!profile);
  if (explorerReadOnly) {
    const { redirect } = await import('next/navigation');
    redirect('/job-orders/[id]/surat-jalan');
  }
  const { id } = await params
  const jobOrder = await getJobOrder(id)

  if (!jobOrder) {
    notFound()
  }

  // Get auto-fill data from JO
  const autoFillData = await getJODataForSJ(id)

  return (
    <div className="space-y-6">
      <SuratJalanForm
        joId={id}
        joNumber={jobOrder.jo_number}
        defaultValues={autoFillData || undefined}
      />
    </div>
  )
}
