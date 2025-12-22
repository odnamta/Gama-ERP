import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { DocumentDetailClient } from './document-detail-client';
import { 
  getSafetyDocument, 
  getJSAHazards, 
  getDocumentAcknowledgments,
  getAcknowledgmentStats,
} from '@/lib/safety-document-actions';

export const metadata = {
  title: 'Detail Dokumen - HSE',
  description: 'Detail dokumen keselamatan',
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function DocumentDetailPage({ params }: PageProps) {
  const { id } = await params;
  
  const [documentResult, hazardsResult, acknowledgementsResult, statsResult] = await Promise.all([
    getSafetyDocument(id),
    getJSAHazards(id),
    getDocumentAcknowledgments(id),
    getAcknowledgmentStats(id),
  ]);

  if (!documentResult.success || !documentResult.data) {
    notFound();
  }

  return (
    <Suspense fallback={<div className="p-8 text-center">Memuat...</div>}>
      <DocumentDetailClient
        document={documentResult.data}
        hazards={hazardsResult.data || []}
        acknowledgments={acknowledgementsResult.data || []}
        acknowledgmentStats={statsResult.data || { totalRequired: 0, totalAcknowledged: 0, completionRate: 0 }}
      />
    </Suspense>
  );
}
