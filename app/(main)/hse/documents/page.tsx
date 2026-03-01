import { Suspense } from 'react';
import { DocumentsClient } from './documents-client';
import { getDocumentCategories, getSafetyDocuments, getDocumentStatistics } from '@/lib/safety-document-actions';
import { getCurrentUserProfile, guardPage } from '@/lib/auth-utils';
import { canAccessFeature } from '@/lib/permissions';
import { ExplorerReadOnlyBanner } from '@/components/layout/explorer-read-only-banner';
import { DocumentStatistics } from '@/types/safety-document';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Dokumen Keselamatan - HSE',
  description: 'Kelola dokumen keselamatan kerja',
};

export default async function DocumentsPage() {
  const profile = await getCurrentUserProfile();
  const { explorerReadOnly } = await guardPage(
    canAccessFeature(profile, 'hse.nav')
  );
  const [categoriesResult, documentsResult, statsResult] = await Promise.all([
    getDocumentCategories(),
    getSafetyDocuments(),
    getDocumentStatistics(),
  ]);

  const defaultStats: DocumentStatistics = {
    totalDocuments: 0,
    approvedDocuments: 0,
    pendingReview: 0,
    expiringWithin30Days: 0,
    byCategory: {},
    byStatus: {} as Record<import('@/types/safety-document').DocumentStatus, number>,
  };

  return (
    <Suspense fallback={<div className="p-8 text-center">Memuat...</div>}>
      {explorerReadOnly && <ExplorerReadOnlyBanner />}
      <DocumentsClient
        categories={categoriesResult.data || []}
        documents={documentsResult.data || []}
        statistics={statsResult.data || defaultStats}
      />
    </Suspense>
  );
}
