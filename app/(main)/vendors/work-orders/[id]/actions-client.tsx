'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  issueSPK,
  completeSPK,
  cancelSPK,
} from '@/lib/spk-actions';
import { SPKStatus } from '@/types/vendor-work-order';
import { Send, CheckCircle, Ban, Loader2 } from 'lucide-react';

interface Props {
  spkId: string;
  status: SPKStatus;
}

export function SPKActions({ spkId, status }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleAction(action: () => Promise<{ success: boolean; error?: string }>) {
    setLoading(true);
    const result = await action();
    setLoading(false);
    if (result.success) {
      router.refresh();
    } else {
      alert(result.error || 'Terjadi kesalahan');
    }
  }

  return (
    <Card className="p-4">
      <div className="flex gap-2">
        {status === 'draft' && (
          <>
            <Button
              onClick={() => handleAction(() => issueSPK(spkId))}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Terbitkan SPK
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleAction(() => cancelSPK(spkId))}
              disabled={loading}
            >
              <Ban className="mr-2 h-4 w-4" />
              Batalkan
            </Button>
          </>
        )}
        {(status === 'issued' || status === 'in_progress') && (
          <>
            <Button
              onClick={() => handleAction(() => completeSPK(spkId))}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700"
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="mr-2 h-4 w-4" />
              )}
              Selesaikan
            </Button>
            {status === 'issued' && (
              <Button
                variant="destructive"
                onClick={() => handleAction(() => cancelSPK(spkId))}
                disabled={loading}
              >
                <Ban className="mr-2 h-4 w-4" />
                Batalkan
              </Button>
            )}
          </>
        )}
      </div>
    </Card>
  );
}
