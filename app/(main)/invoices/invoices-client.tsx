'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { InvoiceVirtualTable } from '@/components/invoices/invoice-virtual-table'
import { InvoiceFilters } from '@/components/invoices/invoice-filters'
import { InvoiceWithRelations, InvoiceStatus } from '@/types'
import { getInvoices, InvoiceStats } from './actions'
import { formatCurrency } from '@/lib/utils/format'
import { Loader2, FileText, Clock, AlertTriangle, CheckCircle } from 'lucide-react'

interface InvoicesClientProps {
  serverStats?: InvoiceStats
}

export function InvoicesClient({ serverStats }: InvoicesClientProps) {
  const [invoices, setInvoices] = useState<InvoiceWithRelations[]>([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState<InvoiceStatus | 'all'>('all')
  const [search, setSearch] = useState('')

  const loadInvoices = useCallback(async () => {
    setLoading(true)
    try {
      const filters = {
        status: status === 'all' ? undefined : status,
        search: search || undefined,
      }
      const data = await getInvoices(filters)
      setInvoices(data)
    } finally {
      setLoading(false)
    }
  }, [status, search])

  useEffect(() => {
    const debounce = setTimeout(() => {
      loadInvoices()
    }, 300)
    return () => clearTimeout(debounce)
  }, [loadInvoices])

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {serverStats && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Total Invoice</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-2xl font-bold">{formatCurrency(serverStats.totalAmount)}</div>
              <p className="text-xs text-muted-foreground">{serverStats.totalCount} invoice</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Outstanding</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-2xl font-bold text-yellow-600">{serverStats.outstandingCount}</div>
              <p className="text-xs text-muted-foreground">{formatCurrency(serverStats.outstandingAmount)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Overdue</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-2xl font-bold text-red-600">{serverStats.overdueCount}</div>
              <p className="text-xs text-muted-foreground">{formatCurrency(serverStats.overdueAmount)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Lunas</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-2xl font-bold text-green-600">{serverStats.paidCount}</div>
              <p className="text-xs text-muted-foreground">{formatCurrency(serverStats.paidAmount)}</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>All Invoices</CardTitle>
          <CardDescription>View and manage all invoices</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <InvoiceFilters
            status={status}
            search={search}
            onStatusChange={setStatus}
            onSearchChange={setSearch}
          />
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <InvoiceVirtualTable invoices={invoices} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
