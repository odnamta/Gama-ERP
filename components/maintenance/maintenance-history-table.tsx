'use client'

import { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Download, Eye, Filter, X } from 'lucide-react'
import { MaintenanceRecord, MaintenanceHistoryFilters, MaintenanceType } from '@/types/maintenance'
import { Asset } from '@/types/assets'
import { formatDate, formatIDR } from '@/lib/pjo-utils'

interface MaintenanceHistoryTableProps {
  records: MaintenanceRecord[]
  assets: Asset[]
  maintenanceTypes: MaintenanceType[]
  filters: MaintenanceHistoryFilters
  onFilterChange: (filters: MaintenanceHistoryFilters) => void
  onExport: () => void
  onViewDetails: (recordId: string) => void
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'completed':
      return <Badge variant="outline" className="border-green-500 text-green-600">Completed</Badge>
    case 'in_progress':
      return <Badge variant="outline" className="border-blue-500 text-blue-600">In Progress</Badge>
    case 'scheduled':
      return <Badge variant="outline" className="border-yellow-500 text-yellow-600">Scheduled</Badge>
    case 'cancelled':
      return <Badge variant="outline" className="border-gray-500 text-gray-600">Cancelled</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

export function MaintenanceHistoryTable({
  records,
  assets,
  maintenanceTypes,
  filters,
  onFilterChange,
  onExport,
  onViewDetails,
}: MaintenanceHistoryTableProps) {
  const [showFilters, setShowFilters] = useState(false)

  const clearFilters = () => {
    onFilterChange({})
  }

  const hasActiveFilters = Object.values(filters).some(v => v !== undefined && v !== '')

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Maintenance History</CardTitle>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-1" />
            Filters
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-1">{Object.values(filters).filter(v => v).length}</Badge>
            )}
          </Button>
          <Button variant="outline" size="sm" onClick={onExport}>
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>
        </div>
      </CardHeader>

      {showFilters && (
        <CardContent className="border-b pb-4">
          <div className="grid gap-4 md:grid-cols-5">
            <div className="space-y-2">
              <Label>Asset</Label>
              <Select
                value={filters.assetId || 'all'}
                onValueChange={(value) => onFilterChange({ ...filters, assetId: value === 'all' ? undefined : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All assets" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All assets</SelectItem>
                  {assets.map((asset) => (
                    <SelectItem key={asset.id} value={asset.id}>
                      {asset.asset_code} - {asset.asset_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                value={filters.maintenanceTypeId || 'all'}
                onValueChange={(value) => onFilterChange({ ...filters, maintenanceTypeId: value === 'all' ? undefined : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  {maintenanceTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.typeName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>From Date</Label>
              <Input
                type="date"
                value={filters.dateFrom || ''}
                onChange={(e) => onFilterChange({ ...filters, dateFrom: e.target.value || undefined })}
              />
            </div>

            <div className="space-y-2">
              <Label>To Date</Label>
              <Input
                type="date"
                value={filters.dateTo || ''}
                onChange={(e) => onFilterChange({ ...filters, dateTo: e.target.value || undefined })}
              />
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={filters.status || 'all'}
                onValueChange={(value) => onFilterChange({ ...filters, status: value === 'all' ? undefined : value as MaintenanceHistoryFilters['status'] })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="mt-2">
              <X className="h-4 w-4 mr-1" />
              Clear filters
            </Button>
          )}
        </CardContent>
      )}

      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Record #</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Asset</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Cost</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No maintenance records found
                </TableCell>
              </TableRow>
            ) : (
              records.map((record) => (
                <TableRow key={record.id} className="cursor-pointer hover:bg-muted/50" onClick={() => onViewDetails(record.id)}>
                  <TableCell className="font-mono text-sm">{record.recordNumber}</TableCell>
                  <TableCell>{formatDate(record.maintenanceDate)}</TableCell>
                  <TableCell>
                    {record.asset ? (
                      <span>{record.asset.asset_code}</span>
                    ) : '-'}
                  </TableCell>
                  <TableCell>{record.maintenanceType?.typeName || '-'}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{record.description}</TableCell>
                  <TableCell className="text-right font-medium">{formatIDR(record.totalCost)}</TableCell>
                  <TableCell>{getStatusBadge(record.status)}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onViewDetails(record.id); }}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
