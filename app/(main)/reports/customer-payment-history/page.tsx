'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CreditCard, AlertTriangle } from 'lucide-react'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ReportFilters, ReportSummary, ReportSkeleton, ReportEmptyState } from '@/components/reports'
import { usePermissions } from '@/components/providers/permission-provider'
import { canAccessReport } from '@/lib/reports/report-permissions'
import { buildCustomerPaymentReport, CustomerPaymentReport } from '@/lib/reports/payment-history-utils'
import { getDateRangeForPreset, parseDateRangeFromParams, formatCurrency } from '@/lib/reports/report-utils'
import { createClient } from '@/lib/supabase/client'
import { DateRange } from '@/types/reports'

export default function CustomerPaymentHistoryReportPage() {
  const { profile } = usePermissions()
  const searchParams = useSearchParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reportData, setReportData] = useState<CustomerPaymentReport | null>(null)

  const fetchReportData = useCallback(async (range: DateRange) => {
    setLoading(true)
    setError(null)
    
    try {
      const supabase = createClient()
      const startDate = format(range.startDate, 'yyyy-MM-dd')
      const endDate = format(range.endDate, 'yyyy-MM-dd')

      const { data: invoiceData, error: invoiceError } = await supabase
        .from('invoices')
        .select(`
          id,
          total_amount,
          status,
          invoice_date,
          job_orders!inner (
            proforma_job_orders!inner (
              projects!inner (
                customers!inner (id, name)
              )
            )
          )
        `)
        .gte('invoice_date', startDate)
        .lte('invoice_date', endDate)

      if (invoiceError) throw invoiceError

      const payments = (invoiceData || []).map(inv => {
        // Estimate days to pay based on status - paid invoices assumed 30 days average
        const isPaid = inv.status === 'paid'
        const daysToPay = isPaid ? 30 : null // Simplified - would need actual payment date tracking
        
        return {
          customerId: inv.job_orders?.proforma_job_orders?.projects?.customers?.id || '',
          customerName: inv.job_orders?.proforma_job_orders?.projects?.customers?.name || 'Unknown',
          invoiceAmount: inv.total_amount || 0,
          paidAmount: isPaid ? (inv.total_amount || 0) : 0,
          daysToPay,
        }
      })

      const report = buildCustomerPaymentReport(payments, range)
      setReportData(report)
    } catch (err) {
      console.error('Error fetching payment history data:', err)
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

  if (profile && !canAccessReport(profile.role, 'customer-payment-history')) {
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
  const handleCustomerClick = (customerId: string) => router.push(`/customers/${customerId}`)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/reports"><ArrowLeft className="h-4 w-4 mr-2" />Back</Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Customer Payment History</h1>
            <p className="text-muted-foreground">Payment patterns and slow payer analysis</p>
          </div>
        </div>
      </div>

      <ReportFilters defaultPeriod="this-month" onPeriodChange={handlePeriodChange} />

      {loading ? (
        <ReportSkeleton />
      ) : error ? (
        <ReportEmptyState title="Error" message={error} />
      ) : !reportData || reportData.items.length === 0 ? (
        <ReportEmptyState message="No payment data found for the selected period." />
      ) : (
        <>
          <ReportSummary
            items={[
              { label: 'Total Invoiced', value: reportData.totalInvoiced, format: 'currency' },
              { label: 'Total Paid', value: reportData.totalPaid, format: 'currency', highlight: 'positive' },
              { label: 'Outstanding', value: reportData.totalOutstanding, format: 'currency', highlight: reportData.totalOutstanding > 0 ? 'negative' : 'neutral' },
            ]}
          />

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment History by Customer
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead className="text-right">Invoiced</TableHead>
                    <TableHead className="text-right">Paid</TableHead>
                    <TableHead className="text-right">Outstanding</TableHead>
                    <TableHead className="text-right">Avg Days to Pay</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportData.items.map((item) => (
                    <TableRow 
                      key={item.customerId} 
                      className={`cursor-pointer hover:bg-muted/50 ${item.isSlowPayer ? 'bg-yellow-50' : ''}`}
                      onClick={() => handleCustomerClick(item.customerId)}
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {item.customerName}
                          {item.isSlowPayer && <AlertTriangle className="h-4 w-4 text-yellow-600" />}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono">{formatCurrency(item.totalInvoiced)}</TableCell>
                      <TableCell className="text-right font-mono">{formatCurrency(item.totalPaid)}</TableCell>
                      <TableCell className="text-right font-mono">{formatCurrency(item.outstandingBalance)}</TableCell>
                      <TableCell className={`text-right font-mono ${item.isSlowPayer ? 'text-yellow-600 font-semibold' : ''}`}>
                        {item.averageDaysToPay !== null ? `${item.averageDaysToPay.toFixed(0)} days` : 'N/A'}
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
