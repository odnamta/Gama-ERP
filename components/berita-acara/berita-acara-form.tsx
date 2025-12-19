'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createBeritaAcara, updateBeritaAcara } from '@/app/(main)/job-orders/berita-acara-actions'
import { BeritaAcaraFormData, CargoCondition, BeritaAcaraWithRelations } from '@/types'
import { CARGO_CONDITIONS, CARGO_CONDITION_LABELS } from '@/lib/ba-utils'
import { PhotoUploader } from './photo-uploader'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Save, X } from 'lucide-react'
import { parsePhotoUrls } from '@/types'

interface BeritaAcaraFormProps {
  joId: string
  joNumber: string
  existingBA?: BeritaAcaraWithRelations
}

export function BeritaAcaraForm({ joId, joNumber, existingBA }: BeritaAcaraFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const [formData, setFormData] = useState<Partial<BeritaAcaraFormData>>({
    handover_date: existingBA?.handover_date || new Date().toISOString().split('T')[0],
    location: existingBA?.location || '',
    work_description: existingBA?.work_description || '',
    cargo_condition: (existingBA?.cargo_condition as CargoCondition) || undefined,
    condition_notes: existingBA?.condition_notes || '',
    company_representative: existingBA?.company_representative || '',
    client_representative: existingBA?.client_representative || '',
    photo_urls: existingBA?.photo_urls ? parsePhotoUrls(existingBA.photo_urls) : [],
    notes: existingBA?.notes || '',
  })

  const handleChange = (field: keyof BeritaAcaraFormData, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      let result
      if (existingBA) {
        result = await updateBeritaAcara(existingBA.id, formData)
      } else {
        result = await createBeritaAcara(joId, formData as BeritaAcaraFormData)
      }
      
      if (result.error) {
        toast({
          title: 'Error',
          description: result.error,
          variant: 'destructive',
        })
      } else {
        toast({
          title: 'Success',
          description: existingBA ? 'Berita Acara updated successfully' : 'Berita Acara created successfully',
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
          <CardTitle>
            {existingBA ? 'Edit' : 'Create'} Berita Acara - {joNumber}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Handover Details */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg border-b pb-2">Handover Details</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="handover_date">Handover Date *</Label>
                <Input
                  id="handover_date"
                  type="date"
                  value={formData.handover_date}
                  onChange={(e) => handleChange('handover_date', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location *</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => handleChange('location', e.target.value)}
                  placeholder="Handover location"
                  required
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-6">
          {/* Work Summary */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg border-b pb-2">Work Summary</h3>
            <div className="space-y-2">
              <Label htmlFor="work_description">Work Description *</Label>
              <Textarea
                id="work_description"
                value={formData.work_description}
                onChange={(e) => handleChange('work_description', e.target.value)}
                placeholder="Description of work completed"
                rows={4}
                required
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="cargo_condition">Cargo Condition *</Label>
                <Select
                  value={formData.cargo_condition}
                  onValueChange={(value) => handleChange('cargo_condition', value)}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select condition" />
                  </SelectTrigger>
                  <SelectContent>
                    {CARGO_CONDITIONS.map((condition) => (
                      <SelectItem key={condition} value={condition}>
                        {CARGO_CONDITION_LABELS[condition]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="condition_notes">Condition Notes</Label>
                <Input
                  id="condition_notes"
                  value={formData.condition_notes}
                  onChange={(e) => handleChange('condition_notes', e.target.value)}
                  placeholder="Additional notes about condition"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-6">
          {/* Representatives */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg border-b pb-2">Representatives</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="company_representative">Company Representative *</Label>
                <Input
                  id="company_representative"
                  value={formData.company_representative}
                  onChange={(e) => handleChange('company_representative', e.target.value)}
                  placeholder="Name of company representative"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="client_representative">Client Representative *</Label>
                <Input
                  id="client_representative"
                  value={formData.client_representative}
                  onChange={(e) => handleChange('client_representative', e.target.value)}
                  placeholder="Name of client representative"
                  required
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-6">
          {/* Photos */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg border-b pb-2">Photos</h3>
            <PhotoUploader
              photos={formData.photo_urls || []}
              onPhotosChange={(photos) => handleChange('photo_urls', photos)}
            />
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
              {existingBA ? 'Update' : 'Save as Draft'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  )
}
