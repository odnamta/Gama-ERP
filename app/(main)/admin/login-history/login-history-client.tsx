'use client'

import { useState, useCallback, useTransition } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  LoginHistoryEntry,
  PaginatedLoginHistory,
  LoginHistoryFilters,
  LoginStatus,
  LoginMethod,
} from '@/types/login-history'
import { LoginHistoryTable } from '@/components/audit/login-history-table'
import { getLoginHistory, exportLoginHistory } from '@/app/actions/login-history-actions'
import {
  formatLoginTimestamp,
  formatSessionDuration,
} from '@/lib/login-history-utils'
import {
  Download,
  RefreshCw,
  CalendarIcon,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Shield,
  X,
} from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { DateRange } from 'react-day-picker'
import { useToast } from '@/hooks/use-toast'


/**
 * Login History Client Component
 * 
 * v0.76: System Audit & Logging Module
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
 * 
 * Provides:
 * - Login history table with filters
 * - Session statistics summary cards
 * - Failed login alerts for security monitoring
 * - Export functionality
 */

interface LoginHistoryClientProps {
  initialData: PaginatedLoginHistory
  filterOptions: {
    loginMethods: string[]
    deviceTypes: string[]
    browsers: string[]
    operatingSystems: string[]
  }
  summary: {
    totalLogins: number
    successfulLogins: number
    failedLogins: number
    uniqueUsers: number
    averageSessionDuration: number
  }
  recentFailedLogins: LoginHistoryEntry[]
  users: Array<{ id: string; email: string; name: string }>
  currentUser: {
    id: string
    email: string
    role: string
  }
}

// Status filter options
const statusOptions: Array<{ value: LoginStatus | 'all'; label: string }> = [
  { value: 'all', label: 'All Statuses' },
  { value: 'success', label: 'Success' },
  { value: 'failed', label: 'Failed' },
]

// Login method filter options
const methodOptions: Array<{ value: LoginMethod | 'all'; label: string }> = [
  { value: 'all', label: 'All Methods' },
  { value: 'password', label: 'Password' },
  { value: 'google', label: 'Google' },
  { value: 'magic_link', label: 'Magic Link' },
]

export function LoginHistoryClient({
  initialData,
  summary,
  recentFailedLogins,
  users,
}: LoginHistoryClientProps) {
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()
  const [data, setData] = useState<PaginatedLoginHistory>(initialData)
  const [filters, setFilters] = useState<LoginHistoryFilters>({})
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const [showFailedAlerts, setShowFailedAlerts] = useState(recentFailedLogins.length > 0)

  // Fetch data with current filters and pagination
  const fetchData = useCallback(
    async (newFilters: LoginHistoryFilters, page: number = 1) => {
      startTransition(async () => {
        const result = await getLoginHistory(newFilters, {
          page,
          page_size: 25,
        })
        if (result.success && result.data) {
          setData(result.data)
        } else {
          toast({
            title: 'Error',
            description: result.error || 'Failed to fetch login history',
            variant: 'destructive',
          })
        }
      })
    },
    [toast]
  )

  // Handle filter changes
  const handleFiltersChange = useCallback(
    (newFilters: LoginHistoryFilters) => {
      setFilters(newFilters)
      fetchData(newFilters, 1)
    },
    [fetchData]
  )

  // Handle page change
  const handlePageChange = useCallback(
    (page: number) => {
      fetchData(filters, page)
    },
    [fetchData, filters]
  )

  // Handle user filter change
  const handleUserChange = (userId: string) => {
    const newFilters = {
      ...filters,
      user_id: userId === 'all' ? undefined : userId,
    }
    handleFiltersChange(newFilters)
  }

  // Handle status filter change
  const handleStatusChange = (status: string) => {
    const newFilters = {
      ...filters,
      status: status === 'all' ? undefined : (status as LoginStatus),
    }
    handleFiltersChange(newFilters)
  }

  // Handle method filter change
  const handleMethodChange = (method: string) => {
    const newFilters = {
      ...filters,
      login_method: method === 'all' ? undefined : (method as LoginMethod),
    }
    handleFiltersChange(newFilters)
  }

  // Handle date range change
  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range)
    const newFilters = {
      ...filters,
      start_date: range?.from ? format(range.from, 'yyyy-MM-dd') : undefined,
      end_date: range?.to ? format(range.to, 'yyyy-MM-dd') : undefined,
    }
    handleFiltersChange(newFilters)
  }

  // Clear all filters
  const clearFilters = () => {
    setDateRange(undefined)
    setFilters({})
    fetchData({}, 1)
  }

  // Refresh data
  const handleRefresh = () => {
    fetchData(filters, data.page)
  }

  // Export to CSV
  const handleExport = async () => {
    startTransition(async () => {
      const result = await exportLoginHistory(filters)
      if (result.success && result.data) {
        // Create and download CSV file
        const blob = new Blob([result.data], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `login-history-${format(new Date(), 'yyyy-MM-dd-HHmmss')}.csv`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
        
        toast({
          title: 'Export Complete',
          description: 'Login history has been exported to CSV',
        })
      } else {
        toast({
          title: 'Export Failed',
          description: result.error || 'Failed to export login history',
          variant: 'destructive',
        })
      }
    })
  }

  const hasActiveFilters =
    filters.user_id ||
    filters.status ||
    filters.login_method ||
    filters.start_date ||
    filters.end_date

  // Create user map for table
  const userEmailMap = users.map(u => ({ id: u.id, email: u.email }))

  return (
    <div className="space-y-6">
      {/* Failed Login Alerts */}
      {showFailedAlerts && recentFailedLogins.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle className="flex items-center justify-between">
            <span>Security Alert: Recent Failed Login Attempts</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => setShowFailedAlerts(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </AlertTitle>
          <AlertDescription>
            <p className="mb-2">
              {recentFailedLogins.length} failed login attempt(s) detected in the last hour.
            </p>
            <div className="space-y-1 text-sm">
              {recentFailedLogins.slice(0, 5).map((entry) => (
                <div key={entry.id} className="flex items-center gap-2">
                  <XCircle className="h-3 w-3" />
                  <span>
                    {formatLoginTimestamp(entry.login_at)} - {entry.failure_reason || 'Unknown reason'}
                    {entry.ip_address && ` (IP: ${entry.ip_address})`}
                  </span>
                </div>
              ))}
              {recentFailedLogins.length > 5 && (
                <p className="text-muted-foreground">
                  ... and {recentFailedLogins.length - 5} more
                </p>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Summary Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Logins</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalLogins}</div>
            <p className="text-xs text-muted-foreground">Last 7 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Successful</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {summary.successfulLogins}
            </div>
            <p className="text-xs text-muted-foreground">
              {summary.totalLogins > 0
                ? `${((summary.successfulLogins / summary.totalLogins) * 100).toFixed(1)}% success rate`
                : 'No logins'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {summary.failedLogins}
            </div>
            <p className="text-xs text-muted-foreground">
              {summary.totalLogins > 0
                ? `${((summary.failedLogins / summary.totalLogins) * 100).toFixed(1)}% failure rate`
                : 'No failures'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.uniqueUsers}</div>
            <p className="text-xs text-muted-foreground">Active users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Session</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatSessionDuration(Math.round(summary.averageSessionDuration))}
            </div>
            <p className="text-xs text-muted-foreground">Average duration</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Login History</CardTitle>
              <CardDescription>
                View and filter user authentication events
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isPending}
              >
                <RefreshCw className={cn('mr-2 h-4 w-4', isPending && 'animate-spin')} />
                Refresh
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                disabled={isPending}
              >
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filter Controls */}
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center">
            {/* User Filter */}
            <Select
              value={filters.user_id || 'all'}
              onValueChange={handleUserChange}
            >
              <SelectTrigger className="w-full lg:w-[250px]">
                <SelectValue placeholder="Filter by user" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name || user.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select
              value={(filters.status as string) || 'all'}
              onValueChange={handleStatusChange}
            >
              <SelectTrigger className="w-full lg:w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      {option.value === 'success' && (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      )}
                      {option.value === 'failed' && (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      {option.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Method Filter */}
            <Select
              value={(filters.login_method as string) || 'all'}
              onValueChange={handleMethodChange}
            >
              <SelectTrigger className="w-full lg:w-[150px]">
                <SelectValue placeholder="Method" />
              </SelectTrigger>
              <SelectContent>
                {methodOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
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
                Clear
              </Button>
            )}
          </div>

          {/* Login History Table */}
          <LoginHistoryTable
            data={data}
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onPageChange={handlePageChange}
            loading={isPending}
            users={userEmailMap}
          />
        </CardContent>
      </Card>
    </div>
  )
}
