'use client'

import { useState } from 'react'
import { PIBItem, PIBItemFormData } from '@/types/pib'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PIBItemForm } from './pib-item-form'
import { formatCurrency } from '@/lib/pib-utils'
import { Plus, Pencil, Trash2, AlertTriangle } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { addPIBItem, updatePIBItem, deletePIBItem } from '@/lib/pib-actions'
import { useToast } from '@/hooks/use-toast'

interface PIBItemsTableProps {
  pibId: string
  items: PIBItem[]
  currency: string
  editable: boolean
  onRefresh: () => void
}

export function PIBItemsTable({
  pibId,
  items,
  currency,
  editable,
  onRefresh,
}: PIBItemsTableProps) {
  const { toast } = useToast()
  const [formOpen, setFormOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<PIBItem | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingItem, setDeletingItem] = useState<PIBItem | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleAddItem = async (data: PIBItemFormData) => {
    const result = await addPIBItem(pibId, data)
    if (result.error) {
      toast({ title: 'Error', description: result.error, variant: 'destructive' })
      throw new Error(result.error)
    }
    toast({ title: 'Success', description: 'Item added' })
    onRefresh()
  }

  const handleUpdateItem = async (data: PIBItemFormData) => {
    if (!editingItem) return
    const result = await updatePIBItem(editingItem.id, data)
    if (result.error) {
      toast({ title: 'Error', description: result.error, variant: 'destructive' })
      throw new Error(result.error)
    }
    toast({ title: 'Success', description: 'Item updated' })
    setEditingItem(null)
    onRefresh()
  }

  const handleDeleteItem = async () => {
    if (!deletingItem) return
    setIsDeleting(true)
    try {
      const result = await deletePIBItem(deletingItem.id)
      if (result.error) {
        toast({ title: 'Error', description: result.error, variant: 'destructive' })
      } else {
        toast({ title: 'Success', description: 'Item deleted' })
        onRefresh()
      }
    } finally {
      setIsDeleting(false)
      setDeleteDialogOpen(false)
      setDeletingItem(null)
    }
  }

  const openEditForm = (item: PIBItem) => {
    setEditingItem(item)
    setFormOpen(true)
  }

  const openDeleteDialog = (item: PIBItem) => {
    setDeletingItem(item)
    setDeleteDialogOpen(true)
  }

  const totalDuties = items.reduce(
    (acc, item) => ({
      beaMasuk: acc.beaMasuk + (item.bea_masuk || 0),
      ppn: acc.ppn + (item.ppn || 0),
      pphImport: acc.pphImport + (item.pph_import || 0),
      totalPrice: acc.totalPrice + (item.total_price || 0),
    }),
    { beaMasuk: 0, ppn: 0, pphImport: 0, totalPrice: 0 }
  )

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Line Items ({items.length})</CardTitle>
        {editable && (
          <Button size="sm" onClick={() => setFormOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Item
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">#</TableHead>
                <TableHead>HS Code</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Unit Price</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">BM</TableHead>
                <TableHead className="text-right">PPN</TableHead>
                <TableHead className="text-right">PPh</TableHead>
                {editable && <TableHead className="w-[80px]">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={editable ? 10 : 9} className="h-24 text-center">
                    No items added yet.
                  </TableCell>
                </TableRow>
              ) : (
                <>
                  {items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.item_number}</TableCell>
                      <TableCell>
                        <div className="font-mono text-sm">{item.hs_code}</div>
                        {item.requires_permit && (
                          <div className="flex items-center gap-1 text-xs text-amber-600">
                            <AlertTriangle className="h-3 w-3" />
                            Permit required
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[200px] truncate" title={item.goods_description}>
                          {item.goods_description}
                        </div>
                        {item.brand && (
                          <div className="text-xs text-muted-foreground">{item.brand}</div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {item.quantity} {item.unit}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(item.unit_price || 0, item.currency)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(item.total_price || 0, item.currency)}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {formatCurrency(item.bea_masuk || 0, item.currency)}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {formatCurrency(item.ppn || 0, item.currency)}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {formatCurrency(item.pph_import || 0, item.currency)}
                      </TableCell>
                      {editable && (
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditForm(item)}
                              title="Edit"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openDeleteDialog(item)}
                              title="Delete"
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                  {/* Totals Row */}
                  <TableRow className="bg-muted/50 font-medium">
                    <TableCell colSpan={5} className="text-right">
                      Totals:
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(totalDuties.totalPrice, currency)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(totalDuties.beaMasuk, currency)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(totalDuties.ppn, currency)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(totalDuties.pphImport, currency)}
                    </TableCell>
                    {editable && <TableCell />}
                  </TableRow>
                </>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Item Form Dialog */}
        <PIBItemForm
          open={formOpen}
          onOpenChange={(open) => {
            setFormOpen(open)
            if (!open) setEditingItem(null)
          }}
          item={editingItem}
          currency={currency}
          onSubmit={editingItem ? handleUpdateItem : handleAddItem}
        />

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Item</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete item #{deletingItem?.item_number}? This action
                cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteItem}
                disabled={isDeleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  )
}
