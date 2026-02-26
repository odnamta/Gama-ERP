import { Suspense } from 'react';
import { PermitsClient } from './permits-client';
import { getSafetyPermits, getPermitStatistics } from '@/lib/safety-permit-actions';
import { getCurrentUserProfile, guardPage } from '@/lib/auth-utils';
import { canAccessFeature } from '@/lib/permissions';
import { ExplorerReadOnlyBanner } from '@/components/layout/explorer-read-only-banner';
import { PermitStatistics, PermitType, PermitStatus } from '@/types/safety-document';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Izin Kerja - HSE',
  description: 'Kelola izin kerja (PTW)',
};

export default async function PermitsPage() {
  const profile = await getCurrentUserProfile();
  const { explorerReadOnly } = await guardPage(
    canAccessFeature(profile, 'hse.permits.view')
  );

  const [permitsResult, statsResult] = await Promise.all([
    getSafetyPermits(),
    getPermitStatistics(),
  ]);

  const defaultStats: PermitStatistics = {
    totalPermits: 0,
    activePermits: 0,
    pendingApproval: 0,
    completedThisMonth: 0,
    byType: {} as Record<PermitType, number>,
    byStatus: {} as Record<PermitStatus, number>,
  };

  return (
    <Suspense fallback={<div className="p-8 text-center">Memuat...</div>}>
      {explorerReadOnly && <ExplorerReadOnlyBanner />}
      <PermitsClient
        permits={permitsResult.data || []}
        statistics={statsResult.data || defaultStats}
        readOnly={explorerReadOnly}
      />
    </Suspense>
  );
}
