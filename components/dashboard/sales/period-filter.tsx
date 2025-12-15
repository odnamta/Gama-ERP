'use client'

import { useState } from 'react'
import { CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { type PeriodType } from '@/lib/sales-dashboard-utils'

interface PeriodFilterProps {
  value: PeriodType
  onChange: (period: PeriodType, customStart?: Date, customEnd?: Date) => void
  customStart?: Date
  customEnd?: Date
}

const periodOptions: { value: PeriodType; label: string }[] = [
  { value: 'this_week', label: 'This Week' },
  { value: 'this_month', label: 'This Month' },
  { value: 'this_quarter', label: 'This Quarter' },
  { value: 'this_year', label: 'This Year' },
  { value: 'custom', label: 'Custom Range' },
]

export function PeriodFilter({ value, onChange, customStart, customEnd }: PeriodFilterProps) {
  const [startDate, setStartDate] = useState<Date | undefined>(customStart)
  const [endDate, setEndDate] = useState<Date | undefined>(customEnd)

  const handlePeriodChange = (newPeriod: PeriodType) => {
    if (newPeriod === 'custom') {
      onChange(newPeriod, startDate, endDate)
    } else {
      onChange(newPeriod)
    }
  }

  const handleStartDateChange = (date: Date | undefined) => {
    setStartDate(date)
    if (date && endDate) {
      onChange('custom', date, endDate)
    }
  }

  const handleEndDateChange = (date: Date | undefined) => {
    setEndDate(date)
    if (startDate && date) {
      onChange('custom', startDate, date)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">Period:</span>
      <Select value={value} onValueChange={(v) => handlePeriodChange(v as PeriodType)}>
        <SelectTrigger className="w-[140px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {periodOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {value === 'custom' && (
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-[130px] justify-start text-left font-normal',
                  !startDate && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {startDate ? format(startDate, 'dd/MM/yyyy') : 'Start'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={handleStartDateChange}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <span className="text-muted-foreground">to</span>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-[130px] justify-start text-left font-normal',
                  !endDate && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {endDate ? format(endDate, 'dd/MM/yyyy') : 'End'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={endDate}
                onSelect={handleEndDateChange}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      )}
    </div>
  )
}
