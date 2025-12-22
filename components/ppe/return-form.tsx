'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PPEIssuance, ReturnPPEInput } from '@/types/ppe';
import { returnPPE, replacePPE, markPPELost, markPPEDamaged } from '@/lib/ppe-actions';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface ReturnFormProps {
  issuance: PPEIssuance | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function ReturnForm({ issuance, open, onOpenChange, onSuccess }: ReturnFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('return');
  const [formData, setFormData] = useState<ReturnPPEInput>({
    returned_date: new Date().toISOString().split('T')[0],
    returned_condition: 'good',
    replacement_reason: null,
    notes: null,
  });
  const [lostDamagedNotes, setLostDamagedNotes] = useState('');

  const handleReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issuance) return;
    setLoading(true);

    try {
      await returnPPE(issuance.id, formData);
      toast.success('PPE returned successfully');
      onOpenChange(false);
      onSuccess?.();
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to return PPE');
    } finally {
      setLoading(false);
    }
  };

  const handleReplace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issuance) return;
    setLoading(true);

    try {
      await replacePPE(issuance.id, {
        ...formData,
        replacement_reason: formData.replacement_reason || 'Scheduled replacement',
      });
      toast.success('PPE replaced successfully');
      onOpenChange(false);
      onSuccess?.();
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to replace PPE');
    } finally {
      setLoading(false);
    }
  };

  const handleLost = async () => {
    if (!issuance) return;
    setLoading(true);

    try {
      await markPPELost(issuance.id, lostDamagedNotes);
      toast.success('PPE marked as lost');
      onOpenChange(false);
      onSuccess?.();
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to mark PPE as lost');
    } finally {
      setLoading(false);
    }
  };

  const handleDamaged = async () => {
    if (!issuance) return;
    setLoading(true);

    try {
      await markPPEDamaged(issuance.id, lostDamagedNotes);
      toast.success('PPE marked as damaged');
      onOpenChange(false);
      onSuccess?.();
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to mark PPE as damaged');
    } finally {
      setLoading(false);
    }
  };

  if (!issuance) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Return / Replace PPE</DialogTitle>
          <DialogDescription>
            {issuance.ppe_type?.ppe_name} issued to {issuance.employee?.full_name}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="return">Return</TabsTrigger>
            <TabsTrigger value="replace">Replace</TabsTrigger>
            <TabsTrigger value="lost">Lost/Damaged</TabsTrigger>
          </TabsList>

          <TabsContent value="return" className="space-y-4">
            <form onSubmit={handleReturn} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="return_date">Return Date</Label>
                  <Input
                    id="return_date"
                    type="date"
                    value={formData.returned_date}
                    onChange={e =>
                      setFormData({ ...formData, returned_date: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="condition">Condition</Label>
                  <Select
                    value={formData.returned_condition}
                    onValueChange={value =>
                      setFormData({ ...formData, returned_condition: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="good">Good</SelectItem>
                      <SelectItem value="fair">Fair</SelectItem>
                      <SelectItem value="poor">Poor</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="return_reason">Reason (Optional)</Label>
                <Textarea
                  id="return_reason"
                  value={formData.replacement_reason || ''}
                  onChange={e =>
                    setFormData({ ...formData, replacement_reason: e.target.value || null })
                  }
                  placeholder="Why is this PPE being returned?"
                  rows={2}
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Return PPE
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>

          <TabsContent value="replace" className="space-y-4">
            <form onSubmit={handleReplace} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="replace_date">Replacement Date</Label>
                  <Input
                    id="replace_date"
                    type="date"
                    value={formData.returned_date}
                    onChange={e =>
                      setFormData({ ...formData, returned_date: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="old_condition">Old Item Condition</Label>
                  <Select
                    value={formData.returned_condition}
                    onValueChange={value =>
                      setFormData({ ...formData, returned_condition: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="good">Good</SelectItem>
                      <SelectItem value="fair">Fair</SelectItem>
                      <SelectItem value="poor">Poor</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="replace_reason">Replacement Reason</Label>
                <Textarea
                  id="replace_reason"
                  value={formData.replacement_reason || ''}
                  onChange={e =>
                    setFormData({ ...formData, replacement_reason: e.target.value || null })
                  }
                  placeholder="Why is this PPE being replaced?"
                  rows={2}
                  required
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Replace PPE
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>

          <TabsContent value="lost" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="lost_notes">Notes</Label>
                <Textarea
                  id="lost_notes"
                  value={lostDamagedNotes}
                  onChange={e => setLostDamagedNotes(e.target.value)}
                  placeholder="Describe the circumstances..."
                  rows={3}
                  required
                />
              </div>

              <DialogFooter className="flex-col sm:flex-row gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleLost}
                  disabled={loading || !lostDamagedNotes}
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Mark as Lost
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDamaged}
                  disabled={loading || !lostDamagedNotes}
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Mark as Damaged
                </Button>
              </DialogFooter>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
