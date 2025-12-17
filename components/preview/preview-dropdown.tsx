'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { UserRole } from '@/types/permissions'
import { PREVIEW_ROLES, getRoleDisplayName } from '@/lib/preview-utils'
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
  if (!canUsePreview) {
    return null
  }

  return (
    <div className="flex items-center gap-2">
      <Eye className="h-4 w-4 text-muted-foreground" />
      <span className="text-sm text-muted-foreground">Preview as:</span>
      <Select
        value={currentRole}
        onValueChange={(value) => onRoleSelect(value as UserRole)}
      >
        <SelectTrigger className="w-[140px] h-8">
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
