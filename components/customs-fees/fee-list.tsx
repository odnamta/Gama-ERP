'use client';

import { useState } from 'react';
import Link from 'next/link';
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
import { PaymentDialog } from './payment-dialog';
import { deleteFee, markFeeWaived, cancelFee } from '@/lib/fee-actions';
import {
  formatFeeAmount,
  getPaymentStatusVariant,
  getFeeCategoryVariant,
} from '@/lib/fee-utils';
import {
  CustomsFeeWithRelations,
  PAYMENT_STATUS_LABELS,
  FEE_CATEGORY_LABELS,
} from '@/types/customs-fees';
import { format } from 'date-fns';
import { MoreHorizontal, CreditCard, Ban, XCircle, Trash2, FileText } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface FeeListProps {
  fees: CustomsFeeWithRelations[];
}

export function FeeList({ fees }: FeeListProps) {
  const router = useRouter();
  const [selectedFee, setSelectedFee] = useState<CustomsFeeWithRelations | null>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const handleWaive = async (fee: CustomsFeeWithRelations) => {
    setActionLoading(true);
    await markFeeWaived(fee.id, 'Waived by user');
    router.refresh();
    setActionLoading(false);
  };

  const handleCancel = async (fee: CustomsFeeWithRelations) => {
    setActionLoading(true);
    await cancelFee(fee.id, 'Cancelled by user');
    router.refresh();
    setActionLoading(false);
  };

  const handleDelete = async () => {
    if (!selectedFee) return;
    setActionLoading(true);
    await deleteFee(selectedFee.id);
    setShowDeleteDialog(false);
    setSelectedFee(null);
    router.refresh();
    setActionLoading(false);
  };

  const getDocumentRef = (fee: CustomsFeeWithRelations) => {
    if (fee.document_type === 'pib' && fee.pib) {
      return fee.pib.internal_ref;
    }
    if (fee.document_type === 'peb' && fee.peb) {
      return fee.peb.internal_ref;
    }
    return '-';
  };

  if (fees.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No fees found. Add a new fee to get started.
      </div>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Document</TableHead>
            <TableHead>Fee Type</TableHead>
            <TableHead>Category</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Job Order</TableHead>
            <TableHead>Date</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {fees.map((fee) => (
            <TableRow key={fee.id}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="uppercase">
                    {fee.document_type}
                  </Badge>
                  <span className="text-sm">{getDocumentRef(fee)}</span>
                </div>
              </TableCell>
              <TableCell>{fee.fee_type?.fee_name || '-'}</TableCell>
              <TableCell>
                {fee.fee_type && (
                  <Badge variant={getFeeCategoryVariant(fee.fee_type.fee_category)}>
                    {FEE_CATEGORY_LABELS[fee.fee_type.fee_category]}
                  </Badge>
                )}
              </TableCell>
              <TableCell className="text-right font-medium">
                {formatFeeAmount(fee.amount, fee.currency)}
              </TableCell>
              <TableCell>
                <Badge variant={getPaymentStatusVariant(fee.payment_status)}>
                  {PAYMENT_STATUS_LABELS[fee.payment_status]}
                </Badge>
              </TableCell>
              <TableCell>
                {fee.job_order?.jo_number || '-'}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {format(new Date(fee.created_at), 'dd/MM/yyyy')}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/customs/fees/${fee.id}`}>
                        <FileText className="mr-2 h-4 w-4" />
                        View Details
                      </Link>
                    </DropdownMenuItem>
                    {fee.payment_status === 'pending' && (
                      <>
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedFee(fee);
                            setShowPaymentDialog(true);
                          }}
                        >
                          <CreditCard className="mr-2 h-4 w-4" />
                          Mark as Paid
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleWaive(fee)}>
                          <Ban className="mr-2 h-4 w-4" />
                          Waive Fee
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleCancel(fee)}>
                          <XCircle className="mr-2 h-4 w-4" />
                          Cancel Fee
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => {
                        setSelectedFee(fee);
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

      {/* Payment Dialog */}
      {selectedFee && (
        <PaymentDialog
          fee={selectedFee}
          open={showPaymentDialog}
          onOpenChange={(open) => {
            setShowPaymentDialog(open);
            if (!open) setSelectedFee(null);
          }}
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Fee</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this fee? This action cannot be undone.
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
