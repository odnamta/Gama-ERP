'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react'

interface PhotoUploaderProps {
  photos: string[]
  onPhotosChange: (photos: string[]) => void
  disabled?: boolean
}

export function PhotoUploader({ photos, onPhotosChange, disabled = false }: PhotoUploaderProps) {
  const { toast } = useToast()
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setIsUploading(true)
    const supabase = createClient()
    const newPhotos: string[] = []

    try {
      for (const file of Array.from(files)) {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          toast({
            title: 'Invalid file type',
            description: `${file.name} is not an image file`,
            variant: 'destructive',
          })
          continue
        }

        // Generate unique filename
        const timestamp = Date.now()
        const ext = file.name.split('.').pop()
        const filename = `ba-photos/${timestamp}-${Math.random().toString(36).substring(7)}.${ext}`

        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
          .from('attachments')
          .upload(filename, file)

        if (error) {
          console.error('Upload error:', error)
          toast({
            title: 'Upload failed',
            description: `Failed to upload ${file.name}`,
            variant: 'destructive',
          })
          continue
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('attachments')
          .getPublicUrl(data.path)

        newPhotos.push(urlData.publicUrl)
      }

      if (newPhotos.length > 0) {
        onPhotosChange([...photos, ...newPhotos])
        toast({
          title: 'Success',
          description: `${newPhotos.length} photo(s) uploaded`,
        })
      }
    } finally {
      setIsUploading(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleRemovePhoto = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index)
    onPhotosChange(newPhotos)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled || isUploading}
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isUploading}
        >
          {isUploading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-1" />
          ) : (
            <Upload className="h-4 w-4 mr-1" />
          )}
          Upload Photos
        </Button>
        <span className="text-sm text-muted-foreground">
          {photos.length} photo(s) attached
        </span>
      </div>

      {photos.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {photos.map((url, index) => (
            <div key={index} className="relative group">
              <div className="aspect-square rounded-lg overflow-hidden border bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt={`Photo ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
              {!disabled && (
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleRemovePhoto(index)}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {photos.length === 0 && (
        <div className="border-2 border-dashed rounded-lg p-8 text-center text-muted-foreground">
          <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>No photos attached</p>
          <p className="text-sm">Click &quot;Upload Photos&quot; to add images</p>
        </div>
      )}
    </div>
  )
}
