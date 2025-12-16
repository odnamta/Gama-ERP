'use server'

import { updateUserRole, createPreregisteredUser, toggleUserActive } from '@/lib/permissions-server'
import { UserRole, UserPermissions } from '@/types/permissions'

export async function updateUserRoleAction(
  targetUserId: string,
  newRole: UserRole,
  customPermissions?: Partial<UserPermissions>
): Promise<{ success: boolean; error?: string }> {
  return updateUserRole(targetUserId, newRole, customPermissions)
}

export async function createPreregisteredUserAction(
  email: string,
  fullName: string,
  role: UserRole,
  customPermissions?: Partial<UserPermissions>
): Promise<{ success: boolean; error?: string }> {
  return createPreregisteredUser(email, fullName, role, customPermissions)
}

export async function toggleUserActiveAction(
  targetProfileId: string,
  newActiveStatus: boolean
): Promise<{ success: boolean; error?: string }> {
  return toggleUserActive(targetProfileId, newActiveStatus)
}
