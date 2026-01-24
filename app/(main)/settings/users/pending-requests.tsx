'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RoleRequestWithUser } from '@/types/role-request'
import { UserRole } from '@/types/permissions'
import { formatDate } from '@/lib/utils/format'
import { Clock, CheckCircle, XCircle, Users } from 'lucide-react'

/**
 * Human-readable labels for roles
 * Matches the ROLE_LABELS in user-management-client.tsx
 */
const ROLE_LABELS: Record<UserRole, string> = {
  owner: 'Owner',
  director: 'Director',
  marketing_manager: 'Marketing Manager',
  finance_manager: 'Finance Manager',
  operations_manager: 'Operations Manager',
  sysadmin: 'System Administrator',
  administration: 'Administration',
  finance: 'Finance',
  marketing: 'Marketing',
  ops: 'Operations',
  engineer: 'Engineer',
  hr: 'Human Resources',
  hse: 'Health, Safety & Environment',
  agency: 'Agency Staff',
  customs: 'Customs Specialist',
}

/**
 * Get human-readable label for a role
 * Falls back to the role string if not found in ROLE_LABELS
 */
function getRoleLabel(role: string): string {
  return ROLE_LABELS[role as UserRole] || role
}

/**
 * Props for the PendingRequestsSection component
 * Requirements: 3.1, 3.2
 */
interface PendingRequestsSectionProps {
  requests: RoleRequestWithUser[]
  onApprove?: (requestId: string) => void
  onReject?: (requestId: string) => void
  isProcessing?: boolean
}

/**
 * PendingRequestsSection Component
 * 
 * Displays a table of pending role requests for admin review.
 * Shows user email, name, department, role, reason, and submission date.
 * Includes Approve/Reject action buttons (functionality implemented in Task 7.2).
 * 
 * Requirements: 3.1, 3.2
 * - 3.1: Display pending role requests section in User Management
 * - 3.2: Show user email, name, department, role, reason, and date
 */
export function PendingRequestsSection({
  requests,
  onApprove,
  onReject,
  isProcessing = false,
}: PendingRequestsSectionProps) {
  const hasPendingRequests = requests.length > 0

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-muted-foreground" />
          <div>
            <CardTitle className="text-lg">Pending Role Requests</CardTitle>
            <CardDescription>
              Review and process role access requests from new users
            </CardDescription>
          </div>
        </div>
        {hasPendingRequests && (
          <Badge variant="secondary" className="w-fit">
            <Clock className="mr-1 h-3 w-3" />
            {requests.length} pending
          </Badge>
        )}
      </CardHeader>
      <CardContent>
        {!hasPendingRequests ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CheckCircle className="h-12 w-12 text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">No pending requests</p>
            <p className="text-sm text-muted-foreground/70">
              All role requests have been processed
            </p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User Email</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Requested Role</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="w-[150px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium">
                      {request.user_email}
                    </TableCell>
                    <TableCell>
                      {request.user_name || (
                        <span className="text-muted-foreground italic">
                          No name
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {request.requested_department || (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {getRoleLabel(request.requested_role)}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[200px]">
                      {request.reason ? (
                        <span className="truncate block" title={request.reason}>
                          {request.reason}
                        </span>
                      ) : (
                        <span className="text-muted-foreground italic">
                          No reason provided
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {formatDate(request.created_at)}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => onApprove?.(request.id)}
                          disabled={isProcessing || !onApprove}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => onReject?.(request.id)}
                          disabled={isProcessing || !onReject}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
