'use client';

import { useState, useEffect } from 'react';
import { getGeneratedDocuments, getActiveTemplates } from '@/lib/template-actions';
import { GeneratedDocumentList, DocumentGeneratorDialog } from '@/components/customs-templates';
import type { GeneratedDocumentWithRelations, CustomsDocumentTemplate } from '@/types/customs-templates';

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<GeneratedDocumentWithRelations[]>([]);
  const [templates, setTemplates] = useState<CustomsDocumentTemplate[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      const [docsResult, templatesResult] = await Promise.all([
        getGeneratedDocuments(),
        getActiveTemplates(),
      ]);
      setDocuments(docsResult.documents);
      setTemplates(templatesResult.templates);
      setLoading(false);
    };
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Generated Documents</h1>
        <p className="text-muted-foreground">
          View and manage generated customs documents.
        </p>
      </div>
      <GeneratedDocumentList
        documents={documents}
        onGenerateClick={() => setDialogOpen(true)}
      />
      <DocumentGeneratorDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        templates={templates}
      />
    </div>
  );
}
