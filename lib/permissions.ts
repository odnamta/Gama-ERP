// Permission utilities for Role-Based Access Control

import { UserRole, UserPermissions, UserProfile, FeatureKey } from '@/types/permissions'

/**
 * Default permissions for each role
 * CRITICAL: ops role has can_see_revenue and can_see_profit set to false
 */
export const DEFAULT_PERMISSIONS: Record<UserRole, UserPermissions> = {
  admin: {
    can_see_revenue: true,
    can_see_profit: true,
    can_approve_pjo: true,
    can_manage_invoices: true,
    can_manage_users: true,
    can_create_pjo: true,
    can_fill_costs: true,
  },
  manager: {
    can_see_revenue: true,
    can_see_profit: true,
    can_approve_pjo: true,
    can_manage_invoices: false,
    can_manage_users: false,
    can_create_pjo: true,
    can_fill_costs: true,
  },
  ops: {
    can_see_revenue: false, // CRITICAL: Hidden from ops
    can_see_profit: false, // CRITICAL: Hidden from ops
    can_approve_pjo: false,
    can_manage_invoices: false,
    can_manage_users: false,
    can_create_pjo: false,
    can_fill_costs: true,
  },
  finance: {
    can_see_revenue: true,
    can_see_profit: true,
    can_approve_pjo: false,
    can_manage_invoices: true,
    can_manage_users: false,
    can_create_pjo: true,
    can_fill_costs: false,
  },
  viewer: {
    can_see_revenue: false,
    can_see_profit: false,
    can_approve_pjo: false,
    can_manage_invoices: false,
    can_manage_users: false,
    can_create_pjo: false,
    can_fill_costs: false,
  },
}

/**
 * Get default permissions for a role
 */
export function getDefaultPermissions(role: UserRole): UserPermissions {
  return DEFAULT_PERMISSIONS[role] || DEFAULT_PERMISSIONS.viewer
}

/**
 * Feature access mapping based on permissions
 */
const FEATURE_PERMISSION_MAP: Record<FeatureKey, (profile: UserProfile) => boolean> = {
  'dashboard.full': (p) => p.can_see_revenue && p.can_see_profit,
  'dashboard.ops': (p) => p.can_fill_costs,
  'dashboard.finance': (p) => p.can_manage_invoices || p.can_see_revenue,
  'customers.crud': (p) => p.role === 'admin' || p.role === 'manager',
  'customers.view': (p) => p.role !== 'ops',
  'projects.crud': (p) => p.role === 'admin' || p.role === 'manager',
  'projects.view': () => true,
  'pjo.create': (p) => p.can_create_pjo,
  'pjo.view_revenue': (p) => p.can_see_revenue,
  'pjo.view_costs': (p) => p.can_fill_costs || p.can_see_revenue,
  'pjo.approve': (p) => p.can_approve_pjo,
  'jo.view_full': (p) => p.can_see_revenue,
  'jo.view_costs': (p) => p.can_fill_costs || p.can_see_revenue,
  'jo.fill_costs': (p) => p.can_fill_costs,
  'invoices.crud': (p) => p.can_manage_invoices,
  'invoices.view': (p) => p.can_manage_invoices || p.can_see_revenue,
  'reports.pnl': (p) => p.can_see_revenue && p.can_see_profit,
  'users.manage': (p) => p.can_manage_users,
}

/**
 * Check if a user profile can access a specific feature
 */
export function canAccessFeature(profile: UserProfile | null, feature: FeatureKey): boolean {
  if (!profile) return false
  const checker = FEATURE_PERMISSION_MAP[feature]
  return checker ? checker(profile) : false
}

/**
 * Check if profile has a specific permission
 */
export function hasPermission(
  profile: UserProfile | null,
  permission: keyof UserPermissions
): boolean {
  if (!profile) return false
  return profile[permission] ?? false
}

/**
 * Check if profile has one of the specified roles
 */
export function isRole(profile: UserProfile | null, role: UserRole | UserRole[]): boolean {
  if (!profile) return false
  const roles = Array.isArray(role) ? role : [role]
  return roles.includes(profile.role)
}

/**
 * Get dashboard type for a user based on their role and custom setting
 */
export function getDashboardType(profile: UserProfile | null): string {
  if (!profile) return 'viewer'
  if (profile.custom_dashboard !== 'default') {
    return profile.custom_dashboard
  }
  return profile.role
}

/**
 * Validate that at least one admin exists before removing admin permissions
 */
export function canRemoveAdminPermission(
  currentAdminCount: number,
  targetUserId: string,
  currentUserId: string
): { allowed: boolean; reason?: string } {
  if (currentAdminCount <= 1 && targetUserId === currentUserId) {
    return {
      allowed: false,
      reason: 'Cannot remove admin permissions from the last admin user',
    }
  }
  return { allowed: true }
}
