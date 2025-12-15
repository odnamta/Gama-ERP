'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Check, X, CheckCheck, Inbox } from 'lucide-react'
import { formatIDR } from '@/lib/pjo-utils'
import { cn } from '@/lib/utils'
import { type PendingApproval } from '@/lib/manager-dashboard-utils'

interface ApprovalQueueProps {
  approvals: PendingApproval[]
  isLoading?: boolean
  onApprove?: (id: string) => Promise<void>
  onReject?: (id: string, reason: string) => Promise<void>
  onApproveAll?: () => Promise<void>
}

export function ApprovalQueue({ 
  approvals, 
  isLoading, 
  onApprove, 
  onReject,
  onApproveAll 
}: ApprovalQueueProps) {
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [processingAll, setProcessingAll] = useState(false)

  const handleApprove = async (id: string) => {
    if (!onApprove) return
    setProcessingId(id)
    try {
      await onApprove(id)
    } finally {
      setProcessingId(null)
    }
  }

  const handleReject = async (id: string) => {
    if (!onReject) return
    const reason = window.prompt('Enter rejection reason:')
    if (!reason) return
    
    setProcessingId(id)
    try {
      await onReject(id, reason)
    } finally {
      setProcessingId(null)
    }
  }

  const handleApproveAll = async () => {
    if (!onApproveAll) return
    setProcessingAll(true)
    try {
      await onApproveAll()
    } finally {
      setProcessingAll(false)
    }
  }

  if (isLoading) {
    return (
      <Card id="approval-queue">
        <CardHeader>
          <CardTitle>Pending Approvals</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (approvals.length === 0) {
    return (
      <Card id="approval-queue">
        <CardHeader>
          <CardTitle>Pending Approvals</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Inbox className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No pending approvals</p>
            <p className="text-sm text-muted-foreground">All PJOs have been reviewed</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card id="approval-queue">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Pending Approvals</CardTitle>
        {approvals.length > 1 && onApproveAll && (
          <Button 
            size="sm" 
            onClick={handleApproveAll}
            disabled={processingAll}
          >
            <CheckCheck className="h-4 w-4 mr-2" />
            {processingAll ? 'Processing...' : 'Approve All'}
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>PJO #</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead className="text-right">Revenue</TableHead>
              <TableHead className="text-right">Est. Profit</TableHead>
              <TableHead className="text-right">Margin</TableHead>
              <TableHead className="text-center">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {approvals.map((approval) => (
              <TableRow key={approval.id}>
                <TableCell>
                  <Link 
                    href={`/proforma-jo/${approval.id}`}
                    className="text-blue-600 hover:underline font-medium"
                  >
                    {approval.pjo_number}
                  </Link>
                  {approval.daysPending > 2 && (
                    <Badge variant="outline" className="ml-2 text-yellow-600 border-yellow-600">
                      {approval.daysPending}d
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div>{approval.customer_name}</div>
                  {approval.project_name && (
                    <div className="text-xs text-muted-foreground">{approval.project_name}</div>
                  )}
                </TableCell>
                <TableCell className="text-right">{formatIDR(approval.revenue)}</TableCell>
                <TableCell className="text-right">{formatIDR(approval.estimatedProfit)}</TableCell>
                <TableCell className={cn(
                  'text-right',
                  approval.margin >= 25 && 'text-green-600',
                  approval.margin < 15 && 'text-red-600'
                )}>
                  {approval.margin.toFixed(1)}%
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-center gap-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                      onClick={() => handleApprove(approval.id)}
                      disabled={processingId === approval.id}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleReject(approval.id)}
                      disabled={processingId === approval.id}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
