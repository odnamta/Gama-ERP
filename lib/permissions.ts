// Permission utilities for Role-Based Access Control - RBAC v0.9.11
// Re-exported from @gama/erp-core with GIS-specific configuration

import { configureOwnerEmail } from '@gama/erp-core/auth/permissions'

// Configure the owner email for GIS-ERP
configureOwnerEmail('dioatmando@gama-group.co')

// Re-export everything from core
export {
  // Configuration
  configureOwnerEmail,
  getOwnerEmail,
  isOwnerEmail,
  // Role group constants
  ADMIN_ROLES,
  EXECUTIVE_ROLES,
  FINANCE_ADMIN_ROLES,
  ALL_MANAGER_ROLES,
  DEPARTMENT_STAFF_ROLES,
  DEPARTMENT_ROLES,
  getDepartmentRoles,
  // Default permissions
  DEFAULT_PERMISSIONS,
  getDefaultPermissions,
  getInheritedRoles,
  // Feature access
  canAccessFeature,
  hasPermission,
  isRole,
  getDashboardType,
  getAssignableRoles,
  canModifyUser,
  isPendingUser,
  // HR helpers
  canViewEmployees,
  canCreateEmployee,
  canEditEmployee,
  canViewEmployeeSalary,
  canEditEmployeeSalary,
  // Asset helpers
  canViewAssets,
  canCreateAsset,
  canEditAsset,
  canChangeAssetStatus,
  canViewAssetFinancials,
  canDisposeAsset,
  canUploadAssetDocuments,
  // Customs helpers
  canViewPEB,
  canCreatePEB,
  canEditPEB,
  canDeletePEB,
  canViewPIB,
  canCreatePIB,
  canEditPIB,
  canDeletePIB,
  canViewPIBDuties,
  canUpdatePIBStatus,
  // Legacy helpers
  getUserRole,
  getUserId,
} from '@gama/erp-core/auth/permissions'

// GIS-specific: export OWNER_EMAIL as a constant for backward compatibility
export const OWNER_EMAIL = 'dioatmando@gama-group.co'
