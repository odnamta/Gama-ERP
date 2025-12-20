'use client';

import { useState, useEffect, useTransition } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, LogIn, LogOut, Loader2, Calendar, TrendingUp, AlertTriangle, Timer } from 'lucide-react';
import { clockIn, clockOut, getTodayAttendance, getCurrentEmployeeInfo } from '@/app/(main)/hr/attendance/clock-actions';
import { getMonthlyAttendanceSummary } from '@/app/(main)/hr/attendance/actions';
import { AttendanceRecord, MonthlySummary } from '@/types/attendance';
import { formatAttendanceTime, formatWorkHours, calculateOngoingWorkHours, getStatusDisplayInfo } from '@/lib/attendance-utils';
import { toast } from 'sonner';

interface MyAttendanceViewProps {
  employeeId?: string;
}

export function MyAttendanceView({ employeeId }: MyAttendanceViewProps) {
  const [attendance, setAttendance] = useState<AttendanceRecord | null>(null);
  const [employeeInfo, setEmployeeInfo] = useState<{ id: string; employee_code: string; full_name: string } | null>(null);
  const [monthlySummary, setMonthlySummary] = useState<MonthlySummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [currentHours, setCurrentHours] = useState<number>(0);

  const today = new Date();
  const currentMonth = today.getMonth() + 1;
  const currentYear = today.getFullYear();

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

        // Load monthly summary if we have employee info
        const empId = employeeId || empInfo?.id;
        if (empId) {
          const { data: summary } = await getMonthlyAttendanceSummary(empId, currentYear, currentMonth);
          setMonthlySummary(summary);
        }
      } catch (error) {
        console.error('Error loading attendance data:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [employeeId, currentMonth, currentYear]);

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
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!employeeInfo) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">
            No employee record linked to your account. Please contact HR.
          </p>
        </CardContent>
      </Card>
    );
  }

  const hasClockedIn = !!attendance?.clock_in;
  const hasClockedOut = !!attendance?.clock_out;
  const statusInfo = attendance?.status ? getStatusDisplayInfo(attendance.status) : null;

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                      'July', 'August', 'September', 'October', 'November', 'December'];

  return (
    <div className="space-y-6">
      {/* Today's Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Today: {today.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Clock In Card */}
            <div className="border rounded-lg p-4 text-center">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">CLOCK IN</h3>
              <div className="text-3xl font-bold mb-2">
                {hasClockedIn ? formatAttendanceTime(attendance!.clock_in) : '--:--'}
              </div>
              {hasClockedIn && statusInfo && (
                <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm ${statusInfo.bgColor} ${statusInfo.color}`}>
                  <span>{statusInfo.icon}</span>
                  <span>{statusInfo.label}</span>
                </div>
              )}
              {!hasClockedIn && (
                <Button
                  onClick={handleClockIn}
                  disabled={isPending}
                  className="mt-2 bg-green-600 hover:bg-green-700"
                >
                  {isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <LogIn className="h-4 w-4 mr-2" />
                  )}
                  Clock In Now
                </Button>
              )}
            </div>

            {/* Clock Out Card */}
            <div className="border rounded-lg p-4 text-center">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">CLOCK OUT</h3>
              <div className="text-3xl font-bold mb-2">
                {hasClockedOut ? formatAttendanceTime(attendance!.clock_out) : '--:--'}
              </div>
              {hasClockedIn && !hasClockedOut && (
                <Button
                  onClick={handleClockOut}
                  disabled={isPending}
                  variant="destructive"
                  className="mt-2"
                >
                  {isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <LogOut className="h-4 w-4 mr-2" />
                  )}
                  Clock Out Now
                </Button>
              )}
              {hasClockedOut && (
                <p className="text-sm text-green-600">Day complete ✓</p>
              )}
            </div>
          </div>

          {/* Work Hours Today */}
          {hasClockedIn && (
            <div className="mt-4 text-center">
              <span className="text-muted-foreground">Work Hours Today: </span>
              <span className="font-bold">
                {hasClockedOut
                  ? formatWorkHours(attendance!.work_hours)
                  : `${formatWorkHours(currentHours)} (ongoing)`}
              </span>
              {attendance?.overtime_hours && attendance.overtime_hours > 0 && (
                <span className="text-green-600 ml-2">
                  (+{formatWorkHours(attendance.overtime_hours)} overtime)
                </span>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Monthly Summary */}
      <div>
        <h2 className="text-lg font-semibold mb-4">
          This Month: {monthNames[currentMonth - 1]} {currentYear}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-blue-500" />
                <span className="text-sm text-muted-foreground">Days Worked</span>
              </div>
              <p className="text-2xl font-bold mt-2">{monthlySummary?.daysWorked || 0}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                <span className="text-sm text-muted-foreground">Late Days</span>
              </div>
              <p className="text-2xl font-bold mt-2">{monthlySummary?.lateDays || 0}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Timer className="h-4 w-4 text-green-500" />
                <span className="text-sm text-muted-foreground">Total Hours</span>
              </div>
              <p className="text-2xl font-bold mt-2">{monthlySummary?.totalHours || 0}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-purple-500" />
                <span className="text-sm text-muted-foreground">Overtime</span>
              </div>
              <p className="text-2xl font-bold mt-2">{monthlySummary?.overtimeHours || 0}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
