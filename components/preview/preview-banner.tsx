'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { UserRole } from '@/types/permissions'
import { getRoleDisplayName, PREVIEW_ROLES } from '@/lib/preview-utils'
import { getDashboardPath } from '@/lib/navigation'
import { AlertTriangle, X } from 'lucide-react'

interface PreviewBannerProps {
  previewRole: UserRole
  onExit: () => void
  onRoleChange: (role: UserRole) => void
}

export function PreviewBanner({ previewRole, onExit, onRoleChange }: PreviewBannerProps) {
  const router = useRouter()

  const handleRoleChange = (value: string) => {
    const selectedRole = value as UserRole
    
    // Update the preview state
    onRoleChange(selectedRole)
    
    // Navigate to the appropriate dashboard for the selected role
    const dashboardPath = getDashboardPath(selectedRole)
    router.push(dashboardPath)
  }

  return (
    <div className="bg-yellow-100 border-b border-yellow-300 px-4 py-2 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-yellow-700" />
        <span className="text-sm font-medium text-yellow-800">
          PREVIEW MODE: Viewing as
        </span>
        <Select value={previewRole} onValueChange={handleRoleChange}>
          <SelectTrigger className="w-[160px] h-7 bg-yellow-50 border-yellow-300 text-yellow-800 text-sm hover:bg-yellow-100 focus:ring-yellow-500">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PREVIEW_ROLES.map((role) => (
              <SelectItem key={role} value={role}>
                {getRoleDisplayName(role)}
                {role === 'owner' && ' (actual)'}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
