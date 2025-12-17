'use client';

/**
 * AttachmentsSection Component
 * Reusable section that combines DocumentUploader and AttachmentList
 * for use in entity detail pages (PJO, JO, Invoice, Customer, Project)
 */

import { useState, useEffect, useCallback } from 'react';
import { Paperclip } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DocumentUploader } from './document-uploader';
import { AttachmentList } from './attachment-list';
import { getAttachments } from '@/lib/attachments/actions';
import { useToast } from '@/hooks/use-toast';
import type { AttachmentEntityType, DocumentAttachment } from '@/types/attachments';

interface AttachmentsSectionProps {
  entityType: AttachmentEntityType;
  entityId: string;
  title?: string;
  maxFiles?: number;
}

export function AttachmentsSection({
  entityType,
  entityId,
  title = 'Attachments',
  maxFiles = 10,
}: AttachmentsSectionProps) {
  const { toast } = useToast();
  const [attachments, setAttachments] = useState<DocumentAttachment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadAttachments = useCallback(async () => {
    setIsLoading(true);
    const result = await getAttachments(entityType, entityId);
    if (result.error) {
      toast({
        title: 'Error',
        description: result.error,
        variant: 'destructive',
      });
    } else {
      setAttachments(result.data);
    }
    setIsLoading(false);
  }, [entityType, entityId, toast]);

  useEffect(() => {
    loadAttachments();
  }, [loadAttachments]);

  const handleUploadComplete = (attachment: DocumentAttachment) => {
    setAttachments((prev) => [attachment, ...prev]);
    toast({
      title: 'Success',
      description: 'File uploaded successfully',
    });
  };

  const handleUploadError = (error: string) => {
    toast({
      title: 'Upload Error',
      description: error,
      variant: 'destructive',
    });
  };

  const handleDelete = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
    toast({
      title: 'Success',
      description: 'Attachment deleted',
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Paperclip className="h-5 w-5" />
          {title} ({attachments.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <DocumentUploader
          entityType={entityType}
          entityId={entityId}
          maxFiles={maxFiles}
          existingCount={attachments.length}
          onUploadComplete={handleUploadComplete}
          onError={handleUploadError}
        />
        <AttachmentList
          entityType={entityType}
          entityId={entityId}
          attachments={attachments}
          onDelete={handleDelete}
          isLoading={isLoading}
        />
      </CardContent>
    </Card>
  );
}
