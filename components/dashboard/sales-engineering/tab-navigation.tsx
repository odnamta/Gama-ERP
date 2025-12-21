'use client'

import { BarChart3, Wrench, LayoutGrid } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { DashboardTab } from '@/lib/sales-engineering-dashboard-utils'

interface TabNavigationProps {
  activeTab: DashboardTab
  onTabChange: (tab: DashboardTab) => void
}

const tabs: { id: DashboardTab; label: string; icon: React.ReactNode }[] = [
  { id: 'sales', label: 'Sales Pipeline', icon: <BarChart3 className="h-4 w-4" /> },
  { id: 'engineering', label: 'Engineering', icon: <Wrench className="h-4 w-4" /> },
  { id: 'combined', label: 'Combined View', icon: <LayoutGrid className="h-4 w-4" /> },
]

export function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
  return (
    <div className="border-b border-gray-200">
      <nav className="-mb-px flex space-x-8" aria-label="Tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              'group inline-flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors',
              activeTab === tab.id
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  )
}
