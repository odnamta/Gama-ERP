'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { type ManagerPeriodType } from '@/lib/manager-dashboard-utils'

interface ManagerPeriodFilterProps {
  value: ManagerPeriodType
  onChange: (period: ManagerPeriodType) => void
}

const PERIOD_OPTIONS: { value: ManagerPeriodType; label: string }[] = [
  { value: 'this_month', label: 'This Month' },
  { value: 'this_quarter', label: 'This Quarter' },
  { value: 'this_year', label: 'This Year' },
  { value: 'ytd', label: 'Year to Date' },
]

export function ManagerPeriodFilter({ value, onChange }: ManagerPeriodFilterProps) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as ManagerPeriodType)}>
      <SelectTrigger className="w-[160px]">
        <SelectValue placeholder="Select period" />
      </SelectTrigger>
      <SelectContent>
        {PERIOD_OPTIONS.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
