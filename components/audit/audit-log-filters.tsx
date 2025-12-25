'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { AuditLogFilters, AuditAction } from '@/types/audit'
import { ACTION_LABELS, MODULE_LABELS } from '@/lib/system-audit-utils'
import { Search, CalendarIcon, X, Filter } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { DateRange } from 'react-day-picker'

interface AuditLogFiltersProps {
  filters: AuditLogFilters
  onFiltersChange: (filters: AuditLogFilters) => void
  users?: Array<{ id: string; email: string }>
  entityTypes?: string[]
  modules?: string[]
}

const actionOptions: Array<{ value: AuditAction | 'all'; label: string }> = [
  { value: 'all', label: 'All Actions' },
  { value: 'create', label: 'Created' },
  { value: 'update', label: 'Updated' },
  { value: 'delete', label: 'Deleted' },
  { value: 'view', label: 'Viewed' },
  { value: 'export', label: 'Exported' },
  { value: 'approve', label: 'Approved' },
  { value: 'reject', label: 'Rejected' },
  { value: 'submit', label: 'Submitted' },
  { value: 'cancel', label: 'Cancelled' },
]

const defaultEntityTypes = [
  'customers',
  'projects',
  'quotations',
  'proforma_job_orders',
  'job_orders',
  'invoices',
  'employees',
  'vendors',
  'equipment',
]

const defaultModules = Object.keys(MODULE_LABELS)

export function AuditLogFiltersComponent({
  filters,
  onFiltersChange,
  users = [],
  entityTypes = defaultEntityTypes,
  modules = defaultModules,
}: AuditLogFiltersProps) {
  const [dateRange, setDateRange] = useState<DateRange | undefined>(
    filters.start_date && filters.end_date
      ? {
          from: new Date(filters.start_date),
          to: new Date(filters.end_date),
        }
      : undefined
  )

  const handleSearchChange = (search: string) => {
    onFiltersChange({ ...filters, search: search || undefined })
  }

  const handleUserChange = (userId: string) => {
    onFiltersChange({
      ...filters,
      user_id: userId === 'all' ? undefined : userId,
    })
  }

  const handleActionChange = (action: string) => {
    onFiltersChange({
      ...filters,
      action: action === 'all' ? undefined : (action as AuditAction),
    })
  }

  const handleEntityTypeChange = (entityType: string) => {
    onFiltersChange({
      ...filters,
      entity_type: entityType === 'all' ? undefined : entityType,
    })
  }

  const handleModuleChange = (module: string) => {
    onFiltersChange({
      ...filters,
      module: module === 'all' ? undefined : module,
    })
  }

  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range)
    onFiltersChange({
      ...filters,
      start_date: range?.from ? format(range.from, 'yyyy-MM-dd') : undefined,
      end_date: range?.to ? format(range.to, 'yyyy-MM-dd') : undefined,
    })
  }

  const clearFilters = () => {
    setDateRange(undefined)
    onFiltersChange({})
  }

  const hasActiveFilters =
    filters.search ||
    filters.user_id ||
    filters.action ||
    filters.entity_type ||
    filters.module ||
    filters.start_date ||
    filters.end_date

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by description, entity, or user..."
            value={filters.search || ''}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* User Filter */}
        <Select
          value={filters.user_id || 'all'}
          onValueChange={handleUserChange}
        >
          <SelectTrigger className="w-full lg:w-[200px]">
            <SelectValue placeholder="Filter by user" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Users</SelectItem>
            {users.map((user) => (
              <SelectItem key={user.id} value={user.id}>
                {user.email}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Action Filter */}
        <Select
          value={(filters.action as string) || 'all'}
          onValueChange={handleActionChange}
        >
          <SelectTrigger className="w-full lg:w-[160px]">
            <SelectValue placeholder="Filter by action" />
          </SelectTrigger>
          <SelectContent>
            {actionOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
        {/* Entity Type Filter */}
        <Select
          value={(filters.entity_type as string) || 'all'}
          onValueChange={handleEntityTypeChange}
        >
          <SelectTrigger className="w-full lg:w-[200px]">
            <SelectValue placeholder="Filter by entity type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Entity Types</SelectItem>
            {entityTypes.map((type) => (
              <SelectItem key={type} value={type}>
                {type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Module Filter */}
        <Select
          value={(filters.module as string) || 'all'}
          onValueChange={handleModuleChange}
        >
          <SelectTrigger className="w-full lg:w-[180px]">
            <SelectValue placeholder="Filter by module" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Modules</SelectItem>
            {modules.map((mod) => (
              <SelectItem key={mod} value={mod}>
                {MODULE_LABELS[mod] || mod.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Date Range Picker */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'w-full justify-start text-left font-normal lg:w-[280px]',
                !dateRange && 'text-muted-foreground'
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateRange?.from ? (
                dateRange.to ? (
                  <>
                    {format(dateRange.from, 'LLL dd, y')} -{' '}
                    {format(dateRange.to, 'LLL dd, y')}
                  </>
                ) : (
                  format(dateRange.from, 'LLL dd, y')
                )
              ) : (
                <span>Pick a date range</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="range"
              defaultMonth={dateRange?.from}
              selected={dateRange}
              onSelect={handleDateRangeChange}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-9 px-3"
          >
            <X className="mr-2 h-4 w-4" />
            Clear Filters
          </Button>
        )}
      </div>

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <Filter className="h-4 w-4" />
          <span>Active filters:</span>
          {filters.search && (
            <span className="rounded-md bg-muted px-2 py-1">
              Search: &quot;{filters.search}&quot;
            </span>
          )}
          {filters.user_id && (
            <span className="rounded-md bg-muted px-2 py-1">
              User: {users.find((u) => u.id === filters.user_id)?.email || filters.user_id}
            </span>
          )}
          {filters.action && (
            <span className="rounded-md bg-muted px-2 py-1">
              Action: {ACTION_LABELS[filters.action as string] || filters.action}
            </span>
          )}
          {filters.entity_type && (
            <span className="rounded-md bg-muted px-2 py-1">
              Entity: {(filters.entity_type as string).replace(/_/g, ' ')}
            </span>
          )}
          {filters.module && (
            <span className="rounded-md bg-muted px-2 py-1">
              Module: {MODULE_LABELS[filters.module as string] || filters.module}
            </span>
          )}
          {(filters.start_date || filters.end_date) && (
            <span className="rounded-md bg-muted px-2 py-1">
              Date: {filters.start_date || '...'} to {filters.end_date || '...'}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
