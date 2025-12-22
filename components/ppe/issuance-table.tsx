'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PPEIssuance, PPEType, PPEEmployee } from '@/types/ppe';
import {
  formatIssuanceStatus,
  getIssuanceStatusColor,
  formatPPEDate,
  isReplacementOverdue,
  isReplacementDueSoon,
} from '@/lib/ppe-utils';
import { IssuanceForm } from './issuance-form';
import { ReturnForm } from './return-form';
import {
  MoreHorizontal,
  Plus,
  Eye,
  RotateCcw,
  AlertTriangle,
  Clock,
  HardHat,
} from 'lucide-react';

interface IssuanceTableProps {
  issuances: PPEIssuance[];
  ppeTypes: PPEType[];
  employees: PPEEmployee[];
}

export function IssuanceTable({ issuances, ppeTypes, employees }: IssuanceTableProps) {
  const router = useRouter();
  const [showIssueForm, setShowIssueForm] = useState(false);
  const [returningIssuance, setReturningIssuance] = useState<PPEIssuance | null>(null);

  const getReplacementBadge = (issuance: PPEIssuance) => {
    if (!issuance.expected_replacement_date) return null;

    if (isReplacementOverdue(issuance.expected_replacement_date)) {
      return (
        <Badge variant="destructive" className="ml-2">
          <AlertTriangle className="mr-1 h-3 w-3" />
          Overdue
        </Badge>
      );
    }

    if (isReplacementDueSoon(issuance.expected_replacement_date)) {
      return (
        <Badge variant="outline" className="ml-2 border-yellow-500 text-yellow-700">
          <Clock className="mr-1 h-3 w-3" />
          Due Soon
        </Badge>
      );
    }

    return null;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">PPE Issuances</h2>
        <Button onClick={() => setShowIssueForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Issue PPE
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>PPE Type</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Issued Date</TableHead>
              <TableHead>Replacement Due</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {issuances.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  <HardHat className="mx-auto h-8 w-8 mb-2 opacity-50" />
                  No PPE issuances found. Issue PPE to get started.
                </TableCell>
              </TableRow>
            ) : (
              issuances.map(issuance => (
                <TableRow key={issuance.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{issuance.employee?.full_name}</div>
                      <div className="text-sm text-muted-foreground">
                        {issuance.employee?.employee_code}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{issuance.ppe_type?.ppe_name}</TableCell>
                  <TableCell>{issuance.size || '-'}</TableCell>
                  <TableCell>{formatPPEDate(issuance.issued_date)}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      {issuance.expected_replacement_date
                        ? formatPPEDate(issuance.expected_replacement_date)
                        : '-'}
                      {issuance.status === 'active' && getReplacementBadge(issuance)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getIssuanceStatusColor(issuance.status)}>
                      {formatIssuanceStatus(issuance.status)}
                    </Badge>
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
                          <Link href={`/hse/ppe/issuance/${issuance.id}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </Link>
                        </DropdownMenuItem>
                        {issuance.status === 'active' && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setReturningIssuance(issuance)}>
                              <RotateCcw className="mr-2 h-4 w-4" />
                              Return / Replace
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <IssuanceForm
        open={showIssueForm}
        onOpenChange={setShowIssueForm}
        ppeTypes={ppeTypes}
        employees={employees}
        onSuccess={() => setShowIssueForm(false)}
      />

      <ReturnForm
        issuance={returningIssuance}
        open={!!returningIssuance}
        onOpenChange={open => !open && setReturningIssuance(null)}
        onSuccess={() => setReturningIssuance(null)}
      />
    </div>
  );
}
