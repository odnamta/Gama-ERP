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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { PPEType } from '@/types/ppe';
import { deletePPEType } from '@/lib/ppe-actions';
import { formatPPECategory, formatPPECost } from '@/lib/ppe-utils';
import { PPETypeForm } from './ppe-type-form';
import { toast } from 'sonner';
import { MoreHorizontal, Pencil, Trash2, Plus } from 'lucide-react';

interface PPETypeTableProps {
  ppeTypes: PPEType[];
}

export function PPETypeTable({ ppeTypes }: PPETypeTableProps) {
  const router = useRouter();
  const [editingType, setEditingType] = useState<PPEType | null>(null);
  const [deletingType, setDeletingType] = useState<PPEType | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!deletingType) return;
    setDeleting(true);

    try {
      await deletePPEType(deletingType.id);
      toast.success('PPE type deleted successfully');
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete PPE type');
    } finally {
      setDeleting(false);
      setDeletingType(null);
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      head: 'bg-blue-100 text-blue-800',
      eye: 'bg-purple-100 text-purple-800',
      ear: 'bg-pink-100 text-pink-800',
      respiratory: 'bg-cyan-100 text-cyan-800',
      hand: 'bg-orange-100 text-orange-800',
      body: 'bg-green-100 text-green-800',
      foot: 'bg-yellow-100 text-yellow-800',
      fall_protection: 'bg-red-100 text-red-800',
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">PPE Types</h2>
        <Button onClick={() => setShowAddForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add PPE Type
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Replacement</TableHead>
              <TableHead>Sizes</TableHead>
              <TableHead>Unit Cost</TableHead>
              <TableHead>Mandatory</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ppeTypes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                  No PPE types found. Add one to get started.
                </TableCell>
              </TableRow>
            ) : (
              ppeTypes.map(type => (
                <TableRow key={type.id}>
                  <TableCell className="font-mono font-medium">{type.ppe_code}</TableCell>
                  <TableCell>{type.ppe_name}</TableCell>
                  <TableCell>
                    <Badge className={getCategoryColor(type.category)} variant="secondary">
                      {formatPPECategory(type.category)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {type.replacement_interval_days
                      ? `${type.replacement_interval_days} days`
                      : 'As needed'}
                  </TableCell>
                  <TableCell>
                    {type.has_sizes && type.available_sizes.length > 0
                      ? type.available_sizes.join(', ')
                      : '-'}
                  </TableCell>
                  <TableCell>{formatPPECost(type.unit_cost)}</TableCell>
                  <TableCell>
                    {type.is_mandatory ? (
                      <Badge variant="destructive">Required</Badge>
                    ) : (
                      <Badge variant="outline">Optional</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditingType(type)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setDeletingType(type)}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <PPETypeForm
        ppeType={editingType}
        open={!!editingType}
        onOpenChange={open => !open && setEditingType(null)}
        onSuccess={() => setEditingType(null)}
      />

      <PPETypeForm
        open={showAddForm}
        onOpenChange={setShowAddForm}
        onSuccess={() => setShowAddForm(false)}
      />

      <AlertDialog open={!!deletingType} onOpenChange={open => !open && setDeletingType(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete PPE Type</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deletingType?.ppe_name}&quot;? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
