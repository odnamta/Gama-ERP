'use client'

import { ReactNode } from 'react'
import { usePermissions } from '@/components/providers/permission-provider'
import { UserPermissions, UserRole, FeatureKey } from '@/types/permissions'

interface PermissionGateProps {
  /** Check for a specific permission */
  permission?: keyof UserPermissions
  /** Check for a specific role or roles */
  role?: UserRole | UserRole[]
  /** Check for feature access */
  feature?: FeatureKey
  /** Content to show when access is denied */
  fallback?: ReactNode
  /** Content to show when access is granted */
  children: ReactNode
}

/**
 * Conditionally render children based on user permissions
 * 
 * @example
 * // Hide revenue for ops users
 * <PermissionGate permission="can_see_revenue">
 *   <RevenueColumn value={pjo.total_revenue} />
 * </PermissionGate>
 * 
 * @example
 * // Show only for admin
 * <PermissionGate role="admin">
 *   <UserManagementLink />
 * </PermissionGate>
 * 
 * @example
 * // Show for multiple roles
 * <PermissionGate role={['admin', 'manager']}>
 *   <ApproveButton />
 * </PermissionGate>
 * 
 * @example
 * // Check feature access
 * <PermissionGate feature="invoices.crud">
 *   <CreateInvoiceButton />
 * </PermissionGate>
 */
export function PermissionGate({
  permission,
  role,
  feature,
  fallback = null,
  children,
}: PermissionGateProps) {
  const { hasPermission, isRole, canAccess, isLoading } = usePermissions()

  // Don't render anything while loading
  if (isLoading) {
    return null
  }

  // Check permission
  if (permission && !hasPermission(permission)) {
    return <>{fallback}</>
  }

  // Check role
  if (role && !isRole(role)) {
    return <>{fallback}</>
  }

  // Check feature access
  if (feature && !canAccess(feature)) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

/**
 * Show content only for specific roles
 */
export function ShowForRole({
  role,
  children,
  fallback = null,
}: {
  role: UserRole | UserRole[]
  children: ReactNode
  fallback?: ReactNode
}) {
  return (
    <PermissionGate role={role} fallback={fallback}>
      {children}
    </PermissionGate>
  )
}

/**
 * Hide content for specific roles
 */
export function HideForRole({
  role,
  children,
}: {
  role: UserRole | UserRole[]
  children: ReactNode
}) {
  const { isRole, isLoading } = usePermissions()

  if (isLoading) {
    return null
  }

  if (isRole(role)) {
    return null
  }

  return <>{children}</>
}
