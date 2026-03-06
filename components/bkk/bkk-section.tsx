'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { BKKList } from './bkk-list'
import { BKKSummary } from './bkk-summary'
import { BKKAutoGenerate } from './bkk-auto-generate'
import { calculateBKKSummary } from '@/lib/bkk-utils'
import { formatCurrency } from '@/lib/utils/format'
import type { BKKWithRelations } from '@/types'
import { Plus, Banknote } from 'lucide-react'

interface BKKSectionProps {
  jobOrderId: string
  joNumber?: string
  bkks: BKKWithRelations[]
  userRole: string
  currentUserId?: string
  canRequest?: boolean
  /** Budget amount (final_cost) for utilization calculation */
  budgetAmount?: number | null
}

export function BKKSection({
  jobOrderId,
  joNumber,
  bkks,
  userRole,
  currentUserId,
  canRequest = true,
  budgetAmount,
}: BKKSectionProps) {
  const summary = calculateBKKSummary(bkks)

  // Calculate budget utilization stats
  const activeBKKs = bkks.filter((b) => b.status && !['cancelled', 'rejected'].includes(b.status))
  const totalDisbursed = activeBKKs
    .filter((b) => b.status && ['released', 'settled'].includes(b.status))
    .reduce((sum, b) => sum + (b.amount_requested || 0), 0)
  const totalSettledSpent = activeBKKs
    .filter((b) => b.status === 'settled')
    .reduce((sum, b) => sum + (b.amount_spent ?? b.amount_requested ?? 0), 0)

  const hasBudget = budgetAmount != null && budgetAmount > 0
  const utilizationPercent = hasBudget ? Math.min((totalDisbursed / budgetAmount) * 100, 100) : 0
  const overBudget = hasBudget && totalDisbursed > budgetAmount

  // Status breakdown counts
  const statusCounts = {
    pending: bkks.filter((b) => b.status === 'pending').length,
    approved: bkks.filter((b) => b.status === 'approved').length,
    released: bkks.filter((b) => b.status === 'released').length,
    settled: bkks.filter((b) => b.status === 'settled').length,
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="flex items-center gap-2">
          <Banknote className="h-5 w-5" />
          Cash Disbursements (BKK)
        </CardTitle>
        {canRequest && (
          <div className="flex items-center gap-2">
            <BKKAutoGenerate
              jobOrderId={jobOrderId}
              joNumber={joNumber || ''}
            />
            <Button asChild size="sm">
              <Link href={`/job-orders/${jobOrderId}/bkk/new`}>
                <Plus className="h-4 w-4 mr-2" />
                Request BKK
              </Link>
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Budget Utilization Recap */}
        {bkks.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-xs text-muted-foreground">Total BKK</p>
              <p className="text-lg font-semibold">{formatCurrency(totalDisbursed)}</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-xs text-muted-foreground">Total Terpakai</p>
              <p className="text-lg font-semibold text-green-600">{formatCurrency(totalSettledSpent)}</p>
            </div>
            {hasBudget && (
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">Anggaran (Final Cost)</p>
                <p className="text-lg font-semibold">{formatCurrency(budgetAmount)}</p>
              </div>
            )}
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-xs text-muted-foreground">Utilisasi</p>
              <p className={`text-lg font-semibold ${overBudget ? 'text-red-600' : ''}`}>
                {hasBudget ? `${utilizationPercent.toFixed(1)}%` : '-'}
              </p>
            </div>
          </div>
        )}

        {/* Budget utilization progress bar */}
        {bkks.length > 0 && hasBudget && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Utilisasi Anggaran</span>
              <span className={overBudget ? 'text-red-600 font-medium' : ''}>
                {utilizationPercent.toFixed(1)}%
                {overBudget && ' (Melebihi Anggaran!)'}
              </span>
            </div>
            <Progress
              value={Math.min(utilizationPercent, 100)}
              className={`h-2 ${overBudget ? '[&>div]:bg-red-500' : ''}`}
            />
          </div>
        )}

        {/* Status breakdown badges */}
        {bkks.length > 0 && (
          <div className="flex flex-wrap gap-2 text-xs">
            {statusCounts.pending > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-100 text-yellow-800">
                Menunggu: {statusCounts.pending}
              </span>
            )}
            {statusCounts.approved > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                Disetujui: {statusCounts.approved}
              </span>
            )}
            {statusCounts.released > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 text-green-800">
                Dicairkan: {statusCounts.released}
              </span>
            )}
            {statusCounts.settled > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 text-gray-800">
                Diselesaikan: {statusCounts.settled}
              </span>
            )}
          </div>
        )}

        <BKKList
          bkks={bkks}
          jobOrderId={jobOrderId}
          userRole={userRole}
          currentUserId={currentUserId}
        />

        {bkks.length > 0 && (
          <BKKSummary summary={summary} />
        )}
      </CardContent>
    </Card>
  )
}
