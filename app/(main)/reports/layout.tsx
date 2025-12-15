import { Suspense } from 'react'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

export default function ReportsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center text-sm text-muted-foreground">
        <Link href="/dashboard" className="hover:text-foreground">
          Dashboard
        </Link>
        <ChevronRight className="h-4 w-4 mx-2" />
        <span className="text-foreground font-medium">Reports</span>
      </nav>

      <Suspense fallback={<div>Loading...</div>}>
        {children}
      </Suspense>
    </div>
  )
}
