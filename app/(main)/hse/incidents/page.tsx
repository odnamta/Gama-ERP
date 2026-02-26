import { Suspense } from 'react';
import { getIncidents } from '@/lib/incident-actions';
import { getCurrentUserProfile, guardPage } from '@/lib/auth-utils';
import { canAccessFeature } from '@/lib/permissions';
import { ExplorerReadOnlyBanner } from '@/components/layout/explorer-read-only-banner';
import { IncidentsClient } from './incidents-client';

export const dynamic = 'force-dynamic';

export default async function IncidentsPage() {
  const profile = await getCurrentUserProfile();
  const { explorerReadOnly } = await guardPage(
    canAccessFeature(profile, 'hse.incidents.view')
  );

  const result = await getIncidents();

  return (
    <Suspense fallback={<div className="p-6">Loading...</div>}>
      {explorerReadOnly && <ExplorerReadOnlyBanner />}
      <IncidentsClient
        incidents={result.data || []}
        readOnly={explorerReadOnly}
      />
    </Suspense>
  );
}
