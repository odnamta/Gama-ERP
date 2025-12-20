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
import { Edit, Trash2, Star, MoreHorizontal, Loader2 } from 'lucide-react';
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
import { WorkSchedule } from '@/types/attendance';
import { deleteWorkSchedule, setDefaultSchedule } from '@/app/(main)/hr/attendance/schedule-actions';
import { toast } from 'sonner';

interface ScheduleListProps {
  schedules: WorkSchedule[];
  onEdit: (schedule: WorkSchedule) => void;
  onRefresh: () => void;
  isLoading?: boolean;
}

const WEEKDAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function ScheduleList({ schedules, onEdit, onRefresh, isLoading }: ScheduleListProps) {
  const [isPending, startTransition] = useTransition();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const formatWorkDays = (days: number[]) => {
    return days.map((d) => WEEKDAY_NAMES[d]).join(', ');
  };

  const handleSetDefault = (scheduleId: string) => {
    startTransition(async () => {
      const result = await setDefaultSchedule(scheduleId);
      if (result.success) {
        toast.success('Default schedule updated');
        onRefresh();
      } else {
        toast.error(result.error || 'Failed to set default schedule');
      }
    });
  };

  const handleDelete = () => {
    if (!deleteId) return;

    startTransition(async () => {
      const result = await deleteWorkSchedule(deleteId);
      if (result.success) {
        toast.success('Schedule deleted');
        onRefresh();
      } else {
        toast.error(result.error || 'Failed to delete schedule');
      }
      setDeleteId(null);
    });
  };

  if (isLoading) {
    return (
      <div className="border rounded-lg p-8 text-center text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
        Loading schedules...
      </div>
    );
  }

  if (schedules.length === 0) {
    return (
      <div className="border rounded-lg p-8 text-center text-muted-foreground">
        No schedules found. Create one to get started.
      </div>
    );
  }

  return (
    <>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Work Hours</TableHead>
              <TableHead>Break</TableHead>
              <TableHead>Grace Period</TableHead>
              <TableHead>Work Days</TableHead>
              <TableHead className="w-[80px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {schedules.map((schedule) => (
              <TableRow key={schedule.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{schedule.schedule_name}</span>
                    {schedule.is_default && (
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">
                        <Star className="h-3 w-3 mr-1" />
                        Default
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {schedule.work_start} - {schedule.work_end}
                </TableCell>
                <TableCell>
                  {schedule.break_start && schedule.break_end
                    ? `${schedule.break_start} - ${schedule.break_end}`
                    : '-'}
                </TableCell>
                <TableCell>{schedule.late_grace_minutes} min</TableCell>
                <TableCell className="text-sm">
                  {formatWorkDays(schedule.work_days)}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" disabled={isPending}>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEdit(schedule)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      {!schedule.is_default && (
                        <DropdownMenuItem onClick={() => handleSetDefault(schedule.id)}>
                          <Star className="h-4 w-4 mr-2" />
                          Set as Default
                        </DropdownMenuItem>
                      )}
                      {!schedule.is_default && (
                        <DropdownMenuItem
                          onClick={() => setDeleteId(schedule.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      )}
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
            <AlertDialogTitle>Delete Schedule</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this schedule? This action cannot be undone.
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
