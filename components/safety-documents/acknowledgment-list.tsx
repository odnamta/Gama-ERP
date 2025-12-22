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
import { CheckCircle, XCircle } from 'lucide-react';
import { DocumentAcknowledgment } from '@/types/safety-document';
import { formatDate } from '@/lib/pjo-utils';

interface AcknowledgmentListProps {
  acknowledgments: DocumentAcknowledgment[];
}

export function AcknowledgmentList({ acknowledgments }: AcknowledgmentListProps) {
  if (acknowledgments.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground border rounded-lg">
        <p>Belum ada karyawan yang mengakui dokumen ini</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Karyawan</TableHead>
            <TableHead>Tanggal</TableHead>
            <TableHead>Skor Quiz</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {acknowledgments.map((ack) => (
            <TableRow key={ack.id}>
              <TableCell className="font-medium">{ack.employeeName || '-'}</TableCell>
              <TableCell>{formatDate(ack.acknowledgedAt)}</TableCell>
              <TableCell>
                {ack.quizScore !== undefined ? `${ack.quizScore}%` : '-'}
              </TableCell>
              <TableCell>
                {ack.quizPassed !== undefined ? (
                  ack.quizPassed ? (
                    <Badge className="bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Lulus
                    </Badge>
                  ) : (
                    <Badge className="bg-red-100 text-red-800">
                      <XCircle className="h-3 w-3 mr-1" />
                      Tidak Lulus
                    </Badge>
                  )
                ) : (
                  <Badge className="bg-blue-100 text-blue-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Diakui
                  </Badge>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
