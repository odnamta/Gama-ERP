import { Suspense } from 'react';
import { SIListClient } from './si-list-client';
import { getShippingInstructions, getSIStats } from '@/app/actions/shipping-instruction-actions';
import { Loader2 } from 'lucide-react';
import { getCurrentUserProfile, guardPage } from '@/lib/auth-utils';
import { ExplorerReadOnlyBanner } from '@/components/layout/explorer-read-only-banner';

export const dynamic = 'force-dynamic';

export default async function ShippingInstructionsPage() {

  const profile = await getCurrentUserProfile();
  const { explorerReadOnly } = await guardPage(!!profile);
  const [sis, stats] = await Promise.all([
    getShippingInstructions({}),
    getSIStats(),
  ]);

  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-64">
      {explorerReadOnly && <ExplorerReadOnlyBanner />}
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <SIListClient
        initialSIs={sis}
        initialStats={stats}
      />
    </Suspense>
  );
}
