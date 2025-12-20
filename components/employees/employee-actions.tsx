'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MoreHorizontal, UserX, UserCheck, Pause, Link2 } from 'lucide-react';
import { EmployeeStatus } from '@/types/employees';
import { updateEmployeeStatus, linkEmployeeToUser } from '@/app/(main)/hr/employees/actions';
import { useToast } from '@/hooks/use-toast';

interface EmployeeActionsProps {
  employeeId: string;
  currentStatus: EmployeeStatus;
  userId?: string | null;
  availableUsers?: { id: string; email: string; full_name: string }[];
  canEdit: boolean;
}

export function EmployeeActions({
  employeeId,
  currentStatus,
  userId,
  availableUsers = [],
  canEdit,
}: EmployeeActionsProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<EmployeeStatus | null>(null);
  const [reason, setReason] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!canEdit) return null;

  const handleStatusChange = async () => {
    if (!selectedStatus) return;

    setIsLoading(true);
    const result = await updateEmployeeStatus(employeeId, selectedStatus, reason || undefined);
    setIsLoading(false);

    if (result.success) {
      toast({
        title: 'Status Updated',
        description: `Employee status updated to ${selectedStatus}`,
      });
      setIsStatusDialogOpen(false);
      setSelectedStatus(null);
      setReason('');
      router.refresh();
    } else {
      toast({
        title: 'Error',
        description: result.error || 'Failed to update status',
        variant: 'destructive',
      });
    }
  };

  const handleLinkUser = async () => {
    if (!selectedUserId) return;

    setIsLoading(true);
    const result = await linkEmployeeToUser(employeeId, selectedUserId);
    setIsLoading(false);

    if (result.success) {
      toast({
        title: 'Success',
        description: 'Employee linked to user account',
      });
      setIsLinkDialogOpen(false);
      setSelectedUserId('');
      router.refresh();
    } else {
      toast({
        title: 'Error',
        description: result.error || 'Failed to link user',
        variant: 'destructive',
      });
    }
  };

  const openStatusDialog = (status: EmployeeStatus) => {
    setSelectedStatus(status);
    setIsStatusDialogOpen(true);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {currentStatus === 'active' && (
            <>
              <DropdownMenuItem onClick={() => openStatusDialog('on_leave')}>
                <Pause className="mr-2 h-4 w-4" />
                Set On Leave
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => openStatusDialog('suspended')}>
                <UserX className="mr-2 h-4 w-4" />
                Suspend Employee
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => openStatusDialog('resigned')}
                className="text-orange-600"
              >
                <UserX className="mr-2 h-4 w-4" />
                Mark as Resigned
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => openStatusDialog('terminated')}
                className="text-destructive"
              >
                <UserX className="mr-2 h-4 w-4" />
                Terminate Employee
              </DropdownMenuItem>
            </>
          )}
          {currentStatus === 'on_leave' && (
            <DropdownMenuItem onClick={() => openStatusDialog('active')}>
              <UserCheck className="mr-2 h-4 w-4" />
              Return from Leave
            </DropdownMenuItem>
          )}
          {currentStatus === 'suspended' && (
            <DropdownMenuItem onClick={() => openStatusDialog('active')}>
              <UserCheck className="mr-2 h-4 w-4" />
              Reinstate Employee
            </DropdownMenuItem>
          )}
          {!userId && availableUsers.length > 0 && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setIsLinkDialogOpen(true)}>
                <Link2 className="mr-2 h-4 w-4" />
                Link to User Account
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Status Change Dialog */}
      <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Employee Status</DialogTitle>
            <DialogDescription>
              {selectedStatus === 'resigned' || selectedStatus === 'terminated'
                ? 'This action will mark the employee as no longer active. Please provide a reason.'
                : `Change employee status to "${selectedStatus}".`}
            </DialogDescription>
          </DialogHeader>
          {(selectedStatus === 'resigned' || selectedStatus === 'terminated' || selectedStatus === 'suspended') && (
            <div className="space-y-2">
              <Label htmlFor="reason">Reason</Label>
              <Textarea
                id="reason"
                placeholder="Enter reason for status change..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsStatusDialogOpen(false);
                setSelectedStatus(null);
                setReason('');
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleStatusChange}
              disabled={isLoading}
              variant={selectedStatus === 'terminated' ? 'destructive' : 'default'}
            >
              {isLoading ? 'Updating...' : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Link User Dialog */}
      <Dialog open={isLinkDialogOpen} onOpenChange={setIsLinkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Link to User Account</DialogTitle>
            <DialogDescription>
              Select a user account to link with this employee record.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="user">User Account</Label>
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a user..." />
              </SelectTrigger>
              <SelectContent>
                {availableUsers.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.full_name} ({user.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsLinkDialogOpen(false);
                setSelectedUserId('');
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleLinkUser} disabled={isLoading || !selectedUserId}>
              {isLoading ? 'Linking...' : 'Link User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
