'use client'

import { useState, useCallback } from 'react'
import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface ReportSearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function ReportSearchInput({
  value,
  onChange,
  placeholder = 'Search reports...',
}: ReportSearchInputProps) {
  const [localValue, setLocalValue] = useState(value)

  // Debounced onChange
  const handleChange = useCallback(
    (newValue: string) => {
      setLocalValue(newValue)
      // Simple debounce using setTimeout
      const timeoutId = setTimeout(() => {
        onChange(newValue)
      }, 300)
      return () => clearTimeout(timeoutId)
    },
    [onChange]
  )

  const handleClear = () => {
    setLocalValue('')
    onChange('')
  }

  return (
    <div className="relative w-full max-w-sm">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        type="text"
        value={localValue}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        className="pl-9 pr-9"
      />
      {localValue && (
        <Button
          variant="ghost"
          size="sm"
          className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
          onClick={handleClear}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Clear search</span>
        </Button>
      )}
    </div>
  )
}
