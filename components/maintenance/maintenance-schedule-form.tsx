'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MaintenanceTypeSelect } from './maintenance-type-select'
import { 
  MaintenanceType, 
  MaintenanceScheduleInput,
  MaintenanceTriggerType,
  MaintenanceSchedule
} from '@/types/maintenance'
import { Asset } from '@/types/assets'
import { validateMaintenanceScheduleInput } from '@/lib/maintenance-utils'
import { createMaintenanceSchedule, updateMaintenanceSchedule } from '@/lib/maintenance-actions'
import { Loader2 } from 'lucide-react'

interface MaintenanceScheduleFormProps {
  assets: Asset[]
  maintenanceTypes: MaintenanceType[]
  schedule?: MaintenanceSchedule
  onCancel: () => void
  onSuccess?: () => void
}

export function MaintenanceScheduleForm({
  assets,
  maintenanceTypes,
  schedule,
  onCancel,
  onSuccess,
}: MaintenanceScheduleFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isEditing = !!schedule

  const [formData, setFormData] = useState<MaintenanceScheduleInput>({
    assetId: schedule?.assetId || '',
    maintenanceTypeId: schedule?.maintenanceTypeId || '',
    triggerType: schedule?.triggerType || 'km',
    triggerValue: schedule?.triggerValue,
    triggerDate: schedule?.triggerDate,
    nextDueKm: schedule?.nextDueKm,
    nextDueDate: schedule?.nextDueDate,
    warningKm: schedule?.warningKm || 1000,
    warningDays: schedule?.warningDays || 14,
  })

  const updateField = <K extends keyof MaintenanceScheduleInput>(
    field: K,
    value: MaintenanceScheduleInput[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleTriggerTypeChange = (type: MaintenanceTriggerType) => {
    updateField('triggerType', type)
    // Reset related fields
    if (type === 'km' || type === 'hours') {
      updateField('triggerDate', undefined)
      updateField('nextDueDate', undefined)
    } else {
      updateField('triggerValue', undefined)
      updateField('nextDueKm', undefined)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const validation = validateMaintenanceScheduleInput(formData)
    if (!validation.valid) {
      setError(validation.errors.join(', '))
      return
    }

    setIsSubmitting(true)
    try {
      if (isEditing && schedule) {
        const result = await updateMaintenanceSchedule(schedule.id, formData)
        if (result.success) {
          if (onSuccess) {
            onSuccess()
          } else {
            router.push('/equipment/maintenance/schedules')
            router.refresh()
          }
        } else {
          setError(result.error || 'Failed to update schedule')
        }
      } else {
        const result = await createMaintenanceSchedule(formData)
        if (result.success) {
          if (onSuccess) {
            onSuccess()
          } else {
            router.push('/equipment/maintenance/schedules')
            router.refresh()
          }
        } else {
          setError(result.error || 'Failed to create schedule')
        }
      }
    } catch (err) {
      setError('An unexpected error occurred')
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectedType = maintenanceTypes.find(t => t.id === formData.maintenanceTypeId)

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Asset & Maintenance Type</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="assetId">Asset *</Label>
            <Select
              value={formData.assetId}
              onValueChange={(value) => updateField('assetId', value)}
              disabled={isEditing}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select asset..." />
              </SelectTrigger>
              <SelectContent>
                {assets.map((asset) => (
                  <SelectItem key={asset.id} value={asset.id}>
                    {asset.asset_code} - {asset.asset_name}
                    {asset.registration_number && ` (${asset.registration_number})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Maintenance Type *</Label>
            <MaintenanceTypeSelect
              types={maintenanceTypes}
              value={formData.maintenanceTypeId}
              onValueChange={(value) => {
                updateField('maintenanceTypeId', value)
                // Auto-fill defaults from type
                const type = maintenanceTypes.find(t => t.id === value)
                if (type) {
                  if (type.defaultIntervalKm) {
                    updateField('triggerType', 'km')
                    updateField('triggerValue', type.defaultIntervalKm)
                  } else if (type.defaultIntervalDays) {
                    updateField('triggerType', 'days')
                    updateField('triggerValue', type.defaultIntervalDays)
                  }
                }
              }}
              disabled={isEditing}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Schedule Trigger</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Trigger Type *</Label>
            <Select
              value={formData.triggerType}
              onValueChange={(value) => handleTriggerTypeChange(value as MaintenanceTriggerType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="km">Kilometers</SelectItem>
                <SelectItem value="hours">Operating Hours</SelectItem>
                <SelectItem value="days">Days Interval</SelectItem>
                <SelectItem value="date">Specific Date</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(formData.triggerType === 'km' || formData.triggerType === 'hours' || formData.triggerType === 'days') && (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="triggerValue">
                  Interval ({formData.triggerType === 'km' ? 'km' : formData.triggerType === 'hours' ? 'hours' : 'days'}) *
                </Label>
                <Input
                  id="triggerValue"
                  type="number"
                  min="1"
                  value={formData.triggerValue || ''}
                  onChange={(e) => updateField('triggerValue', parseInt(e.target.value) || undefined)}
                  placeholder={`e.g., ${formData.triggerType === 'km' ? '5000' : formData.triggerType === 'hours' ? '250' : '90'}`}
                />
                {selectedType && (
                  <p className="text-xs text-muted-foreground">
                    Default: {formData.triggerType === 'km' ? selectedType.defaultIntervalKm : 
                              formData.triggerType === 'hours' ? selectedType.defaultIntervalHours :
                              selectedType.defaultIntervalDays} {formData.triggerType}
                  </p>
                )}
              </div>

              {formData.triggerType === 'km' && (
                <div className="space-y-2">
                  <Label htmlFor="nextDueKm">Next Due at (km)</Label>
                  <Input
                    id="nextDueKm"
                    type="number"
                    min="0"
                    value={formData.nextDueKm || ''}
                    onChange={(e) => updateField('nextDueKm', parseInt(e.target.value) || undefined)}
                    placeholder="Current km + interval"
                  />
                </div>
              )}

              {(formData.triggerType === 'days') && (
                <div className="space-y-2">
                  <Label htmlFor="nextDueDate">Next Due Date</Label>
                  <Input
                    id="nextDueDate"
                    type="date"
                    value={formData.nextDueDate || ''}
                    onChange={(e) => updateField('nextDueDate', e.target.value || undefined)}
                  />
                </div>
              )}
            </div>
          )}

          {formData.triggerType === 'date' && (
            <div className="space-y-2">
              <Label htmlFor="triggerDate">Due Date *</Label>
              <Input
                id="triggerDate"
                type="date"
                value={formData.triggerDate || ''}
                onChange={(e) => {
                  updateField('triggerDate', e.target.value || undefined)
                  updateField('nextDueDate', e.target.value || undefined)
                }}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Warning Thresholds</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          {(formData.triggerType === 'km' || formData.triggerType === 'hours') && (
            <div className="space-y-2">
              <Label htmlFor="warningKm">Warning Threshold (km before due)</Label>
              <Input
                id="warningKm"
                type="number"
                min="0"
                value={formData.warningKm || ''}
                onChange={(e) => updateField('warningKm', parseInt(e.target.value) || undefined)}
                placeholder="1000"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="warningDays">Warning Threshold (days before due)</Label>
            <Input
              id="warningDays"
              type="number"
              min="0"
              value={formData.warningDays || ''}
              onChange={(e) => updateField('warningDays', parseInt(e.target.value) || undefined)}
              placeholder="14"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEditing ? 'Update Schedule' : 'Create Schedule'}
        </Button>
      </div>
    </form>
  )
}
