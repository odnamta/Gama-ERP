'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ReportFilters, ReportSummary, ReportSkeleton, ReportEmptyState } from '@/components/reports'
import { usePermissions } from '@/components/providers/permission-provider'
import { canAccessReport } from '@/lib/reports/report-permissions'
import { buildQuotationConversionReportData, getStatusDisplayName, getStatusColorClass } from '@/lib/reports/quotation-utils'
import { getDateRangeForPreset, parseDateRangeFromParams, formatPercentage } from '@/lib/reports/report-utils'
import { createClient } from '@/lib/supabase/client'
import { DateRange, QuotationConversionReportData, PJOStatusForReport } from '@/types/reports'
import { cn } from '@/lib/utils'

export default function QuotationConversionReportPage() {
  const { profile } = usePermissions()
  const searchParams = useSearchParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reportData, setReportData] = useState<QuotationConversionReportData | null>(null)

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
          status,
          converted_to_jo,
          created_at,
          approved_at,
          converted_to_jo_at
        `)
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .order('created_at', { ascending: false })

      if (pjoError) throw pjoError

      const data = buildQuotationConversionReportData(pjos || [], range)
      setReportData(data)
    } catch (err) {
      console.error('Error fetching quotation conversion data:', err)
      setError('Failed to load report data. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const fromParams = parseDateRangeFromParams(searchParams)
    const range = fromParams || getDateRangeForPreset('this-quarter')
    fetchReportData(range)
  }, [searchParams, fetchReportData])

  // Check permissions
  if (profile && !canAccessReport(profile.role, 'quotation-conversion')) {
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

  const handleStatusClick = (status: PJOStatusForReport) => {
    // Navigate to PJO list filtered by status
    const statusParam = status === 'converted' ? 'approved' : status
    router.push(`/pjo?status=${statusParam}`)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/reports"><ArrowLeft className="h-4 w-4 mr-2" />Back</Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Quotation Conversion Report</h1>
            <p className="text-muted-foreground">PJO conversion and pipeline analysis</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <ReportFilters defaultPeriod="this-quarter" onPeriodChange={handlePeriodChange} />

      {/* Content */}
      {loading ? (
        <ReportSkeleton />
      ) : error ? (
        <ReportEmptyState title="Error" message={error} />
      ) : !reportData || reportData.totals.totalPJOs === 0 ? (
        <ReportEmptyState message="No quotations found for the selected period." />
      ) : (
        <>
          {/* Summary */}
          <ReportSummary
            items={[
              { label: 'Total PJOs', value: reportData.totals.totalPJOs },
              { label: 'Overall Conversion Rate', value: reportData.totals.overallConversionRate, format: 'percentage', highlight: reportData.totals.overallConversionRate >= 50 ? 'positive' : 'neutral' },
            ]}
          />

          {/* Status Pipeline */}
          <Card>
            <CardHeader>
              <CardTitle>Status Pipeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between gap-2 overflow-x-auto pb-2">
                {reportData.statusCounts.map((status, index) => (
                  <div key={status.status} className="flex items-center">
                    <button
                      onClick={() => handleStatusClick(status.status)}
                      className={cn(
                        'flex flex-col items-center p-4 rounded-lg min-w-[120px] transition-all hover:scale-105',
                        getStatusColorClass(status.status)
                      )}
                    >
                      <span className="text-2xl font-bold">{status.count}</span>
                      <span className="text-sm font-medium">{getStatusDisplayName(status.status)}</span>
                      <span className="text-xs opacity-75">{formatPercentage(status.percentage)}</span>
                    </button>
                    {index < reportData.statusCounts.length - 1 && (
                      <ArrowRight className="h-5 w-5 mx-2 text-muted-foreground flex-shrink-0" />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Conversion Rates */}
          <Card>
            <CardHeader>
              <CardTitle>Conversion Rates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {reportData.conversionRates.map((rate) => (
                  <div key={`${rate.from}-${rate.to}`} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">{rate.from}</span>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">{rate.to}</span>
                    </div>
                    <div className="text-3xl font-bold text-center">
                      {formatPercentage(rate.rate)}
                    </div>
                    {/* Progress bar */}
                    <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{ width: `${Math.min(rate.rate, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Pipeline Metrics */}
          {reportData.pipelineMetrics.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Average Time in Pipeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  {reportData.pipelineMetrics.map((metric) => (
                    <div key={metric.stage} className="text-center p-4 border rounded-lg">
                      <div className="text-3xl font-bold">{metric.averageDays}</div>
                      <div className="text-sm text-muted-foreground">days</div>
                      <div className="text-sm font-medium mt-2">{metric.stage}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
