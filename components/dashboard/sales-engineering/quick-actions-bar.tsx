'use client'

import { useRouter } from 'next/navigation'
import { Plus, ClipboardList, Mail, BarChart3 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function QuickActionsBar() {
  const router = useRouter()

  const actions = [
    {
      label: 'New Quotation',
      icon: Plus,
      href: '/quotations/new',
      variant: 'default' as const,
    },
    {
      label: 'Start Assessment',
      icon: ClipboardList,
      href: '/quotations?tab=engineering',
      variant: 'outline' as const,
    },
    {
      label: 'Follow Up',
      icon: Mail,
      href: '/quotations?filter=pending_followup',
      variant: 'outline' as const,
    },
    {
      label: 'Pipeline Report',
      icon: BarChart3,
      href: '/reports/sales-pipeline',
      variant: 'outline' as const,
    },
  ]

  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((action) => (
        <Button
          key={action.label}
          variant={action.variant}
          size="sm"
          onClick={() => router.push(action.href)}
          className="gap-2"
        >
          <action.icon className="h-4 w-4" />
          {action.label}
        </Button>
      ))}
    </div>
  )
}
