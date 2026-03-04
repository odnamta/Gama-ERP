import { Suspense } from 'react'
import { EditMaintenanceClient } from './edit-maintenance-client'
import { getCurrentUserProfile, guardPage } from '@/lib/auth-utils';

interface EditMaintenancePageProps {
  params: Promise<{ id: string }>
}

export default async function EditMaintenancePage({ params }: EditMaintenancePageProps) {

  const profile = await getCurrentUserProfile();
  const { explorerReadOnly } = await guardPage(!!profile);
  if (explorerReadOnly) {
    const { redirect } = await import('next/navigation');
    redirect('/equipment/maintenance');
  }
  const { id } = await params

  return (
    <Suspense fallback={<div className="flex items-center justify-center py-12">Loading...</div>}>
      <EditMaintenanceClient recordId={id} />
    </Suspense>
  )
}
