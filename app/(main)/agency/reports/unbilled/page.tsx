import { Suspense } from 'react';
import { UnbilledRevenueClient } from './unbilled-client';
import { getUnbilledRevenue } from '@/app/actions/profitability-actions';
import { getCustomersForSelection } from '@/lib/jmp-actions';
import { Loader2 } from 'lucide-react';
import { getCurrentUserProfile, guardPage } from '@/lib/auth-utils';
import { ExplorerReadOnlyBanner } from '@/components/layout/explorer-read-only-banner';

export const dynamic = 'force-dynamic';

export default async function UnbilledRevenuePage() {

  const profile = await getCurrentUserProfile();
  const { explorerReadOnly } = await guardPage(!!profile);
  // Fetch initial data in parallel
  const [unbilledResult, customers] = await Promise.all([
    getUnbilledRevenue(),
    getCustomersForSelection(),
  ]);

  const unbilledRevenue = unbilledResult.success ? unbilledResult.data || [] : [];

  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-64">
      {explorerReadOnly && <ExplorerReadOnlyBanner />}
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <UnbilledRevenueClient
        initialUnbilledRevenue={unbilledRevenue}
        customers={customers}
      />
    </Suspense>
  );
}
