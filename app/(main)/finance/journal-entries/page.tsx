import { Metadata } from 'next'
import { getJournalEntries } from '@/lib/gl-actions'
import { getCurrentUserProfile, guardPage, profileHasRole } from '@/lib/auth-utils'
import { JournalEntriesClient } from './journal-entries-client'

export const metadata: Metadata = {
  title: 'Journal Entries | Gama ERP',
  description: 'Kelola jurnal umum (General Journal)',
}

const GL_ROLES = ['owner', 'director', 'sysadmin', 'finance_manager', 'finance'] as const

export default async function JournalEntriesPage() {
  const profile = await getCurrentUserProfile()
  const { explorerReadOnly } = await guardPage(!!profile && profileHasRole(profile, [...GL_ROLES]))

  if (explorerReadOnly) {
    const { redirect } = await import('next/navigation')
    redirect('/dashboard')
  }

  const entries = await getJournalEntries({ limit: 200 })
  const canWrite = profileHasRole(profile, ['owner', 'director', 'sysadmin', 'finance_manager', 'finance'])

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Journal Entries</h1>
        <p className="text-muted-foreground">
          Daftar jurnal umum (General Journal)
        </p>
      </div>
      <JournalEntriesClient entries={entries} canWrite={canWrite} />
    </div>
  )
}
