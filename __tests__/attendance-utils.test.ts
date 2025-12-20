/**
 * Property-based tests for attendance utility functions
 * Feature: hr-attendance-tracking
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  calculateLateMinutes,
  determineAttendanceStatus,
  calculateWorkHours,
  formatAttendanceTime,
  formatWorkHours,
  parseTimeString,
  isWeekend,
  getDayOfWeek,
} from '@/lib/attendance-utils';
import { WorkSchedule } from '@/types/attendance';

// Helper to create a valid work schedule
const createSchedule = (overrides: Partial<WorkSchedule> = {}): WorkSchedule => ({
  id: 'test-schedule',
  schedule_name: 'Test Schedule',
  work_start: '08:00',
  work_end: '17:00',
  break_start: '12:00',
  break_end: '13:00',
  late_grace_minutes: 15,
  work_days: [1, 2, 3, 4, 5],
  is_default: true,
  is_active: true,
  created_at: new Date().toISOString(),
  ...overrides,
});

// Arbitrary for generating valid time strings (HH:MM format)
const timeStringArb = fc.tuple(
  fc.integer({ min: 0, max: 23 }),
  fc.integer({ min: 0, max: 59 })
).map(([h, m]) => `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);

// Arbitrary for generating work schedules
const scheduleArb = fc.record({
  work_start: timeStringArb,
  late_grace_minutes: fc.integer({ min: 0, max: 60 }),
}).map(({ work_start, late_grace_minutes }) => createSchedule({ work_start, late_grace_minutes }));

describe('Attendance Utils - Property Tests', () => {
  /**
   * Property 2: Late Status Determination
   * For any clock-in time and work schedule, if the clock-in time is after 
   * (work_start + late_grace_minutes), the status shall be 'late' and late_minutes 
   * shall equal the difference in minutes; otherwise, the status shall be 'present' 
   * and late_minutes shall be 0.
   * 
   * Validates: Requirements 1.2, 1.3
   */
  describe('Property 2: Late Status Determination', () => {
    it('should mark as present when clock-in is within grace period', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 23 }), // work start hour
          fc.integer({ min: 0, max: 59 }), // work start minute
          fc.integer({ min: 0, max: 30 }), // grace period
          fc.integer({ min: 0, max: 30 }), // minutes offset (within grace)
          (startHour, startMin, gracePeriod, offset) => {
            // Ensure offset is within grace period
            const actualOffset = Math.min(offset, gracePeriod);
            
            const schedule = createSchedule({
              work_start: `${startHour.toString().padStart(2, '0')}:${startMin.toString().padStart(2, '0')}`,
              late_grace_minutes: gracePeriod,
            });
            
            const baseDate = new Date(2025, 0, 6); // A Monday
            const clockIn = parseTimeString(schedule.work_start, baseDate);
            clockIn.setMinutes(clockIn.getMinutes() + actualOffset);
            
            const status = determineAttendanceStatus(clockIn, schedule);
            const lateMinutes = calculateLateMinutes(clockIn, schedule);
            
            expect(status).toBe('present');
            expect(lateMinutes).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should mark as late when clock-in is after grace period', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 20 }), // work start hour (limited to avoid overflow)
          fc.integer({ min: 0, max: 59 }), // work start minute
          fc.integer({ min: 5, max: 15 }), // grace period
          fc.integer({ min: 1, max: 60 }), // minutes late after grace
          (startHour, startMin, gracePeriod, minutesLate) => {
            const schedule = createSchedule({
              work_start: `${startHour.toString().padStart(2, '0')}:${startMin.toString().padStart(2, '0')}`,
              late_grace_minutes: gracePeriod,
            });
            
            const baseDate = new Date(2025, 0, 6); // A Monday
            const clockIn = parseTimeString(schedule.work_start, baseDate);
            // Add grace period + extra minutes to be late
            clockIn.setMinutes(clockIn.getMinutes() + gracePeriod + minutesLate);
            
            const status = determineAttendanceStatus(clockIn, schedule);
            const lateMinutes = calculateLateMinutes(clockIn, schedule);
            
            expect(status).toBe('late');
            expect(lateMinutes).toBeGreaterThan(0);
            // Late minutes should be approximately grace + minutesLate
            expect(lateMinutes).toBe(gracePeriod + minutesLate);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should calculate correct late minutes', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 120 }), // minutes late
          (minutesLate) => {
            const schedule = createSchedule({
              work_start: '08:00',
              late_grace_minutes: 0, // No grace period for exact calculation
            });
            
            const baseDate = new Date(2025, 0, 6);
            const clockIn = parseTimeString('08:00', baseDate);
            clockIn.setMinutes(clockIn.getMinutes() + minutesLate);
            
            const lateMinutes = calculateLateMinutes(clockIn, schedule);
            
            expect(lateMinutes).toBe(minutesLate);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 5: Work Hours Calculation
   * For any attendance record with both clock_in and clock_out times, work_hours 
   * shall equal (clock_out - clock_in - 1 hour for lunch), capped at 8 hours, 
   * and overtime_hours shall equal any excess beyond 8 hours.
   * 
   * Validates: Requirements 2.2, 2.3
   */
  describe('Property 5: Work Hours Calculation', () => {
    it('should calculate work hours correctly (subtracting 1 hour for lunch)', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 2, max: 12 }), // hours worked (before lunch subtraction)
          (hoursWorked) => {
            const clockIn = new Date(2025, 0, 6, 8, 0, 0); // 8:00 AM
            const clockOut = new Date(2025, 0, 6, 8 + hoursWorked, 0, 0);
            
            const { workHours, overtimeHours } = calculateWorkHours(clockIn, clockOut);
            
            const expectedWorkHours = Math.min(hoursWorked - 1, 8);
            const expectedOvertime = Math.max(0, hoursWorked - 1 - 8);
            
            expect(workHours).toBe(expectedWorkHours);
            expect(overtimeHours).toBe(expectedOvertime);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should cap work hours at 8 and calculate overtime', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 10, max: 16 }), // hours worked (will result in overtime)
          (hoursWorked) => {
            const clockIn = new Date(2025, 0, 6, 7, 0, 0); // 7:00 AM
            const clockOut = new Date(2025, 0, 6, 7 + hoursWorked, 0, 0);
            
            const { workHours, overtimeHours } = calculateWorkHours(clockIn, clockOut);
            
            // After subtracting 1 hour lunch, if > 8, cap at 8
            const totalAfterLunch = hoursWorked - 1;
            
            if (totalAfterLunch > 8) {
              expect(workHours).toBe(8);
              expect(overtimeHours).toBe(totalAfterLunch - 8);
            } else {
              expect(workHours).toBe(totalAfterLunch);
              expect(overtimeHours).toBe(0);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return 0 work hours if clock-out is before or equal to clock-in + 1 hour', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 60 }), // minutes worked (less than 1 hour)
          (minutesWorked) => {
            const clockIn = new Date(2025, 0, 6, 8, 0, 0);
            const clockOut = new Date(2025, 0, 6, 8, minutesWorked, 0);
            
            const { workHours, overtimeHours } = calculateWorkHours(clockIn, clockOut);
            
            // Less than 1 hour means 0 after lunch subtraction
            expect(workHours).toBe(0);
            expect(overtimeHours).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle fractional hours correctly', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 2, max: 8 }), // hours
          fc.integer({ min: 0, max: 59 }), // minutes
          (hours, minutes) => {
            const clockIn = new Date(2025, 0, 6, 8, 0, 0);
            const clockOut = new Date(2025, 0, 6, 8 + hours, minutes, 0);
            
            const { workHours, overtimeHours } = calculateWorkHours(clockIn, clockOut);
            
            // Total hours minus 1 for lunch
            const totalHours = hours + minutes / 60 - 1;
            const expectedWork = Math.min(Math.max(0, totalHours), 8);
            const expectedOvertime = Math.max(0, totalHours - 8);
            
            // Allow small floating point differences
            expect(workHours).toBeCloseTo(expectedWork, 1);
            expect(overtimeHours).toBeCloseTo(expectedOvertime, 1);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Unit tests for edge cases
  describe('Unit Tests - Edge Cases', () => {
    it('should handle exact work start time as present', () => {
      const schedule = createSchedule({ work_start: '08:00', late_grace_minutes: 15 });
      const clockIn = parseTimeString('08:00', new Date(2025, 0, 6));
      
      expect(determineAttendanceStatus(clockIn, schedule)).toBe('present');
      expect(calculateLateMinutes(clockIn, schedule)).toBe(0);
    });

    it('should handle exact grace period boundary as present', () => {
      const schedule = createSchedule({ work_start: '08:00', late_grace_minutes: 15 });
      const clockIn = parseTimeString('08:15', new Date(2025, 0, 6));
      
      expect(determineAttendanceStatus(clockIn, schedule)).toBe('present');
      expect(calculateLateMinutes(clockIn, schedule)).toBe(0);
    });

    it('should handle 1 minute after grace period as late', () => {
      const schedule = createSchedule({ work_start: '08:00', late_grace_minutes: 15 });
      const clockIn = parseTimeString('08:16', new Date(2025, 0, 6));
      
      expect(determineAttendanceStatus(clockIn, schedule)).toBe('late');
      expect(calculateLateMinutes(clockIn, schedule)).toBe(16);
    });

    it('should format time correctly', () => {
      const timestamp = new Date(2025, 0, 6, 8, 30, 0);
      const formatted = formatAttendanceTime(timestamp);
      expect(formatted).toMatch(/08:30\s*(AM)?/i);
    });

    it('should format null time as --:--', () => {
      expect(formatAttendanceTime(null)).toBe('--:--');
    });

    it('should format work hours correctly', () => {
      expect(formatWorkHours(8)).toBe('8h');
      expect(formatWorkHours(8.5)).toBe('8h 30m');
      expect(formatWorkHours(0)).toBe('0h');
      expect(formatWorkHours(null)).toBe('-');
    });

    it('should correctly identify weekends', () => {
      // Saturday
      expect(isWeekend(new Date(2025, 0, 4))).toBe(true);
      // Sunday
      expect(isWeekend(new Date(2025, 0, 5))).toBe(true);
      // Monday
      expect(isWeekend(new Date(2025, 0, 6))).toBe(false);
    });

    it('should return correct day of week', () => {
      // Sunday = 0
      expect(getDayOfWeek(new Date(2025, 0, 5))).toBe(0);
      // Monday = 1
      expect(getDayOfWeek(new Date(2025, 0, 6))).toBe(1);
      // Saturday = 6
      expect(getDayOfWeek(new Date(2025, 0, 4))).toBe(6);
    });
  });
});
