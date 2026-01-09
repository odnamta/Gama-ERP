// =====================================================
// v0.35: Role-Based Homepage Routing Types
// =====================================================

import { UserRole } from './permissions'

/**
 * Supported redirect conditions for conditional routing
 */
export type RedirectCondition =
  | 'has_pending_approvals'
  | 'has_urgent_items'
  | 'first_login_today'

/**
 * A conditional redirect rule that can override the default homepage
 */
export interface RedirectRule {
  condition: RedirectCondition
  route: string
}

/**
 * Role homepage configuration from the database
 */
export interface RoleHomepage {
  id: string
  role: string
  homepage_route: string
  fallback_route: string
  redirect_rules: RedirectRule[]
  created_at: string
}

/**
 * Source of the resolved homepage route
 */
export type HomepageSource = 'custom' | 'redirect_rule' | 'role_default' | 'fallback'

/**
 * Result of homepage resolution
 */
export interface HomepageResolutionResult {
  route: string
  source: HomepageSource
  matchedCondition?: RedirectCondition
}

/**
 * Default role-to-homepage mappings (fallback when DB unavailable)
 */
export const DEFAULT_ROLE_HOMEPAGES: Record<UserRole, string> = {
  owner: '/dashboard/executive',
  director: '/dashboard/executive',
  marketing_manager: '/dashboard/marketing-manager',
  finance_manager: '/dashboard/finance-manager',
  operations_manager: '/dashboard/operations-manager',
  sysadmin: '/dashboard/sysadmin',
  administration: '/dashboard/admin',
  finance: '/dashboard/finance',
  marketing: '/dashboard/marketing',
  ops: '/dashboard/operation',
  engineer: '/dashboard/engineering',
  hr: '/dashboard/hr',
  hse: '/dashboard/hse',
  agency: '/dashboard/agency',
  customs: '/dashboard/customs',
}

/**
 * Default fallback route when no configuration matches
 */
export const DEFAULT_FALLBACK_ROUTE = '/dashboard'
