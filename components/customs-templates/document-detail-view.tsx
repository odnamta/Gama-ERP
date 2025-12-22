'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Download, CheckCircle, Send, Archive, FileText, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import type { GeneratedDocumentWithRelations, GeneratedDocumentStatus } from '@/types/customs-templates';
import { DOCUMENT_TYPE_LABELS, DOCUMENT_STATUS_TRANSITIONS } from '@/types/customs-templates';
import { DocumentStatusBadge } from './document-status-badge';
import { updateDocumentStatus, generatePreviewHtml } from '@/lib/template-actions';
import { toast } from 'sonner';

interface DocumentDetailViewProps {
  document: GeneratedDocumentWithRelations;
}

export function DocumentDetailView({ document: initialDocument }: DocumentDetailViewProps) {
  const router = useRouter();
  const [document, setDocument] = useState(initialDocument);
  const [loading, setLoading] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string>('');
  const [previewLoading, setPreviewLoading] = useState(false);

  const allowedTransitions = DOCUMENT_STATUS_TRANSITIONS[document.status];

  const handleStatusChange = async (newStatus: GeneratedDocumentStatus) => {
    setLoading(true);
    const result = await updateDocumentStatus(document.id, newStatus);

    if (result.success) {
      setDocument((prev) => ({ ...prev, status: newStatus }));
      toast.success(`Document ${newStatus === 'final' ? 'finalized' : newStatus}`);
      router.refresh();
    } else {
      toast.error(result.error || 'Failed to update status');
    }
    setLoading(false);
  };

  const loadPreview = async () => {
    if (previewHtml || !document.template_id) return;
    
    setPreviewLoading(true);
    try {
      const result = await generatePreviewHtml(document.template_id, document.document_data);
      if (!result.error) {
        setPreviewHtml(result.html);
      }
    } catch (error) {
      console.error('Error loading preview:', error);
    } finally {
      setPreviewLoading(false);
    }
  };

  const getSourceInfo = () => {
    if (document.pib) {
      return { type: 'PIB', ref: document.pib.internal_ref, name: document.pib.importer_name };
    }
    if (document.peb) {
      return { type: 'PEB', ref: document.peb.internal_ref, name: document.peb.exporter_name };
    }
    if (document.job_order) {
      return { type: 'Job Order', ref: document.job_order.jo_number, name: '' };
    }
    return null;
  };

  const sourceInfo = getSourceInfo();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div className="flex gap-2">
          {document.pdf_url && (
            <Button variant="outline" asChild>
              <a href={document.pdf_url} target="_blank" rel="noopener noreferrer">
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </a>
            </Button>
          )}
          {allowedTransitions.includes('final') && (
            <Button onClick={() => handleStatusChange('final')} disabled={loading}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Finalize
            </Button>
          )}
          {allowedTransitions.includes('sent') && (
            <Button onClick={() => handleStatusChange('sent')} disabled={loading}>
              <Send className="h-4 w-4 mr-2" />
              Mark as Sent
            </Button>
          )}
          {allowedTransitions.includes('archived') && (
            <Button variant="outline" onClick={() => handleStatusChange('archived')} disabled={loading}>
              <Archive className="h-4 w-4 mr-2" />
              Archive
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Document Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Document Info
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Document Number</p>
              <p className="font-mono font-medium">{document.document_number}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <DocumentStatusBadge status={document.status} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Template</p>
              <p className="font-medium">{document.template?.template_name || '-'}</p>
              {document.template?.document_type && (
                <p className="text-sm text-muted-foreground">
                  {DOCUMENT_TYPE_LABELS[document.template.document_type]}
                </p>
              )}
            </div>
            {sourceInfo && (
              <div>
                <p className="text-sm text-muted-foreground">Source</p>
                <p className="font-medium">{sourceInfo.type}: {sourceInfo.ref}</p>
                {sourceInfo.name && (
                  <p className="text-sm text-muted-foreground">{sourceInfo.name}</p>
                )}
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground">Created</p>
              <p>{format(new Date(document.created_at), 'dd/MM/yyyy HH:mm')}</p>
            </div>
          </CardContent>
        </Card>

        {/* Preview & Data */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Document Content</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="preview" onValueChange={(v) => v === 'preview' && loadPreview()}>
                <TabsList>
                  <TabsTrigger value="preview">Preview</TabsTrigger>
                  <TabsTrigger value="data">Data</TabsTrigger>
                </TabsList>

                <TabsContent value="preview" className="mt-4">
                  <div className="border rounded-lg p-4 bg-white min-h-[400px]">
                    {previewLoading ? (
                      <div className="flex items-center justify-center h-[400px]">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        <span className="ml-2 text-muted-foreground">Loading preview...</span>
                      </div>
                    ) : previewHtml ? (
                      <iframe
                        srcDoc={previewHtml}
                        className="w-full h-[500px] border-0"
                        title="Document Preview"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-[400px] text-muted-foreground">
                        Click to load preview
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="data" className="mt-4">
                  <div className="border rounded-lg p-4 bg-muted/50 max-h-[500px] overflow-auto">
                    <pre className="text-sm">
                      {JSON.stringify(document.document_data, null, 2)}
                    </pre>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
