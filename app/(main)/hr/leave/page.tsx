import { LeavePageClient } from './leave-page-client';
import {
  getLeaveRequests,
  getLeaveTypes,
  getLeaveBalancesBatch,
  getEmployeesForSelect,
  getPendingRequestsCount,
} from './actions';
import { LeaveBalance } from '@/types/leave';

export default async function LeaveRequestsPage() {
  const [requests, leaveTypes, employees, pendingCount] = await Promise.all([
    getLeaveRequests(),
    getLeaveTypes(),
    getEmployeesForSelect(),
    getPendingRequestsCount(),
  ]);

  // Batch-fetch balances for all employees with pending requests
  const pendingEmployeeIds = [
    ...new Set(
      requests.filter((r) => r.status === 'pending').map((r) => r.employee_id)
    ),
  ];
  const balancesArray = await getLeaveBalancesBatch(pendingEmployeeIds);

  // Serialize as a plain record (Map is not serializable across server→client)
  const balancesRecord: Record<string, LeaveBalance> = {};
  for (const balance of balancesArray) {
    balancesRecord[`${balance.employee_id}-${balance.leave_type_id}`] = balance;
  }

  return (
    <LeavePageClient
      initialData={{
        requests,
        leaveTypes,
        employees,
        pendingCount,
        balancesRecord,
      }}
    />
  );
}
