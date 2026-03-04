import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { BLDetail } from './bl-detail';
import { getBillOfLading } from '@/app/actions/bl-actions';
import { Loader2 } from 'lucide-react';
import { getCurrentUserProfile, guardPage } from '@/lib/auth-utils';
import { ExplorerReadOnlyBanner } from '@/components/layout/explorer-read-only-banner';

export const dynamic = 'force-dynamic';

interface BLDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function BLDetailPage({ params }: BLDetailPageProps) {

  const profile = await getCurrentUserProfile();
  const { explorerReadOnly } = await guardPage(!!profile);
  const { id } = await params;
  
  const bl = await getBillOfLading(id);

  if (!bl) {
    notFound();
  }

  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-64">
      {explorerReadOnly && <ExplorerReadOnlyBanner />}
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <BLDetail bl={bl} />
    </Suspense>
  );
}
