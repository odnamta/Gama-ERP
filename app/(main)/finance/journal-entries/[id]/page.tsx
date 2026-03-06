import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getJournalEntryById } from '@/lib/gl-actions'
import { getCurrentUserProfile, guardPage, profileHasRole } from '@/lib/auth-utils'
import { JournalEntryDetail } from './journal-entry-detail'

export const metadata: Metadata = {
  title: 'Detail Jurnal | Gama ERP',
}

const GL_ROLES = ['owner', 'director', 'sysadmin', 'finance_manager', 'finance'] as const

interface Props {
  params: Promise<{ id: string }>
}

export default async function JournalEntryPage({ params }: Props) {
  const { id } = await params
  const profile = await getCurrentUserProfile()
  const { explorerReadOnly } = await guardPage(!!profile && profileHasRole(profile, [...GL_ROLES]))

  if (explorerReadOnly) {
    const { redirect } = await import('next/navigation')
    redirect('/finance/journal-entries')
  }

  const entry = await getJournalEntryById(id)
  if (!entry) notFound()

  const canPost = profileHasRole(profile, ['owner', 'director', 'sysadmin', 'finance_manager', 'finance'])

  return (
    <div className="container mx-auto py-6 space-y-6">
      <JournalEntryDetail entry={entry} canPost={canPost} />
    </div>
  )
}
