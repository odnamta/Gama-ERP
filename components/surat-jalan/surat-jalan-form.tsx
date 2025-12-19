'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createSuratJalan } from '@/app/(main)/job-orders/surat-jalan-actions'
import { SuratJalanFormData } from '@/types'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Save, X } from 'lucide-react'

interface SuratJalanFormProps {
  joId: string
  joNumber: string
  defaultValues?: Partial<SuratJalanFormData>
}

export function SuratJalanForm({ joId, joNumber, defaultValues }: SuratJalanFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const [formData, setFormData] = useState<Partial<SuratJalanFormData>>({
    delivery_date: new Date().toISOString().split('T')[0],
    vehicle_plate: '',
    driver_name: '',
    driver_phone: '',
    origin: defaultValues?.origin || '',
    destination: defaultValues?.destination || '',
    cargo_description: defaultValues?.cargo_description || '',
    quantity: defaultValues?.quantity,
    quantity_unit: defaultValues?.quantity_unit || '',
    weight_kg: undefined,
    sender_name: '',
    notes: '',
  })

  const handleChange = (field: keyof SuratJalanFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const result = await createSuratJalan(joId, formData as SuratJalanFormData)
      if (result.error) {
        toast({
          title: 'Error',
          description: result.error,
          variant: 'destructive',
        })
      } else {
        toast({
          title: 'Success',
          description: 'Surat Jalan created successfully',
        })
        router.push(`/job-orders/${joId}`)
        router.refresh()
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create Surat Jalan - {joNumber}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">{/* Delivery Details */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg border-b pb-2">Delivery Details</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="delivery_date">Delivery Date *</Label>
                <Input
                  id="delivery_date"
                  type="date"
                  value={formData.delivery_date}
                  onChange={(e) => handleChange('delivery_date', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vehicle_plate">Vehicle Plate *</Label>
                <Input
                  id="vehicle_plate"
                  value={formData.vehicle_plate}
                  onChange={(e) => handleChange('vehicle_plate', e.target.value)}
                  placeholder="e.g., L 1234 AB"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="driver_name">Driver Name *</Label>
                <Input
                  id="driver_name"
                  value={formData.driver_name}
                  onChange={(e) => handleChange('driver_name', e.target.value)}
                  placeholder="Driver's full name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="driver_phone">Driver Phone</Label>
                <Input
                  id="driver_phone"
                  value={formData.driver_phone}
                  onChange={(e) => handleChange('driver_phone', e.target.value)}
                  placeholder="+62..."
                />
              </div>
            </div>
          </div></CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-6">{/* Route */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg border-b pb-2">Route</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="origin">Origin *</Label>
                <Input
                  id="origin"
                  value={formData.origin}
                  onChange={(e) => handleChange('origin', e.target.value)}
                  placeholder="Point of Loading"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="destination">Destination *</Label>
                <Input
                  id="destination"
                  value={formData.destination}
                  onChange={(e) => handleChange('destination', e.target.value)}
                  placeholder="Point of Destination"
                  required
                />
              </div>
            </div>
          </div></CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-6">{/* Cargo */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg border-b pb-2">Cargo</h3>
            <div className="space-y-2">
              <Label htmlFor="cargo_description">Cargo Description *</Label>
              <Textarea
                id="cargo_description"
                value={formData.cargo_description}
                onChange={(e) => handleChange('cargo_description', e.target.value)}
                placeholder="Description of cargo being transported"
                required
              />
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  step="0.01"
                  value={formData.quantity || ''}
                  onChange={(e) => handleChange('quantity', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantity_unit">Unit</Label>
                <Input
                  id="quantity_unit"
                  value={formData.quantity_unit}
                  onChange={(e) => handleChange('quantity_unit', e.target.value)}
                  placeholder="e.g., TRIP, TON, PCS"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="weight_kg">Weight (kg)</Label>
                <Input
                  id="weight_kg"
                  type="number"
                  step="0.01"
                  value={formData.weight_kg || ''}
                  onChange={(e) => handleChange('weight_kg', parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>
          </div></CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-6">{/* Sender */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg border-b pb-2">Sender</h3>
            <div className="space-y-2">
              <Label htmlFor="sender_name">Sender Name</Label>
              <Input
                id="sender_name"
                value={formData.sender_name}
                onChange={(e) => handleChange('sender_name', e.target.value)}
                placeholder="Name of person handing over cargo"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg border-b pb-2">Notes</h3>
            <Textarea
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="Additional notes..."
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isSubmitting}
            >
              <X className="h-4 w-4 mr-1" />
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <Save className="h-4 w-4 mr-1" />
              )}
              Issue Surat Jalan
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  )
}
