'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { formatCurrency, formatDate } from '@/lib/utils/format'
import { getProjectList, getProjectRecap } from '@/lib/project-recap-actions'
import type { ProjectRecapProject, ProjectRecapSummary } from '@/lib/project-recap-actions'
import {
  ArrowLeft,
  Loader2,
  Building2,
  FileText,
  Banknote,
  TrendingUp,
  DollarSign,
  Receipt,
  Wallet,
} from 'lucide-react'

// Status badge helpers
function getJOStatusColor(status: string): string {
  const colors: Record<string, string> = {
    active: 'bg-blue-100 text-blue-800',
    in_progress: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    submitted_to_finance: 'bg-purple-100 text-purple-800',
    invoiced: 'bg-indigo-100 text-indigo-800',
    closed: 'bg-gray-100 text-gray-800',
  }
  return colors[status] || 'bg-gray-100 text-gray-800'
}

function getInvoiceStatusColor(status: string): string {
  const colors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-800',
    sent: 'bg-blue-100 text-blue-800',
    paid: 'bg-green-100 text-green-800',
    partial: 'bg-yellow-100 text-yellow-800',
    overdue: 'bg-red-100 text-red-800',
    cancelled: 'bg-red-100 text-red-800',
  }
  return colors[status] || 'bg-gray-100 text-gray-800'
}

function getBKKStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-blue-100 text-blue-800',
    released: 'bg-green-100 text-green-800',
    settled: 'bg-gray-100 text-gray-800',
    rejected: 'bg-red-100 text-red-800',
  }
  return colors[status] || 'bg-gray-100 text-gray-800'
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    active: 'Aktif',
    in_progress: 'Dalam Proses',
    completed: 'Selesai',
    submitted_to_finance: 'Diajukan ke Finance',
    invoiced: 'Diinvoice',
    closed: 'Ditutup',
    draft: 'Draft',
    sent: 'Terkirim',
    paid: 'Lunas',
    partial: 'Sebagian',
    overdue: 'Jatuh Tempo',
    cancelled: 'Dibatalkan',
    pending: 'Menunggu',
    approved: 'Disetujui',
    released: 'Dicairkan',
    settled: 'Diselesaikan',
    rejected: 'Ditolak',
  }
  return labels[status] || status
}

export default function ProjectRecapPage() {
  const [projects, setProjects] = useState<ProjectRecapProject[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState<string>('')
  const [recap, setRecap] = useState<ProjectRecapSummary | null>(null)
  const [loading, setLoading] = useState(false)
  const [projectsLoading, setProjectsLoading] = useState(true)

  // Load project list
  useEffect(() => {
    async function loadProjects() {
      setProjectsLoading(true)
      const data = await getProjectList()
      setProjects(data)
      setProjectsLoading(false)
    }
    loadProjects()
  }, [])

  // Load recap when project changes
  useEffect(() => {
    if (!selectedProjectId) {
      setRecap(null)
      return
    }

    async function loadRecap() {
      setLoading(true)
      const data = await getProjectRecap(selectedProjectId)
      setRecap(data)
      setLoading(false)
    }
    loadRecap()
  }, [selectedProjectId])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/reports">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Kembali
              </Link>
            </Button>
          </div>
          <h1 className="text-2xl font-bold">Rekap Proyek</h1>
          <p className="text-muted-foreground">
            Ringkasan keuangan proyek end-to-end: JO, Invoice, dan BKK
          </p>
        </div>
      </div>

      {/* Project Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Pilih Proyek
          </CardTitle>
        </CardHeader>
        <CardContent>
          {projectsLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Memuat daftar proyek...
            </div>
          ) : (
            <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
              <SelectTrigger className="w-full md:w-[400px]">
                <SelectValue placeholder="Pilih proyek untuk melihat rekap..." />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                    {project.customer ? ` — ${project.customer.name}` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </CardContent>
      </Card>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Memuat data rekap proyek...</span>
        </div>
      )}

      {/* Recap Content */}
      {!loading && recap && (
        <>
          {/* Project Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Informasi Proyek
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-sm text-muted-foreground">Nama Proyek</p>
                <p className="font-semibold">{recap.project.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Customer</p>
                <p className="font-semibold">
                  {recap.project.customer ? (
                    <Link href={`/customers/${recap.project.customer.id}`} className="hover:underline text-primary">
                      {recap.project.customer.name}
                    </Link>
                  ) : (
                    '-'
                  )}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Nilai Kontrak</p>
                <p className="font-semibold">
                  {recap.project.contract_value
                    ? formatCurrency(recap.project.contract_value)
                    : '-'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tanggal Dibuat</p>
                <p className="font-semibold">{formatDate(recap.project.created_at)}</p>
              </div>
            </CardContent>
          </Card>

          {/* Financial Summary Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                </div>
                <p className="text-2xl font-bold">{formatCurrency(recap.financials.totalRevenue)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-4 w-4 text-red-600" />
                  <p className="text-sm text-muted-foreground">Total Biaya</p>
                </div>
                <p className="text-2xl font-bold">{formatCurrency(recap.financials.totalCost)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                  <p className="text-sm text-muted-foreground">Profit Kotor</p>
                </div>
                <p className={`text-2xl font-bold ${recap.financials.grossProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(recap.financials.grossProfit)}
                </p>
                <p className="text-sm text-muted-foreground">
                  Margin: {recap.financials.grossMargin.toFixed(1)}%
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-2">
                  <Wallet className="h-4 w-4 text-indigo-600" />
                  <p className="text-sm text-muted-foreground">Posisi Kas Bersih</p>
                </div>
                <p className={`text-2xl font-bold ${recap.financials.netCashPosition >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(recap.financials.netCashPosition)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Diterima - Dicairkan
                </p>
              </CardContent>
            </Card>
          </div>

          {/* JO List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Daftar Job Order ({recap.jobOrders.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recap.jobOrders.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  Belum ada Job Order untuk proyek ini
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>No. JO</TableHead>
                      <TableHead>No. PJO</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                      <TableHead className="text-right">Biaya</TableHead>
                      <TableHead className="text-right">Profit</TableHead>
                      <TableHead className="text-right">Margin</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recap.jobOrders.map((jo) => {
                      const profit = (jo.final_revenue ?? 0) - (jo.final_cost ?? 0)
                      const margin = jo.final_revenue && jo.final_revenue > 0
                        ? (profit / jo.final_revenue) * 100
                        : 0
                      return (
                        <TableRow key={jo.id}>
                          <TableCell>
                            <Link href={`/job-orders/${jo.id}`} className="text-primary hover:underline font-medium">
                              {jo.jo_number}
                            </Link>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {jo.pjo_number ?? '-'}
                          </TableCell>
                          <TableCell>
                            <Badge className={getJOStatusColor(jo.status)}>
                              {getStatusLabel(jo.status)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(jo.final_revenue)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(jo.final_cost)}
                          </TableCell>
                          <TableCell className={`text-right font-medium ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(profit)}
                          </TableCell>
                          <TableCell className={`text-right ${margin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {margin.toFixed(1)}%
                          </TableCell>
                        </TableRow>
                      )
                    })}
                    {/* Totals row */}
                    <TableRow className="bg-muted/50 font-semibold">
                      <TableCell colSpan={3}>Total</TableCell>
                      <TableCell className="text-right">{formatCurrency(recap.financials.totalRevenue)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(recap.financials.totalCost)}</TableCell>
                      <TableCell className={`text-right ${recap.financials.grossProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(recap.financials.grossProfit)}
                      </TableCell>
                      <TableCell className={`text-right ${recap.financials.grossMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {recap.financials.grossMargin.toFixed(1)}%
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Invoice Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                Ringkasan Invoice ({recap.invoices.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Invoice summary cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-sm text-muted-foreground">Total Diinvoice</p>
                  <p className="font-semibold">{formatCurrency(recap.financials.totalInvoiced)}</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-sm text-muted-foreground">Total Diterima</p>
                  <p className="font-semibold text-green-600">{formatCurrency(recap.financials.totalPaid)}</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-sm text-muted-foreground">Outstanding</p>
                  <p className="font-semibold text-orange-600">{formatCurrency(recap.financials.outstandingInvoices)}</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-sm text-muted-foreground">Tingkat Pembayaran</p>
                  <p className="font-semibold">
                    {recap.financials.totalInvoiced > 0
                      ? ((recap.financials.totalPaid / recap.financials.totalInvoiced) * 100).toFixed(1)
                      : '0'}%
                  </p>
                </div>
              </div>

              {/* Collection progress bar */}
              {recap.financials.totalInvoiced > 0 && (
                <div className="space-y-1">
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Progres Penagihan</span>
                    <span>
                      {((recap.financials.totalPaid / recap.financials.totalInvoiced) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <Progress
                    value={(recap.financials.totalPaid / recap.financials.totalInvoiced) * 100}
                    className="h-2"
                  />
                </div>
              )}

              {/* Invoice table */}
              {recap.invoices.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  Belum ada invoice untuk proyek ini
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>No. Invoice</TableHead>
                      <TableHead>JO</TableHead>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Jatuh Tempo</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Jumlah</TableHead>
                      <TableHead className="text-right">Dibayar</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recap.invoices.map((inv) => (
                      <TableRow key={inv.id}>
                        <TableCell>
                          <Link href={`/invoices/${inv.id}`} className="text-primary hover:underline font-medium">
                            {inv.invoice_number}
                          </Link>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{inv.jo_number ?? '-'}</TableCell>
                        <TableCell>{formatDate(inv.invoice_date)}</TableCell>
                        <TableCell>{formatDate(inv.due_date)}</TableCell>
                        <TableCell>
                          <Badge className={getInvoiceStatusColor(inv.status)}>
                            {getStatusLabel(inv.status)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">{formatCurrency(inv.total_amount)}</TableCell>
                        <TableCell className="text-right text-green-600">
                          {formatCurrency(inv.amount_paid)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* BKK Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Banknote className="h-5 w-5" />
                Ringkasan BKK ({recap.bkks.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* BKK summary cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-sm text-muted-foreground">Total Dicairkan</p>
                  <p className="font-semibold">{formatCurrency(recap.financials.totalDisbursed)}</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-sm text-muted-foreground">Total Digunakan</p>
                  <p className="font-semibold text-green-600">{formatCurrency(recap.financials.totalSettled)}</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-sm text-muted-foreground">Menunggu Pencairan</p>
                  <p className="font-semibold text-orange-600">{formatCurrency(recap.financials.pendingDisbursement)}</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-sm text-muted-foreground">Tingkat Penyelesaian</p>
                  <p className="font-semibold">
                    {recap.financials.totalDisbursed > 0
                      ? ((recap.financials.totalSettled / recap.financials.totalDisbursed) * 100).toFixed(1)
                      : '0'}%
                  </p>
                </div>
              </div>

              {/* BKK table */}
              {recap.bkks.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  Belum ada BKK untuk proyek ini
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>No. BKK</TableHead>
                      <TableHead>JO</TableHead>
                      <TableHead>Keperluan</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Diminta</TableHead>
                      <TableHead className="text-right">Digunakan</TableHead>
                      <TableHead className="text-right">Dikembalikan</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recap.bkks.map((bkk) => (
                      <TableRow key={bkk.id}>
                        <TableCell>
                          <Link href={`/disbursements/${bkk.id}`} className="text-primary hover:underline font-medium">
                            {bkk.bkk_number}
                          </Link>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{bkk.jo_number ?? '-'}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{bkk.purpose}</TableCell>
                        <TableCell>
                          <Badge className={getBKKStatusColor(bkk.status)}>
                            {getStatusLabel(bkk.status)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">{formatCurrency(bkk.amount_requested)}</TableCell>
                        <TableCell className="text-right">
                          {bkk.amount_spent != null ? formatCurrency(bkk.amount_spent) : '-'}
                        </TableCell>
                        <TableCell className="text-right text-green-600">
                          {bkk.amount_returned != null && bkk.amount_returned > 0
                            ? formatCurrency(bkk.amount_returned)
                            : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Financial Summary */}
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Ringkasan Keuangan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm uppercase text-muted-foreground">Pendapatan & Biaya</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Revenue</span>
                      <span className="font-medium">{formatCurrency(recap.financials.totalRevenue)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Biaya</span>
                      <span className="font-medium">{formatCurrency(recap.financials.totalCost)}</span>
                    </div>
                    <hr />
                    <div className="flex justify-between">
                      <span className="font-semibold">Profit Kotor</span>
                      <span className={`font-bold ${recap.financials.grossProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(recap.financials.grossProfit)} ({recap.financials.grossMargin.toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm uppercase text-muted-foreground">Arus Kas</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Diterima dari Invoice</span>
                      <span className="font-medium text-green-600">{formatCurrency(recap.financials.totalPaid)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Dicairkan via BKK</span>
                      <span className="font-medium text-red-600">{formatCurrency(recap.financials.totalDisbursed)}</span>
                    </div>
                    <hr />
                    <div className="flex justify-between">
                      <span className="font-semibold">Posisi Kas Bersih</span>
                      <span className={`font-bold ${recap.financials.netCashPosition >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(recap.financials.netCashPosition)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Empty state when no project selected */}
      {!loading && !recap && !selectedProjectId && (
        <div className="text-center py-12 text-muted-foreground">
          Pilih proyek di atas untuk melihat rekap lengkap
        </div>
      )}
    </div>
  )
}
