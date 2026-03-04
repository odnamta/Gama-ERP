import { Suspense } from 'react';
import { PayablesClient } from './payables-client';
import { getVendorInvoices } from '@/app/actions/vendor-invoice-actions';
import { getServiceProviders } from '@/app/actions/service-provider-actions';
import { Loader2 } from 'lucide-react';
import { getCurrentUserProfile, guardPage } from '@/lib/auth-utils';
import { ExplorerReadOnlyBanner } from '@/components/layout/explorer-read-only-banner';

export const dynamic = 'force-dynamic';

export default async function VendorPayablesPage() {

  const profile = await getCurrentUserProfile();
  const { explorerReadOnly } = await guardPage(!!profile);
  // Fetch initial data in parallel
  const [invoicesResult, vendorsResult] = await Promise.all([
    getVendorInvoices(),
    getServiceProviders(),
  ]);

  const invoices = invoicesResult.success ? invoicesResult.data || [] : [];
  const vendors = vendorsResult.success ? vendorsResult.data || [] : [];

  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-64">
      {explorerReadOnly && <ExplorerReadOnlyBanner />}
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <PayablesClient
        initialInvoices={invoices}
        vendors={vendors}
      />
    </Suspense>
  );
}
