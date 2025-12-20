'use client'

import { useState, useEffect, useCallback } from 'react'
import { VendorInvoiceSummary } from './vendor-invoice-summary'
import { VendorInvoiceFilters } from './vendor-invoice-filters'
import { VendorInvoiceTable } from './vendor-invoice-table'
import {
  getVendorInvoices,
  getVendorsForDropdown,
  getJobOrdersForDropdown,
  getPJOsForDropdown,
  getAPSummaryWithAging,
} from '@/app/(main)/finance/vendor-invoices/actions'
import type {
  VendorInvoiceWithRelations,
  VendorInvoiceFilterState,
  APSummaryWithAging,
} from '@/types/vendor-invoices'

const defaultFilters: VendorInvoiceFilterState = {
  search: '',
  status: 'all',
  vendorId: 'all',
  joId: 'all',
  pjoId: 'all',
  agingBucket: 'all',
  dateFrom: null,
  dateTo: null,
}

const defaultSummary: APSummaryWithAging = {
  totalUnpaid: 0,
  dueToday: 0,
  overdue: 0,
  paidMTD: 0,
  pendingVerification: 0,
  aging: {
    current: 0,
    days1to30: 0,
    days31to60: 0,
    days61to90: 0,
    days90plus: 0,
  },
}

export function VendorInvoiceList() {
  const [invoices, setInvoices] = useState<VendorInvoiceWithRelations[]>([])
  const [summary, setSummary] = useState<APSummaryWithAging>(defaultSummary)
  const [filters, setFilters] = useState<VendorInvoiceFilterState>(defaultFilters)
  const [vendors, setVendors] = useState<{ id: string; vendor_name: string }[]>([])
  const [jobOrders, setJobOrders] = useState<{ id: string; jo_number: string }[]>([])
  const [pjos, setPjos] = useState<{ id: string; pjo_number: string }[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSummaryLoading, setIsSummaryLoading] = useState(true)

  // Load dropdown data
  useEffect(() => {
    async function loadDropdownData() {
      const [vendorsData, josData, pjosData] = await Promise.all([
        getVendorsForDropdown(),
        getJobOrdersForDropdown(),
        getPJOsForDropdown(),
      ])
      setVendors(vendorsData)
      setJobOrders(josData)
      setPjos(pjosData)
    }
    loadDropdownData()
  }, [])

  // Load summary
  useEffect(() => {
    async function loadSummary() {
      setIsSummaryLoading(true)
      const summaryData = await getAPSummaryWithAging()
      setSummary(summaryData)
      setIsSummaryLoading(false)
    }
    loadSummary()
  }, [])

  // Load invoices when filters change
  const loadInvoices = useCallback(async () => {
    setIsLoading(true)
    const data = await getVendorInvoices(filters)
    setInvoices(data)
    setIsLoading(false)
  }, [filters])

  useEffect(() => {
    // Debounce search
    const timeoutId = setTimeout(() => {
      loadInvoices()
    }, filters.search ? 300 : 0)

    return () => clearTimeout(timeoutId)
  }, [loadInvoices, filters.search])

  return (
    <div className="space-y-6">
      <VendorInvoiceSummary summary={summary} isLoading={isSummaryLoading} />
      
      <VendorInvoiceFilters
        filters={filters}
        onFiltersChange={setFilters}
        vendors={vendors}
        jobOrders={jobOrders}
        pjos={pjos}
      />
      
      <VendorInvoiceTable invoices={invoices} isLoading={isLoading} />
    </div>
  )
}
