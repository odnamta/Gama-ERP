import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { PermitDetailClient } from './permit-detail-client';
import { getSafetyPermit } from '@/lib/safety-permit-actions';
import { getCurrentUserProfile, guardPage } from '@/lib/auth-utils';
import { canAccessFeature } from '@/lib/permissions';
import { ExplorerReadOnlyBanner } from '@/components/layout/explorer-read-only-banner';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Detail Izin Kerja - HSE',
  description: 'Detail izin kerja (PTW)',
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PermitDetailPage({ params }: PageProps) {
  const profile = await getCurrentUserProfile();
  const { explorerReadOnly } = await guardPage(
    canAccessFeature(profile, 'hse.permits.view')
  );

  const { id } = await params;

  const permitResult = await getSafetyPermit(id);

  if (!permitResult.success || !permitResult.data) {
    notFound();
  }

  return (
    <Suspense fallback={<div className="p-8 text-center">Memuat...</div>}>
      {explorerReadOnly && <ExplorerReadOnlyBanner />}
      <PermitDetailClient permit={permitResult.data} readOnly={explorerReadOnly} />
    </Suspense>
  );
}
