'use client'

import { useRouter } from 'next/navigation'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { UserRole } from '@/types/permissions'
import { PREVIEW_ROLES, getRoleDisplayName } from '@/lib/preview-utils'
import { getDashboardPath } from '@/lib/navigation'
import { Eye } from 'lucide-react'

interface PreviewDropdownProps {
  currentRole: UserRole
  onRoleSelect: (role: UserRole | null) => void
  canUsePreview: boolean
}

export function PreviewDropdown({
  currentRole,
  onRoleSelect,
  canUsePreview,
}: PreviewDropdownProps) {
  const router = useRouter()

  if (!canUsePreview) {
    return null
  }

  const handleRoleSelect = (value: string) => {
    const selectedRole = value as UserRole
    
    // Update the preview state
    onRoleSelect(selectedRole)
    
    // Navigate to the appropriate dashboard for the selected role
    const dashboardPath = getDashboardPath(selectedRole)
    router.push(dashboardPath)
  }

  return (
    <div className="flex items-center gap-2">
      <Eye className="h-4 w-4 text-muted-foreground" />
      <span className="text-sm text-muted-foreground">Preview as:</span>
      <Select
        value={currentRole}
        onValueChange={handleRoleSelect}
      >
        <SelectTrigger className="w-[160px] h-8">
          <SelectValue placeholder="Select role" />
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
  )
}
