'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, Clock, CheckCircle, Wrench, Calendar } from 'lucide-react'
import { UpcomingMaintenance, MaintenanceUrgency } from '@/types/maintenance'
import { formatDate } from '@/lib/utils/format'

interface UpcomingMaintenanceListProps {
  items: UpcomingMaintenance[]
  onLogCompletion: (scheduleId: string, assetId: string) => void
  onScheduleService?: (scheduleId: string, assetId: string) => void
}

function getUrgencyIcon(status: MaintenanceUrgency) {
  switch (status) {
    case 'overdue':
      return <AlertTriangle className="h-4 w-4 text-red-600" />
    case 'due_soon':
      return <Clock className="h-4 w-4 text-yellow-600" />
    default:
      return <CheckCircle className="h-4 w-4 text-green-600" />
  }
}

function getUrgencyBadge(status: MaintenanceUrgency) {
  switch (status) {
    case 'overdue':
      return <Badge variant="destructive">Overdue</Badge>
    case 'due_soon':
      return <Badge variant="outline" className="border-yellow-500 text-yellow-600">Due Soon</Badge>
    default:
      return <Badge variant="outline" className="border-green-500 text-green-600">OK</Badge>
  }
}

function formatRemaining(triggerType: string, remaining: number): string {
  if (triggerType === 'km') {
    return `${remaining.toLocaleString('id-ID')} km remaining`
  }
  if (remaining < 0) {
    return `${Math.abs(remaining)} days overdue`
  }
  if (remaining === 0) {
    return 'Due today'
  }
  return `${remaining} days remaining`
}

export function UpcomingMaintenanceList({ 
  items, 
  onLogCompletion,
  onScheduleService 
}: UpcomingMaintenanceListProps) {
  const overdueItems = items.filter(item => item.status === 'overdue')
  const dueSoonItems = items.filter(item => item.status === 'due_soon')

  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
          <p className="text-muted-foreground">No upcoming maintenance</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {overdueItems.length > 0 && (
        <Card className="border-red-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Overdue ({overdueItems.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {overdueItems.map((item) => (
              <MaintenanceItem 
                key={item.scheduleId} 
                item={item} 
                onLogCompletion={onLogCompletion}
                onScheduleService={onScheduleService}
              />
            ))}
          </CardContent>
        </Card>
      )}

      {dueSoonItems.length > 0 && (
        <Card className="border-yellow-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-yellow-600">
              <Clock className="h-5 w-5" />
              Due Soon ({dueSoonItems.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {dueSoonItems.map((item) => (
              <MaintenanceItem 
                key={item.scheduleId} 
                item={item} 
                onLogCompletion={onLogCompletion}
                onScheduleService={onScheduleService}
              />
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}


interface MaintenanceItemProps {
  item: UpcomingMaintenance
  onLogCompletion: (scheduleId: string, assetId: string) => void
  onScheduleService?: (scheduleId: string, assetId: string) => void
}

function MaintenanceItem({ item, onLogCompletion, onScheduleService }: MaintenanceItemProps) {
  return (
    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
      <div className="flex items-center gap-3">
        {getUrgencyIcon(item.status)}
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium">{item.assetCode}</span>
            <span className="text-muted-foreground">-</span>
            <span>{item.assetName}</span>
            {item.registrationNumber && (
              <span className="text-sm text-muted-foreground">({item.registrationNumber})</span>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Wrench className="h-3 w-3" />
            <span>{item.maintenanceType}</span>
            <span>•</span>
            <span>{formatRemaining(item.triggerType, item.remaining)}</span>
            {item.nextDueDate && (
              <>
                <span>•</span>
                <Calendar className="h-3 w-3" />
                <span>{formatDate(item.nextDueDate)}</span>
              </>
            )}
            {item.nextDueKm && (
              <>
                <span>•</span>
                <span>Due at {item.nextDueKm.toLocaleString('id-ID')} km</span>
              </>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {getUrgencyBadge(item.status)}
        <Button 
          size="sm" 
          onClick={() => onLogCompletion(item.scheduleId, item.assetId)}
        >
          Log Completion
        </Button>
        {onScheduleService && (
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => onScheduleService(item.scheduleId, item.assetId)}
          >
            Schedule
          </Button>
        )}
      </div>
    </div>
  )
}
