// =====================================================
// v0.29: SCHEDULE UTILITY FUNCTIONS
// =====================================================

import { WorkSchedule } from '@/types/attendance';

/**
 * Parse a time string (HH:MM or HH:MM:SS) into hours and minutes
 */
export function parseTime(timeStr: string): { hours: number; minutes: number } {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return { hours, minutes };
}

/**
 * Convert time string to minutes since midnight
 */
export function timeToMinutes(timeStr: string): number {
  const { hours, minutes } = parseTime(timeStr);
  return hours * 60 + minutes;
}

/**
 * Convert minutes since midnight to time string (HH:MM)
 */
export function minutesToTime(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60) % 24;
  const minutes = totalMinutes % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

/**
 * Check if a date is a work day according to the schedule
 */
export function isWorkDay(date: Date | string, schedule: WorkSchedule): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  const dayOfWeek = d.getDay(); // 0 = Sunday, 6 = Saturday
  return schedule.work_days.includes(dayOfWeek);
}

/**
 * Get schedule times for a specific date
 * Returns null if not a work day
 */
export function getScheduleForDate(
  date: Date | string,
  schedule: WorkSchedule
): {
  workStart: Date;
  workEnd: Date;
  breakStart: Date | null;
  breakEnd: Date | null;
  graceEnd: Date;
} | null {
  const d = typeof date === 'string' ? new Date(date) : new Date(date);
  
  if (!isWorkDay(d, schedule)) {
    return null;
  }
  
  const { hours: startH, minutes: startM } = parseTime(schedule.work_start);
  const { hours: endH, minutes: endM } = parseTime(schedule.work_end);
  
  const workStart = new Date(d);
  workStart.setHours(startH, startM, 0, 0);
  
  const workEnd = new Date(d);
  workEnd.setHours(endH, endM, 0, 0);
  
  const graceEnd = new Date(workStart);
  graceEnd.setMinutes(graceEnd.getMinutes() + schedule.late_grace_minutes);
  
  let breakStart: Date | null = null;
  let breakEnd: Date | null = null;
  
  if (schedule.break_start && schedule.break_end) {
    const { hours: breakStartH, minutes: breakStartM } = parseTime(schedule.break_start);
    const { hours: breakEndH, minutes: breakEndM } = parseTime(schedule.break_end);
    
    breakStart = new Date(d);
    breakStart.setHours(breakStartH, breakStartM, 0, 0);
    
    breakEnd = new Date(d);
    breakEnd.setHours(breakEndH, breakEndM, 0, 0);
  }
  
  return {
    workStart,
    workEnd,
    breakStart,
    breakEnd,
    graceEnd,
  };
}

/**
 * Calculate expected work hours for a schedule (excluding break)
 */
export function calculateExpectedWorkHours(schedule: WorkSchedule): number {
  const startMinutes = timeToMinutes(schedule.work_start);
  const endMinutes = timeToMinutes(schedule.work_end);
  
  let totalMinutes = endMinutes - startMinutes;
  
  // Subtract break time if defined
  if (schedule.break_start && schedule.break_end) {
    const breakStartMinutes = timeToMinutes(schedule.break_start);
    const breakEndMinutes = timeToMinutes(schedule.break_end);
    totalMinutes -= (breakEndMinutes - breakStartMinutes);
  }
  
  return totalMinutes / 60;
}

/**
 * Get work days as day names
 */
export function getWorkDayNames(schedule: WorkSchedule): string[] {
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return schedule.work_days.map(day => dayNames[day]);
}

/**
 * Get work days as short day names
 */
export function getWorkDayShortNames(schedule: WorkSchedule): string[] {
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return schedule.work_days.map(day => dayNames[day]);
}

/**
 * Format schedule time range for display
 */
export function formatScheduleTimeRange(schedule: WorkSchedule): string {
  return `${schedule.work_start} - ${schedule.work_end}`;
}

/**
 * Format break time range for display
 */
export function formatBreakTimeRange(schedule: WorkSchedule): string {
  if (!schedule.break_start || !schedule.break_end) {
    return 'No break';
  }
  return `${schedule.break_start} - ${schedule.break_end}`;
}

/**
 * Validate work schedule data
 */
export function validateSchedule(schedule: Partial<WorkSchedule>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (!schedule.schedule_name?.trim()) {
    errors.push('Schedule name is required');
  }
  
  if (!schedule.work_start) {
    errors.push('Work start time is required');
  }
  
  if (!schedule.work_end) {
    errors.push('Work end time is required');
  }
  
  if (schedule.work_start && schedule.work_end) {
    const startMinutes = timeToMinutes(schedule.work_start);
    const endMinutes = timeToMinutes(schedule.work_end);
    
    if (startMinutes >= endMinutes) {
      errors.push('Work end time must be after work start time');
    }
  }
  
  if (schedule.break_start && schedule.break_end) {
    const breakStartMinutes = timeToMinutes(schedule.break_start);
    const breakEndMinutes = timeToMinutes(schedule.break_end);
    
    if (breakStartMinutes >= breakEndMinutes) {
      errors.push('Break end time must be after break start time');
    }
  }
  
  if (schedule.late_grace_minutes !== undefined && schedule.late_grace_minutes < 0) {
    errors.push('Grace period cannot be negative');
  }
  
  if (schedule.work_days) {
    const invalidDays = schedule.work_days.filter(d => d < 0 || d > 6);
    if (invalidDays.length > 0) {
      errors.push('Work days must be numbers between 0 (Sunday) and 6 (Saturday)');
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get default schedule values
 */
export function getDefaultScheduleValues(): Partial<WorkSchedule> {
  return {
    schedule_name: '',
    work_start: '08:00',
    work_end: '17:00',
    break_start: '12:00',
    break_end: '13:00',
    late_grace_minutes: 15,
    work_days: [1, 2, 3, 4, 5], // Monday to Friday
    is_default: false,
    is_active: true,
  };
}
