import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { ManifestDetail } from './manifest-detail';
import { getCargoManifest } from '@/app/actions/cargo-manifest-actions';
import { getBillsOfLading } from '@/app/actions/bl-actions';
import { BillOfLading } from '@/types/agency';
import { Loader2 } from 'lucide-react';
import { getCurrentUserProfile, guardPage } from '@/lib/auth-utils';
import { ExplorerReadOnlyBanner } from '@/components/layout/explorer-read-only-banner';

export const dynamic = 'force-dynamic';

interface ManifestDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ManifestDetailPage({ params }: ManifestDetailPageProps) {

  const profile = await getCurrentUserProfile();
  const { explorerReadOnly } = await guardPage(!!profile);
  const { id } = await params;
  
  const manifest = await getCargoManifest(id);

  if (!manifest) {
    notFound();
  }

  // Fetch linked B/Ls if any
  let linkedBLs: BillOfLading[] = [];
  if (manifest.blIds && manifest.blIds.length > 0) {
    const allBLs = await getBillsOfLading({});
    linkedBLs = allBLs.filter(bl => manifest.blIds.includes(bl.id));
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
      <ManifestDetail manifest={manifest} linkedBLs={linkedBLs} />
    </Suspense>
  );
}
