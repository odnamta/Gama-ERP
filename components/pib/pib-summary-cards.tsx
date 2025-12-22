'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, Clock, Truck, CheckCircle } from 'lucide-react'
import { PIBStatistics } from '@/types/pib'

interface PIBSummaryCardsProps {
  statistics: PIBStatistics
}

export function PIBSummaryCards({ statistics }: PIBSummaryCardsProps) {
  const cards = [
    {
      title: 'Active PIBs',
      value: statistics.active_pibs,
      icon: FileText,
      description: 'Documents in progress',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Pending Clearance',
      value: statistics.pending_clearance,
      icon: Clock,
      description: 'Awaiting customs',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
    },
    {
      title: 'In Transit',
      value: statistics.in_transit,
      icon: Truck,
      description: 'Duties paid, awaiting release',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Released (MTD)',
      value: statistics.released_mtd,
      icon: CheckCircle,
      description: 'Released this month',
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
