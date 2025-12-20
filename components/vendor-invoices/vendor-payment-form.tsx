'use client'

import { useState } from 'react'
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { VENDOR_PAYMENT_METHODS, formatVendorInvoiceCurrency } from '@/lib/vendor-invoice-utils'
import { recordVendorPayment } from '@/app/(main)/finance/vendor-invoices/actions'
import type { VendorPaymentFormData, VendorPaymentMethod } from '@/types/vendor-invoices'
import { format } from 'date-fns'
import { CalendarIcon, Loader2 } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface VendorPaymentFormProps {
  vendorInvoiceId: string
  amountDue: number
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function VendorPaymentForm({
  vendorInvoiceId,
  amountDue,
  open,
  onOpenChange,
  onSuccess,
}: VendorPaymentFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [dateOpen, setDateOpen] = useState(false)

  const [formData, setFormData] = useState<Omit<VendorPaymentFormData, 'vendor_invoice_id'>>({
    amount: amountDue,
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: 'transfer',
    reference_number: '',
    bank_name: '',
    bank_account: '',
    notes: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const result = await recordVendorPayment({
        vendor_invoice_id: vendorInvoiceId,
        ...formData,
      })

      if (result.error) {
        toast({ title: 'Error', description: result.error, variant: 'destructive' })
      } else {
        toast({ title: 'Success', description: 'Payment recorded successfully' })
        onOpenChange(false)
        onSuccess?.()
        // Reset form
        setFormData({
          amount: amountDue,
          payment_date: new Date().toISOString().split('T')[0],
          payment_method: 'transfer',
          reference_number: '',
          bank_name: '',
          bank_account: '',
          notes: '',
        })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-3 bg-muted rounded-lg text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Amount Due:</span>
              <span className="font-medium">{formatVendorInvoiceCurrency(amountDue)}</span>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="amount">Payment Amount (IDR) *</Label>
              <Input
                id="amount"
                type="number"
                min="0"
                max={amountDue}
                step="1"
                value={formData.amount || ''}
                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Payment Date *</Label>
              <Popover open={dateOpen} onOpenChange={setDateOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.payment_date ? format(new Date(formData.payment_date), 'dd/MM/yyyy') : 'Select date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.payment_date ? new Date(formData.payment_date) : undefined}
                    onSelect={(date) => {
                      setFormData({ ...formData, payment_date: date?.toISOString().split('T')[0] || '' })
                      setDateOpen(false)
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment_method">Payment Method *</Label>
            <Select
              value={formData.payment_method}
              onValueChange={(value) => setFormData({ ...formData, payment_method: value as VendorPaymentMethod })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select method" />
              </SelectTrigger>
              <SelectContent>
                {VENDOR_PAYMENT_METHODS.map((method) => (
                  <SelectItem key={method.value} value={method.value}>
                    {method.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reference_number">Reference Number</Label>
            <Input
              id="reference_number"
              value={formData.reference_number}
              onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })}
              placeholder="Transfer/check reference number"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="bank_name">Bank Name</Label>
              <Input
                id="bank_name"
                value={formData.bank_name}
                onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                placeholder="e.g., BCA, Mandiri"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bank_account">Bank Account</Label>
              <Input
                id="bank_account"
                value={formData.bank_account}
                onChange={(e) => setFormData({ ...formData, bank_account: e.target.value })}
                placeholder="Account number"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes..."
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Record Payment
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
