'use client';

import { SafetyDocument, DocumentCategory, DocumentStatistics } from '@/types/safety-document';
import { DocumentSummaryCards, DocumentList } from '@/components/safety-documents';

interface DocumentsClientProps {
  categories: DocumentCategory[];
  documents: SafetyDocument[];
  statistics: DocumentStatistics;
}

export function DocumentsClient({ categories, documents, statistics }: DocumentsClientProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dokumen Keselamatan</h1>
        <p className="text-muted-foreground">
          Kelola JSA, SOP, MSDS, dan dokumen keselamatan lainnya
        </p>
      </div>

      <DocumentSummaryCards statistics={statistics} />

      <DocumentList documents={documents} categories={categories} />
    </div>
  );
}
