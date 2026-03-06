'use client';

import { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { LeaveRequestList } from '@/components/leave/leave-request-list';
import { LeaveRequest, LeaveType, LeaveBalance } from '@/types/leave';
import {
  getLeaveRequests,
  getLeaveTypes,
  getLeaveBalancesBatch,
  getEmployeesForSelect,
  getPendingRequestsCount,
} from './actions';
import { Plus, Loader2, Bell } from 'lucide-react';

interface LeavePageClientProps {
  initialData: {
    requests: LeaveRequest[];
    leaveTypes: LeaveType[];
    employees: { id: string; full_name: string; department: string }[];
    pendingCount: number;
    balancesRecord: Record<string, LeaveBalance>;
  };
}

export function LeavePageClient({ initialData }: LeavePageClientProps) {
  const router = useRouter();
  const [requests, setRequests] = useState(initialData.requests);
  const [leaveTypes, setLeaveTypes] = useState(initialData.leaveTypes);
  const [employees, setEmployees] = useState(initialData.employees);
  const [pendingCount, setPendingCount] = useState(initialData.pendingCount);
  const [balancesRecord, setBalancesRecord] = useState(initialData.balancesRecord);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const balancesMap = useMemo(() => {
    const map = new Map<string, LeaveBalance>();
    for (const [key, value] of Object.entries(balancesRecord)) {
      map.set(key, value);
    }
    return map;
  }, [balancesRecord]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const [requestsData, typesData, employeesData, count] = await Promise.all([
        getLeaveRequests(),
        getLeaveTypes(),
        getEmployeesForSelect(),
        getPendingRequestsCount(),
      ]);

      setRequests(requestsData);
      setLeaveTypes(typesData);
      setEmployees(employeesData);
      setPendingCount(count);

      const pendingEmployeeIds = [
        ...new Set(
          requestsData.filter((r) => r.status === 'pending').map((r) => r.employee_id)
        ),
      ];
      const balancesArray = await getLeaveBalancesBatch(pendingEmployeeIds);

      const newRecord: Record<string, LeaveBalance> = {};
      for (const balance of balancesArray) {
        newRecord[`${balance.employee_id}-${balance.leave_type_id}`] = balance;
      }
      setBalancesRecord(newRecord);
    } catch {
      // silently fail on refresh
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">Leave Requests</h1>
          {pendingCount > 0 && (
            <span className="flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
              <Bell className="h-4 w-4" />
              {pendingCount} pending
            </span>
          )}
          {isRefreshing && (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>
        <Button onClick={() => router.push('/hr/leave/request')}>
          <Plus className="h-4 w-4 mr-2" />
          New Request
        </Button>
      </div>

      <LeaveRequestList
        requests={requests}
        leaveTypes={leaveTypes}
        employees={employees}
        balances={balancesMap}
        showEmployeeFilter={true}
        onRefresh={handleRefresh}
      />
    </div>
  );
}
