'use client';

import { useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AttendanceRecord, Holiday, CalendarDay } from '@/types/attendance';
import { getStatusDisplayInfo, formatAttendanceTime, formatWorkHours } from '@/lib/attendance-utils';
import { cn } from '@/lib/utils';

interface AttendanceCalendarProps {
  records: AttendanceRecord[];
  holidays: Holiday[];
  month: number; // 1-12
  year: number;
  onMonthChange?: (month: number, year: number) => void;
  onDateClick?: (date: string) => void;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export function AttendanceCalendar({
  records,
  holidays,
  month,
  year,
  onMonthChange,
  onDateClick,
}: AttendanceCalendarProps) {
  // Build calendar days for the month
  const calendarDays = useMemo(() => {
    const days: CalendarDay[] = [];
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // Create a map of attendance records by date
    const recordMap = new Map<string, AttendanceRecord>();
    records.forEach(r => recordMap.set(r.attendance_date, r));

    // Create a map of holidays by date
    const holidayMap = new Map<string, Holiday>();
    holidays.forEach(h => holidayMap.set(h.holiday_date, h));

    // First day of the month
    const firstDay = new Date(year, month - 1, 1);
    const startDayOfWeek = firstDay.getDay();

    // Last day of the month
    const lastDay = new Date(year, month, 0);
    const daysInMonth = lastDay.getDate();

    // Previous month days to fill the first week
    const prevMonthLastDay = new Date(year, month - 1, 0);
    const prevMonthDays = prevMonthLastDay.getDate();

    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const dayNum = prevMonthDays - i;
      const date = new Date(year, month - 2, dayNum);
      const dateStr = date.toISOString().split('T')[0];
      const dayOfWeek = date.getDay();
      const holiday = holidayMap.get(dateStr);

      days.push({
        date: dateStr,
        dayOfMonth: dayNum,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
        isHoliday: !!holiday,
        holidayName: holiday?.holiday_name,
        attendance: recordMap.get(dateStr),
      });
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month - 1, day);
      const dateStr = date.toISOString().split('T')[0];
      const dayOfWeek = date.getDay();
      const holiday = holidayMap.get(dateStr);

      days.push({
        date: dateStr,
        dayOfMonth: day,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
        isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
        isHoliday: !!holiday,
        holidayName: holiday?.holiday_name,
        attendance: recordMap.get(dateStr),
      });
    }

    // Next month days to fill the last week
    const remainingDays = 42 - days.length; // 6 rows * 7 days
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(year, month, day);
      const dateStr = date.toISOString().split('T')[0];
      const dayOfWeek = date.getDay();
      const holiday = holidayMap.get(dateStr);

      days.push({
        date: dateStr,
        dayOfMonth: day,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
        isHoliday: !!holiday,
        holidayName: holiday?.holiday_name,
        attendance: recordMap.get(dateStr),
      });
    }

    return days;
  }, [records, holidays, month, year]);

  const handlePrevMonth = () => {
    if (onMonthChange) {
      if (month === 1) {
        onMonthChange(12, year - 1);
      } else {
        onMonthChange(month - 1, year);
      }
    }
  };

  const handleNextMonth = () => {
    if (onMonthChange) {
      if (month === 12) {
        onMonthChange(1, year + 1);
      } else {
        onMonthChange(month + 1, year);
      }
    }
  };

  const getStatusColor = (day: CalendarDay): string => {
    if (!day.isCurrentMonth) return 'bg-muted/30';
    if (day.isHoliday) return 'bg-pink-100';
    if (day.isWeekend) return 'bg-gray-100';
    if (!day.attendance) return 'bg-white';

    const status = day.attendance.status;
    switch (status) {
      case 'present': return 'bg-green-100';
      case 'late': return 'bg-yellow-100';
      case 'absent': return 'bg-red-100';
      case 'on_leave': return 'bg-purple-100';
      case 'half_day': return 'bg-blue-100';
      case 'early_leave': return 'bg-orange-100';
      case 'wfh': return 'bg-cyan-100';
      case 'holiday': return 'bg-pink-100';
      default: return 'bg-white';
    }
  };

  const getStatusDot = (day: CalendarDay): string | null => {
    if (!day.isCurrentMonth) return null;
    if (day.isHoliday) return '🎉';
    if (!day.attendance) return null;

    const info = getStatusDisplayInfo(day.attendance.status);
    return info.icon;
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">
            {MONTH_NAMES[month - 1]} {year}
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" onClick={handlePrevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {WEEKDAYS.map(day => (
            <div
              key={day}
              className={cn(
                'text-center text-sm font-medium py-2',
                day === 'Sun' || day === 'Sat' ? 'text-muted-foreground' : ''
              )}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <TooltipProvider>
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, idx) => (
              <Tooltip key={idx}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => day.isCurrentMonth && onDateClick?.(day.date)}
                    disabled={!day.isCurrentMonth}
                    className={cn(
                      'relative aspect-square p-1 rounded-md text-sm transition-colors',
                      getStatusColor(day),
                      day.isCurrentMonth ? 'hover:ring-2 hover:ring-primary/50' : 'cursor-default',
                      day.isToday && 'ring-2 ring-primary',
                      !day.isCurrentMonth && 'text-muted-foreground/50'
                    )}
                  >
                    <span className={cn(
                      'block',
                      day.isToday && 'font-bold'
                    )}>
                      {day.dayOfMonth}
                    </span>
                    {getStatusDot(day) && (
                      <span className="absolute bottom-1 right-1 text-xs">
                        {getStatusDot(day)}
                      </span>
                    )}
                  </button>
                </TooltipTrigger>
                {day.isCurrentMonth && (
                  <TooltipContent side="top" className="max-w-xs">
                    <CalendarDayTooltip day={day} />
                  </TooltipContent>
                )}
              </Tooltip>
            ))}
          </div>
        </TooltipProvider>

        {/* Legend */}
        <div className="mt-4 flex flex-wrap gap-3 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-green-100" />
            <span>Present</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-yellow-100" />
            <span>Late</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-red-100" />
            <span>Absent</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-purple-100" />
            <span>Leave</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-pink-100" />
            <span>Holiday</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-gray-100" />
            <span>Weekend</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function CalendarDayTooltip({ day }: { day: CalendarDay }) {
  if (day.isHoliday) {
    return (
      <div>
        <p className="font-medium">🎉 {day.holidayName}</p>
        <p className="text-muted-foreground">Holiday</p>
      </div>
    );
  }

  if (day.isWeekend && !day.attendance) {
    return <p className="text-muted-foreground">Weekend</p>;
  }

  if (!day.attendance) {
    const today = new Date();
    const dayDate = new Date(day.date);
    if (dayDate > today) {
      return <p className="text-muted-foreground">Future date</p>;
    }
    return <p className="text-muted-foreground">No record</p>;
  }

  const { attendance } = day;
  const statusInfo = getStatusDisplayInfo(attendance.status);

  return (
    <div className="space-y-1">
      <p className={cn('font-medium', statusInfo.color)}>
        {statusInfo.icon} {statusInfo.label}
      </p>
      {attendance.clock_in && (
        <p className="text-sm">
          In: {formatAttendanceTime(attendance.clock_in)}
          {attendance.late_minutes > 0 && (
            <span className="text-yellow-600 ml-1">
              ({attendance.late_minutes}m late)
            </span>
          )}
        </p>
      )}
      {attendance.clock_out && (
        <p className="text-sm">Out: {formatAttendanceTime(attendance.clock_out)}</p>
      )}
      {attendance.work_hours !== null && (
        <p className="text-sm">Hours: {formatWorkHours(attendance.work_hours)}</p>
      )}
      {attendance.notes && (
        <p className="text-sm text-muted-foreground italic">{attendance.notes}</p>
      )}
    </div>
  );
}
