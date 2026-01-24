'use client'

import { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { MoreHorizontal, Edit, Trash2, Calendar, Gauge, Clock } from 'lucide-react'
import { MaintenanceSchedule, MaintenanceType } from '@/types/maintenance'
import { Asset } from '@/types/assets'
import { formatDate } from '@/lib/utils/format'
import { deleteMaintenanceSchedule } from '@/lib/maintenance-actions'
import { useRouter } from 'next/navigation'

interface MaintenanceScheduleListProps {
  schedules: MaintenanceSchedule[]
  assets?: Asset[]
  maintenanceTypes?: MaintenanceType[]
  onEdit: (scheduleId: string) => void
  onDelete?: (scheduleId: string) => void
}

function getTriggerIcon(triggerType: string) {
  switch (triggerType) {
    case 'km':
      return <Gauge className="h-4 w-4" />
    case 'hours':
      return <Clock className="h-4 w-4" />
    case 'days':
    case 'date':
      return <Calendar className="h-4 w-4" />
    default:
      return null
  }
}

function formatTrigger(schedule: MaintenanceSchedule): string {
  switch (schedule.triggerType) {
    case 'km':
      return `Every ${schedule.triggerValue?.toLocaleString('id-ID')} km`
    case 'hours':
      return `Every ${schedule.triggerValue} hours`
    case 'days':
      return `Every ${schedule.triggerValue} days`
    case 'date':
      return schedule.triggerDate ? formatDate(schedule.triggerDate) : 'Specific date'
    default:
      return '-'
  }
}

function formatNextDue(schedule: MaintenanceSchedule): string {
  if (schedule.triggerType === 'km' && schedule.nextDueKm) {
    return `${schedule.nextDueKm.toLocaleString('id-ID')} km`
  }
  if (schedule.nextDueDate) {
    return formatDate(schedule.nextDueDate)
  }
  return '-'
}

export function MaintenanceScheduleList({ schedules, onEdit, onDelete }: MaintenanceScheduleListProps) {
  const router = useRouter()
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!deleteId) return
    
    setIsDeleting(true)
    try {
      if (onDelete) {
        onDelete(deleteId)
      } else {
        const result = await deleteMaintenanceSchedule(deleteId)
        if (result.success) {
          router.refresh()
        }
      }
    } catch (error) {
      console.error('Failed to delete schedule:', error)
    } finally {
      setIsDeleting(false)
      setDeleteId(null)
    }
  }

  if (schedules.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No maintenance schedules configured</p>
          <Button className="mt-4" onClick={() => router.push('/equipment/maintenance/schedules/new')}>
            Create Schedule
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Maintenance Schedules</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Asset</TableHead>
                <TableHead>Maintenance Type</TableHead>
                <TableHead>Trigger</TableHead>
                <TableHead>Next Due</TableHead>
                <TableHead>Warning</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {schedules.map((schedule) => (
                <TableRow key={schedule.id}>
                  <TableCell>
                    {schedule.asset ? (
                      <div>
                        <span className="font-medium">{schedule.asset.asset_code}</span>
                        <span className="text-muted-foreground ml-2">{schedule.asset.asset_name}</span>
                      </div>
                    ) : '-'}
                  </TableCell>
                  <TableCell>{schedule.maintenanceType?.typeName || '-'}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getTriggerIcon(schedule.triggerType)}
                      <span>{formatTrigger(schedule)}</span>
                    </div>
                  </TableCell>
                  <TableCell>{formatNextDue(schedule)}</TableCell>
                  <TableCell>
                    {schedule.triggerType === 'km' ? (
                      <span>{schedule.warningKm?.toLocaleString('id-ID')} km</span>
                    ) : (
                      <span>{schedule.warningDays} days</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {schedule.isActive ? (
                      <Badge variant="outline" className="border-green-500 text-green-600">Active</Badge>
                    ) : (
                      <Badge variant="outline" className="border-gray-500 text-gray-600">Inactive</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(schedule.id)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => setDeleteId(schedule.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Schedule</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this maintenance schedule? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-red-600 hover:bg-red-700">
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
