'use server'

import { createClient } from '@/lib/supabase/server'
import { ReportConfigurationDB, ReportCategoryDB } from '@/types/reports'

/**
 * Server-side: Get reports grouped by category for a specific role
 */
export async function getReportsByCategoryServer(
  role: string
): Promise<Record<ReportCategoryDB, ReportConfigurationDB[]>> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('report_configurations')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true })

  const grouped: Record<ReportCategoryDB, ReportConfigurationDB[]> = {
    operations: [],
    finance: [],
    sales: [],
    executive: [],
  }

  if (error || !data) return grouped

  const reports = (data as unknown as ReportConfigurationDB[]).filter(
    (report) => report.allowed_roles?.includes(role) ?? false
  )

  for (const report of reports) {
    const category = report.report_category as ReportCategoryDB
    if (grouped[category]) {
      grouped[category].push(report)
    }
  }

  return grouped
}
