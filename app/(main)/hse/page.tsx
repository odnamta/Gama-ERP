import { Suspense } from 'react';
import { getIncidentDashboardSummary, getIncidents, getIncidentStatistics } from '@/lib/incident-actions';
import { getCurrentUserProfile, guardPage } from '@/lib/auth-utils';
import { canAccessFeature } from '@/lib/permissions';
import { ExplorerReadOnlyBanner } from '@/components/layout/explorer-read-only-banner';
import { HSEClient } from './hse-client';

export const dynamic = 'force-dynamic';

export default async function HSEPage() {
  const profile = await getCurrentUserProfile();
  const { explorerReadOnly } = await guardPage(
    canAccessFeature(profile, 'hse.nav')
  );

  const [summaryResult, incidentsResult, statsResult] = await Promise.all([
    getIncidentDashboardSummary(),
    getIncidents({ status: ['reported', 'under_investigation', 'pending_actions'] }),
    getIncidentStatistics(),
  ]);

  return (
    <Suspense fallback={<div className="p-6">Loading...</div>}>
      {explorerReadOnly && <ExplorerReadOnlyBanner />}
      <HSEClient
        summary={summaryResult.data}
        recentIncidents={incidentsResult.data || []}
        statistics={statsResult.data}
      />
    </Suspense>
  );
}
