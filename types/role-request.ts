// =====================================================
// v0.84: Role Request System - Type Definitions
// =====================================================

import { UserRole } from './permissions'

/**
 * Status values for role requests
 * - pending: Request submitted, awaiting admin review
 * - approved: Request approved, role assigned to user
 * - rejected: Request rejected by admin
 */
export type RoleRequestStatus = 'pending' | 'approved' | 'rejected'

/**
 * Role request record from the database
 * Represents a user's request for a specific role in the system
 */
export interface RoleRequest {
  id: string
  user_id: string
  user_email: string
  user_name: string | null
  requested_role: UserRole
  requested_department: string | null
  reason: string | null
  status: RoleRequestStatus
  reviewed_by: string | null
  reviewed_at: string | null
  admin_notes: string | null
  created_at: string
  updated_at: string
}

/**
 * Role request with user information for admin views
 * Used in the pending requests list in User Management
 */
export interface RoleRequestWithUser {
  id: string
  user_id: string
  user_email: string
  user_name: string | null
  requested_role: string
  requested_department: string | null
  reason: string | null
  status: string
  created_at: string
}

/**
 * Form data for submitting a new role request
 */
export interface RoleRequestFormData {
  requestedRole: string
  requestedDepartment: string
  reason?: string
}

/**
 * Result of a role request submission or processing action
 */
export interface RoleRequestActionResult {
  success: boolean
  error?: string
}

/**
 * Department names used in the role request form
 */
export type Department =
  | 'Operations'
  | 'Finance'
  | 'Marketing'
  | 'HR'
  | 'HSE'
  | 'Engineering'
  | 'Agency'
  | 'Customs'
  | 'Administration'
