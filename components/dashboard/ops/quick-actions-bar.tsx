'use client'

import Link from 'next/link'
import { FileText, ClipboardList, Receipt, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function QuickActionsBar() {
  return (
    <div className="flex flex-wrap gap-3">
      <Link href="/job-orders">
        <Button variant="outline" className="gap-2">
          <FileText className="h-4 w-4" />
          Create Surat Jalan
        </Button>
      </Link>
      <Link href="/job-orders">
        <Button variant="outline" className="gap-2">
          <ClipboardList className="h-4 w-4" />
          Complete Handover
        </Button>
      </Link>
      <Link href="/job-orders">
        <Button variant="outline" className="gap-2">
          <Receipt className="h-4 w-4" />
          Request BKK
        </Button>
      </Link>
      <Link href="/job-orders">
        <Button variant="outline" className="gap-2">
          <MapPin className="h-4 w-4" />
          Update Delivery
        </Button>
      </Link>
    </div>
  )
}
