// =====================================================
// v0.29: HOLIDAY UTILITY FUNCTIONS
// =====================================================

import { Holiday } from '@/types/attendance';

/**
 * Check if a date is a holiday
 */
export function isHoliday(date: string | Date, holidays: Holiday[]): boolean {
  const dateStr = typeof date === 'string' 
    ? date.split('T')[0] 
    : date.toISOString().split('T')[0];
  
  return holidays.some(h => h.holiday_date === dateStr);
}

/**
 * Get holiday for a specific date
 */
export function getHolidayForDate(date: string | Date, holidays: Holiday[]): Holiday | null {
  const dateStr = typeof date === 'string' 
    ? date.split('T')[0] 
    : date.toISOString().split('T')[0];
  
  return holidays.find(h => h.holiday_date === dateStr) || null;
}

/**
 * Get holidays within a date range
 */
export function getHolidaysInRange(
  startDate: string | Date,
  endDate: string | Date,
  holidays: Holiday[]
): Holiday[] {
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
  
  return holidays.filter(h => {
    const holidayDate = new Date(h.holiday_date);
    return holidayDate >= start && holidayDate <= end;
  });
}

/**
 * Get holidays for a specific month
 */
export function getHolidaysForMonth(
  year: number,
  month: number, // 1-12
  holidays: Holiday[]
): Holiday[] {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0); // Last day of month
  
  return getHolidaysInRange(startDate, endDate, holidays);
}

/**
 * Count holidays in a date range
 */
export function countHolidaysInRange(
  startDate: string | Date,
  endDate: string | Date,
  holidays: Holiday[]
): number {
  return getHolidaysInRange(startDate, endDate, holidays).length;
}

/**
 * Get upcoming holidays (from today)
 */
export function getUpcomingHolidays(holidays: Holiday[], limit: number = 5): Holiday[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return holidays
    .filter(h => new Date(h.holiday_date) >= today)
    .sort((a, b) => new Date(a.holiday_date).getTime() - new Date(b.holiday_date).getTime())
    .slice(0, limit);
}

/**
 * Format holiday date for display
 */
export function formatHolidayDate(holiday: Holiday): string {
  const date = new Date(holiday.holiday_date);
  return date.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Get holiday type label
 */
export function getHolidayTypeLabel(holiday: Holiday): string {
  if (holiday.is_national && holiday.is_company) {
    return 'National & Company';
  }
  if (holiday.is_national) {
    return 'National Holiday';
  }
  if (holiday.is_company) {
    return 'Company Holiday';
  }
  return 'Holiday';
}

/**
 * Validate holiday data
 */
export function validateHoliday(holiday: Partial<Holiday>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (!holiday.holiday_date) {
    errors.push('Holiday date is required');
  } else {
    const date = new Date(holiday.holiday_date);
    if (isNaN(date.getTime())) {
      errors.push('Invalid date format');
    }
  }
  
  if (!holiday.holiday_name?.trim()) {
    errors.push('Holiday name is required');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Check if a holiday already exists for a date
 */
export function holidayExistsForDate(date: string, holidays: Holiday[], excludeId?: string): boolean {
  const dateStr = date.split('T')[0];
  return holidays.some(h => h.holiday_date === dateStr && h.id !== excludeId);
}

/**
 * Sort holidays by date
 */
export function sortHolidaysByDate(holidays: Holiday[], ascending: boolean = true): Holiday[] {
  return [...holidays].sort((a, b) => {
    const dateA = new Date(a.holiday_date).getTime();
    const dateB = new Date(b.holiday_date).getTime();
    return ascending ? dateA - dateB : dateB - dateA;
  });
}

/**
 * Group holidays by month
 */
export function groupHolidaysByMonth(holidays: Holiday[]): Record<string, Holiday[]> {
  const grouped: Record<string, Holiday[]> = {};
  
  for (const holiday of holidays) {
    const date = new Date(holiday.holiday_date);
    const key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
    
    if (!grouped[key]) {
      grouped[key] = [];
    }
    grouped[key].push(holiday);
  }
  
  return grouped;
}

/**
 * Get default holiday values
 */
export function getDefaultHolidayValues(): Partial<Holiday> {
  return {
    holiday_name: '',
    holiday_date: new Date().toISOString().split('T')[0],
    is_national: true,
    is_company: false,
  };
}
