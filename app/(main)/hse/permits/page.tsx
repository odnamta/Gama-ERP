import { Suspense } from 'react';
import { PermitsClient } from './permits-client';
import { getSafetyPermits, getPermitStatistics } from '@/lib/safety-permit-actions';

export const metadata = {
  title: 'Izin Kerja - HSE',
  description: 'Kelola izin kerja (PTW)',
};

export default async function PermitsPage() {
  const [permitsResult, statsResult] = await Promise.all([
    getSafetyPermits(),
    getPermitStatistics(),
  ]);

  return (
    <Suspense fallback={<div className="p-8 text-center">Memuat...</div>}>
      <PermitsClient
        permits={permitsResult.data || []}
        statistics={statsResult.data || {
          totalPermits: 0,
          activePermits: 0,
          pendingApproval: 0,
          completedThisMonth: 0,
          byType: {},
          byStatus: {},
        }}
      />
    </Suspense>
  );
}
