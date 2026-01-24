'use client'

import Link from 'next/link'
import { SuratJalanWithRelations, SJStatus } from '@/types'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { SJStatusBadge } from '@/components/ui/sj-status-badge'
import { formatDate } from '@/lib/utils/format'
import { isSJTerminalStatus } from '@/lib/sj-utils'
import { Eye, Printer, RefreshCw } from 'lucide-react'

interface SuratJalanListProps {
  items: SuratJalanWithRelations[]
  joId: string
}

export function SuratJalanList({ items, joId }: SuratJalanListProps) {
  if (items.length === 0) {
    return (
      <p className="text-muted-foreground text-center py-4">
        No Surat Jalan documents yet
      </p>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>SJ Number</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Driver</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((sj) => (
          <TableRow key={sj.id}>
            <TableCell className="font-medium">{sj.sj_number}</TableCell>
            <TableCell>{formatDate(sj.delivery_date)}</TableCell>
            <TableCell>
              <SJStatusBadge status={sj.status as SJStatus} />
            </TableCell>
            <TableCell>{sj.driver_name || '-'}</TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-2">
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/job-orders/${joId}/surat-jalan/${sj.id}`}>
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Link>
                </Button>
                {!isSJTerminalStatus(sj.status as SJStatus) && (
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/job-orders/${joId}/surat-jalan/${sj.id}?action=update`}>
                      <RefreshCw className="h-4 w-4 mr-1" />
                      Update
                    </Link>
                  </Button>
                )}
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/job-orders/${joId}/surat-jalan/${sj.id}?print=true`} target="_blank">
                    <Printer className="h-4 w-4 mr-1" />
                    Print
                  </Link>
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
