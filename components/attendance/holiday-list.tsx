'use client';

import { useState, useTransition } from 'react';
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
import { Edit, Trash2, MoreHorizontal, Loader2, Flag, Building2 } from 'lucide-react';
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
import { Holiday } from '@/types/attendance';
import { deleteHoliday } from '@/app/(main)/hr/attendance/holiday-actions';
import { formatAttendanceDate } from '@/lib/attendance-utils';
import { toast } from 'sonner';

interface HolidayListProps {
  holidays: Holiday[];
  onEdit: (holiday: Holiday) => void;
  onRefresh: () => void;
  isLoading?: boolean;
}

export function HolidayList({ holidays, onEdit, onRefresh, isLoading }: HolidayListProps) {
  const [isPending, startTransition] = useTransition();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleDelete = () => {
    if (!deleteId) return;

    startTransition(async () => {
      const result = await deleteHoliday(deleteId);
      if (result.success) {
        toast.success('Holiday deleted');
        onRefresh();
      } else {
        toast.error(result.error || 'Failed to delete holiday');
      }
      setDeleteId(null);
    });
  };

  const getDayOfWeek = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  };

  if (isLoading) {
    return (
      <div className="border rounded-lg p-8 text-center text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
        Loading holidays...
      </div>
    );
  }

  if (holidays.length === 0) {
    return (
      <div className="border rounded-lg p-8 text-center text-muted-foreground">
        No holidays found. Add one to get started.
      </div>
    );
  }

  return (
    <>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Day</TableHead>
              <TableHead>Holiday Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="w-[80px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {holidays.map((holiday) => (
              <TableRow key={holiday.id}>
                <TableCell className="font-mono">
                  {formatAttendanceDate(holiday.holiday_date)}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {getDayOfWeek(holiday.holiday_date)}
                </TableCell>
                <TableCell className="font-medium">
                  {holiday.holiday_name}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    {holiday.is_national && (
                      <Badge variant="secondary" className="bg-red-100 text-red-700">
                        <Flag className="h-3 w-3 mr-1" />
                        National
                      </Badge>
                    )}
                    {holiday.is_company && (
                      <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                        <Building2 className="h-3 w-3 mr-1" />
                        Company
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" disabled={isPending}>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEdit(holiday)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setDeleteId(holiday.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Holiday</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this holiday? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
