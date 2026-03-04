import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { ArrivalNoticeDetail } from './arrival-notice-detail';
import { getArrivalNotice } from '@/app/actions/arrival-notice-actions';
import { Loader2 } from 'lucide-react';
import { getCurrentUserProfile, guardPage } from '@/lib/auth-utils';
import { ExplorerReadOnlyBanner } from '@/components/layout/explorer-read-only-banner';

export const dynamic = 'force-dynamic';

interface ArrivalNoticeDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ArrivalNoticeDetailPage({ params }: ArrivalNoticeDetailPageProps) {

  const profile = await getCurrentUserProfile();
  const { explorerReadOnly } = await guardPage(!!profile);
  const { id } = await params;
  
  const notice = await getArrivalNotice(id);

  if (!notice) {
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
      <ArrivalNoticeDetail notice={notice} />
    </Suspense>
  );
}
