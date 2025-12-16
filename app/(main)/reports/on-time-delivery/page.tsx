'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Clock, CheckCircle, XCircle } from 'lucide-react'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { ReportFilters, ReportSummary, ReportSkeleton, ReportEmptyState } from '@/components/reports'
import { usePermissions } from '@/components/providers/permission-provider'
import { canAccessReport } from '@/lib/reports/report-permissions'
import { buildOnTimeDeliveryReport, classifyDelivery, OnTimeDeliveryReport } from '@/lib/reports/on-time-delivery-utils'
import { getDateRangeForPreset, parseDateRangeFromParams, formatDate } from '@/lib/reports/report-utils'
import { createClient } from '@/lib/supabase/client'
import { DateRange } from '@/types/reports'

export default function OnTimeDeliveryReportPage() {
  const { profile } = usePermissions()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reportData, setReportData] = useState<OnTimeDeliveryReport | null>(null)

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
          created_at,
          completed_at,
          proforma_job_orders!inner (
            projects!inner (
              customers!inner (name)
            )
          )
        `)
        .gte('completed_at', startDate)
        .lte('completed_at', endDate)
        .not('completed_at', 'is', null)

      if (joError) throw joError

      const items = (joData || [])
        .filter(jo => jo.created_at && jo.completed_at)
        .map(jo => {
          // Use created_at + 14 days as estimated delivery date (placeholder)
          const createdDate = new Date(jo.created_at!)
          const scheduledDate = new Date(createdDate.getTime() + 14 * 24 * 60 * 60 * 1000)
          const completedDate = new Date(jo.completed_at!)
          const classification = classifyDelivery(scheduledDate, completedDate)
          
          return {
            joId: jo.id,
            joNumber: jo.jo_number,
            customerName: jo.proforma_job_orders?.projects?.customers?.name || 'Unknown',
            scheduledDate,
            completedDate,
            ...classification,
          }
        })

      const report = buildOnTimeDeliveryReport(items, range)
      setReportData(report)
    } catch (err) {
      console.error('Error fetching on-time delivery data:', err)
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

  if (profile && !canAccessReport(profile.role, 'on-time-delivery')) {
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/reports"><ArrowLeft className="h-4 w-4 mr-2" />Back</Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">On-Time Delivery Report</h1>
            <p className="text-muted-foreground">Delivery performance metrics</p>
          </div>
        </div>
      </div>

      <ReportFilters defaultPeriod="this-month" onPeriodChange={handlePeriodChange} />

      {loading ? (
        <ReportSkeleton />
      ) : error ? (
        <ReportEmptyState title="Error" message={error} />
      ) : !reportData || reportData.items.length === 0 ? (
        <ReportEmptyState message="No completed deliveries found for the selected period." />
      ) : (
        <>
          <ReportSummary
            items={[
              { label: 'On-Time', value: reportData.onTimeCount, format: 'number', highlight: 'positive' },
              { label: 'Late', value: reportData.lateCount, format: 'number', highlight: reportData.lateCount > 0 ? 'negative' : 'neutral' },
              { label: 'On-Time Rate', value: reportData.onTimePercentage, format: 'percentage', highlight: reportData.onTimePercentage >= 90 ? 'positive' : reportData.onTimePercentage < 70 ? 'negative' : 'neutral' },
              { label: 'Avg Delay (Late)', value: `${reportData.averageDelayDays.toFixed(1)} days` },
            ]}
          />

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Delivery Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>JO Number</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Scheduled</TableHead>
                    <TableHead>Completed</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Delay</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportData.items.map((item) => (
                    <TableRow key={item.joId} className={!item.isOnTime ? 'bg-red-50' : ''}>
                      <TableCell className="font-medium">{item.joNumber}</TableCell>
                      <TableCell>{item.customerName}</TableCell>
                      <TableCell>{formatDate(item.scheduledDate)}</TableCell>
                      <TableCell>{formatDate(item.completedDate)}</TableCell>
                      <TableCell>
                        {item.isOnTime ? (
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            <CheckCircle className="h-3 w-3 mr-1" />On Time
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-red-600 border-red-600">
                            <XCircle className="h-3 w-3 mr-1" />Late
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {item.isOnTime ? '-' : `${item.delayDays} days`}
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
