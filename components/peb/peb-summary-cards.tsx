'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, Clock, Package, Ship } from 'lucide-react'
import { PEBStatistics } from '@/types/peb'

interface PEBSummaryCardsProps {
  statistics: PEBStatistics
}

export function PEBSummaryCards({ statistics }: PEBSummaryCardsProps) {
  const cards = [
    {
      title: 'Active PEBs',
      value: statistics.active_pebs,
      icon: FileText,
      description: 'Documents in progress',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Pending Approval',
      value: statistics.pending_approval,
      icon: Clock,
      description: 'Awaiting NPE',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
    },
    {
      title: 'Loaded',
      value: statistics.loaded,
      icon: Package,
      description: 'Awaiting departure',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Departed (MTD)',
      value: statistics.departed_mtd,
      icon: Ship,
      description: 'Departed this month',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
            <div className={`rounded-full p-2 ${card.bgColor}`}>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
            <p className="text-xs text-muted-foreground">{card.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
