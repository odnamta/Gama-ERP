'use client'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { formatIDR } from '@/lib/pjo-utils'
import { Trash2 } from 'lucide-react'

/**
 * Logistics-specific invoice line item types with default descriptions.
 */
export const LOGISTICS_LINE_ITEM_TYPES = [
  { value: 'freight', label: 'Freight', description: 'Biaya angkut / freight charges', unit: 'TRIP' },
  { value: 'thc', label: 'THC', description: 'Terminal Handling Charge', unit: 'UNIT' },
  { value: 'do_fee', label: 'DO Fee', description: 'Delivery Order fee', unit: 'SET' },
  { value: 'demurrage', label: 'Demurrage', description: 'Biaya demurrage', unit: 'HARI' },
  { value: 'storage', label: 'Storage', description: 'Biaya penyimpanan / storage charges', unit: 'HARI' },
  { value: 'handling', label: 'Handling', description: 'Biaya handling / bongkar muat', unit: 'LOT' },
  { value: 'documentation', label: 'Dokumentasi', description: 'Biaya dokumentasi & administrasi', unit: 'SET' },
  { value: 'other', label: 'Lainnya', description: '', unit: 'LOT' },
] as const

export type LogisticsLineItemType = typeof LOGISTICS_LINE_ITEM_TYPES[number]['value']

interface LineItem {
  description: string
  quantity: number
  unit: string
  unit_price: number
  line_item_type?: string
}

interface InvoiceLineItemRowProps {
  index: number
  item: LineItem
  onChange: (index: number, field: keyof LineItem, value: string | number) => void
  onRemove: (index: number) => void
  canRemove: boolean
}

export function InvoiceLineItemRow({
  index,
  item,
  onChange,
  onRemove,
  canRemove,
}: InvoiceLineItemRowProps) {
  const subtotal = item.quantity * item.unit_price

  function handleTypeChange(type: string) {
    onChange(index, 'line_item_type' as keyof LineItem, type)
    // Auto-fill description and unit from type template
    const template = LOGISTICS_LINE_ITEM_TYPES.find(t => t.value === type)
    if (template && template.description) {
      if (!item.description || item.description === '') {
        onChange(index, 'description', template.description)
      }
      if (template.unit) {
        onChange(index, 'unit', template.unit)
      }
    }
  }

  return (
    <tr className="border-b">
      <td className="py-2 px-2 text-center text-muted-foreground">{index + 1}</td>
      <td className="py-2 px-2">
        <div className="flex flex-col gap-1">
          <Select
            value={item.line_item_type || ''}
            onValueChange={handleTypeChange}
          >
            <SelectTrigger className="w-full h-8 text-xs">
              <SelectValue placeholder="Tipe (opsional)" />
            </SelectTrigger>
            <SelectContent>
              {LOGISTICS_LINE_ITEM_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            value={item.description}
            onChange={(e) => onChange(index, 'description', e.target.value)}
            placeholder="Description"
            className="min-w-[200px]"
          />
        </div>
      </td>
      <td className="py-2 px-2">
        <Input
          type="number"
          value={item.quantity}
          onChange={(e) => onChange(index, 'quantity', parseFloat(e.target.value) || 0)}
          min={0.01}
          step={0.01}
          className="w-24 text-right"
        />
      </td>
      <td className="py-2 px-2">
        <Input
          value={item.unit}
          onChange={(e) => onChange(index, 'unit', e.target.value)}
          placeholder="Unit"
          className="w-20"
        />
      </td>
      <td className="py-2 px-2">
        <Input
          type="number"
          value={item.unit_price}
          onChange={(e) => onChange(index, 'unit_price', parseFloat(e.target.value) || 0)}
          min={0}
          step={1000}
          className="w-36 text-right"
        />
      </td>
      <td className="py-2 px-2 text-right font-medium">
        {formatIDR(subtotal)}
      </td>
      <td className="py-2 px-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onRemove(index)}
          disabled={!canRemove}
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </td>
    </tr>
  )
}
