'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  returnSurveyTool,
  markToolLost,
} from '@/lib/survey-tool-loan-actions';
import { LoanStatus } from '@/types/survey-tool-loan';
import { ArrowDownToLine, AlertTriangle, Loader2 } from 'lucide-react';

interface Props {
  loanId: string;
  status: LoanStatus;
}

export function SurveyToolLoanActions({ loanId, status }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showReturnDialog, setShowReturnDialog] = useState(false);
  const [returnCondition, setReturnCondition] = useState('good');

  async function handleReturn() {
    setLoading(true);
    const result = await returnSurveyTool(loanId, returnCondition);
    setLoading(false);
    if (result.success) {
      setShowReturnDialog(false);
      router.refresh();
    } else {
      alert(result.error || 'Gagal mencatat pengembalian');
    }
  }

  async function handleLost() {
    if (!confirm('Tandai alat ini sebagai hilang?')) return;
    setLoading(true);
    const result = await markToolLost(loanId);
    setLoading(false);
    if (result.success) {
      router.refresh();
    } else {
      alert(result.error || 'Gagal menandai alat hilang');
    }
  }

  if (!['borrowed', 'overdue'].includes(status)) return null;

  return (
    <>
      <Card className="p-4">
        <div className="flex gap-2">
          <Button
            onClick={() => setShowReturnDialog(true)}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700"
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <ArrowDownToLine className="mr-2 h-4 w-4" />
            )}
            Kembalikan Alat
          </Button>
          <Button
            variant="destructive"
            onClick={handleLost}
            disabled={loading}
          >
            <AlertTriangle className="mr-2 h-4 w-4" />
            Tandai Hilang
          </Button>
        </div>
      </Card>

      <Dialog open={showReturnDialog} onOpenChange={setShowReturnDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Kembalikan Alat Survey</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Kondisi Alat Saat Dikembalikan</Label>
              <Select value={returnCondition} onValueChange={setReturnCondition}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="good">Baik</SelectItem>
                  <SelectItem value="fair">Cukup</SelectItem>
                  <SelectItem value="needs_repair">Perlu Perbaikan</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReturnDialog(false)}>
              Batal
            </Button>
            <Button
              onClick={handleReturn}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Kembalikan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
