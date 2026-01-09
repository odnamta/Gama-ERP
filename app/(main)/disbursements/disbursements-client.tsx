'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatCurrencyIDR, formatDate } from '@/lib/utils/format'
import { Plus, Search, Download, Filter, Wallet, Clock, CheckCircle, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BKKRecord {
  id: string
  bkk_number: string
  date: string
  description: string | null
  amount: number
  currency: string
  status: string
  category: string
  payment_method: string | null
  bank_account: string | null
  job_order_id: string | null
  vendor_id: string | null
  created_at: string
  job_orders: { jo_number: string; customer_name: string | null } | null
  vendors: { name: string; vendor_code: string | null } | null
  created_by_profile: { full_name: string } | null
  approved_by_profile: { full_name: string } | null
}

interface DisbursementsClientProps {
  initialData: BKKRecord[]
  userRole: string
}

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  approved: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  released: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  settled: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
}

const categoryLabels: Record<string, string> = {
  job_cost: 'Job Cost',
  vendor_payment: 'Vendor Payment',
  overhead: 'Overhead',
  other: 'Other',
}

export function DisbursementsClient({ initialData, userRole }: DisbursementsClientProps) {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  const canCreate = ['owner', 'director', 'finance', 'administration'].includes(userRole)

  const filteredData = useMemo(() => {
    return initialData.filter((bkk) => {
      const matchesSearch =
        bkk.bkk_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bkk.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bkk.job_orders?.jo_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bkk.vendors?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = categoryFilter === 'all' || bkk.category === categoryFilter
      const matchesStatus = statusFilter === 'all' || bkk.status === statusFilter
      return matchesSearch && matchesCategory && matchesStatus
    })
  }, [initialData, searchTerm, categoryFilter, statusFilter])

  // Calculate summary stats
  const stats = useMemo(() => {
    const total = filteredData.reduce((sum, bkk) => sum + Number(bkk.amount), 0)
    const pending = filteredData.filter((b) => b.status === 'pending').length
    const approved = filteredData.filter((b) => b.status === 'approved').length
    const settled = filteredData.filter((b) => b.status === 'settled').length
    return { total, pending, approved, settled, count: filteredData.length }
  }, [filteredData])

  const handleExport = () => {
    const headers = ['BKK Number', 'Date', 'Category', 'Description', 'Amount', 'Currency', 'Status', 'Reference']
    const rows = filteredData.map((bkk) => [
      bkk.bkk_number,
      bkk.date,
      categoryLabels[bkk.category] || bkk.category,
      bkk.description || '',
      bkk.amount,
      bkk.currency,
      bkk.status,
      bkk.job_orders?.jo_number || bkk.vendors?.name || '',
    ])

    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `disbursements-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Disbursements (BKK)</h1>
          <p className="text-muted-foreground">Cash disbursement vouchers</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          {canCreate && (
            <Button onClick={() => router.push('/disbursements/new')}>
              <Plus className="mr-2 h-4 w-4" />
              New BKK
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrencyIDR(stats.total)}</div>
            <p className="text-xs text-muted-foreground">{stats.count} records</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <AlertCircle className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.approved}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Settled</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.settled}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by BKK number, description, JO, or vendor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[180px]">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="job_cost">Job Cost</SelectItem>
            <SelectItem value="vendor_payment">Vendor Payment</SelectItem>
            <SelectItem value="overhead">Overhead</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="released">Released</SelectItem>
            <SelectItem value="settled">Settled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>BKK Number</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created By</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No disbursements found
                  </TableCell>
                </TableRow>
              ) : (
                filteredData.map((bkk) => (
                  <TableRow
                    key={bkk.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => router.push(`/disbursements/${bkk.id}`)}
                  >
                    <TableCell className="font-medium">{bkk.bkk_number}</TableCell>
                    <TableCell>{formatDate(bkk.date)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {categoryLabels[bkk.category] || bkk.category}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {bkk.job_orders?.jo_number || bkk.vendors?.name || '-'}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {bkk.description || '-'}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrencyIDR(bkk.amount)}
                    </TableCell>
                    <TableCell>
                      <Badge className={cn('capitalize', statusColors[bkk.status])}>
                        {bkk.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{bkk.created_by_profile?.full_name || '-'}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
