'use client';

import { useState } from 'react';
import Link from 'next/link';
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
  DropdownMenuSeparator,
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
import { ContainerStatusBadge } from './container-status-badge';
import { FreeTimeIndicator } from './free-time-indicator';
import { deleteContainer, updateContainerStatus } from '@/lib/fee-actions';
import { formatFeeAmount } from '@/lib/fee-utils';
import {
  ContainerTrackingWithRelations,
  ContainerStatus,
  CONTAINER_SIZE_LABELS,
} from '@/types/customs-fees';
import { format } from 'date-fns';
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  LogOut,
  Truck,
  RotateCcw,
} from 'lucide-react';

interface ContainerListProps {
  containers: ContainerTrackingWithRelations[];
}

export function ContainerList({ containers }: ContainerListProps) {
  const router = useRouter();
  const [selectedContainer, setSelectedContainer] = useState<ContainerTrackingWithRelations | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const handleStatusChange = async (container: ContainerTrackingWithRelations, newStatus: ContainerStatus) => {
    setActionLoading(true);
    const gateOutDate = newStatus === 'gate_out' ? format(new Date(), 'yyyy-MM-dd') : undefined;
    await updateContainerStatus(container.id, newStatus, gateOutDate);
    router.refresh();
    setActionLoading(false);
  };

  const handleDelete = async () => {
    if (!selectedContainer) return;
    setActionLoading(true);
    await deleteContainer(selectedContainer.id);
    setShowDeleteDialog(false);
    setSelectedContainer(null);
    router.refresh();
    setActionLoading(false);
  };

  const getDocumentRef = (container: ContainerTrackingWithRelations) => {
    if (container.pib) return container.pib.internal_ref;
    if (container.peb) return container.peb.internal_ref;
    return '-';
  };

  if (containers.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No containers found. Add a new container to get started.
      </div>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Container</TableHead>
            <TableHead>Size/Type</TableHead>
            <TableHead>Document</TableHead>
            <TableHead>Terminal</TableHead>
            <TableHead>Free Time</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Storage Fee</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {containers.map((container) => (
            <TableRow key={container.id}>
              <TableCell>
                <div className="font-medium">{container.container_number}</div>
                {container.seal_number && (
                  <div className="text-xs text-muted-foreground">
                    Seal: {container.seal_number}
                  </div>
                )}
              </TableCell>
              <TableCell>
                {container.container_size && (
                  <span>{CONTAINER_SIZE_LABELS[container.container_size]}</span>
                )}
                {container.container_type && (
                  <span className="text-muted-foreground ml-1">
                    ({container.container_type})
                  </span>
                )}
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="uppercase">
                  {container.pib_id ? 'PIB' : 'PEB'}
                </Badge>
                <span className="ml-2 text-sm">{getDocumentRef(container)}</span>
              </TableCell>
              <TableCell>{container.terminal || '-'}</TableCell>
              <TableCell>
                {container.status === 'at_port' && container.free_time_end ? (
                  <FreeTimeIndicator container={container} showLabel={false} />
                ) : container.arrival_date ? (
                  <span className="text-sm text-muted-foreground">
                    Arrived: {format(new Date(container.arrival_date), 'dd/MM/yyyy')}
                  </span>
                ) : (
                  '-'
                )}
              </TableCell>
              <TableCell>
                <ContainerStatusBadge status={container.status} />
              </TableCell>
              <TableCell className="text-right">
                {container.total_storage_fee ? (
                  <span className="font-medium text-red-600">
                    {formatFeeAmount(container.total_storage_fee, 'IDR')}
                  </span>
                ) : (
                  '-'
                )}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" disabled={actionLoading}>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/customs/containers/${container.id}/edit`}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {container.status === 'at_port' && (
                      <DropdownMenuItem onClick={() => handleStatusChange(container, 'gate_out')}>
                        <LogOut className="mr-2 h-4 w-4" />
                        Mark Gate Out
                      </DropdownMenuItem>
                    )}
                    {container.status === 'gate_out' && (
                      <DropdownMenuItem onClick={() => handleStatusChange(container, 'delivered')}>
                        <Truck className="mr-2 h-4 w-4" />
                        Mark Delivered
                      </DropdownMenuItem>
                    )}
                    {container.status === 'delivered' && (
                      <DropdownMenuItem onClick={() => handleStatusChange(container, 'returned_empty')}>
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Mark Returned Empty
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => {
                        setSelectedContainer(container);
                        setShowDeleteDialog(true);
                      }}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Container</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete container {selectedContainer?.container_number}? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground"
              disabled={actionLoading}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
