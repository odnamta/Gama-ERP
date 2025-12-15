'use client'

import { usePermissions } from '@/components/providers/permission-provider'
import { ReportCard } from '@/components/reports/ReportCard'
import {
  getReportsByCategory,
  getCategoryDisplayName,
  getCategoryIcon,
} from '@/lib/reports/report-permissions'
import { ReportCategory } from '@/types/reports'
import {
  DollarSign,
  Settings,
  Receipt,
  TrendingUp,
  LucideIcon,
} from 'lucide-react'

const categoryIcons: Record<ReportCategory, LucideIcon> = {
  financial: DollarSign,
  operational: Settings,
  ar: Receipt,
  sales: TrendingUp,
}

export default function ReportsPage() {
  const { profile } = usePermissions()
  
  if (!profile) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Loading...
      </div>
    )
  }

  const reportsByCategory = getReportsByCategory(profile.role)
  const categories: ReportCategory[] = ['financial', 'operational', 'ar', 'sales']
  
  // Filter out empty categories
  const nonEmptyCategories = categories.filter(
    (cat) => reportsByCategory[cat].length > 0
  )

  if (nonEmptyCategories.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Reports</h1>
          <p className="text-muted-foreground">Generate business reports and analytics</p>
        </div>
        <div className="text-center py-12 text-muted-foreground">
          You don&apos;t have access to any reports. Contact your administrator for access.
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Reports</h1>
        <p className="text-muted-foreground">Generate business reports and analytics</p>
      </div>

      {nonEmptyCategories.map((category) => {
        const reports = reportsByCategory[category]
        const Icon = categoryIcons[category]
        
        return (
          <div key={category} className="space-y-4">
            <div className="flex items-center gap-2">
              <Icon className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold">
                {getCategoryDisplayName(category)}
              </h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {reports.map((report) => (
                <ReportCard key={report.id} report={report} />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
