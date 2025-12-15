'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, AlertTriangle } from 'lucide-react'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { ReportFilters, ReportTable, ReportSummary, ReportSkeleton, ReportEmptyState } from '@/components/reports'
import { usePermissions } from '@/components/providers/permission-provider'
import { canAccessReport } from '@/lib/reports/report-permissions'
import { buildBudgetVarianceReportData, formatVariancePercentage } from '@/lib/reports/budget-variance-utils'
import { getDateRangeForPreset, parseDateRangeFromParams, formatCurrency } from '@/lib/reports/report-utils'
import { createClient } from '@/lib/supabase/client'
import { DateRange, BudgetVarianceReportData, BudgetVarianceItem, ReportColumn, RowHighlight } from '@/types/reports'

const columns: ReportColumn<BudgetVarianceItem>[] = [
  { key: 'pjoNumber', header: 'PJO Number', width: '150px' },
  { key: 'customerName', header: 'Customer' },
  { key: 'estimatedTotal', header: 'Estimated', align: 'right', format: 'currency' },
  { key: 'actualTotal', header: 'Actual', align: 'right', format: 'currency' },
  { key: 'varianceAmount', header: 'Variance', align: 'right', format: 'currency' },
  { key: 'variancePercentage', header: 'Variance %', align: 'right' },
]

export default function BudgetVarianceReportPage() {
  const { profile } = usePermissions()
  const searchParams = useSearchParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reportData, setReportData] = useState<BudgetVarianceReportData | null>(null)

  const fetchReportData = useCallback(async (range: DateRange) => {
    setLoading(true)
    setError(null)
    
    try {
      const supabase = createClient()
      const startDate = format(range.startDate, 'yyyy-MM-dd')
      const endDate = format(range.endDate, 'yyyy-MM-dd')

      const { data: pjos, error: pjoError } = await supabase
        .from('proforma_job_orders')
        .select(`
          id,
          pjo_number,
          total_cost_estimated,
          total_cost_actual,
          customers (name)
        `)
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .in('status', ['approved', 'converted'])
        .order('created_at', { ascending: false })

      if (pjoError) throw pjoError

      const data = buildBudgetVarianceReportData(pjos || [], range)
      setReportData(data)
    } catch (err) {
      console.error('Error fetching budget variance data:', err)
      setError('Failed to load report data. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const fromParams = parseDateRangeFromParams(searchParams)
    const range = fromParams || getDateRangeForPreset('this-month')
    fetchReportData(range)
  }, [searchParams, fetchReportData])

  // Check permissions
  if (profile && !canAccessReport(profile.role, 'budget-variance')) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/reports"><ArrowLeft className="h-4 w-4 mr-2" />Back to Reports</Link>
          </Button>
        </div>
        <ReportEmptyState
          title="Access Denied"
          message="You don't have permission to view this report."
        />
      </div>
    )
  }

  const handlePeriodChange = (range: DateRange) => {
    fetchReportData(range)
  }

  const handleRowClick = (row: BudgetVarianceItem) => {
    router.push(`/pjo/${row.pjoId}`)
  }

  const getRowHighlight = (row: BudgetVarianceItem): RowHighlight => {
    if (row.hasWarning) return 'warning'
    return null
  }

  // Custom render for variance percentage column
  const renderData = reportData?.items.map(item => ({
    ...item,
    variancePercentage: formatVariancePercentage(item.variancePercentage),
  }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/reports"><ArrowLeft className="h-4 w-4 mr-2" />Back</Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Budget Variance Report</h1>
            <p className="text-muted-foreground">Estimated vs actual costs per PJO</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <ReportFilters defaultPeriod="this-month" onPeriodChange={handlePeriodChange} />

      {/* Content */}
      {loading ? (
        <ReportSkeleton />
      ) : error ? (
        <ReportEmptyState title="Error" message={error} />
      ) : !reportData || reportData.items.length === 0 ? (
        <ReportEmptyState message="No PJOs found for the selected period." />
      ) : (
        <>
          {/* Summary */}
          <ReportSummary
            items={[
              { label: 'Total Estimated', value: reportData.summary.totalEstimated, format: 'currency' },
              { label: 'Total Actual', value: reportData.summary.totalActual, format: 'currency' },
              { label: 'Total Variance', value: reportData.summary.totalVariance, format: 'currency', highlight: reportData.summary.totalVariance <= 0 ? 'positive' : 'negative' },
              { label: 'Items Over Budget', value: reportData.summary.itemsWithWarning, highlight: reportData.summary.itemsWithWarning === 0 ? 'positive' : 'negative' },
            ]}
          />

          {/* Warning Banner */}
          {reportData.summary.itemsWithWarning > 0 && (
            <div className="flex items-center gap-2 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <span className="text-yellow-800">
                {reportData.summary.itemsWithWarning} PJO(s) have exceeded budget by more than 10%
              </span>
            </div>
          )}

          {/* Table */}
          <ReportTable
            columns={columns}
            data={renderData || []}
            onRowClick={handleRowClick}
            highlightCondition={(row) => {
              const original = reportData.items.find(i => i.pjoNumber === row.pjoNumber)
              return original?.hasWarning ? 'warning' : null
            }}
            emptyMessage="No PJOs found for the selected period."
          />
        </>
      )}
    </div>
  )
}
