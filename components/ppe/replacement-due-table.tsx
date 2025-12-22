'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { PPEReplacementDue } from '@/types/ppe';
import { formatPPEDate } from '@/lib/ppe-utils';
import { AlertTriangle, Clock, RefreshCw } from 'lucide-react';

interface ReplacementDueTableProps {
  replacements: PPEReplacementDue[];
}

export function ReplacementDueTable({ replacements }: ReplacementDueTableProps) {
  const getUrgencyBadge = (daysOverdue: number) => {
    if (daysOverdue > 0) {
      return (
        <Badge variant="destructive">
          <AlertTriangle className="mr-1 h-3 w-3" />
          {daysOverdue} days overdue
        </Badge>
      );
    }
    if (daysOverdue >= -7) {
      return (
        <Badge variant="outline" className="border-red-500 text-red-700">
          <Clock className="mr-1 h-3 w-3" />
          {Math.abs(daysOverdue)} days left
        </Badge>
      );
    }
    if (daysOverdue >= -14) {
      return (
        <Badge variant="outline" className="border-orange-500 text-orange-700">
          <Clock className="mr-1 h-3 w-3" />
          {Math.abs(daysOverdue)} days left
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="border-yellow-500 text-yellow-700">
        <Clock className="mr-1 h-3 w-3" />
        {Math.abs(daysOverdue)} days left
      </Badge>
    );
  };

  if (replacements.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <RefreshCw className="mx-auto h-8 w-8 mb-2 opacity-50" />
        <p>No PPE due for replacement in the next 30 days.</p>
      </div>
    );
  }

  // Sort by urgency (most overdue first)
  const sortedReplacements = [...replacements].sort(
    (a, b) => b.days_overdue - a.days_overdue
  );

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Employee</TableHead>
            <TableHead>PPE Type</TableHead>
            <TableHead>Size</TableHead>
            <TableHead>Issued Date</TableHead>
            <TableHead>Due Date</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedReplacements.map(item => (
            <TableRow
              key={item.id}
              className={item.days_overdue > 0 ? 'bg-red-50' : undefined}
            >
              <TableCell>
                <div>
                  <div className="font-medium">{item.full_name}</div>
                  <div className="text-sm text-muted-foreground">{item.employee_code}</div>
                </div>
              </TableCell>
              <TableCell>{item.ppe_name}</TableCell>
              <TableCell>{item.size || '-'}</TableCell>
              <TableCell>{formatPPEDate(item.issued_date)}</TableCell>
              <TableCell>{formatPPEDate(item.expected_replacement_date)}</TableCell>
              <TableCell>{getUrgencyBadge(item.days_overdue)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
