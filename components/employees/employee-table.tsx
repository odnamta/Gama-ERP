'use client';

import { useRouter } from 'next/navigation';
import { useIsDesktop } from '@/hooks/use-media-query';
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
  const isDesktop = useIsDesktop();

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

  if (!isDesktop) {
    return (
      <div className="space-y-3">
        {employees.map((employee) => (
          <div
            key={employee.id}
            className="rounded-lg border bg-card p-4 space-y-1.5 active:bg-muted/50 cursor-pointer"
            onClick={() => handleView(employee.id)}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="font-medium text-sm">{employee.full_name}</div>
                {employee.nickname && (
                  <div className="text-xs text-muted-foreground">({employee.nickname})</div>
                )}
              </div>
              <EmployeeStatusBadge status={employee.status} />
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="font-mono">{employee.employee_code}</span>
              <span>·</span>
              <span>{employee.position?.position_name || '-'}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{employee.department?.department_name || '-'}</span>
              <span>{formatEmployeeDate(employee.join_date)}</span>
            </div>
          </div>
        ))}
      </div>
    )
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
