'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'
import { ProjectWithCustomer, ProformaJobOrder } from '@/types'
import { createPJO, updatePJO } from '@/app/(main)/proforma-jo/actions'
import type { PJOFormData } from '@/app/(main)/proforma-jo/actions'
import { useToast } from '@/hooks/use-toast'
import { calculateProfit, calculateMargin, formatIDR } from '@/lib/pjo-utils'
import { PlacesAutocomplete, LocationData } from '@/components/ui/places-autocomplete'

export const pjoSchema = z.object({
  project_id: z.string().min(1, 'Please select a project'),
  jo_date: z.string().min(1, 'Date is required'),
  commodity: z.string().optional(),
  quantity: z.number().optional(),
  quantity_unit: z.string().optional(),
  pol: z.string().optional(),
  pod: z.string().optional(),
  pol_place_id: z.string().optional(),
  pol_lat: z.number().optional(),
  pol_lng: z.number().optional(),
  pod_place_id: z.string().optional(),
  pod_lat: z.number().optional(),
  pod_lng: z.number().optional(),
  etd: z.string().optional(),
  eta: z.string().optional(),
  carrier_type: z.string().optional(),
  total_revenue: z.number().min(0, 'Revenue must be non-negative'),
  total_expenses: z.number().min(0, 'Expenses must be non-negative'),
  notes: z.string().optional(),
}).refine((data) => {
  // Validate ETA is on or after ETD
  if (data.etd && data.eta) {
    return new Date(data.eta) >= new Date(data.etd)
  }
  return true
}, {
  message: 'ETA must be on or after ETD',
  path: ['eta']
})

export type PJOFormValues = z.infer<typeof pjoSchema>

const quantityUnitOptions = [
  { value: 'TRIP', label: 'TRIP' },
  { value: 'TRIPS', label: 'TRIPS' },
  { value: 'LOT', label: 'LOT' },
  { value: 'CASE', label: 'CASE' },
  { value: 'UNIT', label: 'UNIT' },
  { value: 'UNITS', label: 'UNITS' },
  { value: 'SET', label: 'SET' },
  { value: 'PACKAGE', label: 'PACKAGE' },
  { value: 'CONTAINER', label: 'CONTAINER' },
  { value: 'TON', label: 'TON' },
  { value: 'KG', label: 'KG' },
  { value: 'CBM', label: 'CBM' },
]

const carrierTypeOptions = [
  { value: 'FUSO', label: 'FUSO' },
  { value: 'TRAILER 20FT', label: 'TRAILER 20FT' },
  { value: 'TRAILER 40FT', label: 'TRAILER 40FT' },
  { value: 'TRAILER 45FT', label: 'TRAILER 45FT' },
  { value: 'LOWBED', label: 'LOWBED' },
  { value: 'FLATBED', label: 'FLATBED' },
  { value: 'WINGBOX', label: 'WINGBOX' },
  { value: 'BOX TRUCK', label: 'BOX TRUCK' },
  { value: 'TANKER', label: 'TANKER' },
  { value: 'DUMP TRUCK', label: 'DUMP TRUCK' },
  { value: 'SELF LOADER', label: 'SELF LOADER' },
  { value: 'CRANE TRUCK', label: 'CRANE TRUCK' },
]

interface PJOFormProps {
  projects: ProjectWithCustomer[]
  pjo?: ProformaJobOrder | null
  preselectedProjectId?: string
  mode: 'create' | 'edit'
}

export function PJOForm({ projects, pjo, preselectedProjectId, mode }: PJOFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const today = new Date().toISOString().split('T')[0]

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    trigger,
    formState: { errors },
  } = useForm<PJOFormValues>({
    resolver: zodResolver(pjoSchema),
    defaultValues: {
      project_id: pjo?.project_id || preselectedProjectId || '',
      jo_date: pjo?.jo_date || today,
      commodity: pjo?.commodity || '',
      quantity: pjo?.quantity || 0,
      quantity_unit: pjo?.quantity_unit || '',
      pol: pjo?.pol || '',
      pod: pjo?.pod || '',
      pol_place_id: pjo?.pol_place_id || '',
      pol_lat: pjo?.pol_lat || undefined,
      pol_lng: pjo?.pol_lng || undefined,
      pod_place_id: pjo?.pod_place_id || '',
      pod_lat: pjo?.pod_lat || undefined,
      pod_lng: pjo?.pod_lng || undefined,
      etd: pjo?.etd || '',
      eta: pjo?.eta || '',
      carrier_type: pjo?.carrier_type || '',
      total_revenue: pjo?.total_revenue || 0,
      total_expenses: pjo?.total_expenses || 0,
      notes: pjo?.notes || '',
    },
  })

  const selectedProjectId = watch('project_id')
  const selectedQuantityUnit = watch('quantity_unit')
  const selectedCarrierType = watch('carrier_type')
  const totalRevenue = watch('total_revenue') || 0
  const totalExpenses = watch('total_expenses') || 0
  const polValue = watch('pol') || ''
  const podValue = watch('pod') || ''

  const profit = calculateProfit(totalRevenue, totalExpenses)
  const margin = calculateMargin(totalRevenue, totalExpenses)

  const selectedProject = projects.find((p) => p.id === selectedProjectId)

  function handlePOLChange(value: string, locationData?: LocationData) {
    setValue('pol', value)
    if (locationData) {
      setValue('pol_place_id', locationData.placeId)
      setValue('pol_lat', locationData.lat)
      setValue('pol_lng', locationData.lng)
    } else {
      setValue('pol_place_id', undefined)
      setValue('pol_lat', undefined)
      setValue('pol_lng', undefined)
    }
  }

  function handlePODChange(value: string, locationData?: LocationData) {
    setValue('pod', value)
    if (locationData) {
      setValue('pod_place_id', locationData.placeId)
      setValue('pod_lat', locationData.lat)
      setValue('pod_lng', locationData.lng)
    } else {
      setValue('pod_place_id', undefined)
      setValue('pod_lat', undefined)
      setValue('pod_lng', undefined)
    }
  }

  async function onSubmit(data: PJOFormValues) {
    const formData: PJOFormData = {
      ...data,
      quantity: data.quantity ?? 0,
      total_revenue: data.total_revenue ?? 0,
      total_expenses: data.total_expenses ?? 0,
    }
    setIsLoading(true)
    try {
      if (mode === 'create') {
        const result = await createPJO(formData)
        if (result.error) {
          toast({ title: 'Error', description: result.error, variant: 'destructive' })
        } else {
          toast({ title: 'Success', description: 'PJO created successfully' })
          router.push(`/proforma-jo/${result.id}`)
        }
      } else if (pjo) {
        const result = await updatePJO(pjo.id, formData)
        if (result.error) {
          toast({ title: 'Error', description: result.error, variant: 'destructive' })
        } else {
          toast({ title: 'Success', description: 'PJO updated successfully' })
          router.push(`/proforma-jo/${pjo.id}`)
        }
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Section 1: Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="jo_date">Date *</Label>
            <Input id="jo_date" type="date" {...register('jo_date')} disabled={isLoading} />
            {errors.jo_date && (
              <p className="text-sm text-destructive">{errors.jo_date.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="project_id">Project *</Label>
            <Select
              value={selectedProjectId}
              onValueChange={(value) => setValue('project_id', value)}
              disabled={isLoading || mode === 'edit'}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name} ({project.customers?.name})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.project_id && (
              <p className="text-sm text-destructive">{errors.project_id.message}</p>
            )}
            {selectedProject && (
              <p className="text-sm text-muted-foreground">
                Customer: {selectedProject.customers?.name}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="commodity">Commodity</Label>
            <Input
              id="commodity"
              {...register('commodity')}
              placeholder="What is being transported"
              disabled={isLoading}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                step="0.01"
                {...register('quantity', { valueAsNumber: true })}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantity_unit">Unit</Label>
              <Select
                value={selectedQuantityUnit}
                onValueChange={(value) => setValue('quantity_unit', value)}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent>
                  {quantityUnitOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 2: Logistics */}
      <Card>
        <CardHeader>
          <CardTitle>Logistics</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="pol">Point of Loading (POL)</Label>
            <PlacesAutocomplete
              id="pol"
              value={polValue}
              onChange={handlePOLChange}
              placeholder="Origin location"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="pod">Point of Destination (POD)</Label>
            <PlacesAutocomplete
              id="pod"
              value={podValue}
              onChange={handlePODChange}
              placeholder="Delivery location"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="etd">ETD (Estimated Departure)</Label>
            <Input 
              id="etd" 
              type="date" 
              {...register('etd', {
                onChange: () => {
                  // Re-validate ETA when ETD changes
                  trigger('eta')
                }
              })} 
              disabled={isLoading} 
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="eta">ETA (Estimated Arrival)</Label>
            <Input id="eta" type="date" {...register('eta')} disabled={isLoading} />
            {errors.eta && (
              <p className="text-sm text-destructive">{errors.eta.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="carrier_type">Carrier Type</Label>
            <Select
              value={selectedCarrierType}
              onValueChange={(value) => setValue('carrier_type', value)}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select carrier type" />
              </SelectTrigger>
              <SelectContent>
                {carrierTypeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Section 3: Financials */}
      <Card>
        <CardHeader>
          <CardTitle>Financials</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="total_revenue">Total Revenue (IDR) *</Label>
            <Input
              id="total_revenue"
              type="number"
              step="1"
              {...register('total_revenue', { valueAsNumber: true })}
              disabled={isLoading}
            />
            {errors.total_revenue && (
              <p className="text-sm text-destructive">{errors.total_revenue.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="total_expenses">Total Expenses (IDR) *</Label>
            <Input
              id="total_expenses"
              type="number"
              step="1"
              {...register('total_expenses', { valueAsNumber: true })}
              disabled={isLoading}
            />
            {errors.total_expenses && (
              <p className="text-sm text-destructive">{errors.total_expenses.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Profit</Label>
            <div className={`text-lg font-semibold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatIDR(profit)}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Margin</Label>
            <div className={`text-lg font-semibold ${margin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {margin.toFixed(2)}%
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 4: Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            {...register('notes')}
            placeholder="Additional notes..."
            rows={4}
            disabled={isLoading}
          />
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : mode === 'edit' ? (
            'Update PJO'
          ) : (
            'Create PJO'
          )}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={isLoading}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
