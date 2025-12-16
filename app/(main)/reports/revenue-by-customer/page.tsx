'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Users } from 'lucide-react'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ReportFilters, ReportSummary, ReportSkeleton, ReportEmptyState } from '@/components/reports'
import { usePermissions } from '@/components/providers/permission-provider'
import { canAccessReport } from '@/lib/reports/report-permissions'
import { buildRevenueByCustomerReport, RevenueByCustomerReport } from '@/lib/reports/revenue-customer-utils'
import { getDateRangeForPreset, parseDateRangeFromParams, formatCurrency, formatPercentage } from '@/lib/reports/report-utils'
import { createClient } from '@/lib/supabase/client'
import { DateRange } from '@/types/reports'

export default function RevenueByCustomerReportPage() {
  const { profile } = usePermissions()
  const searchParams = useSearchParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reportData, setReportData] = useState<RevenueByCustomerReport | null>(null)

  const fetchReportData = useCallback(async (range: DateRange) => {
    setLoading(true)
    setError(null)
    
    try {
      const supabase = createClient()
      const startDate = format(range.startDate, 'yyyy-MM-dd')
      const endDate = format(range.endDate, 'yyyy-MM-dd')

      // Fetch JO data with customer info and revenue
      const { data: joData, error: joError } = await supabase
        .from('job_orders')
        .select(`
          id,
          final_revenue,
          proforma_job_orders!inner (
            projects!inner (
              customers!inner (
                id,
                name
              )
            )
          )
        `)
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .in('status', ['completed', 'invoiced', 'closed'])

      if (joError) throw joError

      const transformedData = (joData || []).map(jo => ({
        customerId: jo.proforma_job_orders?.projects?.customers?.id || '',
        customerName: jo.proforma_job_orders?.projects?.customers?.name || 'Unknown',
        revenue: jo.final_revenue || 0,
      }))

      const report = buildRevenueByCustomerReport(transformedData, range)
      setReportData(report)
    } catch (err) {
      console.error('Error fetching revenue by customer data:', err)
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

  if (profile && !canAccessReport(profile.role, 'revenue-customer')) {
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

  const handlePeriodChange = (range: DateRange) => {
    fetchReportData(range)
  }

  const handleCustomerClick = (customerId: string) => {
    router.push(`/customers/${customerId}`)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/reports"><ArrowLeft className="h-4 w-4 mr-2" />Back</Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Revenue by Customer</h1>
            <p className="text-muted-foreground">Revenue breakdown by customer from completed JOs</p>
          </div>
        </div>
      </div>

      <ReportFilters defaultPeriod="this-month" onPeriodChange={handlePeriodChange} />

      {loading ? (
        <ReportSkeleton />
      ) : error ? (
        <ReportEmptyState title="Error" message={error} />
      ) : !reportData || reportData.items.length === 0 ? (
        <ReportEmptyState message="No revenue data found for the selected period." />
      ) : (
        <>
          <ReportSummary
            items={[
              { label: 'Total Revenue', value: reportData.totalRevenue, format: 'currency' },
              { label: 'Customers', value: reportData.customerCount, format: 'number' },
              { label: 'Avg per Customer', value: reportData.customerCount > 0 ? reportData.totalRevenue / reportData.customerCount : 0, format: 'currency' },
            ]}
          />

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Revenue by Customer
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead className="text-right">JOs</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                    <TableHead className="text-right">% of Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportData.items.map((item) => (
                    <TableRow key={item.customerId} className="cursor-pointer hover:bg-muted/50" onClick={() => handleCustomerClick(item.customerId)}>
                      <TableCell className="font-medium">{item.customerName}</TableCell>
                      <TableCell className="text-right">{item.joCount}</TableCell>
                      <TableCell className="text-right font-mono">{formatCurrency(item.totalRevenue)}</TableCell>
                      <TableCell className="text-right font-mono">{formatPercentage(item.percentageOfTotal)}</TableCell>
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
