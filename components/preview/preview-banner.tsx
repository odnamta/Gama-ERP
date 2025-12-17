'use client'

import { Button } from '@/components/ui/button'
import { UserRole } from '@/types/permissions'
import { getRoleDisplayName } from '@/lib/preview-utils'
import { AlertTriangle, X } from 'lucide-react'

interface PreviewBannerProps {
  previewRole: UserRole
  onExit: () => void
}

export function PreviewBanner({ previewRole, onExit }: PreviewBannerProps) {
  return (
    <div className="bg-yellow-100 border-b border-yellow-300 px-4 py-2 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-yellow-700" />
        <span className="text-sm font-medium text-yellow-800">
          PREVIEW MODE: Viewing as {getRoleDisplayName(previewRole)}
        </span>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={onExit}
        className="text-yellow-800 hover:text-yellow-900 hover:bg-yellow-200"
      >
        <X className="h-4 w-4 mr-1" />
        Exit Preview
      </Button>
    </div>
  )
}
