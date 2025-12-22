'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader2 } from 'lucide-react';
import { acknowledgeDocument } from '@/lib/safety-document-actions';
import { useToast } from '@/hooks/use-toast';

interface AcknowledgmentButtonProps {
  documentId: string;
  isAcknowledged: boolean;
  onSuccess?: () => void;
}

export function AcknowledgmentButton({
  documentId,
  isAcknowledged,
  onSuccess,
}: AcknowledgmentButtonProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleAcknowledge = async () => {
    setLoading(true);
    const result = await acknowledgeDocument(documentId);
    setLoading(false);

    if (result.success) {
      toast({
        title: 'Berhasil',
        description: 'Dokumen berhasil diakui',
      });
      onSuccess?.();
    } else {
      toast({
        title: 'Error',
        description: result.error,
        variant: 'destructive',
      });
    }
  };

  if (isAcknowledged) {
    return (
      <Button variant="outline" disabled className="gap-2">
        <CheckCircle className="h-4 w-4 text-green-600" />
        Sudah Diakui
      </Button>
    );
  }

  return (
    <Button onClick={handleAcknowledge} disabled={loading} className="gap-2">
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <CheckCircle className="h-4 w-4" />
      )}
      Akui Dokumen
    </Button>
  );
}
