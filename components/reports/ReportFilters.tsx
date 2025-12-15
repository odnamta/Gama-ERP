'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { format } from 'date-fns'
import { Calendar as CalendarIcon } from 'lucide-react'
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
import { DateRange, PeriodPreset } from '@/types/reports'
import {
  getDateRangeForPreset,
  validateDateRange,
  getPeriodPresetLabel,
  parseDateRangeFromParams,
} from '@/lib/reports/report-utils'

interface ReportFiltersProps {
  defaultPeriod?: PeriodPreset
  onPeriodChange: (range: DateRange) => void
  showCustomRange?: boolean
}

const PERIOD_PRESETS: PeriodPreset[] = [
  'this-week',
  'this-month',
  'last-month',
  'this-quarter',
  'last-quarter',
  'this-year',
  'custom',
]

export function ReportFilters({
  defaultPeriod = 'this-month',
  onPeriodChange,
  showCustomRange = true,
}: ReportFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [selectedPreset, setSelectedPreset] = useState<PeriodPreset>(defaultPeriod)
  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const fromParams = parseDateRangeFromParams(searchParams)
    return fromParams || getDateRangeForPreset(defaultPeriod)
  })
  const [error, setError] = useState<string | null>(null)

  // Initialize from URL params
  useEffect(() => {
    const fromParams = parseDateRangeFromParams(searchParams)
    if (fromParams) {
      setDateRange(fromParams)
      setSelectedPreset('custom')
    }
  }, [searchParams])

  const handlePresetChange = (preset: PeriodPreset) => {
    setSelectedPreset(preset)
    setError(null)
    
    if (preset !== 'custom') {
      const newRange = getDateRangeForPreset(preset)
      setDateRange(newRange)
      updateUrlAndNotify(newRange)
    }
  }

  const handleStartDateChange = (date: Date | undefined) => {
    if (!date) return
    
    const newRange = { ...dateRange, startDate: date }
    const validation = validateDateRange(newRange)
    
    if (!validation.valid) {
      setError(validation.error || 'Invalid date range')
      return
    }
    
    setError(null)
    setDateRange(newRange)
    setSelectedPreset('custom')
  }

  const handleEndDateChange = (date: Date | undefined) => {
    if (!date) return
    
    const newRange = { ...dateRange, endDate: date }
    const validation = validateDateRange(newRange)
    
    if (!validation.valid) {
      setError(validation.error || 'Invalid date range')
      return
    }
    
    setError(null)
    setDateRange(newRange)
    setSelectedPreset('custom')
  }

  const handleGenerate = () => {
    const validation = validateDateRange(dateRange)
    if (!validation.valid) {
      setError(validation.error || 'Invalid date range')
      return
    }
    
    updateUrlAndNotify(dateRange)
  }

  const updateUrlAndNotify = (range: DateRange) => {
    const start = format(range.startDate, 'yyyy-MM-dd')
    const end = format(range.endDate, 'yyyy-MM-dd')
    
    const params = new URLSearchParams(searchParams.toString())
    params.set('start', start)
    params.set('end', end)
    
    router.push(`?${params.toString()}`, { scroll: false })
    onPeriodChange(range)
  }

  return (
    <div className="flex flex-wrap items-center gap-4 p-4 bg-muted/50 rounded-lg">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Period:</span>
        <Select value={selectedPreset} onValueChange={(v) => handlePresetChange(v as PeriodPreset)}>
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PERIOD_PRESETS.filter(p => showCustomRange || p !== 'custom').map((preset) => (
              <SelectItem key={preset} value={preset}>
                {getPeriodPresetLabel(preset)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {showCustomRange && (
        <>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">From:</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-[140px] justify-start text-left font-normal',
                    !dateRange.startDate && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(dateRange.startDate, 'dd/MM/yyyy')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateRange.startDate}
                  onSelect={handleStartDateChange}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">To:</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-[140px] justify-start text-left font-normal',
                    !dateRange.endDate && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(dateRange.endDate, 'dd/MM/yyyy')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateRange.endDate}
                  onSelect={handleEndDateChange}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </>
      )}

      <Button onClick={handleGenerate} disabled={!!error}>
        Generate
      </Button>

      {error && (
        <span className="text-sm text-destructive">{error}</span>
      )}
    </div>
  )
}
