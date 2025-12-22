'use client'

import { useState } from 'react'
import { PEBItem, PEBItemFormData } from '@/types/peb'
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
import { PEBItemForm } from './peb-item-form'
import { formatCurrency } from '@/lib/peb-utils'
import { Plus, Pencil, Trash2 } from 'lucide-react'
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
import { addPEBItem, updatePEBItem, deletePEBItem } from '@/lib/peb-actions'
import { useToast } from '@/hooks/use-toast'

interface PEBItemsTableProps {
  pebId: string
  items: PEBItem[]
  currency: string
  editable: boolean
  onRefresh: () => void
}

export function PEBItemsTable({
  pebId,
  items,
  currency,
  editable,
  onRefresh,
}: PEBItemsTableProps) {
  const { toast } = useToast()
  const [formOpen, setFormOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<PEBItem | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingItem, setDeletingItem] = useState<PEBItem | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleAddItem = async (data: PEBItemFormData) => {
    const result = await addPEBItem(pebId, data)
    if (result.error) {
      toast({ title: 'Error', description: result.error, variant: 'destructive' })
      throw new Error(result.error)
    }
    toast({ title: 'Success', description: 'Item added' })
    onRefresh()
  }

  const handleUpdateItem = async (data: PEBItemFormData) => {
    if (!editingItem) return
    const result = await updatePEBItem(editingItem.id, data)
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
      const result = await deletePEBItem(deletingItem.id)
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

  const openEditForm = (item: PEBItem) => {
    setEditingItem(item)
    setFormOpen(true)
  }

  const openDeleteDialog = (item: PEBItem) => {
    setDeletingItem(item)
    setDeleteDialogOpen(true)
  }

  const totalValue = items.reduce((acc, item) => acc + (item.total_price || 0), 0)
  const totalWeight = items.reduce((acc, item) => acc + (item.gross_weight_kg || 0), 0)

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
                <TableHead className="text-right">Weight (kg)</TableHead>
                <TableHead className="text-right">Unit Price</TableHead>
                <TableHead className="text-right">Total</TableHead>
                {editable && <TableHead className="w-[80px]">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={editable ? 8 : 7} className="h-24 text-center">
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
                        {item.gross_weight_kg?.toLocaleString() || '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(item.unit_price || 0, item.currency)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(item.total_price || 0, item.currency)}
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
                    <TableCell colSpan={4} className="text-right">
                      Totals:
                    </TableCell>
                    <TableCell className="text-right">
                      {totalWeight.toLocaleString()} kg
                    </TableCell>
                    <TableCell />
                    <TableCell className="text-right">
                      {formatCurrency(totalValue, currency)}
                    </TableCell>
                    {editable && <TableCell />}
                  </TableRow>
                </>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Item Form Dialog */}
        <PEBItemForm
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
