import { redirect } from 'next/navigation'
import { getCurrentUserProfile } from '@/lib/auth-utils'
import { getReportsByCategory } from '@/lib/reports/report-permissions'
import { getReportsByCategoryServer } from './actions'
import { ReportsPageClient } from './reports-page-client'

export default async function ReportsPage() {
  const profile = await getCurrentUserProfile()

  if (!profile?.role) {
    redirect('/login')
  }

  // Fetch DB reports server-side (was previously fetched client-side after hydration)
  const dbReports = await getReportsByCategoryServer(profile.role)
  const hasDbReports = Object.values(dbReports).some((arr) => arr.length > 0)

  // Fall back to static config if no DB reports
  const staticReportsByCategory = !hasDbReports
    ? getReportsByCategory(profile.role)
    : null

  return (
    <ReportsPageClient
      dbReports={hasDbReports ? dbReports : null}
      staticReports={staticReportsByCategory}
      userId={profile.user_id ?? undefined}
    />
  )
}
