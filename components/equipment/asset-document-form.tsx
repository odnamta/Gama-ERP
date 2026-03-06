'use client'

import { useState, useRef } from 'react'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Loader2, Upload, X } from 'lucide-react'
import { AssetDocumentFormData, AssetDocumentType } from '@/types/assets'
import { ASSET_DOCUMENT_TYPES } from '@/lib/asset-utils'

const ALLOWED_FILE_TYPES = ['application/pdf', 'image/jpeg', 'image/png']
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

interface AssetDocumentFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: AssetDocumentFormData, file?: File) => Promise<void>
}

export function AssetDocumentForm({
  open,
  onOpenChange,
  onSubmit,
}: AssetDocumentFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [formData, setFormData] = useState<AssetDocumentFormData>({
    document_type: 'other',
    document_name: '',
    issue_date: '',
    expiry_date: '',
    reminder_days: 30,
    notes: '',
  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null)
    const file = e.target.files?.[0]
    if (!file) return

    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      setFileError('Format file harus PDF, JPEG, atau PNG')
      return
    }
    if (file.size > MAX_FILE_SIZE) {
      setFileError('Ukuran file maksimal 10MB')
      return
    }
    setSelectedFile(file)
  }

  const clearFile = () => {
    setSelectedFile(null)
    setFileError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.document_name.trim()) return

    setIsSubmitting(true)
    try {
      await onSubmit(formData, selectedFile || undefined)
      // Reset form
      setFormData({
        document_type: 'other',
        document_name: '',
        issue_date: '',
        expiry_date: '',
        reminder_days: 30,
        notes: '',
      })
      clearFile()
      onOpenChange(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add Document</DialogTitle>
            <DialogDescription>
              Add a document record for this asset. You can track expiry dates and set reminders.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="document_type">Document Type</Label>
              <Select
                value={formData.document_type}
                onValueChange={(value) =>
                  setFormData({ ...formData, document_type: value as AssetDocumentType })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {ASSET_DOCUMENT_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="document_name">Document Name *</Label>
              <Input
                id="document_name"
                value={formData.document_name}
                onChange={(e) =>
                  setFormData({ ...formData, document_name: e.target.value })
                }
                placeholder="e.g., STNK 2024"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="issue_date">Issue Date</Label>
                <Input
                  id="issue_date"
                  type="date"
                  value={formData.issue_date || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, issue_date: e.target.value })
                  }
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="expiry_date">Expiry Date</Label>
                <Input
                  id="expiry_date"
                  type="date"
                  value={formData.expiry_date || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, expiry_date: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="reminder_days">Reminder Days Before Expiry</Label>
              <Input
                id="reminder_days"
                type="number"
                min={1}
                max={365}
                value={formData.reminder_days || 30}
                onChange={(e) =>
                  setFormData({ ...formData, reminder_days: parseInt(e.target.value) || 30 })
                }
              />
              <p className="text-xs text-muted-foreground">
                You&apos;ll be notified this many days before the document expires
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes || ''}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                placeholder="Additional notes about this document..."
                rows={3}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="file">Upload File</Label>
              {selectedFile ? (
                <div className="flex items-center gap-2 rounded-md border p-2 text-sm">
                  <Upload className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="truncate flex-1">{selectedFile.name}</span>
                  <span className="text-muted-foreground shrink-0">
                    {(selectedFile.size / 1024 / 1024).toFixed(1)} MB
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 shrink-0"
                    onClick={clearFile}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <Input
                  id="file"
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                />
              )}
              {fileError && (
                <p className="text-xs text-destructive">{fileError}</p>
              )}
              <p className="text-xs text-muted-foreground">
                PDF, JPEG, atau PNG. Maksimal 10MB.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !formData.document_name.trim()}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Document
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
