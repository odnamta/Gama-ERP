import { Metadata } from 'next'
import { getChartOfAccounts } from '@/lib/gl-actions'
import { getCurrentUserProfile, guardPage, profileHasRole } from '@/lib/auth-utils'
import { NewJournalEntryForm } from './new-journal-entry-form'

export const metadata: Metadata = {
  title: 'Buat Jurnal Baru | Gama ERP',
}

const GL_ROLES = ['owner', 'director', 'sysadmin', 'finance_manager', 'finance'] as const

export default async function NewJournalEntryPage() {
  const profile = await getCurrentUserProfile()
  const { explorerReadOnly } = await guardPage(!!profile && profileHasRole(profile, [...GL_ROLES]))

  if (explorerReadOnly) {
    const { redirect } = await import('next/navigation')
    redirect('/finance/journal-entries')
  }

  const accounts = await getChartOfAccounts()

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Buat Jurnal Baru</h1>
        <p className="text-muted-foreground">
          Buat jurnal umum manual
        </p>
      </div>
      <NewJournalEntryForm accounts={accounts} />
    </div>
  )
}
