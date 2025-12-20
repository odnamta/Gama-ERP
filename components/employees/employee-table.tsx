'use client';

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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Eye, Pencil } from 'lucide-react';
import { EmployeeWithRelations } from '@/types/employees';
import { EmployeeStatusBadge } from './employee-status-badge';
import { formatEmployeeDate } from '@/lib/employee-utils';

interface EmployeeTableProps {
  employees: EmployeeWithRelations[];
  canEdit?: boolean;
}

export function EmployeeTable({ employees, canEdit }: EmployeeTableProps) {
  const router = useRouter();

  const handleView = (id: string) => {
    router.push(`/hr/employees/${id}`);
  };

  const handleEdit = (id: string) => {
    router.push(`/hr/employees/${id}/edit`);
  };

  if (employees.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No employees found. Try adjusting your filters or add a new employee.
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Code</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Department</TableHead>
            <TableHead>Position</TableHead>
            <TableHead>Join Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[70px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {employees.map((employee) => (
            <TableRow key={employee.id}>
              <TableCell className="font-mono text-sm">
                {employee.employee_code}
              </TableCell>
              <TableCell>
                <div>
                  <div className="font-medium">{employee.full_name}</div>
                  {employee.nickname && (
                    <div className="text-xs text-muted-foreground">
                      ({employee.nickname})
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                {employee.department?.department_name || (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell>
                {employee.position?.position_name || (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell>{formatEmployeeDate(employee.join_date)}</TableCell>
              <TableCell>
                <EmployeeStatusBadge status={employee.status} />
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Actions</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleView(employee.id)}>
                      <Eye className="mr-2 h-4 w-4" />
                      View Details
                    </DropdownMenuItem>
                    {canEdit && (
                      <DropdownMenuItem onClick={() => handleEdit(employee.id)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
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
  );
}
