'use client'

import Link from 'next/link'
import { PEBDocumentWithRelations } from '@/types/peb'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { PEBStatusBadge } from './peb-status-badge'
import { formatCurrency } from '@/lib/peb-utils'
import { Eye, Pencil, Trash2, Ship, Plane, Truck } from 'lucide-react'

interface PEBListProps {
  documents: PEBDocumentWithRelations[]
  onDelete?: (peb: PEBDocumentWithRelations) => void
}

function TransportIcon({ mode }: { mode: string | null }) {
  if (!mode) return null
  switch (mode) {
    case 'sea':
      return <Ship className="h-4 w-4 text-blue-500" />
    case 'air':
      return <Plane className="h-4 w-4 text-sky-500" />
    case 'land':
      return <Truck className="h-4 w-4 text-amber-500" />
    default:
      return null
  }
}

function formatTransportMode(mode: string): string {
  const modes: Record<string, string> = {
    sea: 'Sea',
    air: 'Air',
    land: 'Land',
  }
  return modes[mode] || mode
}

function formatDate(date: string | null): string {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function PEBList({ documents, onDelete }: PEBListProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Reference</TableHead>
            <TableHead>Exporter</TableHead>
            <TableHead>Consignee</TableHead>
            <TableHead>Transport</TableHead>
            <TableHead>ETD</TableHead>
            <TableHead className="text-right">FOB Value</TableHead>
            <TableHead>Job Order</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {documents.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="h-24 text-center">
                No PEB documents found.
              </TableCell>
            </TableRow>
          ) : (
            documents.map((peb) => (
              <TableRow key={peb.id}>
                <TableCell className="font-medium">
                  <Link href={`/customs/export/${peb.id}`} className="hover:underline">
                    <div>{peb.internal_ref}</div>
                    {peb.peb_number && (
                      <div className="text-xs text-muted-foreground">
                        PEB: {peb.peb_number}
                      </div>
                    )}
                  </Link>
                </TableCell>
                <TableCell>
                  <div>{peb.exporter_name}</div>
                  {peb.customer && (
                    <div className="text-xs text-muted-foreground">
                      {peb.customer.name}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <div>{peb.consignee_name || '-'}</div>
                  {peb.consignee_country && (
                    <div className="text-xs text-muted-foreground">
                      {peb.consignee_country}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <TransportIcon mode={peb.transport_mode} />
                    <span className="text-sm">
                      {peb.transport_mode ? formatTransportMode(peb.transport_mode) : '-'}
                    </span>
                  </div>
                </TableCell>
                <TableCell>{formatDate(peb.etd_date)}</TableCell>
                <TableCell className="text-right">
                  {peb.fob_value
                    ? formatCurrency(peb.fob_value, peb.currency)
                    : '-'}
                </TableCell>
                <TableCell>
                  {peb.job_order ? (
                    <Link
                      href={`/job-orders/${peb.job_order.id}`}
                      className="text-sm hover:underline"
                    >
                      {peb.job_order.jo_number}
                    </Link>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <PEBStatusBadge status={peb.status} />
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" asChild title="View PEB">
                      <Link href={`/customs/export/${peb.id}`}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                    {peb.status === 'draft' && (
                      <>
                        <Button variant="ghost" size="icon" asChild title="Edit PEB">
                          <Link href={`/customs/export/${peb.id}/edit`}>
                            <Pencil className="h-4 w-4" />
                          </Link>
                        </Button>
                        {onDelete && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onDelete(peb)}
                            title="Delete PEB"
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
