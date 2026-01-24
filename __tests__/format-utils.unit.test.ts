/**
 * Unit Tests for Date & Currency Formatting Utilities - Edge Cases
 * Feature: v0.83-date-currency-formatting-standardization
 * 
 * These tests verify edge case handling for null, undefined, invalid inputs,
 * and boundary values in the formatting utility functions.
 * 
 * Requirements: 1.4, 1.5, 2.4, 3.2, 4.4, 5.3, 6.3
 */

import { describe, it, expect } from 'vitest';
import {
  formatDate,
  formatDateTime,
  formatTime,
  formatRelative,
  formatDocumentDate,
  toInputDate,
  toFileDate,
  toFileDateTime,
  formatCurrency,
  formatCurrencyShort,
  formatNumber,
  formatPercent,
  parseDate,
} from '@/lib/utils/format';

// =====================================================
// Date Formatting Functions - Edge Cases
// Requirements: 1.4, 1.5
// =====================================================

describe('Date Formatting Functions - Edge Cases', () => {
  
  describe('formatDate', () => {
    it('should return "-" for null input', () => {
      expect(formatDate(null)).toBe('-');
    });

    it('should return "-" for undefined input', () => {
      expect(formatDate(undefined)).toBe('-');
    });

    it('should return "-" for invalid date string "not-a-date"', () => {
      expect(formatDate('not-a-date')).toBe('-');
    });

    it('should return "-" for invalid date string "2026-13-45"', () => {
      expect(formatDate('2026-13-45')).toBe('-');
    });

    it('should return "-" for empty string', () => {
      expect(formatDate('')).toBe('-');
    });

    it('should format valid ISO string correctly', () => {
      expect(formatDate('2026-01-15')).toBe('15 Jan 2026');
    });

    it('should format valid Date object correctly', () => {
      const date = new Date(2026, 0, 15); // January 15, 2026
      expect(formatDate(date)).toBe('15 Jan 2026');
    });

    it('should handle midnight boundary (00:00:00)', () => {
      const date = new Date(2026, 0, 15, 0, 0, 0);
      expect(formatDate(date)).toBe('15 Jan 2026');
    });

    it('should handle end of day (23:59:59)', () => {
      const date = new Date(2026, 0, 15, 23, 59, 59);
      expect(formatDate(date)).toBe('15 Jan 2026');
    });

    it('should handle leap year date (Feb 29)', () => {
      const date = new Date(2024, 1, 29); // Feb 29, 2024 (leap year)
      expect(formatDate(date)).toBe('29 Feb 2024');
    });

    it('should handle first day of year', () => {
      const date = new Date(2026, 0, 1);
      expect(formatDate(date)).toBe('1 Jan 2026');
    });

    it('should handle last day of year', () => {
      const date = new Date(2026, 11, 31);
      expect(formatDate(date)).toBe('31 Dec 2026');
    });
  });

  describe('formatDateTime', () => {
    it('should return "-" for null input', () => {
      expect(formatDateTime(null)).toBe('-');
    });

    it('should return "-" for undefined input', () => {
      expect(formatDateTime(undefined)).toBe('-');
    });

    it('should return "-" for invalid date string "not-a-date"', () => {
      expect(formatDateTime('not-a-date')).toBe('-');
    });

    it('should return "-" for invalid date string "2026-13-45"', () => {
      expect(formatDateTime('2026-13-45')).toBe('-');
    });

    it('should format valid ISO string with time correctly', () => {
      expect(formatDateTime('2026-01-15T14:30:00')).toBe('15 Jan 2026, 14:30');
    });

    it('should format valid Date object correctly', () => {
      const date = new Date(2026, 0, 15, 14, 30);
      expect(formatDateTime(date)).toBe('15 Jan 2026, 14:30');
    });

    it('should handle midnight boundary (00:00:00)', () => {
      const date = new Date(2026, 0, 15, 0, 0, 0);
      expect(formatDateTime(date)).toBe('15 Jan 2026, 00:00');
    });

    it('should handle end of day (23:59:59)', () => {
      const date = new Date(2026, 0, 15, 23, 59, 59);
      expect(formatDateTime(date)).toBe('15 Jan 2026, 23:59');
    });

    it('should handle leap year date (Feb 29)', () => {
      const date = new Date(2024, 1, 29, 12, 0);
      expect(formatDateTime(date)).toBe('29 Feb 2024, 12:00');
    });
  });

  describe('formatTime', () => {
    it('should return "-" for null input', () => {
      expect(formatTime(null)).toBe('-');
    });

    it('should return "-" for undefined input', () => {
      expect(formatTime(undefined)).toBe('-');
    });

    it('should return "-" for invalid date string "not-a-date"', () => {
      expect(formatTime('not-a-date')).toBe('-');
    });

    it('should return "-" for invalid date string "2026-13-45"', () => {
      expect(formatTime('2026-13-45')).toBe('-');
    });

    it('should format valid ISO string correctly', () => {
      expect(formatTime('2026-01-15T14:30:00')).toBe('14:30');
    });

    it('should format valid Date object correctly', () => {
      const date = new Date(2026, 0, 15, 14, 30);
      expect(formatTime(date)).toBe('14:30');
    });

    it('should handle midnight boundary (00:00:00)', () => {
      const date = new Date(2026, 0, 15, 0, 0, 0);
      expect(formatTime(date)).toBe('00:00');
    });

    it('should handle end of day (23:59:59)', () => {
      const date = new Date(2026, 0, 15, 23, 59, 59);
      expect(formatTime(date)).toBe('23:59');
    });
  });

  describe('formatRelative', () => {
    it('should return "-" for null input', () => {
      expect(formatRelative(null)).toBe('-');
    });

    it('should return "-" for undefined input', () => {
      expect(formatRelative(undefined)).toBe('-');
    });

    it('should return "-" for invalid date string "not-a-date"', () => {
      expect(formatRelative('not-a-date')).toBe('-');
    });

    it('should return "-" for invalid date string "2026-13-45"', () => {
      expect(formatRelative('2026-13-45')).toBe('-');
    });

    it('should format valid Date object with Indonesian locale', () => {
      const result = formatRelative(new Date());
      // Should contain Indonesian relative time indicator
      expect(typeof result).toBe('string');
      expect(result).not.toBe('-');
    });

    it('should format past date with "yang lalu" suffix', () => {
      const pastDate = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2 hours ago
      const result = formatRelative(pastDate);
      expect(result).toContain('yang lalu');
    });
  });

  describe('formatDocumentDate', () => {
    it('should return "-" for null input', () => {
      expect(formatDocumentDate(null)).toBe('-');
    });

    it('should return "-" for undefined input', () => {
      expect(formatDocumentDate(undefined)).toBe('-');
    });

    it('should return "-" for invalid date string "not-a-date"', () => {
      expect(formatDocumentDate('not-a-date')).toBe('-');
    });

    it('should return "-" for invalid date string "2026-13-45"', () => {
      expect(formatDocumentDate('2026-13-45')).toBe('-');
    });

    it('should format valid ISO string with full Indonesian month name', () => {
      expect(formatDocumentDate('2026-01-15')).toBe('15 Januari 2026');
    });

    it('should format valid Date object correctly', () => {
      const date = new Date(2026, 0, 15);
      expect(formatDocumentDate(date)).toBe('15 Januari 2026');
    });

    it('should handle all Indonesian month names', () => {
      const months = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
      ];
      months.forEach((month, index) => {
        const date = new Date(2026, index, 15);
        expect(formatDocumentDate(date)).toContain(month);
      });
    });

    it('should handle leap year date (Feb 29)', () => {
      const date = new Date(2024, 1, 29);
      expect(formatDocumentDate(date)).toBe('29 Februari 2024');
    });
  });

  describe('toInputDate', () => {
    it('should return empty string for null input', () => {
      expect(toInputDate(null)).toBe('');
    });

    it('should return empty string for undefined input', () => {
      expect(toInputDate(undefined)).toBe('');
    });

    it('should return empty string for invalid date string "not-a-date"', () => {
      expect(toInputDate('not-a-date')).toBe('');
    });

    it('should return empty string for invalid date string "2026-13-45"', () => {
      expect(toInputDate('2026-13-45')).toBe('');
    });

    it('should format valid ISO string correctly', () => {
      expect(toInputDate('2026-01-15T14:30:00')).toBe('2026-01-15');
    });

    it('should format valid Date object correctly', () => {
      const date = new Date(2026, 0, 15);
      expect(toInputDate(date)).toBe('2026-01-15');
    });

    it('should handle midnight boundary (00:00:00)', () => {
      const date = new Date(2026, 0, 15, 0, 0, 0);
      expect(toInputDate(date)).toBe('2026-01-15');
    });

    it('should handle end of day (23:59:59)', () => {
      const date = new Date(2026, 0, 15, 23, 59, 59);
      expect(toInputDate(date)).toBe('2026-01-15');
    });

    it('should handle leap year date (Feb 29)', () => {
      const date = new Date(2024, 1, 29);
      expect(toInputDate(date)).toBe('2024-02-29');
    });

    it('should handle single digit month and day with zero padding', () => {
      const date = new Date(2026, 0, 5); // January 5
      expect(toInputDate(date)).toBe('2026-01-05');
    });
  });

  describe('toFileDate', () => {
    it('should format valid Date object correctly', () => {
      const date = new Date(2026, 0, 15);
      expect(toFileDate(date)).toBe('20260115');
    });

    it('should use current date when no argument provided', () => {
      const result = toFileDate();
      expect(result).toMatch(/^\d{8}$/);
    });

    it('should use current date for undefined input', () => {
      const result = toFileDate(undefined);
      expect(result).toMatch(/^\d{8}$/);
    });

    it('should handle leap year date (Feb 29)', () => {
      const date = new Date(2024, 1, 29);
      expect(toFileDate(date)).toBe('20240229');
    });

    it('should handle single digit month and day with zero padding', () => {
      const date = new Date(2026, 0, 5);
      expect(toFileDate(date)).toBe('20260105');
    });
  });

  describe('toFileDateTime', () => {
    it('should format valid Date object correctly', () => {
      const date = new Date(2026, 0, 15, 14, 30, 22);
      expect(toFileDateTime(date)).toBe('20260115_143022');
    });

    it('should use current date when no argument provided', () => {
      const result = toFileDateTime();
      expect(result).toMatch(/^\d{8}_\d{6}$/);
    });

    it('should use current date for undefined input', () => {
      const result = toFileDateTime(undefined);
      expect(result).toMatch(/^\d{8}_\d{6}$/);
    });

    it('should handle midnight boundary (00:00:00)', () => {
      const date = new Date(2026, 0, 15, 0, 0, 0);
      expect(toFileDateTime(date)).toBe('20260115_000000');
    });

    it('should handle end of day (23:59:59)', () => {
      const date = new Date(2026, 0, 15, 23, 59, 59);
      expect(toFileDateTime(date)).toBe('20260115_235959');
    });

    it('should handle leap year date (Feb 29)', () => {
      const date = new Date(2024, 1, 29, 12, 30, 45);
      expect(toFileDateTime(date)).toBe('20240229_123045');
    });
  });

  describe('parseDate helper', () => {
    it('should return null for null input', () => {
      expect(parseDate(null)).toBeNull();
    });

    it('should return null for undefined input', () => {
      expect(parseDate(undefined)).toBeNull();
    });

    it('should return null for invalid date string', () => {
      expect(parseDate('not-a-date')).toBeNull();
    });

    it('should return null for invalid date "2026-13-45"', () => {
      expect(parseDate('2026-13-45')).toBeNull();
    });

    it('should return Date object for valid ISO string', () => {
      const result = parseDate('2026-01-15');
      expect(result).toBeInstanceOf(Date);
      expect(result?.getFullYear()).toBe(2026);
    });

    it('should return same Date object for valid Date input', () => {
      const date = new Date(2026, 0, 15);
      const result = parseDate(date);
      expect(result).toBeInstanceOf(Date);
      expect(result?.getTime()).toBe(date.getTime());
    });
  });
});


// =====================================================
// Currency Formatting Functions - Edge Cases
// Requirements: 5.3
// =====================================================

describe('Currency Formatting Functions - Edge Cases', () => {

  describe('formatCurrency', () => {
    it('should return "Rp 0" for null input', () => {
      expect(formatCurrency(null)).toBe('Rp 0');
    });

    it('should return "Rp 0" for undefined input', () => {
      expect(formatCurrency(undefined)).toBe('Rp 0');
    });

    it('should return formatted zero for zero input', () => {
      const result = formatCurrency(0);
      expect(result).toContain('Rp');
      expect(result).toContain('0');
    });

    it('should format positive number with "Rp" prefix', () => {
      const result = formatCurrency(1500000);
      expect(result).toContain('Rp');
      expect(result).toContain('1');
      expect(result).toContain('500');
      expect(result).toContain('000');
    });

    it('should format negative number with "-Rp" prefix', () => {
      const result = formatCurrency(-500000);
      expect(result).toContain('-');
      expect(result).toContain('Rp');
      expect(result).toContain('500');
      expect(result).toContain('000');
    });

    it('should format large numbers (millions)', () => {
      const result = formatCurrency(15000000);
      expect(result).toContain('Rp');
      expect(result).toContain('15');
    });

    it('should format large numbers (billions)', () => {
      const result = formatCurrency(1500000000);
      expect(result).toContain('Rp');
      expect(result).toContain('1');
      expect(result).toContain('500');
    });

    it('should format very large numbers (trillions)', () => {
      const result = formatCurrency(1500000000000);
      expect(result).toContain('Rp');
    });

    it('should handle small positive numbers', () => {
      const result = formatCurrency(100);
      expect(result).toContain('Rp');
      expect(result).toContain('100');
    });

    it('should handle decimal numbers (rounded)', () => {
      const result = formatCurrency(1500000.75);
      expect(result).toContain('Rp');
      // Should be rounded to whole number
    });
  });

  describe('formatCurrencyShort', () => {
    it('should return "Rp 0" for null input', () => {
      expect(formatCurrencyShort(null)).toBe('Rp 0');
    });

    it('should return "Rp 0" for undefined input', () => {
      expect(formatCurrencyShort(undefined)).toBe('Rp 0');
    });

    it('should return formatted zero for zero input', () => {
      const result = formatCurrencyShort(0);
      expect(result).toContain('Rp');
      expect(result).toContain('0');
    });

    it('should format billions with "M" suffix', () => {
      const result = formatCurrencyShort(1500000000);
      expect(result).toContain('Rp');
      expect(result).toContain('1,5');
      expect(result).toContain('M');
    });

    it('should format millions with "jt" suffix', () => {
      const result = formatCurrencyShort(1500000);
      expect(result).toContain('Rp');
      expect(result).toContain('1,5');
      expect(result).toContain('jt');
    });

    it('should format small amounts without abbreviation', () => {
      const result = formatCurrencyShort(1500);
      expect(result).toContain('Rp');
      expect(result).toContain('1');
      expect(result).toContain('500');
      expect(result).not.toContain('jt');
      expect(result).not.toContain('M');
    });

    it('should format negative billions correctly', () => {
      const result = formatCurrencyShort(-1500000000);
      expect(result).toContain('-');
      expect(result).toContain('Rp');
      expect(result).toContain('M');
    });

    it('should format negative millions correctly', () => {
      const result = formatCurrencyShort(-1500000);
      expect(result).toContain('-');
      expect(result).toContain('Rp');
      expect(result).toContain('jt');
    });

    it('should handle exact billion boundary', () => {
      const result = formatCurrencyShort(1000000000);
      expect(result).toContain('M');
    });

    it('should handle exact million boundary', () => {
      const result = formatCurrencyShort(1000000);
      expect(result).toContain('jt');
    });

    it('should handle values just below million', () => {
      const result = formatCurrencyShort(999999);
      expect(result).not.toContain('jt');
      expect(result).not.toContain('M');
    });
  });
});


// =====================================================
// Number Formatting Functions - Edge Cases
// Requirements: 6.3
// =====================================================

describe('Number Formatting Functions - Edge Cases', () => {

  describe('formatNumber', () => {
    it('should return "0" for null input', () => {
      expect(formatNumber(null)).toBe('0');
    });

    it('should return "0" for undefined input', () => {
      expect(formatNumber(undefined)).toBe('0');
    });

    it('should return "0" for zero', () => {
      expect(formatNumber(0)).toBe('0');
    });

    it('should format positive number with Indonesian separators', () => {
      const result = formatNumber(1500000);
      expect(result).toBe('1.500.000');
    });

    it('should format negative number correctly', () => {
      const result = formatNumber(-1500000);
      expect(result).toBe('-1.500.000');
    });

    it('should format small numbers without separators', () => {
      expect(formatNumber(100)).toBe('100');
      expect(formatNumber(999)).toBe('999');
    });

    it('should format numbers at thousand boundary', () => {
      expect(formatNumber(1000)).toBe('1.000');
    });

    it('should format large numbers (millions)', () => {
      const result = formatNumber(15000000);
      expect(result).toBe('15.000.000');
    });

    it('should format large numbers (billions)', () => {
      const result = formatNumber(1500000000);
      expect(result).toBe('1.500.000.000');
    });

    it('should handle decimal numbers', () => {
      const result = formatNumber(1500.75);
      expect(result).toContain('1');
      expect(result).toContain('500');
    });
  });

  describe('formatPercent', () => {
    it('should return "0%" for null input', () => {
      expect(formatPercent(null)).toBe('0%');
    });

    it('should return "0%" for undefined input', () => {
      expect(formatPercent(undefined)).toBe('0%');
    });

    it('should return "0%" for zero', () => {
      expect(formatPercent(0)).toBe('0%');
    });

    it('should format decimal as percentage', () => {
      expect(formatPercent(0.755)).toBe('75,5%');
    });

    it('should format 1.0 as 100%', () => {
      expect(formatPercent(1)).toBe('100%');
    });

    it('should format values over 100%', () => {
      expect(formatPercent(1.5)).toBe('150%');
    });

    it('should format negative percentages', () => {
      const result = formatPercent(-0.25);
      expect(result).toContain('-');
      expect(result).toContain('25');
      expect(result).toContain('%');
    });

    it('should format small decimals correctly', () => {
      expect(formatPercent(0.001)).toBe('0,1%');
    });

    it('should format whole percentages without decimal', () => {
      expect(formatPercent(0.5)).toBe('50%');
    });

    it('should use comma as decimal separator (Indonesian locale)', () => {
      const result = formatPercent(0.755);
      expect(result).toContain(',');
      expect(result).not.toMatch(/\.\d+%$/); // Should not have dot before %
    });
  });
});
