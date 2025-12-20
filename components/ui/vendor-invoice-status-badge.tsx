'use client'

import { Badge } from '@/components/ui/badge'
import { getStatusDisplayInfo } from '@/lib/vendor-invoice-utils'
import type { VendorInvoiceStatus } from '@/types/vendor-invoices'
import { cn } from '@/lib/utils'

interface VendorInvoiceStatusBadgeProps {
  status: VendorInvoiceStatus
  className?: string
}

export function VendorInvoiceStatusBadge({ status, className }: VendorInvoiceStatusBadgeProps) {
  const { bg, text, label } = getStatusDisplayInfo(status)
  
  return (
    <Badge 
      variant="outline" 
      className={cn(bg, text, 'border-0 font-medium', className)}
    >
      {label}
    </Badge>
  )
}
