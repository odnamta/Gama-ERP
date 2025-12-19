'use client'

import Link from 'next/link'
import { BeritaAcaraWithRelations, BAStatus, CargoCondition } from '@/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { BAStatusBadge } from '@/components/ui/ba-status-badge'
import { formatDate } from '@/lib/pjo-utils'
import { canEditBA, getCargoConditionLabel, getCargoConditionColor } from '@/lib/ba-utils'
import { Eye, Printer, Edit } from 'lucide-react'

interface BeritaAcaraListProps {
  items: BeritaAcaraWithRelations[]
  joId: string
}

export function BeritaAcaraList({ items, joId }: BeritaAcaraListProps) {
  if (items.length === 0) {
    return (
      <p className="text-muted-foreground text-center py-4">
        No Berita Acara documents yet
      </p>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>BA Number</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Cargo Condition</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((ba) => (
          <TableRow key={ba.id}>
            <TableCell className="font-medium">{ba.ba_number}</TableCell>
            <TableCell>{formatDate(ba.handover_date)}</TableCell>
            <TableCell>
              <BAStatusBadge status={ba.status as BAStatus} />
            </TableCell>
            <TableCell>
              {ba.cargo_condition ? (
                <Badge className={getCargoConditionColor(ba.cargo_condition as CargoCondition)} variant="outline">
                  {getCargoConditionLabel(ba.cargo_condition as CargoCondition)}
                </Badge>
              ) : (
                '-'
              )}
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-2">
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/job-orders/${joId}/berita-acara/${ba.id}`}>
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Link>
                </Button>
                {canEditBA(ba.status as BAStatus) && (
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/job-orders/${joId}/berita-acara/${ba.id}/edit`}>
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Link>
                  </Button>
                )}
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/job-orders/${joId}/berita-acara/${ba.id}?print=true`} target="_blank">
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
