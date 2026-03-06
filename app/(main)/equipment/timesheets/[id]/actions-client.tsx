'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  submitTimesheet,
  approveTimesheet,
  rejectTimesheet,
} from '@/lib/timesheet-actions';
import { TimesheetStatus } from '@/types/timesheet';
import { Send, CheckCircle, XCircle, Loader2 } from 'lucide-react';

interface Props {
  timesheetId: string;
  status: TimesheetStatus;
  canManage: boolean;
}

export function TimesheetActions({ timesheetId, status, canManage }: Props) {
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
          <Button
            onClick={() => handleAction(() => submitTimesheet(timesheetId))}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            Ajukan Timesheet
          </Button>
        )}
        {status === 'submitted' && canManage && (
          <>
            <Button
              onClick={() => handleAction(() => approveTimesheet(timesheetId))}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700"
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="mr-2 h-4 w-4" />
              )}
              Setujui
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleAction(() => rejectTimesheet(timesheetId))}
              disabled={loading}
            >
              <XCircle className="mr-2 h-4 w-4" />
              Tolak
            </Button>
          </>
        )}
      </div>
    </Card>
  );
}
