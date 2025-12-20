'use client';

import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { MyAttendanceView } from '@/components/attendance/my-attendance-view';
import { AttendanceCalendar } from '@/components/attendance/attendance-calendar';
import { getMonthlyAttendanceRecords } from '@/app/(main)/hr/attendance/actions';
import { getHolidaysForMonth } from '@/app/(main)/hr/attendance/holiday-actions';
import { getCurrentEmployeeInfo } from '@/app/(main)/hr/attendance/clock-actions';
import { AttendanceRecord, Holiday } from '@/types/attendance';

export default function MyAttendancePage() {
  const [employeeId, setEmployeeId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);

  const today = new Date();
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());

  // Load employee info on mount
  useEffect(() => {
    async function loadEmployee() {
      const empInfo = await getCurrentEmployeeInfo();
      setEmployeeId(empInfo?.id || null);
      setIsLoading(false);
    }
    loadEmployee();
  }, []);

  // Load calendar data when month/year changes
  useEffect(() => {
    async function loadCalendarData() {
      if (!employeeId) return;

      const [recordsResult, holidaysResult] = await Promise.all([
        getMonthlyAttendanceRecords(employeeId, year, month),
        getHolidaysForMonth(year, month),
      ]);

      setRecords(recordsResult.data || []);
      setHolidays(holidaysResult.data || []);
    }
    loadCalendarData();
  }, [employeeId, month, year]);

  const handleMonthChange = (newMonth: number, newYear: number) => {
    setMonth(newMonth);
    setYear(newYear);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Attendance</h1>
        <p className="text-muted-foreground">
          View your attendance records and clock in/out
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <MyAttendanceView employeeId={employeeId || undefined} />
        </div>
        <div>
          <AttendanceCalendar
            records={records}
            holidays={holidays}
            month={month}
            year={year}
            onMonthChange={handleMonthChange}
          />
        </div>
      </div>
    </div>
  );
}
