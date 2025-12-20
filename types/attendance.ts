// =====================================================
// v0.29: HR - ATTENDANCE TRACKING TYPES
// =====================================================

export type AttendanceStatus =
  | 'present'
  | 'late'
  | 'early_leave'
  | 'absent'
  | 'half_day'
  | 'on_leave'
  | 'holiday'
  | 'wfh';

export interface AttendanceRecord {
  id: string;
  employee_id: string;
  attendance_date: string;
  clock_in: string | null;
  clock_out: string | null;
  work_hours: number | null;
  overtime_hours: number | null;
  clock_in_location: string | null;
  clock_out_location: string | null;
  status: AttendanceStatus;
  late_minutes: number;
  early_leave_minutes: number;
  notes: string | null;
  is_corrected: boolean;
  corrected_by: string | null;
  correction_reason: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  employee?: {
    id: string;
    employee_code: string;
    full_name: string;
    department_id: string | null;
    department?: {
      id: string;
      department_name: string;
    };
  };
}

export interface AttendanceRecordInput {
  employee_id: string;
  attendance_date: string;
  clock_in?: string;
  clock_out?: string;
  status?: AttendanceStatus;
  late_minutes?: number;
  early_leave_minutes?: number;
  notes?: string;
  is_corrected?: boolean;
  corrected_by?: string;
  correction_reason?: string;
}

export interface AttendanceSummary {
  total: number;
  present: number;
  late: number;
  absent: number;
  onLeave: number;
  holiday: number;
}

export interface MonthlySummary {
  daysWorked: number;
  lateDays: number;
  totalHours: number;
  overtimeHours: number;
  absentDays: number;
}

export interface AttendanceFilters {
  date?: string;
  dateFrom?: string;
  dateTo?: string;
  departmentId?: string;
  employeeId?: string;
  status?: AttendanceStatus;
}

export interface WorkSchedule {
  id: string;
  schedule_name: string;
  work_start: string;
  work_end: string;
  break_start: string | null;
  break_end: string | null;
  late_grace_minutes: number;
  work_days: number[];
  is_default: boolean;
  is_active: boolean;
  created_at: string;
}

export interface WorkScheduleInput {
  schedule_name: string;
  work_start: string;
  work_end: string;
  break_start?: string;
  break_end?: string;
  late_grace_minutes?: number;
  work_days?: number[];
  is_default?: boolean;
  is_active?: boolean;
}

export interface Holiday {
  id: string;
  holiday_date: string;
  holiday_name: string;
  is_national: boolean;
  is_company: boolean;
  created_at: string;
}

export interface HolidayInput {
  holiday_date: string;
  holiday_name: string;
  is_national?: boolean;
  is_company?: boolean;
}

// Calendar day type for UI
export interface CalendarDay {
  date: string;
  dayOfMonth: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isWeekend: boolean;
  isHoliday: boolean;
  holidayName?: string;
  attendance?: AttendanceRecord;
}

// Widget state type
export interface AttendanceWidgetState {
  isLoading: boolean;
  hasClockedIn: boolean;
  hasClockedOut: boolean;
  clockInTime: string | null;
  clockOutTime: string | null;
  workHours: number | null;
  status: AttendanceStatus | null;
}
