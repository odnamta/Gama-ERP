'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { PPEInventory, PPEType, RecordPurchaseInput } from '@/types/ppe';
import { updateInventory, recordPurchase } from '@/lib/ppe-actions';
import { getStockStatus, getStockStatusColor, formatPPECost, formatPPEDate } from '@/lib/ppe-utils';
import { toast } from 'sonner';
import { Package, Plus, AlertTriangle, Loader2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface InventoryTableProps {
  inventory: PPEInventory[];
  ppeTypes: PPEType[];
}

export function InventoryTable({ inventory, ppeTypes }: InventoryTableProps) {
  const router = useRouter();
  const [showPurchaseForm, setShowPurchaseForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [purchaseData, setPurchaseData] = useState<RecordPurchaseInput>({
    ppe_type_id: '',
    size: '',
    quantity: 1,
    purchase_date: new Date().toISOString().split('T')[0],
    unit_cost: 0,
    storage_location: '',
  });

  const handleRecordPurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await recordPurchase(purchaseData);
      toast.success('Purchase recorded successfully');
      setShowPurchaseForm(false);
      setPurchaseData({
        ppe_type_id: '',
        size: '',
        quantity: 1,
        purchase_date: new Date().toISOString().split('T')[0],
        unit_cost: 0,
        storage_location: '',
      });
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to record purchase');
    } finally {
      setLoading(false);
    }
  };

  const selectedPPEType = ppeTypes.find(t => t.id === purchaseData.ppe_type_id);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">PPE Inventory</h2>
        <Button onClick={() => setShowPurchaseForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Record Purchase
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>PPE Type</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>In Stock</TableHead>
              <TableHead>Reorder Level</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Last Purchase</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {inventory.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  <Package className="mx-auto h-8 w-8 mb-2 opacity-50" />
                  No inventory records. Record a purchase to get started.
                </TableCell>
              </TableRow>
            ) : (
              inventory.map(item => {
                const status = getStockStatus(item.quantity_in_stock, item.reorder_level);
                return (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      {item.ppe_type?.ppe_name || 'Unknown'}
                    </TableCell>
                    <TableCell>{item.size || '-'}</TableCell>
                    <TableCell>
                      <span className="font-mono">{item.quantity_in_stock}</span>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono">{item.reorder_level}</span>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStockStatusColor(status)}>
                        {status === 'critical' && (
                          <AlertTriangle className="mr-1 h-3 w-3" />
                        )}
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>{item.storage_location || '-'}</TableCell>
                    <TableCell>
                      {item.last_purchase_date ? (
                        <div className="text-sm">
                          <div>{formatPPEDate(item.last_purchase_date)}</div>
                          <div className="text-muted-foreground">
                            {item.last_purchase_qty} units @ {formatPPECost(item.last_purchase_cost)}
                          </div>
                        </div>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={showPurchaseForm} onOpenChange={setShowPurchaseForm}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Record Purchase</DialogTitle>
            <DialogDescription>
              Add new PPE stock to inventory.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleRecordPurchase} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ppe_type">PPE Type</Label>
              <Select
                value={purchaseData.ppe_type_id}
                onValueChange={value =>
                  setPurchaseData({ ...purchaseData, ppe_type_id: value, size: '' })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select PPE type" />
                </SelectTrigger>
                <SelectContent>
                  {ppeTypes.map(type => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.ppe_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedPPEType?.has_sizes && selectedPPEType.available_sizes.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="size">Size</Label>
                <Select
                  value={purchaseData.size || ''}
                  onValueChange={value =>
                    setPurchaseData({ ...purchaseData, size: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select size" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedPPEType.available_sizes.map(size => (
                      <SelectItem key={size} value={size}>
                        {size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={purchaseData.quantity}
                  onChange={e =>
                    setPurchaseData({ ...purchaseData, quantity: parseInt(e.target.value) || 1 })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="unit_cost">Unit Cost (IDR)</Label>
                <Input
                  id="unit_cost"
                  type="number"
                  min="0"
                  value={purchaseData.unit_cost}
                  onChange={e =>
                    setPurchaseData({ ...purchaseData, unit_cost: parseFloat(e.target.value) || 0 })
                  }
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="purchase_date">Purchase Date</Label>
              <Input
                id="purchase_date"
                type="date"
                value={purchaseData.purchase_date}
                onChange={e =>
                  setPurchaseData({ ...purchaseData, purchase_date: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="storage_location">Storage Location</Label>
              <Input
                id="storage_location"
                value={purchaseData.storage_location || ''}
                onChange={e =>
                  setPurchaseData({ ...purchaseData, storage_location: e.target.value })
                }
                placeholder="e.g., Warehouse A, Shelf 3"
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowPurchaseForm(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading || !purchaseData.ppe_type_id}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Record Purchase
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
