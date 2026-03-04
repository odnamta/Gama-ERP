import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ResourceDetail } from '@/components/resource-scheduling/resource-detail'
import { getResourceById } from '@/lib/resource-scheduling-actions'
import { ChevronLeft } from 'lucide-react'
import { getCurrentUserProfile, guardPage } from '@/lib/auth-utils';
import { ExplorerReadOnlyBanner } from '@/components/layout/explorer-read-only-banner';

export const dynamic = 'force-dynamic'

interface ResourceDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function ResourceDetailPage({ params }: ResourceDetailPageProps) {

  const profile = await getCurrentUserProfile();
  const { explorerReadOnly } = await guardPage(!!profile);
  const { id } = await params
  const resource = await getResourceById(id)

  if (!resource) {
    notFound()
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {explorerReadOnly && <ExplorerReadOnlyBanner />}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/engineering/resources">
            <ChevronLeft className="h-5 w-5" />
          </Link>
        </Button>
        <span className="text-muted-foreground">Back to Resources</span>
      </div>

      <ResourceDetail resource={resource} />
    </div>
  )
}
