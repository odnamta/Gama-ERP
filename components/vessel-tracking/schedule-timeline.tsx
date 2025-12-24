'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  VesselSchedule,
  SCHEDULE_STATUS_LABELS,
  SCHEDULE_STATUS_COLORS,
  getDelaySeverity,
  DELAY_SEVERITY_COLORS,
} from '@/types/agency';
import { format, parseISO } from 'date-fns';
import {
  Ship,
  MapPin,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Circle,
  ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ScheduleTimelineProps {
  schedules: VesselSchedule[];
  vesselName?: string;
  voyageNumber?: string;
  className?: string;
}

/**
 * Timeline component showing all port calls for a voyage.
 * Displays visual progress indicator with status for each port.
 * 
 * **Requirements: 2.1-2.8**
 */
export function ScheduleTimeline({
  schedules,
  vesselName,
  voyageNumber,
  className,
}: ScheduleTimelineProps) {
  // Sort schedules by scheduled arrival time
  const sortedSchedules = [...schedules].sort((a, b) => {
    const dateA = a.scheduledArrival ? new Date(a.scheduledArrival).getTime() : 0;
    const dateB = b.scheduledArrival ? new Date(b.scheduledArrival).getTime() : 0;
    return dateA - dateB;
  });

  // Calculate overall progress
  const completedCount = sortedSchedules.filter(
    s => s.status === 'departed' || s.status === 'cancelled'
  ).length;
  const totalCount = sortedSchedules.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Format date/time for display
  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return '-';
    try {
      return format(parseISO(dateStr), 'dd MMM HH:mm');
    } catch {
      return dateStr;
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'departed':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'arrived':
      case 'berthed':
      case 'working':
        return <Circle className="h-5 w-5 text-blue-600 fill-blue-600" />;
      case 'cancelled':
        return <Circle className="h-5 w-5 text-red-600" />;
      default:
        return <Circle className="h-5 w-5 text-gray-400" />;
    }
  };

  // Get line color based on status
  const getLineColor = (status: string, isLast: boolean) => {
    if (isLast) return 'bg-transparent';
    switch (status) {
      case 'departed':
        return 'bg-green-400';
      case 'arrived':
      case 'berthed':
      case 'working':
        return 'bg-blue-400';
      default:
        return 'bg-gray-200';
    }
  };

  if (sortedSchedules.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="py-8 text-center text-muted-foreground">
          No port calls scheduled for this voyage
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Ship className="h-5 w-5" />
            Voyage Timeline
          </CardTitle>
          <div className="text-sm text-muted-foreground">
            {completedCount} of {totalCount} ports completed ({progressPercent}%)
          </div>
        </div>
        {(vesselName || voyageNumber) && (
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {vesselName && <span className="font-medium">{vesselName}</span>}
            {voyageNumber && <span>Voyage: {voyageNumber}</span>}
          </div>
        )}
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
          <div
            className="bg-green-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {sortedSchedules.map((schedule, index) => {
            const isLast = index === sortedSchedules.length - 1;
            const delaySeverity = getDelaySeverity(schedule.delayHours);
            const hasDelay = schedule.delayHours > 0;

            return (
              <div key={schedule.id} className="relative flex gap-4 pb-8 last:pb-0">
                {/* Timeline Line */}
                <div className="flex flex-col items-center">
                  {getStatusIcon(schedule.status)}
                  {!isLast && (
                    <div
                      className={cn(
                        'w-0.5 flex-1 mt-2',
                        getLineColor(schedule.status, isLast)
                      )}
                    />
                  )}
                </div>

                {/* Port Call Content */}
                <div className="flex-1 min-w-0 pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-semibold flex items-center gap-1">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          {schedule.portName}
                        </h4>
                        <Badge className={SCHEDULE_STATUS_COLORS[schedule.status]} variant="secondary">
                          {SCHEDULE_STATUS_LABELS[schedule.status]}
                        </Badge>
                      </div>
                      {schedule.terminal && (
                        <p className="text-sm text-muted-foreground">
                          {schedule.terminal}
                          {schedule.berth && ` • ${schedule.berth}`}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Times */}
                  <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span className="text-xs">Arrival</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>{formatDateTime(schedule.scheduledArrival)}</span>
                        {schedule.actualArrival && (
                          <>
                            <ArrowRight className="h-3 w-3 text-muted-foreground" />
                            <span className={hasDelay ? 'text-orange-600 font-medium' : 'text-green-600'}>
                              {formatDateTime(schedule.actualArrival)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span className="text-xs">Departure</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>{formatDateTime(schedule.scheduledDeparture)}</span>
                        {schedule.actualDeparture && (
                          <>
                            <ArrowRight className="h-3 w-3 text-muted-foreground" />
                            <span className="text-green-600">
                              {formatDateTime(schedule.actualDeparture)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Delay Indicator */}
                  {hasDelay && (
                    <div className={cn(
                      'mt-2 flex items-center gap-2 p-2 rounded-md text-sm',
                      DELAY_SEVERITY_COLORS[delaySeverity]
                    )}>
                      <AlertTriangle className="h-4 w-4" />
                      <span>
                        Delayed: {schedule.delayHours > 0 ? '+' : ''}{schedule.delayHours}h
                        {schedule.delayReason && ` - ${schedule.delayReason}`}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Compact timeline for inline display
 */
interface CompactTimelineProps {
  schedules: VesselSchedule[];
  className?: string;
}

export function CompactScheduleTimeline({ schedules, className }: CompactTimelineProps) {
  // Sort schedules by scheduled arrival time
  const sortedSchedules = [...schedules].sort((a, b) => {
    const dateA = a.scheduledArrival ? new Date(a.scheduledArrival).getTime() : 0;
    const dateB = b.scheduledArrival ? new Date(b.scheduledArrival).getTime() : 0;
    return dateA - dateB;
  });

  if (sortedSchedules.length === 0) {
    return null;
  }

  return (
    <div className={cn('flex items-center gap-1 overflow-x-auto', className)}>
      {sortedSchedules.map((schedule, index) => {
        const isLast = index === sortedSchedules.length - 1;
        const isCompleted = schedule.status === 'departed';
        const isCurrent = schedule.status === 'arrived' || schedule.status === 'berthed' || schedule.status === 'working';

        return (
          <div key={schedule.id} className="flex items-center">
            <div
              className={cn(
                'px-2 py-1 rounded text-xs whitespace-nowrap',
                isCompleted && 'bg-green-100 text-green-800',
                isCurrent && 'bg-blue-100 text-blue-800 font-medium',
                !isCompleted && !isCurrent && 'bg-gray-100 text-gray-600'
              )}
              title={`${schedule.portName} - ${SCHEDULE_STATUS_LABELS[schedule.status]}`}
            >
              {schedule.portName}
            </div>
            {!isLast && (
              <ArrowRight className={cn(
                'h-4 w-4 mx-1',
                isCompleted ? 'text-green-400' : 'text-gray-300'
              )} />
            )}
          </div>
        );
      })}
    </div>
  );
}
