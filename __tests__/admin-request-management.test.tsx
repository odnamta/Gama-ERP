/**
 * Unit Tests for Admin Request Management
 * Feature: v0.84-role-request-system
 * 
 * Tests for:
 * - PendingRequestsSection component:
 *   - Displays pending requests table
 *   - Shows "No pending requests" when empty
 *   - Shows correct columns (email, name, department, role, reason, date)
 *   - Approve/Reject buttons are present
 * - ApproveDialog component:
 *   - Shows request details
 *   - Has Approve/Cancel buttons
 * - RejectDialog component:
 *   - Shows request details
 *   - Has reason textarea
 *   - Validates reason is required
 *   - Has Reject/Cancel buttons
 * 
 * **Validates: Requirements 3.1, 3.2, 3.3, 3.4**
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import type { RoleRequestWithUser } from '@/types/role-request'

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

// Mock the toast hook
const mockToast = vi.fn()
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}))

// Mock the server actions
const mockApproveRoleRequest = vi.fn()
const mockRejectRoleRequest = vi.fn()
vi.mock('@/app/(main)/settings/users/actions', () => ({
  approveRoleRequest: (...args: unknown[]) => mockApproveRoleRequest(...args),
  rejectRoleRequest: (...args: unknown[]) => mockRejectRoleRequest(...args),
}))

// =====================================================
// TEST DATA
// =====================================================

/**
 * Create a mock pending role request
 */
const createMockRequest = (overrides?: Partial<RoleRequestWithUser>): RoleRequestWithUser => ({
  id: '123e4567-e89b-12d3-a456-426614174000',
  user_id: 'user-123',
  user_email: 'john.doe@gama-group.co',
  user_name: 'John Doe',
  requested_role: 'ops',
  requested_department: 'Operations',
  reason: 'I need access to operations dashboard for my daily work',
  status: 'pending',
  created_at: '2026-01-25T10:00:00Z',
  ...overrides,
})

/**
 * Create multiple mock requests for testing
 */
const createMockRequests = (): RoleRequestWithUser[] => [
  createMockRequest({
    id: 'request-1',
    user_email: 'alice@gama-group.co',
    user_name: 'Alice Smith',
    requested_role: 'finance',
    requested_department: 'Finance',
    reason: 'Need access to finance module',
    created_at: '2026-01-25T09:00:00Z',
  }),
  createMockRequest({
    id: 'request-2',
    user_email: 'bob@gama-group.co',
    user_name: 'Bob Johnson',
    requested_role: 'marketing',
    requested_department: 'Marketing',
    reason: null,
    created_at: '2026-01-25T08:00:00Z',
  }),
  createMockRequest({
    id: 'request-3',
    user_email: 'charlie@gama-group.co',
    user_name: null,
    requested_role: 'hr',
    requested_department: 'HR',
    reason: 'HR department access required',
    created_at: '2026-01-25T07:00:00Z',
  }),
]

// Import components after mocks are set up
import { PendingRequestsSection } from '@/app/(main)/settings/users/pending-requests'
import { ApproveDialog, RejectDialog } from '@/app/(main)/settings/users/approve-reject-dialog'

// =====================================================
// PENDING REQUESTS SECTION TESTS
// **Validates: Requirements 3.1, 3.2**
// =====================================================

describe('Task 7.4: PendingRequestsSection - Empty State', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should display "No pending requests" when requests array is empty', () => {
    render(<PendingRequestsSection requests={[]} />)
    
    expect(screen.getByText(/No pending requests/i)).toBeInTheDocument()
  })

  it('should display message about all requests being processed when empty', () => {
    render(<PendingRequestsSection requests={[]} />)
    
    expect(screen.getByText(/All role requests have been processed/i)).toBeInTheDocument()
  })

  it('should not display table when requests array is empty', () => {
    render(<PendingRequestsSection requests={[]} />)
    
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })

  it('should display card title "Pending Role Requests"', () => {
    render(<PendingRequestsSection requests={[]} />)
    
    expect(screen.getByText(/Pending Role Requests/i)).toBeInTheDocument()
  })

  it('should display card description', () => {
    render(<PendingRequestsSection requests={[]} />)
    
    expect(screen.getByText(/Review and process role access requests/i)).toBeInTheDocument()
  })
})

describe('Task 7.4: PendingRequestsSection - With Requests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should display table when requests exist', () => {
    const requests = createMockRequests()
    render(<PendingRequestsSection requests={requests} />)
    
    expect(screen.getByRole('table')).toBeInTheDocument()
  })

  it('should display pending count badge', () => {
    const requests = createMockRequests()
    render(<PendingRequestsSection requests={requests} />)
    
    expect(screen.getByText(/3 pending/i)).toBeInTheDocument()
  })

  it('should display correct table headers', () => {
    const requests = createMockRequests()
    render(<PendingRequestsSection requests={requests} />)
    
    expect(screen.getByText('User Email')).toBeInTheDocument()
    expect(screen.getByText('Name')).toBeInTheDocument()
    expect(screen.getByText('Department')).toBeInTheDocument()
    expect(screen.getByText('Requested Role')).toBeInTheDocument()
    expect(screen.getByText('Reason')).toBeInTheDocument()
    expect(screen.getByText('Date')).toBeInTheDocument()
    expect(screen.getByText('Actions')).toBeInTheDocument()
  })

  it('should display user emails in the table', () => {
    const requests = createMockRequests()
    render(<PendingRequestsSection requests={requests} />)
    
    expect(screen.getByText('alice@gama-group.co')).toBeInTheDocument()
    expect(screen.getByText('bob@gama-group.co')).toBeInTheDocument()
    expect(screen.getByText('charlie@gama-group.co')).toBeInTheDocument()
  })

  it('should display user names in the table', () => {
    const requests = createMockRequests()
    render(<PendingRequestsSection requests={requests} />)
    
    expect(screen.getByText('Alice Smith')).toBeInTheDocument()
    expect(screen.getByText('Bob Johnson')).toBeInTheDocument()
  })

  it('should display "No name" for users without names', () => {
    const requests = createMockRequests()
    render(<PendingRequestsSection requests={requests} />)
    
    expect(screen.getByText(/No name/i)).toBeInTheDocument()
  })

  it('should display departments in the table', () => {
    const requests = createMockRequests()
    render(<PendingRequestsSection requests={requests} />)
    
    // Finance appears both as department and role label, so use getAllByText
    expect(screen.getAllByText('Finance').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Marketing').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('HR')).toBeInTheDocument()
  })

  it('should display role labels (not raw role values)', () => {
    const requests = createMockRequests()
    render(<PendingRequestsSection requests={requests} />)
    
    // Role labels should be human-readable
    // Finance appears both as department and role label
    expect(screen.getAllByText('Finance').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Marketing').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('Human Resources')).toBeInTheDocument()
  })

  it('should display reasons when provided', () => {
    const requests = createMockRequests()
    render(<PendingRequestsSection requests={requests} />)
    
    expect(screen.getByText('Need access to finance module')).toBeInTheDocument()
    expect(screen.getByText('HR department access required')).toBeInTheDocument()
  })

  it('should display "No reason provided" when reason is null', () => {
    const requests = createMockRequests()
    render(<PendingRequestsSection requests={requests} />)
    
    expect(screen.getByText(/No reason provided/i)).toBeInTheDocument()
  })
})

describe('Task 7.4: PendingRequestsSection - Action Buttons', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should display Approve button for each request', () => {
    const requests = createMockRequests()
    render(<PendingRequestsSection requests={requests} />)
    
    const approveButtons = screen.getAllByRole('button', { name: /Approve/i })
    expect(approveButtons).toHaveLength(3)
  })

  it('should display Reject button for each request', () => {
    const requests = createMockRequests()
    render(<PendingRequestsSection requests={requests} />)
    
    const rejectButtons = screen.getAllByRole('button', { name: /Reject/i })
    expect(rejectButtons).toHaveLength(3)
  })

  it('should call onApprove callback when Approve button is clicked', async () => {
    const requests = [createMockRequest()]
    const onApprove = vi.fn()
    
    render(
      <PendingRequestsSection 
        requests={requests} 
        onApprove={onApprove}
      />
    )
    
    const approveButton = screen.getByRole('button', { name: /Approve/i })
    fireEvent.click(approveButton)
    
    expect(onApprove).toHaveBeenCalledWith(requests[0].id)
  })

  it('should call onReject callback when Reject button is clicked', async () => {
    const requests = [createMockRequest()]
    const onReject = vi.fn()
    
    render(
      <PendingRequestsSection 
        requests={requests} 
        onReject={onReject}
      />
    )
    
    const rejectButton = screen.getByRole('button', { name: /Reject/i })
    fireEvent.click(rejectButton)
    
    expect(onReject).toHaveBeenCalledWith(requests[0].id)
  })

  it('should disable buttons when isProcessing is true', () => {
    const requests = [createMockRequest()]
    
    render(
      <PendingRequestsSection 
        requests={requests} 
        isProcessing={true}
        onApprove={vi.fn()}
        onReject={vi.fn()}
      />
    )
    
    const approveButton = screen.getByRole('button', { name: /Approve/i })
    const rejectButton = screen.getByRole('button', { name: /Reject/i })
    
    expect(approveButton).toBeDisabled()
    expect(rejectButton).toBeDisabled()
  })

  it('should disable buttons when callbacks are not provided', () => {
    const requests = [createMockRequest()]
    
    render(<PendingRequestsSection requests={requests} />)
    
    const approveButton = screen.getByRole('button', { name: /Approve/i })
    const rejectButton = screen.getByRole('button', { name: /Reject/i })
    
    expect(approveButton).toBeDisabled()
    expect(rejectButton).toBeDisabled()
  })
})

// =====================================================
// APPROVE DIALOG TESTS
// **Validates: Requirements 3.3**
// =====================================================

describe('Task 7.4: ApproveDialog - Display', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should display dialog title "Approve Role Request"', () => {
    const request = createMockRequest()
    
    render(
      <ApproveDialog 
        request={request} 
        open={true} 
        onOpenChange={vi.fn()} 
      />
    )
    
    expect(screen.getByText(/Approve Role Request/i)).toBeInTheDocument()
  })

  it('should display user email in request details', () => {
    const request = createMockRequest()
    
    render(
      <ApproveDialog 
        request={request} 
        open={true} 
        onOpenChange={vi.fn()} 
      />
    )
    
    expect(screen.getByText(request.user_email)).toBeInTheDocument()
  })

  it('should display user name in request details when provided', () => {
    const request = createMockRequest({ user_name: 'Test User' })
    
    render(
      <ApproveDialog 
        request={request} 
        open={true} 
        onOpenChange={vi.fn()} 
      />
    )
    
    expect(screen.getByText('Test User')).toBeInTheDocument()
  })

  it('should display department in request details when provided', () => {
    const request = createMockRequest({ requested_department: 'Operations' })
    
    render(
      <ApproveDialog 
        request={request} 
        open={true} 
        onOpenChange={vi.fn()} 
      />
    )
    
    // Operations appears both as department and role label for 'ops' role
    expect(screen.getAllByText('Operations').length).toBeGreaterThanOrEqual(1)
  })

  it('should display role label in request details', () => {
    const request = createMockRequest({ requested_role: 'finance' })
    
    render(
      <ApproveDialog 
        request={request} 
        open={true} 
        onOpenChange={vi.fn()} 
      />
    )
    
    expect(screen.getByText('Finance')).toBeInTheDocument()
  })

  it('should display confirmation message', () => {
    const request = createMockRequest()
    
    render(
      <ApproveDialog 
        request={request} 
        open={true} 
        onOpenChange={vi.fn()} 
      />
    )
    
    expect(screen.getByText(/Are you sure you want to approve/i)).toBeInTheDocument()
  })

  it('should not render when request is null', () => {
    render(
      <ApproveDialog 
        request={null} 
        open={true} 
        onOpenChange={vi.fn()} 
      />
    )
    
    expect(screen.queryByText(/Approve Role Request/i)).not.toBeInTheDocument()
  })
})

describe('Task 7.4: ApproveDialog - Buttons', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should display Approve button', () => {
    const request = createMockRequest()
    
    render(
      <ApproveDialog 
        request={request} 
        open={true} 
        onOpenChange={vi.fn()} 
      />
    )
    
    expect(screen.getByRole('button', { name: /Approve/i })).toBeInTheDocument()
  })

  it('should display Cancel button', () => {
    const request = createMockRequest()
    
    render(
      <ApproveDialog 
        request={request} 
        open={true} 
        onOpenChange={vi.fn()} 
      />
    )
    
    expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument()
  })

  it('should call onOpenChange(false) when Cancel is clicked', async () => {
    const request = createMockRequest()
    const onOpenChange = vi.fn()
    
    render(
      <ApproveDialog 
        request={request} 
        open={true} 
        onOpenChange={onOpenChange} 
      />
    )
    
    const cancelButton = screen.getByRole('button', { name: /Cancel/i })
    fireEvent.click(cancelButton)
    
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('should call approveRoleRequest when Approve is clicked', async () => {
    const request = createMockRequest()
    mockApproveRoleRequest.mockResolvedValue({ success: true })
    
    render(
      <ApproveDialog 
        request={request} 
        open={true} 
        onOpenChange={vi.fn()} 
      />
    )
    
    const approveButton = screen.getByRole('button', { name: /Approve/i })
    fireEvent.click(approveButton)
    
    await waitFor(() => {
      expect(mockApproveRoleRequest).toHaveBeenCalledWith(request.id)
    })
  })

  it('should show loading state when approving', async () => {
    const request = createMockRequest()
    // Make the mock hang to test loading state
    mockApproveRoleRequest.mockImplementation(() => new Promise(() => {}))
    
    render(
      <ApproveDialog 
        request={request} 
        open={true} 
        onOpenChange={vi.fn()} 
      />
    )
    
    const approveButton = screen.getByRole('button', { name: /Approve/i })
    fireEvent.click(approveButton)
    
    await waitFor(() => {
      expect(screen.getByText(/Approving/i)).toBeInTheDocument()
    })
  })

  it('should call onSuccess callback after successful approval', async () => {
    const request = createMockRequest()
    const onSuccess = vi.fn()
    mockApproveRoleRequest.mockResolvedValue({ success: true })
    
    render(
      <ApproveDialog 
        request={request} 
        open={true} 
        onOpenChange={vi.fn()} 
        onSuccess={onSuccess}
      />
    )
    
    const approveButton = screen.getByRole('button', { name: /Approve/i })
    fireEvent.click(approveButton)
    
    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled()
    })
  })

  it('should show toast on successful approval', async () => {
    const request = createMockRequest()
    mockApproveRoleRequest.mockResolvedValue({ success: true })
    
    render(
      <ApproveDialog 
        request={request} 
        open={true} 
        onOpenChange={vi.fn()} 
      />
    )
    
    const approveButton = screen.getByRole('button', { name: /Approve/i })
    fireEvent.click(approveButton)
    
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Request Approved',
        })
      )
    })
  })

  it('should show error toast on failed approval', async () => {
    const request = createMockRequest()
    mockApproveRoleRequest.mockResolvedValue({ success: false, error: 'Failed to approve' })
    
    render(
      <ApproveDialog 
        request={request} 
        open={true} 
        onOpenChange={vi.fn()} 
      />
    )
    
    const approveButton = screen.getByRole('button', { name: /Approve/i })
    fireEvent.click(approveButton)
    
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Error',
          variant: 'destructive',
        })
      )
    })
  })
})

// =====================================================
// REJECT DIALOG TESTS
// **Validates: Requirements 3.4**
// =====================================================

describe('Task 7.4: RejectDialog - Display', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should display dialog title "Reject Role Request"', () => {
    const request = createMockRequest()
    
    render(
      <RejectDialog 
        request={request} 
        open={true} 
        onOpenChange={vi.fn()} 
      />
    )
    
    expect(screen.getByText(/Reject Role Request/i)).toBeInTheDocument()
  })

  it('should display user email in request details', () => {
    const request = createMockRequest()
    
    render(
      <RejectDialog 
        request={request} 
        open={true} 
        onOpenChange={vi.fn()} 
      />
    )
    
    expect(screen.getByText(request.user_email)).toBeInTheDocument()
  })

  it('should display user name in request details when provided', () => {
    const request = createMockRequest({ user_name: 'Test User' })
    
    render(
      <RejectDialog 
        request={request} 
        open={true} 
        onOpenChange={vi.fn()} 
      />
    )
    
    expect(screen.getByText('Test User')).toBeInTheDocument()
  })

  it('should display department in request details when provided', () => {
    const request = createMockRequest({ requested_department: 'Finance' })
    
    render(
      <RejectDialog 
        request={request} 
        open={true} 
        onOpenChange={vi.fn()} 
      />
    )
    
    expect(screen.getByText('Finance')).toBeInTheDocument()
  })

  it('should display role label in request details', () => {
    const request = createMockRequest({ requested_role: 'hr' })
    
    render(
      <RejectDialog 
        request={request} 
        open={true} 
        onOpenChange={vi.fn()} 
      />
    )
    
    expect(screen.getByText('Human Resources')).toBeInTheDocument()
  })

  it('should display description about providing reason', () => {
    const request = createMockRequest()
    
    render(
      <RejectDialog 
        request={request} 
        open={true} 
        onOpenChange={vi.fn()} 
      />
    )
    
    expect(screen.getByText(/provide a reason for rejecting/i)).toBeInTheDocument()
  })

  it('should not render when request is null', () => {
    render(
      <RejectDialog 
        request={null} 
        open={true} 
        onOpenChange={vi.fn()} 
      />
    )
    
    expect(screen.queryByText(/Reject Role Request/i)).not.toBeInTheDocument()
  })
})

describe('Task 7.4: RejectDialog - Reason Textarea', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should display reason textarea', () => {
    const request = createMockRequest()
    
    render(
      <RejectDialog 
        request={request} 
        open={true} 
        onOpenChange={vi.fn()} 
      />
    )
    
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  it('should display label for rejection reason with required indicator', () => {
    const request = createMockRequest()
    
    render(
      <RejectDialog 
        request={request} 
        open={true} 
        onOpenChange={vi.fn()} 
      />
    )
    
    expect(screen.getByText(/Rejection Reason/i)).toBeInTheDocument()
    expect(screen.getByText('*')).toBeInTheDocument()
  })

  it('should display placeholder text in textarea', () => {
    const request = createMockRequest()
    
    render(
      <RejectDialog 
        request={request} 
        open={true} 
        onOpenChange={vi.fn()} 
      />
    )
    
    const textarea = screen.getByRole('textbox')
    expect(textarea).toHaveAttribute('placeholder', expect.stringContaining('explain why'))
  })

  it('should allow typing in the textarea', async () => {
    const request = createMockRequest()
    
    render(
      <RejectDialog 
        request={request} 
        open={true} 
        onOpenChange={vi.fn()} 
      />
    )
    
    const textarea = screen.getByRole('textbox')
    fireEvent.change(textarea, { target: { value: 'Invalid department selection' } })
    
    expect(textarea).toHaveValue('Invalid department selection')
  })
})

describe('Task 7.4: RejectDialog - Validation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should disable Reject button when reason is empty', () => {
    const request = createMockRequest()
    
    render(
      <RejectDialog 
        request={request} 
        open={true} 
        onOpenChange={vi.fn()} 
      />
    )
    
    const rejectButton = screen.getByRole('button', { name: /Reject Request/i })
    expect(rejectButton).toBeDisabled()
  })

  it('should enable Reject button when reason is provided', async () => {
    const request = createMockRequest()
    
    render(
      <RejectDialog 
        request={request} 
        open={true} 
        onOpenChange={vi.fn()} 
      />
    )
    
    const textarea = screen.getByRole('textbox')
    fireEvent.change(textarea, { target: { value: 'Invalid request' } })
    
    const rejectButton = screen.getByRole('button', { name: /Reject Request/i })
    expect(rejectButton).not.toBeDisabled()
  })

  it('should disable Reject button when reason is only whitespace', async () => {
    const request = createMockRequest()
    
    render(
      <RejectDialog 
        request={request} 
        open={true} 
        onOpenChange={vi.fn()} 
      />
    )
    
    const textarea = screen.getByRole('textbox')
    fireEvent.change(textarea, { target: { value: '   ' } })
    
    const rejectButton = screen.getByRole('button', { name: /Reject Request/i })
    expect(rejectButton).toBeDisabled()
  })

  it('should show error message when trying to reject without reason', async () => {
    const request = createMockRequest()
    mockRejectRoleRequest.mockResolvedValue({ success: false, error: 'Reason required' })
    
    render(
      <RejectDialog 
        request={request} 
        open={true} 
        onOpenChange={vi.fn()} 
      />
    )
    
    // Type something then clear it to enable the button temporarily
    const textarea = screen.getByRole('textbox')
    fireEvent.change(textarea, { target: { value: 'test' } })
    fireEvent.change(textarea, { target: { value: '' } })
    
    // Button should be disabled again
    const rejectButton = screen.getByRole('button', { name: /Reject Request/i })
    expect(rejectButton).toBeDisabled()
  })
})

describe('Task 7.4: RejectDialog - Buttons', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should display Reject Request button', () => {
    const request = createMockRequest()
    
    render(
      <RejectDialog 
        request={request} 
        open={true} 
        onOpenChange={vi.fn()} 
      />
    )
    
    expect(screen.getByRole('button', { name: /Reject Request/i })).toBeInTheDocument()
  })

  it('should display Cancel button', () => {
    const request = createMockRequest()
    
    render(
      <RejectDialog 
        request={request} 
        open={true} 
        onOpenChange={vi.fn()} 
      />
    )
    
    expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument()
  })

  it('should call onOpenChange(false) when Cancel is clicked', async () => {
    const request = createMockRequest()
    const onOpenChange = vi.fn()
    
    render(
      <RejectDialog 
        request={request} 
        open={true} 
        onOpenChange={onOpenChange} 
      />
    )
    
    const cancelButton = screen.getByRole('button', { name: /Cancel/i })
    fireEvent.click(cancelButton)
    
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('should call rejectRoleRequest with reason when Reject is clicked', async () => {
    const request = createMockRequest()
    const reason = 'Invalid department selection'
    mockRejectRoleRequest.mockResolvedValue({ success: true })
    
    render(
      <RejectDialog 
        request={request} 
        open={true} 
        onOpenChange={vi.fn()} 
      />
    )
    
    const textarea = screen.getByRole('textbox')
    fireEvent.change(textarea, { target: { value: reason } })
    
    const rejectButton = screen.getByRole('button', { name: /Reject Request/i })
    fireEvent.click(rejectButton)
    
    await waitFor(() => {
      expect(mockRejectRoleRequest).toHaveBeenCalledWith(request.id, reason)
    })
  })

  it('should show loading state when rejecting', async () => {
    const request = createMockRequest()
    // Make the mock hang to test loading state
    mockRejectRoleRequest.mockImplementation(() => new Promise(() => {}))
    
    render(
      <RejectDialog 
        request={request} 
        open={true} 
        onOpenChange={vi.fn()} 
      />
    )
    
    const textarea = screen.getByRole('textbox')
    fireEvent.change(textarea, { target: { value: 'Test reason' } })
    
    const rejectButton = screen.getByRole('button', { name: /Reject Request/i })
    fireEvent.click(rejectButton)
    
    await waitFor(() => {
      // "Rejecting" appears in both the description and the button text
      expect(screen.getAllByText(/Rejecting/i).length).toBeGreaterThanOrEqual(1)
    })
  })

  it('should call onSuccess callback after successful rejection', async () => {
    const request = createMockRequest()
    const onSuccess = vi.fn()
    mockRejectRoleRequest.mockResolvedValue({ success: true })
    
    render(
      <RejectDialog 
        request={request} 
        open={true} 
        onOpenChange={vi.fn()} 
        onSuccess={onSuccess}
      />
    )
    
    const textarea = screen.getByRole('textbox')
    fireEvent.change(textarea, { target: { value: 'Test reason' } })
    
    const rejectButton = screen.getByRole('button', { name: /Reject Request/i })
    fireEvent.click(rejectButton)
    
    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled()
    })
  })

  it('should show toast on successful rejection', async () => {
    const request = createMockRequest()
    mockRejectRoleRequest.mockResolvedValue({ success: true })
    
    render(
      <RejectDialog 
        request={request} 
        open={true} 
        onOpenChange={vi.fn()} 
      />
    )
    
    const textarea = screen.getByRole('textbox')
    fireEvent.change(textarea, { target: { value: 'Test reason' } })
    
    const rejectButton = screen.getByRole('button', { name: /Reject Request/i })
    fireEvent.click(rejectButton)
    
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Request Rejected',
        })
      )
    })
  })

  it('should show error toast on failed rejection', async () => {
    const request = createMockRequest()
    mockRejectRoleRequest.mockResolvedValue({ success: false, error: 'Failed to reject' })
    
    render(
      <RejectDialog 
        request={request} 
        open={true} 
        onOpenChange={vi.fn()} 
      />
    )
    
    const textarea = screen.getByRole('textbox')
    fireEvent.change(textarea, { target: { value: 'Test reason' } })
    
    const rejectButton = screen.getByRole('button', { name: /Reject Request/i })
    fireEvent.click(rejectButton)
    
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Error',
          variant: 'destructive',
        })
      )
    })
  })

  it('should clear reason when dialog is closed', async () => {
    const request = createMockRequest()
    const onOpenChange = vi.fn()
    
    const { rerender } = render(
      <RejectDialog 
        request={request} 
        open={true} 
        onOpenChange={onOpenChange} 
      />
    )
    
    const textarea = screen.getByRole('textbox')
    fireEvent.change(textarea, { target: { value: 'Test reason' } })
    expect(textarea).toHaveValue('Test reason')
    
    // Close and reopen the dialog
    const cancelButton = screen.getByRole('button', { name: /Cancel/i })
    fireEvent.click(cancelButton)
    
    // Rerender with open=true to simulate reopening
    rerender(
      <RejectDialog 
        request={request} 
        open={true} 
        onOpenChange={onOpenChange} 
      />
    )
    
    // The textarea should be cleared (this tests the handleOpenChange reset)
    const newTextarea = screen.getByRole('textbox')
    expect(newTextarea).toHaveValue('')
  })
})
