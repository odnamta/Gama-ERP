'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import { type TeamMemberMetrics } from '@/lib/manager-dashboard-utils'

interface TeamPerformanceTableProps {
  members: TeamMemberMetrics[]
  isLoading?: boolean
}

const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  sales: 'Sales',
  ops: 'Operations',
  finance: 'Finance',
  manager: 'Manager'
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            'h-4 w-4',
            i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
          )}
        />
      ))}
    </div>
  )
}

export function TeamPerformanceTable({ members, isLoading }: TeamPerformanceTableProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Team Performance (This Month)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }


  return (
    <Card>
      <CardHeader>
        <CardTitle>Team Performance (This Month)</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Team Member</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="text-right">PJOs Created</TableHead>
              <TableHead className="text-right">JOs Completed</TableHead>
              <TableHead className="text-right">On-Time Rate</TableHead>
              <TableHead className="text-center">Rating</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((member) => (
              <TableRow key={member.userId}>
                <TableCell className="font-medium">{member.name}</TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {ROLE_LABELS[member.role] || member.role}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {member.pjosCreated !== null ? member.pjosCreated : '-'}
                </TableCell>
                <TableCell className="text-right">
                  {member.josCompleted !== null ? member.josCompleted : '-'}
                </TableCell>
                <TableCell className={cn(
                  'text-right',
                  member.onTimeRate !== null && member.onTimeRate >= 90 && 'text-green-600',
                  member.onTimeRate !== null && member.onTimeRate < 80 && 'text-red-600'
                )}>
                  {member.onTimeRate !== null ? `${member.onTimeRate.toFixed(0)}%` : '-'}
                </TableCell>
                <TableCell>
                  <div className="flex justify-center">
                    <StarRating rating={member.rating} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
