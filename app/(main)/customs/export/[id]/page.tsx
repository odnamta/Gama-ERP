import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { PEBDetailView } from '@/components/peb'
import { getPEBDocument } from '@/lib/peb-actions'
import { ArrowLeft, FileText } from 'lucide-react'
import { getCurrentUserProfile } from '@/lib/auth-utils'
import { canViewPEB, canEditPEB, canDeletePEB } from '@/lib/permissions'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function PEBDetailPage({ params }: PageProps) {
  const profile = await getCurrentUserProfile()
  if (!canViewPEB(profile)) {
    redirect('/dashboard')
  }

  const { id } = await params
  const result = await getPEBDocument(id)

  if (result.error || !result.data) {
    notFound()
  }

  const peb = result.data

  const permissions = {
    canEdit: canEditPEB(profile),
    canDelete: canDeletePEB(profile),
    canUpdateStatus: canEditPEB(profile),
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Back Button */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/customs/export">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <span className="text-muted-foreground">Back to Export Documents</span>
      </div>

      {/* Detail View */}
      <PEBDetailView peb={peb} permissions={permissions} />
    </div>
  )
}
