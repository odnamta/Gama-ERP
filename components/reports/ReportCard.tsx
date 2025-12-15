'use client'

import Link from 'next/link'
import {
  TrendingUp,
  Users,
  PieChart,
  BarChart3,
  ClipboardList,
  Clock,
  FileText,
  DollarSign,
  Settings,
  Receipt,
  LucideIcon,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ReportConfig } from '@/types/reports'

// Icon mapping
const iconMap: Record<string, LucideIcon> = {
  TrendingUp,
  Users,
  PieChart,
  BarChart3,
  ClipboardList,
  Clock,
  FileText,
  DollarSign,
  Settings,
  Receipt,
}

interface ReportCardProps {
  report: ReportConfig
}

export function ReportCard({ report }: ReportCardProps) {
  const Icon = iconMap[report.icon] || FileText

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">{report.title}</CardTitle>
              {report.badge && (
                <Badge variant="secondary" className="mt-1 text-xs">
                  {report.badge}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <CardDescription className="mb-4">{report.description}</CardDescription>
        <Button asChild variant="outline" size="sm" className="w-full">
          <Link href={report.href}>
            Generate →
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}
