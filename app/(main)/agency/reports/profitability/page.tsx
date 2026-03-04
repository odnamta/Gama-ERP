import { Suspense } from 'react';
import { ProfitabilityClient } from './profitability-client';
import { getShipmentProfitability } from '@/app/actions/profitability-actions';
import { getCustomersForSelection } from '@/lib/jmp-actions';
import { Loader2 } from 'lucide-react';
import { getCurrentUserProfile, guardPage } from '@/lib/auth-utils';
import { ExplorerReadOnlyBanner } from '@/components/layout/explorer-read-only-banner';

export const dynamic = 'force-dynamic';

export default async function ProfitabilityReportPage() {

  const profile = await getCurrentUserProfile();
  const { explorerReadOnly } = await guardPage(!!profile);
  // Fetch initial data in parallel
  const [profitabilityResult, customers] = await Promise.all([
    getShipmentProfitability(),
    getCustomersForSelection(),
  ]);

  const profitability = profitabilityResult.success ? profitabilityResult.data || [] : [];

  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-64">
      {explorerReadOnly && <ExplorerReadOnlyBanner />}
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <ProfitabilityClient
        initialProfitability={profitability}
        customers={customers}
      />
    </Suspense>
  );
}
