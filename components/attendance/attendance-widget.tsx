'use client';

import { useState, useEffect, useTransition } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, LogIn, LogOut, Loader2 } from 'lucide-react';
import { clockIn, clockOut, getTodayAttendance, getCurrentEmployeeInfo } from '@/app/(main)/hr/attendance/clock-actions';
import { AttendanceRecord } from '@/types/attendance';
import { formatAttendanceTime, formatWorkHours, calculateOngoingWorkHours, getStatusDisplayInfo } from '@/lib/attendance-utils';
import { toast } from 'sonner';

export function AttendanceWidget() {
  const [attendance, setAttendance] = useState<AttendanceRecord | null>(null);
  const [employeeInfo, setEmployeeInfo] = useState<{ id: string; employee_code: string; full_name: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [currentHours, setCurrentHours] = useState<number>(0);

  // Load initial data
  useEffect(() => {
    async function loadData() {
      try {
        const [attendanceData, empInfo] = await Promise.all([
          getTodayAttendance(),
          getCurrentEmployeeInfo(),
        ]);
        setAttendance(attendanceData);
        setEmployeeInfo(empInfo);
      } catch (error) {
        console.error('Error loading attendance data:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  // Update ongoing hours every minute
  useEffect(() => {
    if (attendance?.clock_in && !attendance?.clock_out) {
      const updateHours = () => {
        const hours = calculateOngoingWorkHours(new Date(attendance.clock_in!));
        setCurrentHours(hours);
      };
      updateHours();
      const interval = setInterval(updateHours, 60000);
      return () => clearInterval(interval);
    }
  }, [attendance?.clock_in, attendance?.clock_out]);

  const handleClockIn = () => {
    startTransition(async () => {
      const result = await clockIn();
      if (result.success && result.record) {
        setAttendance(result.record);
        toast.success('Clocked in successfully');
      } else {
        toast.error(result.error || 'Failed to clock in');
      }
    });
  };

  const handleClockOut = () => {
    startTransition(async () => {
      const result = await clockOut();
      if (result.success && result.record) {
        setAttendance(result.record);
        toast.success('Clocked out successfully');
      } else {
        toast.error(result.error || 'Failed to clock out');
      }
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Attendance Today
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!employeeInfo) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Attendance Today
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No employee record linked to your account.
          </p>
        </CardContent>
      </Card>
    );
  }

  const hasClockedIn = !!attendance?.clock_in;
  const hasClockedOut = !!attendance?.clock_out;
  const statusInfo = attendance?.status ? getStatusDisplayInfo(attendance.status) : null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Attendance Today
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Status */}
        {hasClockedIn && statusInfo && (
          <div className="flex items-center gap-2">
            <span className="text-lg">{statusInfo.icon}</span>
            <span className={`text-sm font-medium ${statusInfo.color}`}>
              {statusInfo.label}
            </span>
          </div>
        )}

        {/* Clock times */}
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-muted-foreground">Clock In:</span>
            <p className="font-medium">
              {hasClockedIn ? formatAttendanceTime(attendance!.clock_in) : '--:--'}
            </p>
          </div>
          <div>
            <span className="text-muted-foreground">Clock Out:</span>
            <p className="font-medium">
              {hasClockedOut ? formatAttendanceTime(attendance!.clock_out) : '--:--'}
            </p>
          </div>
        </div>

        {/* Work hours */}
        {hasClockedIn && (
          <div className="text-sm">
            <span className="text-muted-foreground">Hours:</span>
            <p className="font-medium">
              {hasClockedOut
                ? formatWorkHours(attendance!.work_hours)
                : `${formatWorkHours(currentHours)} (ongoing)`}
              {attendance?.overtime_hours && attendance.overtime_hours > 0 && (
                <span className="text-green-600 ml-1">
                  (+{formatWorkHours(attendance.overtime_hours)} OT)
                </span>
              )}
            </p>
          </div>
        )}

        {/* Action button */}
        <div className="pt-2">
          {!hasClockedIn ? (
            <Button
              onClick={handleClockIn}
              disabled={isPending}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <LogIn className="h-4 w-4 mr-2" />
              )}
              Clock In
            </Button>
          ) : !hasClockedOut ? (
            <Button
              onClick={handleClockOut}
              disabled={isPending}
              variant="destructive"
              className="w-full"
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <LogOut className="h-4 w-4 mr-2" />
              )}
              Clock Out
            </Button>
          ) : (
            <p className="text-center text-sm text-muted-foreground">
              Day complete ✓
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
