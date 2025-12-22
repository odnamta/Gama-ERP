'use client'

import * as React from 'react'
import { Check, ChevronsUpDown, Wrench, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { MaintenanceType } from '@/types/maintenance'

interface MaintenanceTypeSelectProps {
  types: MaintenanceType[]
  value: string
  onValueChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
}

export function MaintenanceTypeSelect({
  types,
  value,
  onValueChange,
  placeholder = 'Select maintenance type...',
  disabled = false,
}: MaintenanceTypeSelectProps) {
  const [open, setOpen] = React.useState(false)

  const selectedType = types.find((type) => type.id === value)
  const scheduledTypes = types.filter((type) => type.isScheduled)
  const unscheduledTypes = types.filter((type) => !type.isScheduled)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
        >
          {selectedType ? (
            <span className="flex items-center gap-2">
              {selectedType.isScheduled ? (
                <Calendar className="h-4 w-4 text-blue-500" />
              ) : (
                <Wrench className="h-4 w-4 text-orange-500" />
              )}
              {selectedType.typeName}
            </span>
          ) : (
            placeholder
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0">
        <Command>
          <CommandInput placeholder="Search maintenance type..." />
          <CommandList>
            <CommandEmpty>No maintenance type found.</CommandEmpty>
            {scheduledTypes.length > 0 && (
              <CommandGroup heading="Scheduled Maintenance">
                {scheduledTypes.map((type) => (
                  <CommandItem
                    key={type.id}
                    value={type.typeName}
                    onSelect={() => {
                      onValueChange(type.id)
                      setOpen(false)
                    }}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        value === type.id ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    <Calendar className="mr-2 h-4 w-4 text-blue-500" />
                    <div className="flex flex-col">
                      <span>{type.typeName}</span>
                      {type.description && (
                        <span className="text-xs text-muted-foreground">{type.description}</span>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {unscheduledTypes.length > 0 && (
              <CommandGroup heading="Unscheduled / Reactive">
                {unscheduledTypes.map((type) => (
                  <CommandItem
                    key={type.id}
                    value={type.typeName}
                    onSelect={() => {
                      onValueChange(type.id)
                      setOpen(false)
                    }}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        value === type.id ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    <Wrench className="mr-2 h-4 w-4 text-orange-500" />
                    <div className="flex flex-col">
                      <span>{type.typeName}</span>
                      {type.description && (
                        <span className="text-xs text-muted-foreground">{type.description}</span>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
