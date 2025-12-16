'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ClipboardList } from 'lucide-react'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { ReportFilters, ReportSummary, ReportSkeleton, ReportEmptyState } from '@/components/reports'
import { usePermissions } from '@/components/providers/permission-provider'
import { canAccessReport } from '@/lib/reports/report-permissions'
import { buildJOSummaryReport, filterByStatus, JOSummaryReport, JOStatus } from '@/lib/reports/jo-summary-utils'
import { getDateRangeForPreset, parseDateRangeFromParams, formatCurrency, formatPercentage } from '@/lib/reports/report-utils'
import { createClient } from '@/lib/supabase/client'
import { DateRange } from '@/types/reports'

const STATUS_LABELS: Record<JOStatus, string> = {
  active: 'Active',
  completed: 'Completed',
  submitted_to_finance: 'Submitted',
  invoiced: 'Invoiced',
  closed: 'Closed',
}

export default function JOSummaryReportPage() {
  const { profile } = usePermissions()
  const searchParams = useSearchParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reportData, setReportData] = useState<JOSummaryReport | null>(null)
  const [statusFilter, setStatusFilter] = useState<JOStatus | 'all'>('all')

  const fetchReportData = useCallback(async (range: DateRange) => {
    setLoading(true)
    setError(null)
    
    try {
      const supabase = createClient()
      const startDate = format(range.startDate, 'yyyy-MM-dd')
      const endDate = format(range.endDate, 'yyyy-MM-dd')

      const { data: joData, error: joError } = await supabase
        .from('job_orders')
        .select(`
          id,
          jo_number,
          status,
          final_revenue,
          final_cost,
          completed_at,
          proforma_job_orders!inner (
            projects!inner (
              name,
              customers!inner (name)
            )
          )
        `)
        .gte('created_at', startDate)
        .lte('created_at', endDate)

      if (joError) throw joError

      const items = (joData || []).map(jo => {
        const revenue = jo.final_revenue || 0
        const cost = jo.final_cost || 0
        return {
          joId: jo.id,
          joNumber: jo.jo_number,
          customerName: jo.proforma_job_orders?.projects?.customers?.name || 'Unknown',
          projectName: jo.proforma_job_orders?.projects?.name || 'Unknown',
          status: jo.status as JOStatus,
          revenue,
          cost,
          margin: revenue > 0 ? ((revenue - cost) / revenue) * 100 : 0,
          completedDate: jo.completed_at ? new Date(jo.completed_at) : undefined,
        }
      })

      const report = buildJOSummaryReport(items, range)
      setReportData(report)
    } catch (err) {
      console.error('Error fetching JO summary data:', err)
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

  if (profile && !canAccessReport(profile.role, 'jo-summary')) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/reports"><ArrowLeft className="h-4 w-4 mr-2" />Back to Reports</Link>
          </Button>
        </div>
        <ReportEmptyState title="Access Denied" message="You don't have permission to view this report." />
      </div>
    )
  }

  const handlePeriodChange = (range: DateRange) => fetchReportData(range)
  const handleJOClick = (joId: string) => router.push(`/job-orders/${joId}`)

  const filteredItems = reportData ? filterByStatus(reportData.items, statusFilter) : []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/reports"><ArrowLeft className="h-4 w-4 mr-2" />Back</Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Job Order Summary</h1>
            <p className="text-muted-foreground">Overview of all job orders</p>
          </div>
        </div>
      </div>

      <div className="flex gap-4 items-end">
        <ReportFilters defaultPeriod="this-month" onPeriodChange={handlePeriodChange} />
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as JOStatus | 'all')}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <ReportSkeleton />
      ) : error ? (
        <ReportEmptyState title="Error" message={error} />
      ) : !reportData || reportData.items.length === 0 ? (
        <ReportEmptyState message="No job orders found for the selected period." />
      ) : (
        <>
          <ReportSummary
            items={[
              { label: 'Total JOs', value: reportData.totalCount, format: 'number' },
              { label: 'Total Revenue', value: reportData.totalRevenue, format: 'currency' },
              { label: 'Total Cost', value: reportData.totalCost, format: 'currency' },
              { label: 'Avg Margin', value: reportData.averageMargin, format: 'percentage', highlight: reportData.averageMargin >= 20 ? 'positive' : reportData.averageMargin < 0 ? 'negative' : 'neutral' },
            ]}
          />

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5" />
                Job Orders ({filteredItems.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>JO Number</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                    <TableHead className="text-right">Cost</TableHead>
                    <TableHead className="text-right">Margin</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.map((item) => (
                    <TableRow key={item.joId} className="cursor-pointer hover:bg-muted/50" onClick={() => handleJOClick(item.joId)}>
                      <TableCell className="font-medium">{item.joNumber}</TableCell>
                      <TableCell>{item.customerName}</TableCell>
                      <TableCell>{item.projectName}</TableCell>
                      <TableCell><Badge variant="outline">{STATUS_LABELS[item.status]}</Badge></TableCell>
                      <TableCell className="text-right font-mono">{formatCurrency(item.revenue)}</TableCell>
                      <TableCell className="text-right font-mono">{formatCurrency(item.cost)}</TableCell>
                      <TableCell className={`text-right font-mono ${item.margin >= 20 ? 'text-green-600' : item.margin < 0 ? 'text-red-600' : ''}`}>
                        {formatPercentage(item.margin)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
