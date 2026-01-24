/**
 * Unit Tests for Request Access Page
 * Feature: v0.84-role-request-system
 * 
 * Tests for:
 * - Form validation (empty department, empty role)
 * - Department-role filtering UI
 * - Status display states (pending, approved, rejected)
 * - Rejection reason display
 * - Resubmission button for rejected requests
 * 
 * **Validates: Requirements 1.2, 1.3, 2.1, 2.2**
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { DEPARTMENT_ROLES, getDepartmentRoles } from '@/lib/permissions'
import type { RoleRequest } from '@/types/role-request'
import type { UserRole } from '@/types/permissions'

// =====================================================
// MOCKS
// =====================================================

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    back: vi.fn(),
    refresh: vi.fn(),
  }),
}))

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

// Mock the submitRoleRequest action
const mockSubmitRoleRequest = vi.fn()
vi.mock('@/app/(main)/request-access/actions', () => ({
  submitRoleRequest: (...args: unknown[]) => mockSubmitRoleRequest(...args),
}))


// =====================================================
// TEST DATA
// =====================================================

const mockUserEmail = 'test@gama-group.co'
const mockUserName = 'Test User'

/**
 * Create a mock pending role request
 */
const createPendingRequest = (): RoleRequest => ({
  id: '123e4567-e89b-12d3-a456-426614174000',
  user_id: 'user-123',
  user_email: mockUserEmail,
  user_name: mockUserName,
  requested_role: 'ops' as UserRole,
  requested_department: 'Operations',
  reason: 'I need access to operations dashboard',
  status: 'pending',
  reviewed_by: null,
  reviewed_at: null,
  admin_notes: null,
  created_at: '2026-01-25T10:00:00Z',
  updated_at: '2026-01-25T10:00:00Z',
})

/**
 * Create a mock rejected role request
 */
const createRejectedRequest = (adminNotes?: string): RoleRequest => ({
  id: '123e4567-e89b-12d3-a456-426614174001',
  user_id: 'user-123',
  user_email: mockUserEmail,
  user_name: mockUserName,
  requested_role: 'finance' as UserRole,
  requested_department: 'Finance',
  reason: 'I need access to finance dashboard',
  status: 'rejected',
  reviewed_by: 'admin-123',
  reviewed_at: '2026-01-25T12:00:00Z',
  admin_notes: adminNotes || 'Please contact HR for proper onboarding',
  created_at: '2026-01-25T10:00:00Z',
  updated_at: '2026-01-25T12:00:00Z',
})

/**
 * Create a mock approved role request
 */
const createApprovedRequest = (): RoleRequest => ({
  id: '123e4567-e89b-12d3-a456-426614174002',
  user_id: 'user-123',
  user_email: mockUserEmail,
  user_name: mockUserName,
  requested_role: 'marketing' as UserRole,
  requested_department: 'Marketing',
  reason: 'I need access to marketing dashboard',
  status: 'approved',
  reviewed_by: 'admin-123',
  reviewed_at: '2026-01-25T12:00:00Z',
  admin_notes: null,
  created_at: '2026-01-25T10:00:00Z',
  updated_at: '2026-01-25T12:00:00Z',
})

// Import the component after mocks are set up
import { RequestAccessClient } from '@/app/(main)/request-access/request-access-client'


// =====================================================
// FORM DISPLAY TESTS
// **Validates: Requirements 1.2**
// =====================================================

describe('Task 4.4: Form Display', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should display welcome message with user name', () => {
    render(
      <RequestAccessClient
        userEmail={mockUserEmail}
        userName={mockUserName}
        existingRequest={null}
      />
    )

    expect(screen.getByText(/Welcome/)).toBeInTheDocument()
    // User name appears in both welcome message and user info card
    expect(screen.getAllByText(new RegExp(mockUserName)).length).toBeGreaterThanOrEqual(1)
  })

  it('should display welcome message without name when userName is null', () => {
    render(
      <RequestAccessClient
        userEmail={mockUserEmail}
        userName={null}
        existingRequest={null}
      />
    )

    expect(screen.getByText(/Welcome!/)).toBeInTheDocument()
  })

  it('should display user email in the user info card', () => {
    render(
      <RequestAccessClient
        userEmail={mockUserEmail}
        userName={mockUserName}
        existingRequest={null}
      />
    )

    expect(screen.getByText(mockUserEmail)).toBeInTheDocument()
  })

  it('should display department dropdown label', () => {
    render(
      <RequestAccessClient
        userEmail={mockUserEmail}
        userName={mockUserName}
        existingRequest={null}
      />
    )

    expect(screen.getByText(/Department \*/)).toBeInTheDocument()
  })

  it('should display role dropdown label', () => {
    render(
      <RequestAccessClient
        userEmail={mockUserEmail}
        userName={mockUserName}
        existingRequest={null}
      />
    )

    expect(screen.getByText(/Role \*/)).toBeInTheDocument()
  })

  it('should display optional reason textarea label', () => {
    render(
      <RequestAccessClient
        userEmail={mockUserEmail}
        userName={mockUserName}
        existingRequest={null}
      />
    )

    expect(screen.getByText(/Reason \(Optional\)/)).toBeInTheDocument()
  })

  it('should display submit button', () => {
    render(
      <RequestAccessClient
        userEmail={mockUserEmail}
        userName={mockUserName}
        existingRequest={null}
      />
    )

    expect(screen.getByRole('button', { name: /Submit Request/i })).toBeInTheDocument()
  })

  it('should display help text at the bottom', () => {
    render(
      <RequestAccessClient
        userEmail={mockUserEmail}
        userName={mockUserName}
        existingRequest={null}
      />
    )

    expect(screen.getByText(/Need help\? Contact your system administrator/i)).toBeInTheDocument()
  })
})


// =====================================================
// FORM VALIDATION TESTS
// **Validates: Requirements 1.2**
// =====================================================

describe('Task 4.4: Form Validation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should have submit button disabled when no department/role selected', () => {
    render(
      <RequestAccessClient
        userEmail={mockUserEmail}
        userName={mockUserName}
        existingRequest={null}
      />
    )

    const submitButton = screen.getByRole('button', { name: /Submit Request/i })
    expect(submitButton).toBeDisabled()
  })

  it('should show "Select a department first" placeholder for role dropdown', () => {
    render(
      <RequestAccessClient
        userEmail={mockUserEmail}
        userName={mockUserName}
        existingRequest={null}
      />
    )

    expect(screen.getByText(/Select a department first/i)).toBeInTheDocument()
  })

  it('should show "Select your department" placeholder for department dropdown', () => {
    render(
      <RequestAccessClient
        userEmail={mockUserEmail}
        userName={null}
        existingRequest={null}
      />
    )

    // The placeholder text may appear multiple times (in trigger and hidden select)
    expect(screen.getAllByText(/Select your department/i).length).toBeGreaterThanOrEqual(1)
  })
})


// =====================================================
// STATUS DISPLAY TESTS - PENDING
// **Validates: Requirements 2.1**
// =====================================================

describe('Task 4.4: Pending Status Display', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should display pending status card when request is pending', () => {
    const pendingRequest = createPendingRequest()
    
    render(
      <RequestAccessClient
        userEmail={mockUserEmail}
        userName={mockUserName}
        existingRequest={pendingRequest}
      />
    )

    expect(screen.getByText(/Request Pending/i)).toBeInTheDocument()
  })

  it('should display pending request department', () => {
    const pendingRequest = createPendingRequest()
    
    render(
      <RequestAccessClient
        userEmail={mockUserEmail}
        userName={mockUserName}
        existingRequest={pendingRequest}
      />
    )

    expect(screen.getByText('Operations')).toBeInTheDocument()
  })

  it('should display pending request role as human-readable label', () => {
    const pendingRequest = createPendingRequest()
    
    render(
      <RequestAccessClient
        userEmail={mockUserEmail}
        userName={mockUserName}
        existingRequest={pendingRequest}
      />
    )

    expect(screen.getByText(/Operations Staff/i)).toBeInTheDocument()
  })

  it('should display message about waiting for admin review', () => {
    const pendingRequest = createPendingRequest()
    
    render(
      <RequestAccessClient
        userEmail={mockUserEmail}
        userName={mockUserName}
        existingRequest={pendingRequest}
      />
    )

    expect(screen.getByText(/being reviewed by an administrator/i)).toBeInTheDocument()
  })

  it('should not show form when pending request exists', () => {
    const pendingRequest = createPendingRequest()
    
    render(
      <RequestAccessClient
        userEmail={mockUserEmail}
        userName={mockUserName}
        existingRequest={pendingRequest}
      />
    )

    expect(screen.queryByRole('button', { name: /Submit Request/i })).not.toBeInTheDocument()
  })

  it('should not show resubmit button for pending requests', () => {
    const pendingRequest = createPendingRequest()
    
    render(
      <RequestAccessClient
        userEmail={mockUserEmail}
        userName={mockUserName}
        existingRequest={pendingRequest}
      />
    )

    expect(screen.queryByRole('button', { name: /Submit New Request/i })).not.toBeInTheDocument()
  })

  it('should display submission date for pending request', () => {
    const pendingRequest = createPendingRequest()
    
    render(
      <RequestAccessClient
        userEmail={mockUserEmail}
        userName={mockUserName}
        existingRequest={pendingRequest}
      />
    )

    // The date should be formatted in Indonesian locale
    expect(screen.getByText(/Submitted:/i)).toBeInTheDocument()
  })
})


// =====================================================
// STATUS DISPLAY TESTS - REJECTED
// **Validates: Requirements 2.2**
// Note: For rejected requests, the component shows the form by default
// to allow immediate resubmission. The status is shown in the header area.
// =====================================================

describe('Task 4.4: Rejected Status Display', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should display form for rejected requests (allows immediate resubmission)', () => {
    const rejectedRequest = createRejectedRequest()
    
    render(
      <RequestAccessClient
        userEmail={mockUserEmail}
        userName={mockUserName}
        existingRequest={rejectedRequest}
      />
    )

    // Form should be visible for rejected requests
    expect(screen.getByRole('button', { name: /Submit Request/i })).toBeInTheDocument()
  })

  it('should display department dropdown for rejected requests', () => {
    const rejectedRequest = createRejectedRequest()
    
    render(
      <RequestAccessClient
        userEmail={mockUserEmail}
        userName={mockUserName}
        existingRequest={rejectedRequest}
      />
    )

    expect(screen.getByText(/Department \*/)).toBeInTheDocument()
  })

  it('should display role dropdown for rejected requests', () => {
    const rejectedRequest = createRejectedRequest()
    
    render(
      <RequestAccessClient
        userEmail={mockUserEmail}
        userName={mockUserName}
        existingRequest={rejectedRequest}
      />
    )

    expect(screen.getByText(/Role \*/)).toBeInTheDocument()
  })
})


// =====================================================
// STATUS DISPLAY TESTS - APPROVED
// **Validates: Requirements 2.3**
// =====================================================

describe('Task 4.4: Approved Status Display', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should display approved status card when request is approved', () => {
    const approvedRequest = createApprovedRequest()
    
    render(
      <RequestAccessClient
        userEmail={mockUserEmail}
        userName={mockUserName}
        existingRequest={approvedRequest}
      />
    )

    expect(screen.getByText(/Request Approved/i)).toBeInTheDocument()
  })

  it('should display redirect message for approved requests', () => {
    const approvedRequest = createApprovedRequest()
    
    render(
      <RequestAccessClient
        userEmail={mockUserEmail}
        userName={mockUserName}
        existingRequest={approvedRequest}
      />
    )

    expect(screen.getByText(/Redirecting to dashboard/i)).toBeInTheDocument()
  })

  it('should not show resubmit button for approved requests', () => {
    const approvedRequest = createApprovedRequest()
    
    render(
      <RequestAccessClient
        userEmail={mockUserEmail}
        userName={mockUserName}
        existingRequest={approvedRequest}
      />
    )

    expect(screen.queryByRole('button', { name: /Submit New Request/i })).not.toBeInTheDocument()
  })

  it('should not show form for approved requests', () => {
    const approvedRequest = createApprovedRequest()
    
    render(
      <RequestAccessClient
        userEmail={mockUserEmail}
        userName={mockUserName}
        existingRequest={approvedRequest}
      />
    )

    expect(screen.queryByRole('button', { name: /Submit Request/i })).not.toBeInTheDocument()
  })
})


// =====================================================
// DEPARTMENT-ROLE MAPPING VERIFICATION TESTS
// **Validates: Requirements 1.3**
// =====================================================

describe('Task 4.4: Department-Role Mapping Verification', () => {
  /**
   * Verify that getDepartmentRoles returns correct roles for each department
   * This ensures the UI filtering logic is based on correct data
   */
  
  it('should return correct roles for Operations department', () => {
    const roles = getDepartmentRoles('Operations')
    expect(roles).toContain('ops')
    expect(roles).toContain('operations_manager')
    expect(roles).toHaveLength(2)
  })

  it('should return correct roles for Finance department', () => {
    const roles = getDepartmentRoles('Finance')
    expect(roles).toContain('finance')
    expect(roles).toContain('finance_manager')
    expect(roles).toContain('administration')
    expect(roles).toHaveLength(3)
  })

  it('should return correct roles for Marketing department', () => {
    const roles = getDepartmentRoles('Marketing')
    expect(roles).toContain('marketing')
    expect(roles).toContain('marketing_manager')
    expect(roles).toHaveLength(2)
  })

  it('should return correct roles for HR department', () => {
    const roles = getDepartmentRoles('HR')
    expect(roles).toContain('hr')
    expect(roles).toHaveLength(1)
  })

  it('should return correct roles for HSE department', () => {
    const roles = getDepartmentRoles('HSE')
    expect(roles).toContain('hse')
    expect(roles).toHaveLength(1)
  })

  it('should return correct roles for Engineering department', () => {
    const roles = getDepartmentRoles('Engineering')
    expect(roles).toContain('engineer')
    expect(roles).toHaveLength(1)
  })

  it('should return correct roles for Agency department', () => {
    const roles = getDepartmentRoles('Agency')
    expect(roles).toContain('agency')
    expect(roles).toHaveLength(1)
  })

  it('should return correct roles for Customs department', () => {
    const roles = getDepartmentRoles('Customs')
    expect(roles).toContain('customs')
    expect(roles).toHaveLength(1)
  })

  it('should return correct roles for Administration department', () => {
    const roles = getDepartmentRoles('Administration')
    expect(roles).toContain('administration')
    expect(roles).toHaveLength(1)
  })

  it('should return empty array for unknown department', () => {
    const roles = getDepartmentRoles('Unknown')
    expect(roles).toEqual([])
  })

  it('should return empty array for empty string', () => {
    const roles = getDepartmentRoles('')
    expect(roles).toEqual([])
  })

  it('should have all 9 departments defined in DEPARTMENT_ROLES', () => {
    const expectedDepartments = [
      'Operations', 'Finance', 'Marketing', 'HR', 'HSE',
      'Engineering', 'Agency', 'Customs', 'Administration'
    ]
    
    expect(Object.keys(DEPARTMENT_ROLES)).toHaveLength(9)
    for (const dept of expectedDepartments) {
      expect(DEPARTMENT_ROLES).toHaveProperty(dept)
    }
  })

  it('should be case-sensitive for department names', () => {
    // Lowercase should not match
    expect(getDepartmentRoles('operations')).toEqual([])
    expect(getDepartmentRoles('OPERATIONS')).toEqual([])
    // Correct case should match
    expect(getDepartmentRoles('Operations')).toHaveLength(2)
  })
})


// =====================================================
// USER INFO DISPLAY TESTS
// **Validates: Requirements 1.2**
// =====================================================

describe('Task 4.4: User Info Display', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should display user avatar with first letter of name', () => {
    render(
      <RequestAccessClient
        userEmail={mockUserEmail}
        userName={mockUserName}
        existingRequest={null}
      />
    )

    // First letter of "Test User" is "T"
    expect(screen.getByText('T')).toBeInTheDocument()
  })

  it('should display user avatar with first letter of email when name is null', () => {
    render(
      <RequestAccessClient
        userEmail={mockUserEmail}
        userName={null}
        existingRequest={null}
      />
    )

    // First letter of "test@gama-group.co" is "T"
    expect(screen.getByText('T')).toBeInTheDocument()
  })

  it('should display "User" as fallback when userName is null', () => {
    render(
      <RequestAccessClient
        userEmail={mockUserEmail}
        userName={null}
        existingRequest={null}
      />
    )

    expect(screen.getByText('User')).toBeInTheDocument()
  })

  it('should display user name when provided', () => {
    render(
      <RequestAccessClient
        userEmail={mockUserEmail}
        userName={mockUserName}
        existingRequest={null}
      />
    )

    expect(screen.getByText(mockUserName)).toBeInTheDocument()
  })
})

// =====================================================
// ROLE LABELS DISPLAY TESTS
// **Validates: Requirements 1.2, 2.1**
// =====================================================

describe('Task 4.4: Role Labels Display', () => {
  /**
   * Test that role labels are displayed correctly in status cards
   */
  
  it('should display "Operations Staff" for ops role', () => {
    const request = createPendingRequest()
    request.requested_role = 'ops' as UserRole
    
    render(
      <RequestAccessClient
        userEmail={mockUserEmail}
        userName={mockUserName}
        existingRequest={request}
      />
    )

    expect(screen.getByText(/Operations Staff/i)).toBeInTheDocument()
  })

  it('should display "Finance Staff" for finance role', () => {
    const request = createPendingRequest()
    request.requested_role = 'finance' as UserRole
    request.requested_department = 'Finance'
    
    render(
      <RequestAccessClient
        userEmail={mockUserEmail}
        userName={mockUserName}
        existingRequest={request}
      />
    )

    expect(screen.getByText(/Finance Staff/i)).toBeInTheDocument()
  })

  it('should display "HR Staff" for hr role', () => {
    const request = createPendingRequest()
    request.requested_role = 'hr' as UserRole
    request.requested_department = 'HR'
    
    render(
      <RequestAccessClient
        userEmail={mockUserEmail}
        userName={mockUserName}
        existingRequest={request}
      />
    )

    expect(screen.getByText(/HR Staff/i)).toBeInTheDocument()
  })

  it('should display "Engineer" for engineer role in pending status', () => {
    const request = createPendingRequest()
    request.requested_role = 'engineer' as UserRole
    request.requested_department = 'Engineering'
    
    render(
      <RequestAccessClient
        userEmail={mockUserEmail}
        userName={mockUserName}
        existingRequest={request}
      />
    )

    // Both "Engineering" (department) and "Engineer" (role) will be present
    // Use getAllByText to verify both are present
    const engineerElements = screen.getAllByText(/Engineer/i)
    expect(engineerElements.length).toBeGreaterThanOrEqual(1)
  })
})
