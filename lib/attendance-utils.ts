// =====================================================
// v0.29: ATTENDANCE TRACKING UTILITY FUNCTIONS
// =====================================================

import { AttendanceStatus, WorkSchedule } from '@/types/attendance';

/**
 * Parse a time string (HH:MM or HH:MM:SS) into a Date object for today
 */
export function parseTimeString(timeStr: string, baseDate?: Date): Date {
  const base = baseDate || new Date();
  const [hours, minutes, seconds = '0'] = timeStr.split(':').map(Number);
  
  const result = new Date(base);
  result.setHours(hours, minutes, parseInt(String(seconds)), 0);
  return result;
}

/**
 * Calculate late minutes based on clock-in time and schedule
 * Returns 0 if on time or early, positive number if late
 */
export function calculateLateMinutes(
  clockInTime: Date,
  schedule: WorkSchedule
): number {
  const expectedStart = parseTimeString(schedule.work_start, clockInTime);
  const graceEnd = new Date(expectedStart.getTime() + schedule.late_grace_minutes * 60 * 1000);
  
  if (clockInTime <= graceEnd) {
    return 0;
  }
  
  const lateMs = clockInTime.getTime() - expectedStart.getTime();
  return Math.floor(lateMs / (60 * 1000));
}

/**
 * Determine attendance status based on clock-in time and schedule
 */
export function determineAttendanceStatus(
  clockInTime: Date,
  schedule: WorkSchedule
): AttendanceStatus {
  const lateMinutes = calculateLateMinutes(clockInTime, schedule);
  return lateMinutes > 0 ? 'late' : 'present';
}

/**
 * Calculate work hours from clock-in and clock-out times
 * Subtracts 1 hour for lunch break
 * Returns { workHours, overtimeHours }
 */
export function calculateWorkHours(
  clockIn: Date,
  clockOut: Date
): { workHours: number; overtimeHours: number } {
  const diffMs = clockOut.getTime() - clockIn.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  
  // Subtract 1 hour for lunch
  let workHours = diffHours - 1;
  
  // Cap at 0 if negative
  if (workHours < 0) {
    workHours = 0;
  }
  
  // Calculate overtime (anything over 8 hours)
  let overtimeHours = 0;
  if (workHours > 8) {
    overtimeHours = workHours - 8;
    workHours = 8;
  }
  
  return {
    workHours: Math.round(workHours * 100) / 100,
    overtimeHours: Math.round(overtimeHours * 100) / 100,
  };
}

/**
 * Format a timestamp for display (HH:MM AM/PM)
 */
export function formatAttendanceTime(timestamp: string | Date | null): string {
  if (!timestamp) return '--:--';
  
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  
  if (isNaN(date.getTime())) return '--:--';
  
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Format work hours for display (e.g., "8h 30m")
 */
export function formatWorkHours(hours: number | null): string {
  if (hours === null || hours === undefined) return '-';
  
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  
  if (h === 0 && m === 0) return '0h';
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

/**
 * Calculate ongoing work hours (from clock-in to now)
 */
export function calculateOngoingWorkHours(clockIn: Date): number {
  const now = new Date();
  const diffMs = now.getTime() - clockIn.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  
  // Subtract 1 hour for lunch if past lunch time
  const clockInHour = clockIn.getHours();
  const nowHour = now.getHours();
  
  // If we've passed the typical lunch period (12-13), subtract lunch hour
  let workHours = diffHours;
  if (clockInHour < 13 && nowHour >= 13) {
    workHours -= 1;
  }
  
  return Math.max(0, Math.round(workHours * 100) / 100);
}

/**
 * Get status display info (label, color, icon)
 */
export function getStatusDisplayInfo(status: AttendanceStatus): {
  label: string;
  color: string;
  bgColor: string;
  icon: string;
} {
  const statusMap: Record<AttendanceStatus, { label: string; color: string; bgColor: string; icon: string }> = {
    present: { label: 'Present', color: 'text-green-600', bgColor: 'bg-green-100', icon: '✅' },
    late: { label: 'Late', color: 'text-yellow-600', bgColor: 'bg-yellow-100', icon: '⚠️' },
    early_leave: { label: 'Early Leave', color: 'text-orange-600', bgColor: 'bg-orange-100', icon: '🚪' },
    absent: { label: 'Absent', color: 'text-red-600', bgColor: 'bg-red-100', icon: '❌' },
    half_day: { label: 'Half Day', color: 'text-blue-600', bgColor: 'bg-blue-100', icon: '½' },
    on_leave: { label: 'On Leave', color: 'text-purple-600', bgColor: 'bg-purple-100', icon: '🏖️' },
    holiday: { label: 'Holiday', color: 'text-pink-600', bgColor: 'bg-pink-100', icon: '🎉' },
    wfh: { label: 'WFH', color: 'text-cyan-600', bgColor: 'bg-cyan-100', icon: '🏠' },
  };
  
  return statusMap[status] || statusMap.present;
}

/**
 * Format date for display (DD/MM/YYYY)
 */
export function formatAttendanceDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(d.getTime())) return '-';
  
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  
  return `${day}/${month}/${year}`;
}

/**
 * Get today's date in YYYY-MM-DD format
 */
export function getTodayDateString(): string {
  const today = new Date();
  return today.toISOString().split('T')[0];
}

/**
 * Check if a date is today
 */
export function isToday(date: string | Date): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  
  return (
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear()
  );
}

/**
 * Check if a date is a weekend (Saturday or Sunday)
 */
export function isWeekend(date: string | Date): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  const dayOfWeek = d.getDay();
  return dayOfWeek === 0 || dayOfWeek === 6;
}

/**
 * Get the day of week (0=Sunday, 6=Saturday)
 */
export function getDayOfWeek(date: string | Date): number {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.getDay();
}
