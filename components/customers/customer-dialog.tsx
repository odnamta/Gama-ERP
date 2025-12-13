'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { CustomerForm, CustomerFormData } from './customer-form'
import { Customer } from '@/types'

interface CustomerDialogProps {
  customer?: Customer | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: CustomerFormData) => Promise<{ error?: string }>
  onSuccess: () => void
}

export function CustomerDialog({
  customer,
  open,
  onOpenChange,
  onSubmit,
  onSuccess,
}: CustomerDialogProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (data: CustomerFormData) => {
    setIsLoading(true)
    const result = await onSubmit(data)
    setIsLoading(false)

    if (!result.error) {
      onOpenChange(false)
      onSuccess()
    }
  }

  const isEditing = !!customer

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Customer' : 'Add Customer'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the customer information below.'
              : 'Fill in the details to add a new customer.'}
          </DialogDescription>
        </DialogHeader>
        <CustomerForm
          customer={customer}
          onSubmit={handleSubmit}
          isLoading={isLoading}
        />
      </DialogContent>
    </Dialog>
  )
}
