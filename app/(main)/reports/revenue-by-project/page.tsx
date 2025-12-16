'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, FolderKanban } from 'lucide-react'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ReportFilters, ReportSummary, ReportSkeleton, ReportEmptyState } from '@/components/reports'
import { usePermissions } from '@/components/providers/permission-provider'
import { canAccessReport } from '@/lib/reports/report-permissions'
import { buildRevenueByProjectReport, RevenueByProjectReport } from '@/lib/reports/revenue-project-utils'
import { getDateRangeForPreset, parseDateRangeFromParams, formatCurrency, formatPercentage } from '@/lib/reports/report-utils'
import { createClient } from '@/lib/supabase/client'
import { DateRange } from '@/types/reports'

export default function RevenueByProjectReportPage() {
  const { profile } = usePermissions()
  const searchParams = useSearchParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reportData, setReportData] = useState<RevenueByProjectReport | null>(null)

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
          final_revenue,
          final_cost,
          proforma_job_orders!inner (
            projects!inner (
              id,
              name,
              customers!inner (name)
            )
          )
        `)
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .in('status', ['completed', 'invoiced', 'closed'])

      if (joError) throw joError

      const transformedData = (joData || []).map(jo => ({
        projectId: jo.proforma_job_orders?.projects?.id || '',
        projectName: jo.proforma_job_orders?.projects?.name || 'Unknown',
        customerName: jo.proforma_job_orders?.projects?.customers?.name || 'Unknown',
        revenue: jo.final_revenue || 0,
        cost: jo.final_cost || 0,
      }))

      const report = buildRevenueByProjectReport(transformedData, range)
      setReportData(report)
    } catch (err) {
      console.error('Error fetching revenue by project data:', err)
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

  if (profile && !canAccessReport(profile.role, 'revenue-project')) {
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
  const handleProjectClick = (projectId: string) => router.push(`/projects/${projectId}`)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/reports"><ArrowLeft className="h-4 w-4 mr-2" />Back</Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Revenue by Project</h1>
            <p className="text-muted-foreground">Revenue and profit analysis by project</p>
          </div>
        </div>
      </div>

      <ReportFilters defaultPeriod="this-month" onPeriodChange={handlePeriodChange} />

      {loading ? (
        <ReportSkeleton />
      ) : error ? (
        <ReportEmptyState title="Error" message={error} />
      ) : !reportData || reportData.items.length === 0 ? (
        <ReportEmptyState message="No project revenue found for the selected period." />
      ) : (
        <>
          <ReportSummary
            items={[
              { label: 'Total Revenue', value: reportData.totalRevenue, format: 'currency' },
              { label: 'Total Cost', value: reportData.totalCost, format: 'currency' },
              { label: 'Gross Profit', value: reportData.totalRevenue - reportData.totalCost, format: 'currency', highlight: reportData.totalRevenue - reportData.totalCost >= 0 ? 'positive' : 'negative' },
              { label: 'Avg Margin', value: reportData.averageMargin, format: 'percentage', highlight: reportData.averageMargin >= 20 ? 'positive' : reportData.averageMargin < 0 ? 'negative' : 'neutral' },
            ]}
          />

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FolderKanban className="h-5 w-5" />
                Revenue by Project
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                    <TableHead className="text-right">Cost</TableHead>
                    <TableHead className="text-right">Margin</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportData.items.map((item) => (
                    <TableRow key={item.projectId} className="cursor-pointer hover:bg-muted/50" onClick={() => handleProjectClick(item.projectId)}>
                      <TableCell className="font-medium">{item.projectName}</TableCell>
                      <TableCell>{item.customerName}</TableCell>
                      <TableCell className="text-right font-mono">{formatCurrency(item.totalRevenue)}</TableCell>
                      <TableCell className="text-right font-mono">{formatCurrency(item.totalCost)}</TableCell>
                      <TableCell className={`text-right font-mono ${item.profitMargin >= 20 ? 'text-green-600' : item.profitMargin < 0 ? 'text-red-600' : ''}`}>
                        {formatPercentage(item.profitMargin)}
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
