'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { VENDOR_INVOICE_STATUSES } from '@/lib/vendor-invoice-utils'
import type { VendorInvoiceFilterState, AgingBucket } from '@/types/vendor-invoices'
import { Search, X, CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

interface VendorInvoiceFiltersProps {
  filters: VendorInvoiceFilterState
  onFiltersChange: (filters: VendorInvoiceFilterState) => void
  vendors: { id: string; vendor_name: string }[]
  jobOrders: { id: string; jo_number: string }[]
  pjos: { id: string; pjo_number: string }[]
}

const agingBuckets: { value: AgingBucket | 'all'; label: string }[] = [
  { value: 'all', label: 'All Ages' },
  { value: 'current', label: 'Current' },
  { value: '1-30', label: '1-30 Days' },
  { value: '31-60', label: '31-60 Days' },
  { value: '61-90', label: '61-90 Days' },
  { value: '90+', label: '90+ Days' },
]

export function VendorInvoiceFilters({
  filters,
  onFiltersChange,
  vendors,
  jobOrders,
  pjos,
}: VendorInvoiceFiltersProps) {
  const [dateFromOpen, setDateFromOpen] = useState(false)
  const [dateToOpen, setDateToOpen] = useState(false)

  const handleReset = () => {
    onFiltersChange({
      search: '',
      status: 'all',
      vendorId: 'all',
      joId: 'all',
      pjoId: 'all',
      agingBucket: 'all',
      dateFrom: null,
      dateTo: null,
    })
  }

  const hasActiveFilters =
    filters.search ||
    filters.status !== 'all' ||
    filters.vendorId !== 'all' ||
    filters.joId !== 'all' ||
    filters.pjoId !== 'all' ||
    filters.agingBucket !== 'all' ||
    filters.dateFrom ||
    filters.dateTo

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search invoice number, ref, description..."
            value={filters.search}
            onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
            className="pl-9"
          />
        </div>

        {/* Status Filter */}
        <Select
          value={filters.status}
          onValueChange={(value) => onFiltersChange({ ...filters, status: value as typeof filters.status })}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {VENDOR_INVOICE_STATUSES.map((status) => (
              <SelectItem key={status} value={status} className="capitalize">
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Vendor Filter */}
        <Select
          value={filters.vendorId}
          onValueChange={(value) => onFiltersChange({ ...filters, vendorId: value })}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Vendor" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Vendors</SelectItem>
            {vendors.map((vendor) => (
              <SelectItem key={vendor.id} value={vendor.id}>
                {vendor.vendor_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Aging Bucket Filter */}
        <Select
          value={filters.agingBucket}
          onValueChange={(value) => onFiltersChange({ ...filters, agingBucket: value as typeof filters.agingBucket })}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Aging" />
          </SelectTrigger>
          <SelectContent>
            {agingBuckets.map((bucket) => (
              <SelectItem key={bucket.value} value={bucket.value}>
                {bucket.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-wrap gap-3">
        {/* JO Filter */}
        <Select
          value={filters.joId}
          onValueChange={(value) => onFiltersChange({ ...filters, joId: value })}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Job Order" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Job Orders</SelectItem>
            {jobOrders.map((jo) => (
              <SelectItem key={jo.id} value={jo.id}>
                {jo.jo_number}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* PJO Filter */}
        <Select
          value={filters.pjoId}
          onValueChange={(value) => onFiltersChange({ ...filters, pjoId: value })}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="PJO" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All PJOs</SelectItem>
            {pjos.map((pjo) => (
              <SelectItem key={pjo.id} value={pjo.id}>
                {pjo.pjo_number}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Date From */}
        <Popover open={dateFromOpen} onOpenChange={setDateFromOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'w-[150px] justify-start text-left font-normal',
                !filters.dateFrom && 'text-muted-foreground'
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {filters.dateFrom ? format(new Date(filters.dateFrom), 'dd/MM/yyyy') : 'From Date'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={filters.dateFrom ? new Date(filters.dateFrom) : undefined}
              onSelect={(date) => {
                onFiltersChange({ ...filters, dateFrom: date?.toISOString().split('T')[0] || null })
                setDateFromOpen(false)
              }}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        {/* Date To */}
        <Popover open={dateToOpen} onOpenChange={setDateToOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'w-[150px] justify-start text-left font-normal',
                !filters.dateTo && 'text-muted-foreground'
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {filters.dateTo ? format(new Date(filters.dateTo), 'dd/MM/yyyy') : 'To Date'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={filters.dateTo ? new Date(filters.dateTo) : undefined}
              onSelect={(date) => {
                onFiltersChange({ ...filters, dateTo: date?.toISOString().split('T')[0] || null })
                setDateToOpen(false)
              }}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        {/* Reset Button */}
        {hasActiveFilters && (
          <Button variant="ghost" onClick={handleReset} className="gap-2">
            <X className="h-4 w-4" />
            Reset
          </Button>
        )}
      </div>
    </div>
  )
}
