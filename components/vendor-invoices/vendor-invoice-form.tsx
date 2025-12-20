'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EXPENSE_CATEGORIES } from '@/lib/vendor-invoice-utils'
import {
  createVendorInvoice,
  updateVendorInvoice,
  getVendorsForDropdown,
  getJobOrdersForDropdown,
  getPJOsForDropdown,
  getMatchingBKKs,
} from '@/app/(main)/finance/vendor-invoices/actions'
import type { VendorInvoiceFormData, VendorInvoiceWithRelations } from '@/types/vendor-invoices'
import { format } from 'date-fns'
import { CalendarIcon, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'

interface VendorInvoiceFormProps {
  invoice?: VendorInvoiceWithRelations
  onSuccess?: () => void
}

export function VendorInvoiceForm({ invoice, onSuccess }: VendorInvoiceFormProps) {
  const router = useRouter()
  const isEditing = !!invoice

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [vendors, setVendors] = useState<{ id: string; vendor_name: string; vendor_code: string }[]>([])
  const [jobOrders, setJobOrders] = useState<{ id: string; jo_number: string }[]>([])
  const [pjos, setPjos] = useState<{ id: string; pjo_number: string }[]>([])
  const [matchingBkks, setMatchingBkks] = useState<{ id: string; bkk_number: string; amount_spent: number | null; amount_requested: number }[]>([])

  const [formData, setFormData] = useState<VendorInvoiceFormData>({
    vendor_id: invoice?.vendor_id || '',
    invoice_number: invoice?.invoice_number || '',
    invoice_date: invoice?.invoice_date || new Date().toISOString().split('T')[0],
    received_date: invoice?.received_date || new Date().toISOString().split('T')[0],
    due_date: invoice?.due_date || undefined,
    description: invoice?.description || '',
    subtotal: invoice?.subtotal || 0,
    tax_amount: invoice?.tax_amount || 0,
    expense_category: invoice?.expense_category || undefined,
    jo_id: invoice?.jo_id || undefined,
    pjo_id: invoice?.pjo_id || undefined,
    bkk_id: invoice?.bkk_id || undefined,
    notes: invoice?.notes || '',
  })

  const [invoiceDateOpen, setInvoiceDateOpen] = useState(false)
  const [receivedDateOpen, setReceivedDateOpen] = useState(false)
  const [dueDateOpen, setDueDateOpen] = useState(false)

  // Load dropdown data
  useEffect(() => {
    async function loadData() {
      const [vendorsData, josData, pjosData] = await Promise.all([
        getVendorsForDropdown(),
        getJobOrdersForDropdown(),
        getPJOsForDropdown(),
      ])
      setVendors(vendorsData)
      setJobOrders(josData)
      setPjos(pjosData)
    }
    loadData()
  }, [])

  // Load matching BKKs when vendor or JO changes
  useEffect(() => {
    async function loadBkks() {
      if (formData.vendor_id) {
        const bkks = await getMatchingBKKs(formData.vendor_id, formData.jo_id, formData.pjo_id)
        setMatchingBkks(bkks)
      } else {
        setMatchingBkks([])
      }
    }
    loadBkks()
  }, [formData.vendor_id, formData.jo_id, formData.pjo_id])

  const totalAmount = formData.subtotal + formData.tax_amount

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      if (isEditing) {
        const result = await updateVendorInvoice(invoice.id, formData)
        if (result.error) {
          toast({ title: 'Error', description: result.error, variant: 'destructive' })
        } else {
          toast({ title: 'Success', description: 'Vendor invoice updated' })
          onSuccess?.()
          router.push(`/finance/vendor-invoices/${invoice.id}`)
        }
      } else {
        const result = await createVendorInvoice(formData)
        if (result.error) {
          toast({ title: 'Error', description: result.error, variant: 'destructive' })
        } else {
          toast({ title: 'Success', description: 'Vendor invoice created' })
          onSuccess?.()
          router.push(`/finance/vendor-invoices/${result.id}`)
        }
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Vendor Information</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="vendor_id">Vendor *</Label>
            <Select
              value={formData.vendor_id}
              onValueChange={(value) => setFormData({ ...formData, vendor_id: value, bkk_id: undefined })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select vendor" />
              </SelectTrigger>
              <SelectContent>
                {vendors.map((vendor) => (
                  <SelectItem key={vendor.id} value={vendor.id}>
                    {vendor.vendor_name} ({vendor.vendor_code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="invoice_number">Vendor Invoice Number *</Label>
            <Input
              id="invoice_number"
              value={formData.invoice_number}
              onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
              placeholder="e.g., INV-2025-001"
              required
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Invoice Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label>Invoice Date *</Label>
            <Popover open={invoiceDateOpen} onOpenChange={setInvoiceDateOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.invoice_date ? format(new Date(formData.invoice_date), 'dd/MM/yyyy') : 'Select date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={formData.invoice_date ? new Date(formData.invoice_date) : undefined}
                  onSelect={(date) => {
                    setFormData({ ...formData, invoice_date: date?.toISOString().split('T')[0] || '' })
                    setInvoiceDateOpen(false)
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label>Received Date</Label>
            <Popover open={receivedDateOpen} onOpenChange={setReceivedDateOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.received_date ? format(new Date(formData.received_date), 'dd/MM/yyyy') : 'Select date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={formData.received_date ? new Date(formData.received_date) : undefined}
                  onSelect={(date) => {
                    setFormData({ ...formData, received_date: date?.toISOString().split('T')[0] })
                    setReceivedDateOpen(false)
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label>Due Date</Label>
            <Popover open={dueDateOpen} onOpenChange={setDueDateOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn('w-full justify-start text-left font-normal', !formData.due_date && 'text-muted-foreground')}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.due_date ? format(new Date(formData.due_date), 'dd/MM/yyyy') : 'Auto (30 days)'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={formData.due_date ? new Date(formData.due_date) : undefined}
                  onSelect={(date) => {
                    setFormData({ ...formData, due_date: date?.toISOString().split('T')[0] })
                    setDueDateOpen(false)
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of the invoice"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="expense_category">Expense Category</Label>
            <Select
              value={formData.expense_category || ''}
              onValueChange={(value) => setFormData({ ...formData, expense_category: value as typeof formData.expense_category })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {EXPENSE_CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Amount</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="subtotal">Subtotal (IDR) *</Label>
            <Input
              id="subtotal"
              type="number"
              min="0"
              step="1"
              value={formData.subtotal || ''}
              onChange={(e) => setFormData({ ...formData, subtotal: parseFloat(e.target.value) || 0 })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tax_amount">Tax Amount (IDR)</Label>
            <Input
              id="tax_amount"
              type="number"
              min="0"
              step="1"
              value={formData.tax_amount || ''}
              onChange={(e) => setFormData({ ...formData, tax_amount: parseFloat(e.target.value) || 0 })}
            />
          </div>

          <div className="space-y-2">
            <Label>Total Amount</Label>
            <div className="h-10 px-3 py-2 border rounded-md bg-muted font-medium">
              {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(totalAmount)}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Job Reference & BKK Linking</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label>Job Order</Label>
            <Select
              value={formData.jo_id || 'none'}
              onValueChange={(value) => setFormData({ ...formData, jo_id: value === 'none' ? undefined : value, bkk_id: undefined })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select JO (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No JO</SelectItem>
                {jobOrders.map((jo) => (
                  <SelectItem key={jo.id} value={jo.id}>
                    {jo.jo_number}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>PJO (Pre-execution)</Label>
            <Select
              value={formData.pjo_id || 'none'}
              onValueChange={(value) => setFormData({ ...formData, pjo_id: value === 'none' ? undefined : value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select PJO (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No PJO</SelectItem>
                {pjos.map((pjo) => (
                  <SelectItem key={pjo.id} value={pjo.id}>
                    {pjo.pjo_number}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Link to BKK</Label>
            <Select
              value={formData.bkk_id || 'none'}
              onValueChange={(value) => setFormData({ ...formData, bkk_id: value === 'none' ? undefined : value })}
              disabled={!formData.vendor_id}
            >
              <SelectTrigger>
                <SelectValue placeholder={formData.vendor_id ? 'Select BKK' : 'Select vendor first'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No BKK Link</SelectItem>
                {matchingBkks.map((bkk) => (
                  <SelectItem key={bkk.id} value={bkk.id}>
                    {bkk.bkk_number} - {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(bkk.amount_spent ?? bkk.amount_requested)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Additional notes..."
            rows={3}
          />
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEditing ? 'Update Invoice' : 'Create Invoice'}
        </Button>
      </div>
    </form>
  )
}
