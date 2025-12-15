'use server'

import { updateUserRole } from '@/lib/permissions-server'
import { UserRole, UserPermissions } from '@/types/permissions'

export async function updateUserRoleAction(
  targetUserId: string,
  newRole: UserRole,
  customPermissions?: Partial<UserPermissions>
): Promise<{ success: boolean; error?: string }> {
  return updateUserRole(targetUserId, newRole, customPermissions)
}
