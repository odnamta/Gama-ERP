'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  SyncMapping,
  CreateSyncMappingInput,
  UpdateSyncMappingInput,
  FieldMapping,
  FilterCondition,
  SyncDirection,
  SyncFrequency,
  TransformFunction,
  FilterOperator,
  VALID_SYNC_DIRECTIONS,
  VALID_SYNC_FREQUENCIES,
  VALID_TRANSFORM_FUNCTIONS,
  VALID_FILTER_OPERATORS,
} from '@/types/integration'
import {
  createSyncMapping,
  updateSyncMapping,
} from '@/lib/sync-mapping-actions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import {
  Loader2,
  Save,
  ArrowLeft,
  Plus,
  Trash2,
  ArrowRight,
} from 'lucide-react'

interface SyncMappingFormProps {
  connectionId: string
  mapping?: SyncMapping
  mode: 'create' | 'edit'
}

// Common local tables in Gama ERP
const LOCAL_TABLES = [
  'invoices',
  'customers',
  'projects',
  'job_orders',
  'proforma_job_orders',
  'quotations',
  'payments',
  'employees',
  'assets',
  'documents',
]

// Format labels for display
const formatSyncDirection = (dir: SyncDirection): string => {
  const labels: Record<SyncDirection, string> = {
    push: 'Push (Local → Remote)',
    pull: 'Pull (Remote → Local)',
    bidirectional: 'Bidirectional',
  }
  return labels[dir]
}

const formatSyncFrequency = (freq: SyncFrequency): string => {
  const labels: Record<SyncFrequency, string> = {
    realtime: 'Real-time',
    hourly: 'Hourly',
    daily: 'Daily',
    manual: 'Manual',
  }
  return labels[freq]
}

const formatTransform = (transform: TransformFunction): string => {
  const labels: Record<TransformFunction, string> = {
    date_format: 'Date Format (YYYY-MM-DD)',
    currency_format: 'Currency (2 decimals)',
    uppercase: 'Uppercase',
    lowercase: 'Lowercase',
    custom: 'Custom',
  }
  return labels[transform]
}

const formatOperator = (op: FilterOperator): string => {
  const labels: Record<FilterOperator, string> = {
    eq: 'Equals (=)',
    neq: 'Not Equals (≠)',
    gt: 'Greater Than (>)',
    lt: 'Less Than (<)',
    gte: 'Greater or Equal (≥)',
    lte: 'Less or Equal (≤)',
    in: 'In List',
    contains: 'Contains',
  }
  return labels[op]
}


export function SyncMappingForm({ connectionId, mapping, mode }: SyncMappingFormProps) {
  const router = useRouter()
  const { toast } = useToast()

  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form state
  const [localTable, setLocalTable] = useState(mapping?.local_table || '')
  const [remoteEntity, setRemoteEntity] = useState(mapping?.remote_entity || '')
  const [syncDirection, setSyncDirection] = useState<SyncDirection>(mapping?.sync_direction || 'push')
  const [syncFrequency, setSyncFrequency] = useState<SyncFrequency>(mapping?.sync_frequency || 'realtime')
  const [isActive, setIsActive] = useState(mapping?.is_active ?? true)
  const [fieldMappings, setFieldMappings] = useState<FieldMapping[]>(
    mapping?.field_mappings || [{ local_field: '', remote_field: '' }]
  )
  const [filterConditions, setFilterConditions] = useState<FilterCondition[]>(
    mapping?.filter_conditions || []
  )

  // Field mapping handlers
  const addFieldMapping = () => {
    setFieldMappings([...fieldMappings, { local_field: '', remote_field: '' }])
  }

  const removeFieldMapping = (index: number) => {
    if (fieldMappings.length > 1) {
      setFieldMappings(fieldMappings.filter((_, i) => i !== index))
    }
  }

  const updateFieldMapping = (index: number, field: keyof FieldMapping, value: string) => {
    const updated = [...fieldMappings]
    if (field === 'transform') {
      if (value === 'none') {
        delete updated[index].transform
      } else {
        updated[index].transform = value as TransformFunction
      }
    } else {
      updated[index][field] = value
    }
    setFieldMappings(updated)
  }

  // Filter condition handlers
  const addFilterCondition = () => {
    setFilterConditions([...filterConditions, { field: '', operator: 'eq', value: '' }])
  }

  const removeFilterCondition = (index: number) => {
    setFilterConditions(filterConditions.filter((_, i) => i !== index))
  }

  const updateFilterCondition = (index: number, field: keyof FilterCondition, value: string | FilterOperator) => {
    const updated = [...filterConditions]
    if (field === 'operator') {
      updated[index].operator = value as FilterOperator
    } else if (field === 'value') {
      // Try to parse as number or keep as string
      const numValue = Number(value)
      updated[index].value = isNaN(numValue) ? value : numValue
    } else {
      updated[index][field] = value as string
    }
    setFilterConditions(updated)
  }


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Validate field mappings
      const validMappings = fieldMappings.filter(
        fm => fm.local_field.trim() && fm.remote_field.trim()
      )
      if (validMappings.length === 0) {
        toast({
          title: 'Error',
          description: 'At least one field mapping is required',
          variant: 'destructive',
        })
        setIsSubmitting(false)
        return
      }

      // Validate filter conditions (remove empty ones)
      const validFilters = filterConditions.filter(
        fc => fc.field.trim() && fc.value !== ''
      )

      if (mode === 'create') {
        const input: CreateSyncMappingInput = {
          connection_id: connectionId,
          local_table: localTable,
          remote_entity: remoteEntity,
          field_mappings: validMappings,
          sync_direction: syncDirection,
          sync_frequency: syncFrequency,
          filter_conditions: validFilters.length > 0 ? validFilters : null,
          is_active: isActive,
        }

        const result = await createSyncMapping(input)
        if (!result.success) {
          toast({
            title: 'Error',
            description: result.error || 'Failed to create mapping',
            variant: 'destructive',
          })
        } else {
          toast({
            title: 'Success',
            description: 'Sync mapping created successfully',
          })
          router.push(`/settings/integrations/${connectionId}/mappings`)
        }
      } else {
        const input: UpdateSyncMappingInput = {
          local_table: localTable,
          remote_entity: remoteEntity,
          field_mappings: validMappings,
          sync_direction: syncDirection,
          sync_frequency: syncFrequency,
          filter_conditions: validFilters.length > 0 ? validFilters : null,
          is_active: isActive,
        }

        const result = await updateSyncMapping(mapping!.id, input)
        if (!result.success) {
          toast({
            title: 'Error',
            description: result.error || 'Failed to update mapping',
            variant: 'destructive',
          })
        } else {
          toast({
            title: 'Success',
            description: 'Sync mapping updated successfully',
          })
          router.push(`/settings/integrations/${connectionId}/mappings`)
        }
      }
    } finally {
      setIsSubmitting(false)
    }
  }


  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Mapping Configuration</CardTitle>
          <CardDescription>
            Define how local data maps to the external system
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="local_table">Local Table</Label>
              <Select value={localTable} onValueChange={setLocalTable}>
                <SelectTrigger>
                  <SelectValue placeholder="Select table" />
                </SelectTrigger>
                <SelectContent>
                  {LOCAL_TABLES.map((table) => (
                    <SelectItem key={table} value={table}>
                      {table}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="remote_entity">Remote Entity</Label>
              <Input
                id="remote_entity"
                value={remoteEntity}
                onChange={(e) => setRemoteEntity(e.target.value)}
                placeholder="e.g., SalesInvoice, Customer"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sync_direction">Sync Direction</Label>
              <Select value={syncDirection} onValueChange={(v) => setSyncDirection(v as SyncDirection)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VALID_SYNC_DIRECTIONS.map((dir) => (
                    <SelectItem key={dir} value={dir}>
                      {formatSyncDirection(dir)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sync_frequency">Sync Frequency</Label>
              <Select value={syncFrequency} onValueChange={(v) => setSyncFrequency(v as SyncFrequency)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VALID_SYNC_FREQUENCIES.map((freq) => (
                    <SelectItem key={freq} value={freq}>
                      {formatSyncFrequency(freq)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={isActive}
              onCheckedChange={setIsActive}
            />
            <Label htmlFor="is_active">Active</Label>
          </div>
        </CardContent>
      </Card>


      {/* Field Mappings */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Field Mappings</CardTitle>
              <CardDescription>
                Map local fields to remote fields with optional transformations
              </CardDescription>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={addFieldMapping}>
              <Plus className="h-4 w-4 mr-1" />
              Add Field
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {fieldMappings.map((mapping, index) => (
            <div key={index} className="flex items-center gap-2">
              <div className="flex-1">
                <Input
                  value={mapping.local_field}
                  onChange={(e) => updateFieldMapping(index, 'local_field', e.target.value)}
                  placeholder="Local field (e.g., invoice_number)"
                />
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <div className="flex-1">
                <Input
                  value={mapping.remote_field}
                  onChange={(e) => updateFieldMapping(index, 'remote_field', e.target.value)}
                  placeholder="Remote field (e.g., transNo)"
                />
              </div>
              <div className="w-[180px]">
                <Select
                  value={mapping.transform || 'none'}
                  onValueChange={(v) => updateFieldMapping(index, 'transform', v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Transform" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Transform</SelectItem>
                    {VALID_TRANSFORM_FUNCTIONS.map((tf) => (
                      <SelectItem key={tf} value={tf}>
                        {formatTransform(tf)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeFieldMapping(index)}
                disabled={fieldMappings.length === 1}
              >
                <Trash2 className="h-4 w-4 text-muted-foreground" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>


      {/* Filter Conditions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Filter Conditions</CardTitle>
              <CardDescription>
                Only sync records that match these conditions (optional)
              </CardDescription>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={addFilterCondition}>
              <Plus className="h-4 w-4 mr-1" />
              Add Filter
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {filterConditions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No filters configured. All records will be synced.
            </p>
          ) : (
            filterConditions.map((condition, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="flex-1">
                  <Input
                    value={condition.field}
                    onChange={(e) => updateFilterCondition(index, 'field', e.target.value)}
                    placeholder="Field name (e.g., status)"
                  />
                </div>
                <div className="w-[180px]">
                  <Select
                    value={condition.operator}
                    onValueChange={(v) => updateFilterCondition(index, 'operator', v as FilterOperator)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {VALID_FILTER_OPERATORS.map((op) => (
                        <SelectItem key={op} value={op}>
                          {formatOperator(op)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1">
                  <Input
                    value={String(condition.value)}
                    onChange={(e) => updateFilterCondition(index, 'value', e.target.value)}
                    placeholder="Value"
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeFilterCondition(index)}
                >
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Actions */}
      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push(`/settings/integrations/${connectionId}/mappings`)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          {mode === 'create' ? 'Create Mapping' : 'Save Changes'}
        </Button>
      </div>
    </form>
  )
}
