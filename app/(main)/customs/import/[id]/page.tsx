import { notFound } from 'next/navigation'
import { PIBDetailView } from '@/components/pib'
import { getPIBDocument } from '@/lib/pib-actions'
import { getCurrentUserProfile, guardPage } from '@/lib/auth-utils'
import { canViewPIB, canEditPIB, canDeletePIB, canViewPIBDuties, canUpdatePIBStatus } from '@/lib/permissions'
import { ExplorerReadOnlyBanner } from '@/components/layout/explorer-read-only-banner'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function PIBDetailPage({ params }: PageProps) {
  // Permission check
  const profile = await getCurrentUserProfile()
  const { explorerReadOnly } = await guardPage(canViewPIB(profile))

  const { id } = await params
  const result = await getPIBDocument(id)

  if (result.error || !result.data) {
    notFound()
  }

  // Pass permission flags to the component — disable write actions in explorer mode
  const permissions = {
    canEdit: explorerReadOnly ? false : canEditPIB(profile),
    canDelete: explorerReadOnly ? false : canDeletePIB(profile),
    canViewDuties: canViewPIBDuties(profile),
    canUpdateStatus: explorerReadOnly ? false : canUpdatePIBStatus(profile),
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {explorerReadOnly && <ExplorerReadOnlyBanner />}
      <PIBDetailView pib={result.data} permissions={permissions} />
    </div>
  )
}
