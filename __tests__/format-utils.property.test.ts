/**
 * Feature: v0.83-date-currency-formatting-standardization
 * Property-based tests for date and currency formatting utilities
 * 
 * These tests verify universal properties across randomly generated inputs
 * using fast-check library.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  formatDate,
  formatDateTime,
  formatTime,
} from '@/lib/utils/format';

// =====================================================
// Valid 3-letter month abbreviations used by date-fns
// =====================================================
const VALID_MONTH_ABBREVIATIONS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

// =====================================================
// Custom date arbitrary that only generates valid dates
// fc.date() can sometimes generate Date(NaN), so we filter those out
// =====================================================
const validDateArbitrary = fc.date({
  min: new Date('1970-01-01'),
  max: new Date('2100-12-31'),
}).filter((d) => !isNaN(d.getTime()));

// =====================================================
// Property 1: Date Formatting Pattern Validity
// **Validates: Requirements 1.1**
// =====================================================
describe('Property 1: Date Formatting Pattern Validity', () => {
  /**
   * For any valid Date object, formatDate SHALL return a string matching
   * the pattern "DD MMM YYYY" where DD is 1-31, MMM is a valid 3-letter
   * month abbreviation, and YYYY is a 4-digit year.
   */
  it('formatDate returns pattern "D MMM YYYY" for any valid Date object', () => {
    fc.assert(
      fc.property(
        validDateArbitrary,
        (date) => {
          const result = formatDate(date);
          
          // Should not be the fallback
          if (result === '-') return false;
          
          // Pattern: "D MMM YYYY" or "DD MMM YYYY" (day can be 1 or 2 digits)
          // Example: "1 Jan 2026" or "15 Jan 2026"
          const pattern = /^(\d{1,2}) ([A-Z][a-z]{2}) (\d{4})$/;
          const match = result.match(pattern);
          
          if (!match) return false;
          
          const day = parseInt(match[1], 10);
          const month = match[2];
          const year = parseInt(match[3], 10);
          
          // Validate day is in valid range (1-31)
          if (day < 1 || day > 31) return false;
          
          // Validate month is a valid 3-letter abbreviation
          if (!VALID_MONTH_ABBREVIATIONS.includes(month)) return false;
          
          // Validate year is a 4-digit number
          if (year < 1000 || year > 9999) return false;
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * For any valid ISO date string, formatDate SHALL return a string matching
   * the pattern "DD MMM YYYY".
   */
  it('formatDate returns pattern "D MMM YYYY" for any valid ISO date string', () => {
    fc.assert(
      fc.property(
        validDateArbitrary,
        (date) => {
          // Convert to ISO string to test string input
          const isoString = date.toISOString();
          const result = formatDate(isoString);
          
          // Should not be the fallback
          if (result === '-') return false;
          
          // Pattern: "D MMM YYYY" or "DD MMM YYYY"
          const pattern = /^(\d{1,2}) ([A-Z][a-z]{2}) (\d{4})$/;
          const match = result.match(pattern);
          
          if (!match) return false;
          
          const day = parseInt(match[1], 10);
          const month = match[2];
          const year = parseInt(match[3], 10);
          
          // Validate components
          if (day < 1 || day > 31) return false;
          if (!VALID_MONTH_ABBREVIATIONS.includes(month)) return false;
          if (year < 1000 || year > 9999) return false;
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * The formatted date should preserve the original date's day, month, and year.
   */
  it('formatDate preserves the original date components', () => {
    fc.assert(
      fc.property(
        validDateArbitrary,
        (date) => {
          const result = formatDate(date);
          
          if (result === '-') return false;
          
          const pattern = /^(\d{1,2}) ([A-Z][a-z]{2}) (\d{4})$/;
          const match = result.match(pattern);
          
          if (!match) return false;
          
          const formattedDay = parseInt(match[1], 10);
          const formattedMonth = match[2];
          const formattedYear = parseInt(match[3], 10);
          
          // Check that the formatted values match the original date
          const originalDay = date.getDate();
          const originalMonth = VALID_MONTH_ABBREVIATIONS[date.getMonth()];
          const originalYear = date.getFullYear();
          
          return (
            formattedDay === originalDay &&
            formattedMonth === originalMonth &&
            formattedYear === originalYear
          );
        }
      ),
      { numRuns: 100 }
    );
  });
});

// =====================================================
// Property 2: DateTime Formatting Pattern Validity
// **Validates: Requirements 1.2**
// =====================================================
describe('Property 2: DateTime Formatting Pattern Validity', () => {
  /**
   * For any valid Date object, formatDateTime SHALL return a string matching
   * the pattern "DD MMM YYYY, HH:mm" where the date portion follows Property 1
   * and time is in 24-hour format.
   */
  it('formatDateTime returns pattern "D MMM YYYY, HH:mm" for any valid Date object', () => {
    fc.assert(
      fc.property(
        validDateArbitrary,
        (date) => {
          const result = formatDateTime(date);
          
          // Should not be the fallback
          if (result === '-') return false;
          
          // Pattern: "D MMM YYYY, HH:mm" or "DD MMM YYYY, HH:mm"
          // Example: "15 Jan 2026, 14:30"
          const pattern = /^(\d{1,2}) ([A-Z][a-z]{2}) (\d{4}), (\d{2}):(\d{2})$/;
          const match = result.match(pattern);
          
          if (!match) return false;
          
          const day = parseInt(match[1], 10);
          const month = match[2];
          const year = parseInt(match[3], 10);
          const hour = parseInt(match[4], 10);
          const minute = parseInt(match[5], 10);
          
          // Validate day is in valid range (1-31)
          if (day < 1 || day > 31) return false;
          
          // Validate month is a valid 3-letter abbreviation
          if (!VALID_MONTH_ABBREVIATIONS.includes(month)) return false;
          
          // Validate year is a 4-digit number
          if (year < 1000 || year > 9999) return false;
          
          // Validate hour is in 24-hour format (00-23)
          if (hour < 0 || hour > 23) return false;
          
          // Validate minute is in valid range (00-59)
          if (minute < 0 || minute > 59) return false;
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * For any valid ISO date string, formatDateTime SHALL return a string matching
   * the pattern "DD MMM YYYY, HH:mm".
   */
  it('formatDateTime returns pattern "D MMM YYYY, HH:mm" for any valid ISO date string', () => {
    fc.assert(
      fc.property(
        validDateArbitrary,
        (date) => {
          // Convert to ISO string to test string input
          const isoString = date.toISOString();
          const result = formatDateTime(isoString);
          
          // Should not be the fallback
          if (result === '-') return false;
          
          // Pattern: "D MMM YYYY, HH:mm"
          const pattern = /^(\d{1,2}) ([A-Z][a-z]{2}) (\d{4}), (\d{2}):(\d{2})$/;
          const match = result.match(pattern);
          
          if (!match) return false;
          
          const day = parseInt(match[1], 10);
          const month = match[2];
          const year = parseInt(match[3], 10);
          const hour = parseInt(match[4], 10);
          const minute = parseInt(match[5], 10);
          
          // Validate components
          if (day < 1 || day > 31) return false;
          if (!VALID_MONTH_ABBREVIATIONS.includes(month)) return false;
          if (year < 1000 || year > 9999) return false;
          if (hour < 0 || hour > 23) return false;
          if (minute < 0 || minute > 59) return false;
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * The formatted datetime should preserve the original date's components.
   */
  it('formatDateTime preserves the original date and time components', () => {
    fc.assert(
      fc.property(
        validDateArbitrary,
        (date) => {
          const result = formatDateTime(date);
          
          if (result === '-') return false;
          
          const pattern = /^(\d{1,2}) ([A-Z][a-z]{2}) (\d{4}), (\d{2}):(\d{2})$/;
          const match = result.match(pattern);
          
          if (!match) return false;
          
          const formattedDay = parseInt(match[1], 10);
          const formattedMonth = match[2];
          const formattedYear = parseInt(match[3], 10);
          const formattedHour = parseInt(match[4], 10);
          const formattedMinute = parseInt(match[5], 10);
          
          // Check that the formatted values match the original date
          const originalDay = date.getDate();
          const originalMonth = VALID_MONTH_ABBREVIATIONS[date.getMonth()];
          const originalYear = date.getFullYear();
          const originalHour = date.getHours();
          const originalMinute = date.getMinutes();
          
          return (
            formattedDay === originalDay &&
            formattedMonth === originalMonth &&
            formattedYear === originalYear &&
            formattedHour === originalHour &&
            formattedMinute === originalMinute
          );
        }
      ),
      { numRuns: 100 }
    );
  });
});

// =====================================================
// Property 3: Time Formatting Pattern Validity
// **Validates: Requirements 1.3**
// =====================================================
describe('Property 3: Time Formatting Pattern Validity', () => {
  /**
   * For any valid Date object, formatTime SHALL return a string matching
   * the pattern "HH:mm" where HH is 00-23 and mm is 00-59.
   */
  it('formatTime returns pattern "HH:mm" for any valid Date object', () => {
    fc.assert(
      fc.property(
        validDateArbitrary,
        (date) => {
          const result = formatTime(date);
          
          // Should not be the fallback
          if (result === '-') return false;
          
          // Pattern: "HH:mm" (always 2 digits for hour and minute)
          // Example: "14:30", "00:00", "23:59"
          const pattern = /^(\d{2}):(\d{2})$/;
          const match = result.match(pattern);
          
          if (!match) return false;
          
          const hour = parseInt(match[1], 10);
          const minute = parseInt(match[2], 10);
          
          // Validate hour is in 24-hour format (00-23)
          if (hour < 0 || hour > 23) return false;
          
          // Validate minute is in valid range (00-59)
          if (minute < 0 || minute > 59) return false;
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * For any valid ISO date string, formatTime SHALL return a string matching
   * the pattern "HH:mm".
   */
  it('formatTime returns pattern "HH:mm" for any valid ISO date string', () => {
    fc.assert(
      fc.property(
        validDateArbitrary,
        (date) => {
          // Convert to ISO string to test string input
          const isoString = date.toISOString();
          const result = formatTime(isoString);
          
          // Should not be the fallback
          if (result === '-') return false;
          
          // Pattern: "HH:mm"
          const pattern = /^(\d{2}):(\d{2})$/;
          const match = result.match(pattern);
          
          if (!match) return false;
          
          const hour = parseInt(match[1], 10);
          const minute = parseInt(match[2], 10);
          
          // Validate components
          if (hour < 0 || hour > 23) return false;
          if (minute < 0 || minute > 59) return false;
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * The formatted time should preserve the original date's hour and minute.
   */
  it('formatTime preserves the original time components', () => {
    fc.assert(
      fc.property(
        validDateArbitrary,
        (date) => {
          const result = formatTime(date);
          
          if (result === '-') return false;
          
          const pattern = /^(\d{2}):(\d{2})$/;
          const match = result.match(pattern);
          
          if (!match) return false;
          
          const formattedHour = parseInt(match[1], 10);
          const formattedMinute = parseInt(match[2], 10);
          
          // Check that the formatted values match the original date
          const originalHour = date.getHours();
          const originalMinute = date.getMinutes();
          
          return (
            formattedHour === originalHour &&
            formattedMinute === originalMinute
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * formatTime should always return exactly 5 characters (HH:mm format).
   */
  it('formatTime always returns exactly 5 characters for valid dates', () => {
    fc.assert(
      fc.property(
        validDateArbitrary,
        (date) => {
          const result = formatTime(date);
          
          // Should not be the fallback
          if (result === '-') return false;
          
          // Should always be exactly 5 characters: "HH:mm"
          return result.length === 5;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * formatTime should handle boundary times correctly (00:00 and 23:59).
   */
  it('formatTime handles boundary times correctly', () => {
    // Test midnight
    const midnight = new Date(2026, 0, 15, 0, 0, 0);
    expect(formatTime(midnight)).toBe('00:00');
    
    // Test end of day
    const endOfDay = new Date(2026, 0, 15, 23, 59, 59);
    expect(formatTime(endOfDay)).toBe('23:59');
    
    // Test noon
    const noon = new Date(2026, 0, 15, 12, 0, 0);
    expect(formatTime(noon)).toBe('12:00');
  });
});


// =====================================================
// Property 4: Invalid Date Fallback
// **Validates: Requirements 1.5**
// =====================================================
import {
  formatRelative,
  formatDocumentDate,
  toInputDate,
} from '@/lib/utils/format';

describe('Property 4: Invalid Date Fallback', () => {
  /**
   * For any random string that is NOT a valid date, all date formatting
   * functions SHALL return "-" as the fallback value.
   */
  it('formatDate returns "-" for any random invalid string', () => {
    fc.assert(
      fc.property(
        fc.string().filter((s) => {
          // Filter out strings that might accidentally be valid dates
          const parsed = new Date(s);
          return isNaN(parsed.getTime());
        }),
        (invalidString) => {
          const result = formatDate(invalidString);
          return result === '-';
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * For any random string that is NOT a valid date, formatDateTime
   * SHALL return "-" as the fallback value.
   */
  it('formatDateTime returns "-" for any random invalid string', () => {
    fc.assert(
      fc.property(
        fc.string().filter((s) => {
          const parsed = new Date(s);
          return isNaN(parsed.getTime());
        }),
        (invalidString) => {
          const result = formatDateTime(invalidString);
          return result === '-';
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * For any random string that is NOT a valid date, formatTime
   * SHALL return "-" as the fallback value.
   */
  it('formatTime returns "-" for any random invalid string', () => {
    fc.assert(
      fc.property(
        fc.string().filter((s) => {
          const parsed = new Date(s);
          return isNaN(parsed.getTime());
        }),
        (invalidString) => {
          const result = formatTime(invalidString);
          return result === '-';
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * For any random string that is NOT a valid date, formatRelative
   * SHALL return "-" as the fallback value.
   */
  it('formatRelative returns "-" for any random invalid string', () => {
    fc.assert(
      fc.property(
        fc.string().filter((s) => {
          const parsed = new Date(s);
          return isNaN(parsed.getTime());
        }),
        (invalidString) => {
          const result = formatRelative(invalidString);
          return result === '-';
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * For any random string that is NOT a valid date, formatDocumentDate
   * SHALL return "-" as the fallback value.
   */
  it('formatDocumentDate returns "-" for any random invalid string', () => {
    fc.assert(
      fc.property(
        fc.string().filter((s) => {
          const parsed = new Date(s);
          return isNaN(parsed.getTime());
        }),
        (invalidString) => {
          const result = formatDocumentDate(invalidString);
          return result === '-';
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * For any random string that is NOT a valid date, toInputDate
   * SHALL return "" (empty string) as the fallback value.
   */
  it('toInputDate returns "" for any random invalid string', () => {
    fc.assert(
      fc.property(
        fc.string().filter((s) => {
          const parsed = new Date(s);
          return isNaN(parsed.getTime());
        }),
        (invalidString) => {
          const result = toInputDate(invalidString);
          return result === '';
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Test specific invalid date patterns that should all return fallback values.
   * These are common invalid date formats that users might accidentally input.
   * 
   * Note: JavaScript's Date constructor is VERY lenient and will parse many strings:
   * - "2026-02-30" becomes March 2nd, 2026 (rolls over)
   * - "2025-02-29" becomes March 1st, 2025 (rolls over)
   * - "date:2026-01-15" parses as Jan 15, 2026 (ignores prefix)
   * 
   * We only include patterns that JavaScript truly cannot parse (returns Invalid Date).
   */
  describe('Specific invalid date patterns', () => {
    // Only include patterns that JavaScript's Date constructor truly cannot parse
    const INVALID_DATE_PATTERNS = [
      'not-a-date',      // Plain text
      'abc123',          // Alphanumeric gibberish
      '!!@@##',          // Special characters
      '',                // Empty string
      '   ',             // Whitespace only
      'undefined',       // String "undefined"
      'null',            // String "null"
      'NaN',             // String "NaN"
      'invalid-date',    // Plain invalid text
      'XXXX-XX-XX',      // Pattern with X's
      '----',            // Just dashes
      'hello world',     // Plain text with space
      'foo bar baz',     // Multiple words
      '@#$%^&*()',       // Only special characters
      'true',            // Boolean string
      'false',           // Boolean string
    ];

    it('formatDate returns "-" for all specific invalid patterns', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...INVALID_DATE_PATTERNS),
          (invalidPattern) => {
            const result = formatDate(invalidPattern);
            return result === '-';
          }
        ),
        { numRuns: INVALID_DATE_PATTERNS.length }
      );
    });

    it('formatDateTime returns "-" for all specific invalid patterns', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...INVALID_DATE_PATTERNS),
          (invalidPattern) => {
            const result = formatDateTime(invalidPattern);
            return result === '-';
          }
        ),
        { numRuns: INVALID_DATE_PATTERNS.length }
      );
    });

    it('formatTime returns "-" for all specific invalid patterns', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...INVALID_DATE_PATTERNS),
          (invalidPattern) => {
            const result = formatTime(invalidPattern);
            return result === '-';
          }
        ),
        { numRuns: INVALID_DATE_PATTERNS.length }
      );
    });

    it('formatRelative returns "-" for all specific invalid patterns', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...INVALID_DATE_PATTERNS),
          (invalidPattern) => {
            const result = formatRelative(invalidPattern);
            return result === '-';
          }
        ),
        { numRuns: INVALID_DATE_PATTERNS.length }
      );
    });

    it('formatDocumentDate returns "-" for all specific invalid patterns', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...INVALID_DATE_PATTERNS),
          (invalidPattern) => {
            const result = formatDocumentDate(invalidPattern);
            return result === '-';
          }
        ),
        { numRuns: INVALID_DATE_PATTERNS.length }
      );
    });

    it('toInputDate returns "" for all specific invalid patterns', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...INVALID_DATE_PATTERNS),
          (invalidPattern) => {
            const result = toInputDate(invalidPattern);
            return result === '';
          }
        ),
        { numRuns: INVALID_DATE_PATTERNS.length }
      );
    });
  });

  /**
   * Test that null and undefined inputs return fallback values.
   */
  describe('Null and undefined inputs', () => {
    it('all date formatting functions return "-" for null', () => {
      expect(formatDate(null)).toBe('-');
      expect(formatDateTime(null)).toBe('-');
      expect(formatTime(null)).toBe('-');
      expect(formatRelative(null)).toBe('-');
      expect(formatDocumentDate(null)).toBe('-');
    });

    it('all date formatting functions return "-" for undefined', () => {
      expect(formatDate(undefined)).toBe('-');
      expect(formatDateTime(undefined)).toBe('-');
      expect(formatTime(undefined)).toBe('-');
      expect(formatRelative(undefined)).toBe('-');
      expect(formatDocumentDate(undefined)).toBe('-');
    });

    it('toInputDate returns "" for null', () => {
      expect(toInputDate(null)).toBe('');
    });

    it('toInputDate returns "" for undefined', () => {
      expect(toInputDate(undefined)).toBe('');
    });
  });

  /**
   * Test with randomly generated gibberish strings that are definitely not dates.
   * Uses fc.string() with filtering to ensure we only test truly invalid dates.
   */
  it('all date functions handle random gibberish strings correctly', () => {
    // Generate random strings and filter out any that might accidentally be valid dates
    const gibberishArbitrary = fc.string({ minLength: 1, maxLength: 50 }).filter((s) => {
      const parsed = new Date(s);
      return isNaN(parsed.getTime());
    });

    fc.assert(
      fc.property(
        gibberishArbitrary,
        (gibberish) => {
          return (
            formatDate(gibberish) === '-' &&
            formatDateTime(gibberish) === '-' &&
            formatTime(gibberish) === '-' &&
            formatRelative(gibberish) === '-' &&
            formatDocumentDate(gibberish) === '-' &&
            toInputDate(gibberish) === ''
          );
        }
      ),
      { numRuns: 100 }
    );
  });
});


// =====================================================
// Property 5: Relative Date Indonesian Formatting
// **Validates: Requirements 2.1, 2.2, 2.3**
// =====================================================
describe('Property 5: Relative Date Indonesian Formatting', () => {
  /**
   * Indonesian relative time indicators used by date-fns with Indonesian locale.
   * These are the key phrases that indicate relative time in Indonesian.
   */
  const INDONESIAN_TIME_UNITS = {
    SECONDS: 'detik',
    MINUTES: 'menit',
    HOURS: 'jam',
    DAYS: 'hari',
    MONTHS: 'bulan',
    YEARS: 'tahun',
    AGO_SUFFIX: 'yang lalu',
    LESS_THAN: 'kurang dari',
    ABOUT: 'sekitar',
  };

  /**
   * Custom arbitrary for generating past dates within specific time ranges.
   * This helps us test different relative time units.
   */
  
  // Generate dates within the last 60 seconds (for "detik" - seconds)
  const recentSecondsArbitrary = fc.integer({ min: 1, max: 59 }).map((seconds) => {
    return new Date(Date.now() - seconds * 1000);
  });

  // Generate dates within the last 45 minutes (for "menit" - minutes)
  // Note: date-fns rounds 45+ minutes to "sekitar 1 jam" (about 1 hour)
  const recentMinutesArbitrary = fc.integer({ min: 1, max: 44 }).map((minutes) => {
    return new Date(Date.now() - minutes * 60 * 1000);
  });

  // Generate dates within the last 24 hours (for "jam" - hours)
  const recentHoursArbitrary = fc.integer({ min: 1, max: 23 }).map((hours) => {
    return new Date(Date.now() - hours * 60 * 60 * 1000);
  });

  // Generate dates within the last 7 days (for "hari" - days)
  const recentDaysArbitrary = fc.integer({ min: 1, max: 6 }).map((days) => {
    return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  });

  // Generate dates within the last year (for various time units)
  const pastDateArbitrary = fc.integer({ min: 1, max: 365 }).map((days) => {
    return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  });

  /**
   * For any past date, formatRelative SHALL return a string containing
   * "yang lalu" (Indonesian for "ago").
   */
  it('formatRelative returns string containing "yang lalu" for any past date', () => {
    fc.assert(
      fc.property(
        pastDateArbitrary,
        (pastDate) => {
          const result = formatRelative(pastDate);
          
          // Should not be the fallback
          if (result === '-') return false;
          
          // Should contain "yang lalu" (Indonesian for "ago")
          return result.includes(INDONESIAN_TIME_UNITS.AGO_SUFFIX);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * For dates within the last minute, formatRelative SHALL return a string
   * containing Indonesian time indicators (may include "detik" or "kurang dari semenit").
   */
  it('formatRelative handles very recent dates (seconds ago)', () => {
    fc.assert(
      fc.property(
        recentSecondsArbitrary,
        (recentDate) => {
          const result = formatRelative(recentDate);
          
          // Should not be the fallback
          if (result === '-') return false;
          
          // Should contain "yang lalu" for past dates
          // date-fns may return "kurang dari semenit yang lalu" for very recent dates
          return result.includes(INDONESIAN_TIME_UNITS.AGO_SUFFIX);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * For dates within the last hour (1-59 minutes ago), formatRelative SHALL
   * return a string containing "menit" (minutes) and "yang lalu".
   */
  it('formatRelative returns string containing "menit" for dates within the last hour', () => {
    fc.assert(
      fc.property(
        recentMinutesArbitrary,
        (recentDate) => {
          const result = formatRelative(recentDate);
          
          // Should not be the fallback
          if (result === '-') return false;
          
          // Should contain "yang lalu" for past dates
          if (!result.includes(INDONESIAN_TIME_UNITS.AGO_SUFFIX)) return false;
          
          // Should contain "menit" (minutes) or "kurang dari" for very short times
          // date-fns may return "kurang dari semenit" for < 1 minute
          return (
            result.includes(INDONESIAN_TIME_UNITS.MINUTES) ||
            result.includes(INDONESIAN_TIME_UNITS.LESS_THAN)
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * For dates within the last 24 hours (1-23 hours ago), formatRelative SHALL
   * return a string containing "jam" (hours) and "yang lalu".
   */
  it('formatRelative returns string containing "jam" for dates within the last 24 hours', () => {
    fc.assert(
      fc.property(
        recentHoursArbitrary,
        (recentDate) => {
          const result = formatRelative(recentDate);
          
          // Should not be the fallback
          if (result === '-') return false;
          
          // Should contain "yang lalu" for past dates
          if (!result.includes(INDONESIAN_TIME_UNITS.AGO_SUFFIX)) return false;
          
          // Should contain "jam" (hours) - date-fns uses "sekitar X jam" format
          return result.includes(INDONESIAN_TIME_UNITS.HOURS);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * For dates within the last 7 days (1-6 days ago), formatRelative SHALL
   * return a string containing "hari" (days) and "yang lalu".
   */
  it('formatRelative returns string containing "hari" for dates within the last 7 days', () => {
    fc.assert(
      fc.property(
        recentDaysArbitrary,
        (recentDate) => {
          const result = formatRelative(recentDate);
          
          // Should not be the fallback
          if (result === '-') return false;
          
          // Should contain "yang lalu" for past dates
          if (!result.includes(INDONESIAN_TIME_UNITS.AGO_SUFFIX)) return false;
          
          // Should contain "hari" (days)
          return result.includes(INDONESIAN_TIME_UNITS.DAYS);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * For any valid past date provided as ISO string, formatRelative SHALL
   * return a string containing "yang lalu".
   */
  it('formatRelative handles ISO date strings for past dates', () => {
    fc.assert(
      fc.property(
        pastDateArbitrary,
        (pastDate) => {
          // Convert to ISO string to test string input
          const isoString = pastDate.toISOString();
          const result = formatRelative(isoString);
          
          // Should not be the fallback
          if (result === '-') return false;
          
          // Should contain "yang lalu" for past dates
          return result.includes(INDONESIAN_TIME_UNITS.AGO_SUFFIX);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * formatRelative output should always be a non-empty string for valid past dates.
   */
  it('formatRelative returns non-empty string for any valid past date', () => {
    fc.assert(
      fc.property(
        pastDateArbitrary,
        (pastDate) => {
          const result = formatRelative(pastDate);
          
          // Should be a non-empty string
          return typeof result === 'string' && result.length > 0;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * formatRelative should contain at least one Indonesian time unit for past dates.
   * This validates that the Indonesian locale is being used correctly.
   */
  it('formatRelative contains Indonesian time units for past dates', () => {
    fc.assert(
      fc.property(
        pastDateArbitrary,
        (pastDate) => {
          const result = formatRelative(pastDate);
          
          // Should not be the fallback
          if (result === '-') return false;
          
          // Should contain at least one Indonesian time indicator
          const containsIndonesianUnit = 
            result.includes(INDONESIAN_TIME_UNITS.SECONDS) ||
            result.includes(INDONESIAN_TIME_UNITS.MINUTES) ||
            result.includes(INDONESIAN_TIME_UNITS.HOURS) ||
            result.includes(INDONESIAN_TIME_UNITS.DAYS) ||
            result.includes(INDONESIAN_TIME_UNITS.MONTHS) ||
            result.includes(INDONESIAN_TIME_UNITS.YEARS) ||
            result.includes(INDONESIAN_TIME_UNITS.LESS_THAN) ||
            result.includes(INDONESIAN_TIME_UNITS.ABOUT);
          
          return containsIndonesianUnit;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Test specific examples to verify Indonesian locale formatting.
   * These are concrete examples that demonstrate the expected behavior.
   */
  describe('Specific Indonesian relative date examples', () => {
    it('formats 2 hours ago correctly in Indonesian', () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
      const result = formatRelative(twoHoursAgo);
      
      // Should contain "jam" (hours) and "yang lalu" (ago)
      expect(result).toContain('jam');
      expect(result).toContain('yang lalu');
    });

    it('formats 3 days ago correctly in Indonesian', () => {
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
      const result = formatRelative(threeDaysAgo);
      
      // Should contain "hari" (days) and "yang lalu" (ago)
      expect(result).toContain('hari');
      expect(result).toContain('yang lalu');
    });

    it('formats 30 minutes ago correctly in Indonesian', () => {
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
      const result = formatRelative(thirtyMinutesAgo);
      
      // Should contain "menit" (minutes) and "yang lalu" (ago)
      expect(result).toContain('menit');
      expect(result).toContain('yang lalu');
    });

    it('formats 1 month ago correctly in Indonesian', () => {
      const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const result = formatRelative(oneMonthAgo);
      
      // Should contain "yang lalu" (ago)
      // May contain "bulan" (month) or "hari" depending on exact calculation
      expect(result).toContain('yang lalu');
    });
  });

  /**
   * Test that formatRelative handles edge cases correctly.
   */
  describe('Edge cases for relative date formatting', () => {
    it('handles date exactly 1 day ago', () => {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const result = formatRelative(oneDayAgo);
      
      expect(result).toContain('yang lalu');
      // Should contain "hari" (day) or "jam" (hours) depending on exact timing
      expect(result.includes('hari') || result.includes('jam')).toBe(true);
    });

    it('handles date exactly 1 hour ago', () => {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const result = formatRelative(oneHourAgo);
      
      expect(result).toContain('yang lalu');
      expect(result).toContain('jam');
    });

    it('handles date exactly 1 minute ago', () => {
      const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
      const result = formatRelative(oneMinuteAgo);
      
      expect(result).toContain('yang lalu');
      // Should contain "menit" (minute)
      expect(result).toContain('menit');
    });

    it('handles very old dates (1 year ago)', () => {
      const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
      const result = formatRelative(oneYearAgo);
      
      expect(result).toContain('yang lalu');
      // Should contain "tahun" (year) or "bulan" (months)
      expect(result.includes('tahun') || result.includes('bulan')).toBe(true);
    });
  });
});


// =====================================================
// Property 6: Document Date Indonesian Month Names
// **Validates: Requirements 3.1**
// =====================================================
describe('Property 6: Document Date Indonesian Month Names', () => {
  /**
   * Full Indonesian month names used in formal documents.
   * These are the exact month names that formatDocumentDate should use.
   */
  const INDONESIAN_MONTH_NAMES = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  /**
   * Custom arbitrary for generating valid dates within a reasonable range.
   */
  const validDateArbitraryForDocs = fc.date({
    min: new Date('1970-01-01'),
    max: new Date('2100-12-31'),
  }).filter((d) => !isNaN(d.getTime()));

  /**
   * For any valid Date object, formatDocumentDate SHALL return a string
   * containing a full Indonesian month name.
   */
  it('formatDocumentDate returns string containing Indonesian month name for any valid Date', () => {
    fc.assert(
      fc.property(
        validDateArbitraryForDocs,
        (date) => {
          const result = formatDocumentDate(date);
          
          // Should not be the fallback
          if (result === '-') return false;
          
          // Should contain exactly one of the Indonesian month names
          const containsIndonesianMonth = INDONESIAN_MONTH_NAMES.some(
            (month) => result.includes(month)
          );
          
          return containsIndonesianMonth;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * For any valid ISO date string, formatDocumentDate SHALL return a string
   * containing a full Indonesian month name.
   */
  it('formatDocumentDate returns string containing Indonesian month name for any valid ISO string', () => {
    fc.assert(
      fc.property(
        validDateArbitraryForDocs,
        (date) => {
          // Convert to ISO string to test string input
          const isoString = date.toISOString();
          const result = formatDocumentDate(isoString);
          
          // Should not be the fallback
          if (result === '-') return false;
          
          // Should contain exactly one of the Indonesian month names
          const containsIndonesianMonth = INDONESIAN_MONTH_NAMES.some(
            (month) => result.includes(month)
          );
          
          return containsIndonesianMonth;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * For any valid Date object, formatDocumentDate SHALL return a string
   * matching the pattern "DD MMMM YYYY" (e.g., "15 Januari 2026").
   */
  it('formatDocumentDate returns pattern "D MMMM YYYY" for any valid Date', () => {
    fc.assert(
      fc.property(
        validDateArbitraryForDocs,
        (date) => {
          const result = formatDocumentDate(date);
          
          // Should not be the fallback
          if (result === '-') return false;
          
          // Pattern: "D MMMM YYYY" or "DD MMMM YYYY"
          // Day can be 1 or 2 digits, month is full Indonesian name, year is 4 digits
          // Example: "1 Januari 2026" or "15 Januari 2026"
          const monthPattern = INDONESIAN_MONTH_NAMES.join('|');
          const pattern = new RegExp(`^(\\d{1,2}) (${monthPattern}) (\\d{4})$`);
          const match = result.match(pattern);
          
          if (!match) return false;
          
          const day = parseInt(match[1], 10);
          const year = parseInt(match[3], 10);
          
          // Validate day is in valid range (1-31)
          if (day < 1 || day > 31) return false;
          
          // Validate year is a 4-digit number
          if (year < 1000 || year > 9999) return false;
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * The formatted document date should preserve the original date's day, month, and year.
   */
  it('formatDocumentDate preserves the original date components', () => {
    fc.assert(
      fc.property(
        validDateArbitraryForDocs,
        (date) => {
          const result = formatDocumentDate(date);
          
          if (result === '-') return false;
          
          // Parse the result to extract components
          const monthPattern = INDONESIAN_MONTH_NAMES.join('|');
          const pattern = new RegExp(`^(\\d{1,2}) (${monthPattern}) (\\d{4})$`);
          const match = result.match(pattern);
          
          if (!match) return false;
          
          const formattedDay = parseInt(match[1], 10);
          const formattedMonth = match[2];
          const formattedYear = parseInt(match[3], 10);
          
          // Check that the formatted values match the original date
          const originalDay = date.getDate();
          const originalMonth = INDONESIAN_MONTH_NAMES[date.getMonth()];
          const originalYear = date.getFullYear();
          
          return (
            formattedDay === originalDay &&
            formattedMonth === originalMonth &&
            formattedYear === originalYear
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * The month in the formatted output should correspond to the correct month index.
   * This validates that the Indonesian month names are correctly mapped to month indices.
   */
  it('formatDocumentDate uses correct Indonesian month name for each month index', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 11 }), // Month index 0-11
        fc.integer({ min: 1, max: 28 }),  // Day 1-28 (safe for all months)
        fc.integer({ min: 1970, max: 2100 }), // Year
        (monthIndex, day, year) => {
          const date = new Date(year, monthIndex, day);
          
          // Skip if date is invalid (shouldn't happen with these constraints)
          if (isNaN(date.getTime())) return true;
          
          const result = formatDocumentDate(date);
          
          // Should not be the fallback
          if (result === '-') return false;
          
          // The result should contain the correct Indonesian month name
          const expectedMonth = INDONESIAN_MONTH_NAMES[monthIndex];
          return result.includes(expectedMonth);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Test specific examples for each Indonesian month name.
   * This validates that all 12 months are correctly formatted.
   */
  describe('Specific Indonesian month name examples', () => {
    const monthTestCases = [
      { month: 0, name: 'Januari', date: new Date(2026, 0, 15) },
      { month: 1, name: 'Februari', date: new Date(2026, 1, 15) },
      { month: 2, name: 'Maret', date: new Date(2026, 2, 15) },
      { month: 3, name: 'April', date: new Date(2026, 3, 15) },
      { month: 4, name: 'Mei', date: new Date(2026, 4, 15) },
      { month: 5, name: 'Juni', date: new Date(2026, 5, 15) },
      { month: 6, name: 'Juli', date: new Date(2026, 6, 15) },
      { month: 7, name: 'Agustus', date: new Date(2026, 7, 15) },
      { month: 8, name: 'September', date: new Date(2026, 8, 15) },
      { month: 9, name: 'Oktober', date: new Date(2026, 9, 15) },
      { month: 10, name: 'November', date: new Date(2026, 10, 15) },
      { month: 11, name: 'Desember', date: new Date(2026, 11, 15) },
    ];

    it('formatDocumentDate returns correct Indonesian month for all 12 months', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...monthTestCases),
          ({ name, date }) => {
            const result = formatDocumentDate(date);
            return result === `15 ${name} 2026`;
          }
        ),
        { numRuns: monthTestCases.length }
      );
    });

    // Individual tests for each month for clarity
    monthTestCases.forEach(({ month, name, date }) => {
      it(`formats month ${month + 1} as "${name}"`, () => {
        const result = formatDocumentDate(date);
        expect(result).toBe(`15 ${name} 2026`);
      });
    });
  });

  /**
   * Test edge cases for document date formatting.
   */
  describe('Edge cases for document date formatting', () => {
    it('handles first day of month correctly', () => {
      const firstDay = new Date(2026, 0, 1);
      const result = formatDocumentDate(firstDay);
      expect(result).toBe('1 Januari 2026');
    });

    it('handles last day of month correctly', () => {
      const lastDay = new Date(2026, 0, 31);
      const result = formatDocumentDate(lastDay);
      expect(result).toBe('31 Januari 2026');
    });

    it('handles leap year February 29th correctly', () => {
      const leapDay = new Date(2024, 1, 29); // 2024 is a leap year
      const result = formatDocumentDate(leapDay);
      expect(result).toBe('29 Februari 2024');
    });

    it('handles year boundaries correctly', () => {
      const newYearsEve = new Date(2025, 11, 31);
      const newYearsDay = new Date(2026, 0, 1);
      
      expect(formatDocumentDate(newYearsEve)).toBe('31 Desember 2025');
      expect(formatDocumentDate(newYearsDay)).toBe('1 Januari 2026');
    });

    it('handles single-digit days without leading zero', () => {
      // Property: Day should NOT have leading zero in document format
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 9 }), // Single digit days
          fc.integer({ min: 0, max: 11 }), // Any month
          fc.integer({ min: 2000, max: 2050 }), // Recent years
          (day, month, year) => {
            const date = new Date(year, month, day);
            const result = formatDocumentDate(date);
            
            // Should not be the fallback
            if (result === '-') return false;
            
            // Day should be single digit (no leading zero)
            // Pattern should start with single digit followed by space
            return result.startsWith(`${day} `);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('handles double-digit days correctly', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 10, max: 28 }), // Double digit days (safe for all months)
          fc.integer({ min: 0, max: 11 }), // Any month
          fc.integer({ min: 2000, max: 2050 }), // Recent years
          (day, month, year) => {
            const date = new Date(year, month, day);
            const result = formatDocumentDate(date);
            
            // Should not be the fallback
            if (result === '-') return false;
            
            // Day should be double digit
            return result.startsWith(`${day} `);
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  /**
   * Test that formatDocumentDate output is suitable for formal documents.
   * The output should be human-readable and professional.
   */
  describe('Document date format suitability', () => {
    it('output uses full Indonesian month names (not English abbreviations)', () => {
      // English 3-letter abbreviations that should NOT appear in document dates
      // Note: "Mei" is the full Indonesian month name for May (not an abbreviation)
      const ENGLISH_ABBREVIATIONS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                                     'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      
      fc.assert(
        fc.property(
          validDateArbitraryForDocs,
          (date) => {
            const result = formatDocumentDate(date);
            
            // Should not be the fallback
            if (result === '-') return true; // Skip invalid dates
            
            // Extract the month part from the result
            const monthPattern = INDONESIAN_MONTH_NAMES.join('|');
            const pattern = new RegExp(`^\\d{1,2} (${monthPattern}) \\d{4}$`);
            const match = result.match(pattern);
            
            if (!match) return false;
            
            const monthInResult = match[1];
            
            // The month should be a full Indonesian month name
            // and should NOT be an English abbreviation
            const isIndonesianMonth = INDONESIAN_MONTH_NAMES.includes(monthInResult);
            const isEnglishAbbreviation = ENGLISH_ABBREVIATIONS.includes(monthInResult);
            
            return isIndonesianMonth && !isEnglishAbbreviation;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('output is non-empty for valid dates', () => {
      fc.assert(
        fc.property(
          validDateArbitraryForDocs,
          (date) => {
            const result = formatDocumentDate(date);
            return typeof result === 'string' && result.length > 0;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('output length is reasonable for document dates', () => {
      fc.assert(
        fc.property(
          validDateArbitraryForDocs,
          (date) => {
            const result = formatDocumentDate(date);
            
            // Should not be the fallback
            if (result === '-') return true;
            
            // Minimum: "1 Mei 2000" = 10 characters
            // Maximum: "31 September 2100" = 17 characters
            return result.length >= 10 && result.length <= 20;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});


// =====================================================
// Property 7: Input Date ISO Format
// **Validates: Requirements 4.1, 4.2, 4.3**
// =====================================================
import {
  toFileDate,
  toFileDateTime,
} from '@/lib/utils/format';

describe('Property 7: Input Date ISO Format', () => {
  /**
   * Custom arbitrary for generating valid dates within a reasonable range.
   * fc.date() can sometimes generate Date(NaN), so we filter those out.
   */
  const validDateArbitraryForInput = fc.date({
    min: new Date('1970-01-01'),
    max: new Date('2100-12-31'),
  }).filter((d) => !isNaN(d.getTime()));

  /**
   * For any valid Date object, toInputDate SHALL return a string matching
   * the ISO date format "YYYY-MM-DD" that is valid for HTML date input elements.
   */
  it('toInputDate returns pattern "YYYY-MM-DD" for any valid Date object', () => {
    fc.assert(
      fc.property(
        validDateArbitraryForInput,
        (date) => {
          const result = toInputDate(date);
          
          // Should not be empty (fallback for invalid dates)
          if (result === '') return false;
          
          // Pattern: "YYYY-MM-DD" (exactly 10 characters)
          // Example: "2026-01-15"
          const pattern = /^(\d{4})-(\d{2})-(\d{2})$/;
          const match = result.match(pattern);
          
          if (!match) return false;
          
          const year = parseInt(match[1], 10);
          const month = parseInt(match[2], 10);
          const day = parseInt(match[3], 10);
          
          // Validate year is a 4-digit number
          if (year < 1000 || year > 9999) return false;
          
          // Validate month is in valid range (01-12)
          if (month < 1 || month > 12) return false;
          
          // Validate day is in valid range (01-31)
          if (day < 1 || day > 31) return false;
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * For any valid ISO date string, toInputDate SHALL return a string matching
   * the ISO date format "YYYY-MM-DD".
   */
  it('toInputDate returns pattern "YYYY-MM-DD" for any valid ISO date string', () => {
    fc.assert(
      fc.property(
        validDateArbitraryForInput,
        (date) => {
          // Convert to ISO string to test string input
          const isoString = date.toISOString();
          const result = toInputDate(isoString);
          
          // Should not be empty
          if (result === '') return false;
          
          // Pattern: "YYYY-MM-DD"
          const pattern = /^(\d{4})-(\d{2})-(\d{2})$/;
          const match = result.match(pattern);
          
          if (!match) return false;
          
          const year = parseInt(match[1], 10);
          const month = parseInt(match[2], 10);
          const day = parseInt(match[3], 10);
          
          // Validate components
          if (year < 1000 || year > 9999) return false;
          if (month < 1 || month > 12) return false;
          if (day < 1 || day > 31) return false;
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * toInputDate output is valid for HTML date inputs.
   * The output should always be exactly 10 characters in "YYYY-MM-DD" format.
   */
  it('toInputDate returns exactly 10 characters for valid dates', () => {
    fc.assert(
      fc.property(
        validDateArbitraryForInput,
        (date) => {
          const result = toInputDate(date);
          
          // Should not be empty
          if (result === '') return false;
          
          // Should always be exactly 10 characters: "YYYY-MM-DD"
          return result.length === 10;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Parsing the toInputDate output back produces the same date.
   * This validates round-trip consistency (Property 13 from design).
   */
  it('toInputDate output can be parsed back to the same date (year, month, day)', () => {
    fc.assert(
      fc.property(
        validDateArbitraryForInput,
        (date) => {
          const result = toInputDate(date);
          
          // Should not be empty
          if (result === '') return false;
          
          // Parse the result back to a Date
          const parsedBack = new Date(result);
          
          // Check if parsing was successful
          if (isNaN(parsedBack.getTime())) return false;
          
          // Compare year, month, and day (ignoring time components)
          // Note: We use UTC methods for the parsed date since "YYYY-MM-DD" is parsed as UTC
          const originalYear = date.getFullYear();
          const originalMonth = date.getMonth();
          const originalDay = date.getDate();
          
          // When parsing "YYYY-MM-DD", JavaScript treats it as UTC midnight
          // So we need to compare with the local date components
          const parsedYear = parsedBack.getUTCFullYear();
          const parsedMonth = parsedBack.getUTCMonth();
          const parsedDay = parsedBack.getUTCDate();
          
          return (
            originalYear === parsedYear &&
            originalMonth === parsedMonth &&
            originalDay === parsedDay
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * toInputDate preserves the original date's year, month, and day.
   */
  it('toInputDate preserves the original date components', () => {
    fc.assert(
      fc.property(
        validDateArbitraryForInput,
        (date) => {
          const result = toInputDate(date);
          
          if (result === '') return false;
          
          const pattern = /^(\d{4})-(\d{2})-(\d{2})$/;
          const match = result.match(pattern);
          
          if (!match) return false;
          
          const formattedYear = parseInt(match[1], 10);
          const formattedMonth = parseInt(match[2], 10);
          const formattedDay = parseInt(match[3], 10);
          
          // Check that the formatted values match the original date
          const originalYear = date.getFullYear();
          const originalMonth = date.getMonth() + 1; // JavaScript months are 0-indexed
          const originalDay = date.getDate();
          
          return (
            formattedYear === originalYear &&
            formattedMonth === originalMonth &&
            formattedDay === originalDay
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Test specific examples for HTML date input compatibility.
   */
  describe('HTML date input compatibility', () => {
    it('formats single-digit months with leading zero', () => {
      const january = new Date(2026, 0, 15); // January (month 0)
      const result = toInputDate(january);
      expect(result).toBe('2026-01-15');
    });

    it('formats single-digit days with leading zero', () => {
      const firstDay = new Date(2026, 0, 1);
      const result = toInputDate(firstDay);
      expect(result).toBe('2026-01-01');
    });

    it('formats double-digit months correctly', () => {
      const december = new Date(2026, 11, 15); // December (month 11)
      const result = toInputDate(december);
      expect(result).toBe('2026-12-15');
    });

    it('formats double-digit days correctly', () => {
      const lastDay = new Date(2026, 0, 31);
      const result = toInputDate(lastDay);
      expect(result).toBe('2026-01-31');
    });

    it('handles leap year February 29th correctly', () => {
      const leapDay = new Date(2024, 1, 29); // 2024 is a leap year
      const result = toInputDate(leapDay);
      expect(result).toBe('2024-02-29');
    });

    it('handles year boundaries correctly', () => {
      const newYearsEve = new Date(2025, 11, 31);
      const newYearsDay = new Date(2026, 0, 1);
      
      expect(toInputDate(newYearsEve)).toBe('2025-12-31');
      expect(toInputDate(newYearsDay)).toBe('2026-01-01');
    });
  });
});


// =====================================================
// Property 8: File Date Sortable Format
// **Validates: Requirements 4.2, 4.3**
// =====================================================
describe('Property 8: File Date Sortable Format', () => {
  /**
   * Custom arbitrary for generating valid dates within a reasonable range.
   */
  const validDateArbitraryForFile = fc.date({
    min: new Date('1970-01-01'),
    max: new Date('2100-12-31'),
  }).filter((d) => !isNaN(d.getTime()));

  /**
   * For any Date object, toFileDate SHALL return an 8-character string
   * in "YYYYMMDD" format.
   */
  it('toFileDate returns exactly 8 characters for any valid Date', () => {
    fc.assert(
      fc.property(
        validDateArbitraryForFile,
        (date) => {
          const result = toFileDate(date);
          
          // Should always be exactly 8 characters: "YYYYMMDD"
          return result.length === 8;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * toFileDate output matches the pattern "YYYYMMDD".
   */
  it('toFileDate returns pattern "YYYYMMDD" for any valid Date', () => {
    fc.assert(
      fc.property(
        validDateArbitraryForFile,
        (date) => {
          const result = toFileDate(date);
          
          // Pattern: "YYYYMMDD" (8 digits)
          // Example: "20260115"
          const pattern = /^(\d{4})(\d{2})(\d{2})$/;
          const match = result.match(pattern);
          
          if (!match) return false;
          
          const year = parseInt(match[1], 10);
          const month = parseInt(match[2], 10);
          const day = parseInt(match[3], 10);
          
          // Validate year is a 4-digit number
          if (year < 1000 || year > 9999) return false;
          
          // Validate month is in valid range (01-12)
          if (month < 1 || month > 12) return false;
          
          // Validate day is in valid range (01-31)
          if (day < 1 || day > 31) return false;
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * toFileDate preserves the original date's year, month, and day.
   */
  it('toFileDate preserves the original date components', () => {
    fc.assert(
      fc.property(
        validDateArbitraryForFile,
        (date) => {
          const result = toFileDate(date);
          
          const pattern = /^(\d{4})(\d{2})(\d{2})$/;
          const match = result.match(pattern);
          
          if (!match) return false;
          
          const formattedYear = parseInt(match[1], 10);
          const formattedMonth = parseInt(match[2], 10);
          const formattedDay = parseInt(match[3], 10);
          
          // Check that the formatted values match the original date
          const originalYear = date.getFullYear();
          const originalMonth = date.getMonth() + 1; // JavaScript months are 0-indexed
          const originalDay = date.getDate();
          
          return (
            formattedYear === originalYear &&
            formattedMonth === originalMonth &&
            formattedDay === originalDay
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * For any Date object, toFileDateTime SHALL return a 15-character string
   * in "YYYYMMDD_HHmmss" format.
   */
  it('toFileDateTime returns exactly 15 characters for any valid Date', () => {
    fc.assert(
      fc.property(
        validDateArbitraryForFile,
        (date) => {
          const result = toFileDateTime(date);
          
          // Should always be exactly 15 characters: "YYYYMMDD_HHmmss"
          return result.length === 15;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * toFileDateTime output matches the pattern "YYYYMMDD_HHmmss".
   */
  it('toFileDateTime returns pattern "YYYYMMDD_HHmmss" for any valid Date', () => {
    fc.assert(
      fc.property(
        validDateArbitraryForFile,
        (date) => {
          const result = toFileDateTime(date);
          
          // Pattern: "YYYYMMDD_HHmmss" (8 digits + underscore + 6 digits)
          // Example: "20260115_143022"
          const pattern = /^(\d{4})(\d{2})(\d{2})_(\d{2})(\d{2})(\d{2})$/;
          const match = result.match(pattern);
          
          if (!match) return false;
          
          const year = parseInt(match[1], 10);
          const month = parseInt(match[2], 10);
          const day = parseInt(match[3], 10);
          const hour = parseInt(match[4], 10);
          const minute = parseInt(match[5], 10);
          const second = parseInt(match[6], 10);
          
          // Validate year is a 4-digit number
          if (year < 1000 || year > 9999) return false;
          
          // Validate month is in valid range (01-12)
          if (month < 1 || month > 12) return false;
          
          // Validate day is in valid range (01-31)
          if (day < 1 || day > 31) return false;
          
          // Validate hour is in 24-hour format (00-23)
          if (hour < 0 || hour > 23) return false;
          
          // Validate minute is in valid range (00-59)
          if (minute < 0 || minute > 59) return false;
          
          // Validate second is in valid range (00-59)
          if (second < 0 || second > 59) return false;
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * toFileDateTime preserves the original date's components.
   */
  it('toFileDateTime preserves the original date and time components', () => {
    fc.assert(
      fc.property(
        validDateArbitraryForFile,
        (date) => {
          const result = toFileDateTime(date);
          
          const pattern = /^(\d{4})(\d{2})(\d{2})_(\d{2})(\d{2})(\d{2})$/;
          const match = result.match(pattern);
          
          if (!match) return false;
          
          const formattedYear = parseInt(match[1], 10);
          const formattedMonth = parseInt(match[2], 10);
          const formattedDay = parseInt(match[3], 10);
          const formattedHour = parseInt(match[4], 10);
          const formattedMinute = parseInt(match[5], 10);
          const formattedSecond = parseInt(match[6], 10);
          
          // Check that the formatted values match the original date
          const originalYear = date.getFullYear();
          const originalMonth = date.getMonth() + 1; // JavaScript months are 0-indexed
          const originalDay = date.getDate();
          const originalHour = date.getHours();
          const originalMinute = date.getMinutes();
          const originalSecond = date.getSeconds();
          
          return (
            formattedYear === originalYear &&
            formattedMonth === originalMonth &&
            formattedDay === originalDay &&
            formattedHour === originalHour &&
            formattedMinute === originalMinute &&
            formattedSecond === originalSecond
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Earlier dates sort before later dates (lexicographic sorting).
   * This is the key property for file naming - files should sort chronologically.
   */
  it('toFileDate produces lexicographically sortable output (earlier dates sort first)', () => {
    fc.assert(
      fc.property(
        validDateArbitraryForFile,
        validDateArbitraryForFile,
        (date1, date2) => {
          const result1 = toFileDate(date1);
          const result2 = toFileDate(date2);
          
          // Get timestamps for comparison
          const time1 = date1.getTime();
          const time2 = date2.getTime();
          
          // Compare dates at day level (ignore time components)
          const day1 = new Date(date1.getFullYear(), date1.getMonth(), date1.getDate()).getTime();
          const day2 = new Date(date2.getFullYear(), date2.getMonth(), date2.getDate()).getTime();
          
          // Lexicographic comparison should match chronological order
          const lexicographicComparison = result1.localeCompare(result2);
          
          if (day1 < day2) {
            // Earlier date should sort before later date
            return lexicographicComparison < 0;
          } else if (day1 > day2) {
            // Later date should sort after earlier date
            return lexicographicComparison > 0;
          } else {
            // Same day should produce same result
            return lexicographicComparison === 0;
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Earlier datetimes sort before later datetimes (lexicographic sorting).
   */
  it('toFileDateTime produces lexicographically sortable output (earlier datetimes sort first)', () => {
    fc.assert(
      fc.property(
        validDateArbitraryForFile,
        validDateArbitraryForFile,
        (date1, date2) => {
          const result1 = toFileDateTime(date1);
          const result2 = toFileDateTime(date2);
          
          // Get timestamps for comparison (at second precision)
          const time1 = Math.floor(date1.getTime() / 1000);
          const time2 = Math.floor(date2.getTime() / 1000);
          
          // Lexicographic comparison should match chronological order
          const lexicographicComparison = result1.localeCompare(result2);
          
          if (time1 < time2) {
            // Earlier datetime should sort before later datetime
            return lexicographicComparison < 0;
          } else if (time1 > time2) {
            // Later datetime should sort after earlier datetime
            return lexicographicComparison > 0;
          } else {
            // Same second should produce same result
            return lexicographicComparison === 0;
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Test specific examples for file date formatting.
   */
  describe('Specific file date format examples', () => {
    it('formats date correctly for file naming', () => {
      const date = new Date(2026, 0, 15); // January 15, 2026
      expect(toFileDate(date)).toBe('20260115');
    });

    it('formats datetime correctly for file naming', () => {
      const date = new Date(2026, 0, 15, 14, 30, 22);
      expect(toFileDateTime(date)).toBe('20260115_143022');
    });

    it('formats single-digit months with leading zero', () => {
      const january = new Date(2026, 0, 15);
      expect(toFileDate(january)).toBe('20260115');
    });

    it('formats single-digit days with leading zero', () => {
      const firstDay = new Date(2026, 0, 1);
      expect(toFileDate(firstDay)).toBe('20260101');
    });

    it('formats midnight correctly', () => {
      const midnight = new Date(2026, 0, 15, 0, 0, 0);
      expect(toFileDateTime(midnight)).toBe('20260115_000000');
    });

    it('formats end of day correctly', () => {
      const endOfDay = new Date(2026, 0, 15, 23, 59, 59);
      expect(toFileDateTime(endOfDay)).toBe('20260115_235959');
    });

    it('handles leap year February 29th correctly', () => {
      const leapDay = new Date(2024, 1, 29, 12, 30, 45);
      expect(toFileDate(leapDay)).toBe('20240229');
      expect(toFileDateTime(leapDay)).toBe('20240229_123045');
    });
  });

  /**
   * Test lexicographic sorting with specific examples.
   */
  describe('Lexicographic sorting examples', () => {
    it('earlier year sorts before later year', () => {
      const earlier = toFileDate(new Date(2025, 0, 1));
      const later = toFileDate(new Date(2026, 0, 1));
      
      expect(earlier.localeCompare(later)).toBeLessThan(0);
    });

    it('earlier month sorts before later month', () => {
      const earlier = toFileDate(new Date(2026, 0, 1)); // January
      const later = toFileDate(new Date(2026, 11, 1)); // December
      
      expect(earlier.localeCompare(later)).toBeLessThan(0);
    });

    it('earlier day sorts before later day', () => {
      const earlier = toFileDate(new Date(2026, 0, 1));
      const later = toFileDate(new Date(2026, 0, 31));
      
      expect(earlier.localeCompare(later)).toBeLessThan(0);
    });

    it('earlier time sorts before later time on same day', () => {
      const earlier = toFileDateTime(new Date(2026, 0, 15, 8, 0, 0));
      const later = toFileDateTime(new Date(2026, 0, 15, 17, 0, 0));
      
      expect(earlier.localeCompare(later)).toBeLessThan(0);
    });

    it('array of file dates sorts chronologically', () => {
      const dates = [
        new Date(2026, 5, 15),  // June 15
        new Date(2025, 11, 31), // Dec 31, 2025
        new Date(2026, 0, 1),   // Jan 1, 2026
        new Date(2026, 5, 1),   // June 1
      ];
      
      const fileDates = dates.map(d => toFileDate(d));
      const sorted = [...fileDates].sort();
      
      // Expected chronological order
      expect(sorted).toEqual([
        '20251231', // Dec 31, 2025
        '20260101', // Jan 1, 2026
        '20260601', // June 1, 2026
        '20260615', // June 15, 2026
      ]);
    });

    it('array of file datetimes sorts chronologically', () => {
      const dates = [
        new Date(2026, 0, 15, 17, 30, 0),  // 5:30 PM
        new Date(2026, 0, 15, 8, 0, 0),    // 8:00 AM
        new Date(2026, 0, 15, 12, 0, 0),   // 12:00 PM
        new Date(2026, 0, 14, 23, 59, 59), // Previous day
      ];
      
      const fileDateTimes = dates.map(d => toFileDateTime(d));
      const sorted = [...fileDateTimes].sort();
      
      // Expected chronological order
      expect(sorted).toEqual([
        '20260114_235959', // Previous day
        '20260115_080000', // 8:00 AM
        '20260115_120000', // 12:00 PM
        '20260115_173000', // 5:30 PM
      ]);
    });
  });

  /**
   * Test default behavior when no date is provided.
   */
  describe('Default behavior (no date provided)', () => {
    it('toFileDate returns current date when called without arguments', () => {
      const result = toFileDate();
      
      // Should be 8 characters
      expect(result.length).toBe(8);
      
      // Should match pattern
      expect(result).toMatch(/^\d{8}$/);
      
      // Should be close to current date (within same day)
      const now = new Date();
      const expectedPrefix = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
      expect(result).toBe(expectedPrefix);
    });

    it('toFileDateTime returns current datetime when called without arguments', () => {
      const before = new Date();
      const result = toFileDateTime();
      const after = new Date();
      
      // Should be 15 characters
      expect(result.length).toBe(15);
      
      // Should match pattern
      expect(result).toMatch(/^\d{8}_\d{6}$/);
      
      // The date portion should match current date
      const expectedDatePrefix = `${before.getFullYear()}${String(before.getMonth() + 1).padStart(2, '0')}${String(before.getDate()).padStart(2, '0')}`;
      expect(result.startsWith(expectedDatePrefix)).toBe(true);
    });
  });
});


// =====================================================
// Property 9: Currency Formatting Correctness
// **Validates: Requirements 5.1, 5.2**
// =====================================================
import {
  formatCurrency,
  formatCurrencyShort,
} from '@/lib/utils/format';

describe('Property 9: Currency Formatting Correctness', () => {
  /**
   * For any number (positive, negative, or zero), formatCurrency SHALL return
   * a string starting with "Rp " (or "-Rp " for negatives) followed by the
   * absolute value formatted with Indonesian thousand separators (dots).
   * 
   * **Validates: Requirements 5.1, 5.2**
   */

  /**
   * Custom arbitrary for generating reasonable currency amounts.
   * We use a range that covers typical business scenarios.
   */
  const currencyAmountArbitrary = fc.integer({
    min: -1_000_000_000_000, // -1 trillion
    max: 1_000_000_000_000,  // 1 trillion
  });

  /**
   * Positive currency amounts should start with "Rp".
   */
  it('formatCurrency output starts with "Rp" for positive numbers', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 1_000_000_000_000 }),
        (amount) => {
          const result = formatCurrency(amount);
          
          // Should start with "Rp" (Indonesian Rupiah prefix)
          return result.startsWith('Rp');
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Negative currency amounts should contain "-" (minus sign).
   */
  it('formatCurrency output contains "-" for negative numbers', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -1_000_000_000_000, max: -1 }),
        (amount) => {
          const result = formatCurrency(amount);
          
          // Should contain minus sign for negative amounts
          return result.includes('-');
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Currency output should use Indonesian thousand separators (dots).
   * For amounts >= 1000, the output should contain dots as separators.
   */
  it('formatCurrency uses Indonesian thousand separators (dots) for amounts >= 1000', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1000, max: 1_000_000_000_000 }),
        (amount) => {
          const result = formatCurrency(amount);
          
          // Should contain dots as thousand separators
          // Indonesian locale uses dots for thousands
          return result.includes('.');
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Zero should return the fallback currency value.
   * Note: Intl.NumberFormat uses non-breaking space (\u00A0) between "Rp" and the number.
   */
  it('formatCurrency returns fallback for zero', () => {
    const result = formatCurrency(0);
    // The output uses non-breaking space from Intl.NumberFormat
    expect(result).toMatch(/Rp\s*0/);
    expect(result).toContain('Rp');
    expect(result).toContain('0');
  });

  /**
   * Null and undefined should return "Rp 0" (the fallback value).
   */
  it('formatCurrency returns "Rp 0" for null and undefined', () => {
    expect(formatCurrency(null)).toBe('Rp 0');
    expect(formatCurrency(undefined)).toBe('Rp 0');
  });

  /**
   * The formatted output should be a non-empty string for any number.
   */
  it('formatCurrency returns non-empty string for any number', () => {
    fc.assert(
      fc.property(
        currencyAmountArbitrary,
        (amount) => {
          const result = formatCurrency(amount);
          return typeof result === 'string' && result.length > 0;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * The formatted output should always contain "Rp" (the currency symbol).
   */
  it('formatCurrency output always contains "Rp" for any number', () => {
    fc.assert(
      fc.property(
        currencyAmountArbitrary,
        (amount) => {
          const result = formatCurrency(amount);
          return result.includes('Rp');
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Test specific examples to verify correct formatting.
   */
  describe('Specific currency formatting examples', () => {
    it('formats 1,500,000 correctly', () => {
      const result = formatCurrency(1500000);
      // Indonesian format: Rp 1.500.000
      expect(result).toMatch(/Rp\s*1\.500\.000/);
    });

    it('formats negative 500,000 correctly', () => {
      const result = formatCurrency(-500000);
      // Should contain minus sign and the amount
      expect(result).toContain('-');
      expect(result).toContain('Rp');
      expect(result).toContain('500.000');
    });

    it('formats small amounts correctly', () => {
      const result = formatCurrency(100);
      expect(result).toMatch(/Rp\s*100/);
    });

    it('formats large amounts (billions) correctly', () => {
      const result = formatCurrency(1500000000);
      // Should contain dots as separators
      expect(result).toContain('.');
      expect(result).toContain('Rp');
    });
  });

  /**
   * The absolute value in the output should match the input amount.
   * We verify this by extracting digits from the output and comparing.
   */
  it('formatCurrency preserves the numeric value (digits match)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 999_999_999 }), // Reasonable range for digit extraction
        (amount) => {
          const result = formatCurrency(amount);
          
          // Extract all digits from the result
          const digits = result.replace(/[^\d]/g, '');
          
          // The digits should match the original amount
          return digits === String(amount);
        }
      ),
      { numRuns: 100 }
    );
  });
});


// =====================================================
// Property 10: Compact Currency Abbreviation
// **Validates: Requirements 5.4**
// =====================================================
describe('Property 10: Compact Currency Abbreviation', () => {
  /**
   * For any number >= 1,000,000,000, formatCurrencyShort SHALL return a string
   * with "M" suffix (Miliar - billion in Indonesian).
   * 
   * For any number >= 1,000,000 and < 1,000,000,000, it SHALL return a string
   * with "jt" suffix (Juta - million in Indonesian).
   * 
   * The numeric portion SHALL be rounded to 1 decimal place.
   * 
   * **Validates: Requirements 5.4**
   */

  /**
   * Numbers >= 1 billion should have "M" suffix (Miliar).
   */
  it('formatCurrencyShort returns string with "M" suffix for numbers >= 1 billion', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1_000_000_000, max: 100_000_000_000 }), // 1B to 100B
        (amount) => {
          const result = formatCurrencyShort(amount);
          
          // Should contain "M" suffix for billions
          return result.includes('M');
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Numbers >= 1 million and < 1 billion should have "jt" suffix (Juta).
   */
  it('formatCurrencyShort returns string with "jt" suffix for numbers >= 1 million and < 1 billion', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1_000_000, max: 999_999_999 }), // 1M to just under 1B
        (amount) => {
          const result = formatCurrencyShort(amount);
          
          // Should contain "jt" suffix for millions
          return result.includes('jt');
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Numbers < 1 million should use standard formatting (no abbreviation).
   */
  it('formatCurrencyShort uses standard formatting for numbers < 1 million', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 999_999 }), // 1 to just under 1M
        (amount) => {
          const result = formatCurrencyShort(amount);
          
          // Should NOT contain "M" or "jt" suffixes
          // Should use standard Rp formatting
          return !result.includes('M') && !result.includes('jt') && result.includes('Rp');
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * The output should always start with "Rp" for positive numbers.
   */
  it('formatCurrencyShort output starts with "Rp" for positive numbers', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100_000_000_000 }),
        (amount) => {
          const result = formatCurrencyShort(amount);
          return result.startsWith('Rp');
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Negative numbers should contain "-" (minus sign).
   */
  it('formatCurrencyShort output contains "-" for negative numbers', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -100_000_000_000, max: -1 }),
        (amount) => {
          const result = formatCurrencyShort(amount);
          return result.includes('-');
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Negative billions should have "M" suffix.
   */
  it('formatCurrencyShort returns string with "M" suffix for negative billions', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -100_000_000_000, max: -1_000_000_000 }),
        (amount) => {
          const result = formatCurrencyShort(amount);
          return result.includes('M') && result.includes('-');
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Negative millions should have "jt" suffix.
   */
  it('formatCurrencyShort returns string with "jt" suffix for negative millions', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -999_999_999, max: -1_000_000 }),
        (amount) => {
          const result = formatCurrencyShort(amount);
          return result.includes('jt') && result.includes('-');
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Zero should return the fallback currency value.
   * Note: Intl.NumberFormat uses non-breaking space (\u00A0) between "Rp" and the number.
   */
  it('formatCurrencyShort returns fallback for zero', () => {
    const result = formatCurrencyShort(0);
    // The output uses non-breaking space from Intl.NumberFormat
    expect(result).toMatch(/Rp\s*0/);
    expect(result).toContain('Rp');
    expect(result).toContain('0');
  });

  /**
   * Null and undefined should return "Rp 0" (the fallback value).
   */
  it('formatCurrencyShort returns "Rp 0" for null and undefined', () => {
    expect(formatCurrencyShort(null)).toBe('Rp 0');
    expect(formatCurrencyShort(undefined)).toBe('Rp 0');
  });

  /**
   * The numeric portion should be rounded to 1 decimal place.
   * For billions: value / 1B rounded to 1 decimal
   * For millions: value / 1M rounded to 1 decimal
   */
  it('formatCurrencyShort rounds to 1 decimal place for billions', () => {
    // Test specific values to verify rounding
    const testCases = [
      { input: 1_500_000_000, expected: '1,5' },  // 1.5 billion
      { input: 2_300_000_000, expected: '2,3' },  // 2.3 billion
      { input: 10_000_000_000, expected: '10,0' }, // 10 billion
    ];

    testCases.forEach(({ input, expected }) => {
      const result = formatCurrencyShort(input);
      expect(result).toContain(expected);
      expect(result).toContain('M');
    });
  });

  it('formatCurrencyShort rounds to 1 decimal place for millions', () => {
    // Test specific values to verify rounding
    const testCases = [
      { input: 1_500_000, expected: '1,5' },  // 1.5 million
      { input: 2_300_000, expected: '2,3' },  // 2.3 million
      { input: 10_000_000, expected: '10,0' }, // 10 million
    ];

    testCases.forEach(({ input, expected }) => {
      const result = formatCurrencyShort(input);
      expect(result).toContain(expected);
      expect(result).toContain('jt');
    });
  });

  /**
   * Test specific examples to verify correct compact formatting.
   */
  describe('Specific compact currency formatting examples', () => {
    it('formats 1.5 billion correctly', () => {
      const result = formatCurrencyShort(1_500_000_000);
      expect(result).toBe('Rp 1,5 M');
    });

    it('formats 2.3 billion correctly', () => {
      const result = formatCurrencyShort(2_300_000_000);
      expect(result).toBe('Rp 2,3 M');
    });

    it('formats 1.5 million correctly', () => {
      const result = formatCurrencyShort(1_500_000);
      expect(result).toBe('Rp 1,5 jt');
    });

    it('formats 2.3 million correctly', () => {
      const result = formatCurrencyShort(2_300_000);
      expect(result).toBe('Rp 2,3 jt');
    });

    it('formats amounts under 1 million with standard formatting', () => {
      const result = formatCurrencyShort(500_000);
      // Should use standard Rp formatting with dots
      expect(result).toMatch(/Rp\s*500\.000/);
    });

    it('formats negative 1.5 billion correctly', () => {
      const result = formatCurrencyShort(-1_500_000_000);
      expect(result).toBe('-Rp 1,5 M');
    });

    it('formats negative 1.5 million correctly', () => {
      const result = formatCurrencyShort(-1_500_000);
      expect(result).toBe('-Rp 1,5 jt');
    });
  });

  /**
   * The output should be a non-empty string for any number.
   */
  it('formatCurrencyShort returns non-empty string for any number', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -100_000_000_000, max: 100_000_000_000 }),
        (amount) => {
          const result = formatCurrencyShort(amount);
          return typeof result === 'string' && result.length > 0;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * The output should always contain "Rp" (the currency symbol).
   */
  it('formatCurrencyShort output always contains "Rp" for any number', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -100_000_000_000, max: 100_000_000_000 }),
        (amount) => {
          const result = formatCurrencyShort(amount);
          return result.includes('Rp');
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Boundary test: exactly 1 million should use "jt" suffix.
   */
  it('formatCurrencyShort uses "jt" suffix for exactly 1 million', () => {
    const result = formatCurrencyShort(1_000_000);
    expect(result).toContain('jt');
    expect(result).toBe('Rp 1,0 jt');
  });

  /**
   * Boundary test: exactly 1 billion should use "M" suffix.
   */
  it('formatCurrencyShort uses "M" suffix for exactly 1 billion', () => {
    const result = formatCurrencyShort(1_000_000_000);
    expect(result).toContain('M');
    expect(result).toBe('Rp 1,0 M');
  });

  /**
   * Boundary test: just under 1 million should use standard formatting.
   */
  it('formatCurrencyShort uses standard formatting for 999,999', () => {
    const result = formatCurrencyShort(999_999);
    expect(result).not.toContain('jt');
    expect(result).not.toContain('M');
    expect(result).toContain('Rp');
  });

  /**
   * Boundary test: just under 1 billion should use "jt" suffix.
   */
  it('formatCurrencyShort uses "jt" suffix for 999,999,999', () => {
    const result = formatCurrencyShort(999_999_999);
    expect(result).toContain('jt');
    expect(result).not.toContain('M');
  });
});


// =====================================================
// Property 11: Number Formatting Indonesian Separators
// **Validates: Requirements 6.1, 6.2**
// =====================================================
import {
  formatNumber,
  formatPercent,
} from '@/lib/utils/format';

describe('Property 11: Number Formatting Indonesian Separators', () => {
  /**
   * For any number, formatNumber SHALL return a string using dots as thousand
   * separators (Indonesian locale), and the formatted string parsed back SHALL
   * equal the original number.
   * 
   * **Validates: Requirements 6.1**
   */

  /**
   * Custom arbitrary for generating reasonable numbers.
   * We use a range that covers typical business scenarios.
   */
  const numberArbitrary = fc.integer({
    min: -1_000_000_000_000, // -1 trillion
    max: 1_000_000_000_000,  // 1 trillion
  });

  /**
   * Numbers >= 1000 should use dots as thousand separators.
   */
  it('formatNumber uses dots as thousand separators for numbers >= 1000', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1000, max: 1_000_000_000_000 }),
        (num) => {
          const result = formatNumber(num);
          
          // Should contain dots as thousand separators
          // Indonesian locale uses dots for thousands
          return result.includes('.');
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Numbers < 1000 should NOT contain dots (no thousand separators needed).
   */
  it('formatNumber does not use dots for numbers < 1000', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 999 }),
        (num) => {
          const result = formatNumber(num);
          
          // Should NOT contain dots for small numbers
          return !result.includes('.');
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Parsing the formatted output back should equal the original number.
   * This validates round-trip consistency.
   */
  it('formatNumber output parsed back equals the original number', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 999_999_999 }), // Reasonable range for parsing
        (num) => {
          const result = formatNumber(num);
          
          // Remove dots (thousand separators) and parse back
          const parsedBack = parseInt(result.replace(/\./g, ''), 10);
          
          // Should equal the original number
          return parsedBack === num;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Negative numbers should contain minus sign and use dots for separators.
   */
  it('formatNumber handles negative numbers with dots as separators', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -1_000_000_000_000, max: -1000 }),
        (num) => {
          const result = formatNumber(num);
          
          // Should contain minus sign
          if (!result.includes('-')) return false;
          
          // Should contain dots as thousand separators
          return result.includes('.');
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Null and undefined should return "0" (the fallback value).
   */
  it('formatNumber returns "0" for null and undefined', () => {
    expect(formatNumber(null)).toBe('0');
    expect(formatNumber(undefined)).toBe('0');
  });

  /**
   * Zero should return "0".
   */
  it('formatNumber returns "0" for zero', () => {
    expect(formatNumber(0)).toBe('0');
  });

  /**
   * The output should be a non-empty string for any number.
   */
  it('formatNumber returns non-empty string for any number', () => {
    fc.assert(
      fc.property(
        numberArbitrary,
        (num) => {
          const result = formatNumber(num);
          return typeof result === 'string' && result.length > 0;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * The digits in the output should match the original number's digits.
   */
  it('formatNumber preserves the numeric value (digits match)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 999_999_999 }),
        (num) => {
          const result = formatNumber(num);
          
          // Extract all digits from the result
          const digits = result.replace(/[^\d]/g, '');
          
          // The digits should match the original number
          return digits === String(num);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Test specific examples to verify correct formatting.
   */
  describe('Specific number formatting examples', () => {
    it('formats 1,500,000 correctly', () => {
      const result = formatNumber(1500000);
      expect(result).toBe('1.500.000');
    });

    it('formats 1,000 correctly', () => {
      const result = formatNumber(1000);
      expect(result).toBe('1.000');
    });

    it('formats 999 correctly (no separator)', () => {
      const result = formatNumber(999);
      expect(result).toBe('999');
    });

    it('formats 100 correctly', () => {
      const result = formatNumber(100);
      expect(result).toBe('100');
    });

    it('formats negative 1,500,000 correctly', () => {
      const result = formatNumber(-1500000);
      expect(result).toBe('-1.500.000');
    });

    it('formats large numbers (billions) correctly', () => {
      const result = formatNumber(1500000000);
      expect(result).toBe('1.500.000.000');
    });
  });

  /**
   * Test round-trip consistency with specific examples.
   */
  describe('Round-trip consistency examples', () => {
    const testCases = [
      { input: 0, formatted: '0' },
      { input: 100, formatted: '100' },
      { input: 1000, formatted: '1.000' },
      { input: 1500000, formatted: '1.500.000' },
      { input: 1500000000, formatted: '1.500.000.000' },
    ];

    testCases.forEach(({ input, formatted }) => {
      it(`round-trip for ${input}: format → parse → equals original`, () => {
        const result = formatNumber(input);
        expect(result).toBe(formatted);
        
        // Parse back by removing dots
        const parsedBack = parseInt(result.replace(/\./g, ''), 10);
        expect(parsedBack).toBe(input);
      });
    });
  });
});


// =====================================================
// Property 12: Percentage Formatting
// **Validates: Requirements 6.2**
// =====================================================
describe('Property 12: Percentage Formatting', () => {
  /**
   * For any decimal number, formatPercent SHALL return a string ending with "%"
   * and using comma as the decimal separator (Indonesian locale).
   * 
   * **Validates: Requirements 6.2**
   */

  /**
   * Custom arbitrary for generating decimal numbers (0 to 2 range covers most percentages).
   */
  const decimalArbitrary = fc.double({
    min: -10,
    max: 10,
    noNaN: true,
    noDefaultInfinity: true,
  });

  /**
   * Percentage output should always end with "%".
   */
  it('formatPercent output ends with "%" for any decimal number', () => {
    fc.assert(
      fc.property(
        decimalArbitrary,
        (decimal) => {
          const result = formatPercent(decimal);
          
          // Should end with "%"
          return result.endsWith('%');
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Percentage output should use comma as decimal separator (Indonesian locale).
   * For decimals that result in non-integer percentages, the output should contain comma.
   */
  it('formatPercent uses comma as decimal separator for non-integer percentages', () => {
    fc.assert(
      fc.property(
        // Generate decimals that will result in non-integer percentages
        fc.double({ min: 0.001, max: 0.999, noNaN: true, noDefaultInfinity: true }),
        (decimal) => {
          const result = formatPercent(decimal);
          
          // The percentage value (decimal * 100) should have a decimal part
          const percentage = decimal * 100;
          const hasDecimalPart = percentage % 1 !== 0;
          
          // If the percentage has a decimal part, the output should contain comma
          // (Indonesian locale uses comma as decimal separator)
          if (hasDecimalPart) {
            // Note: formatPercent rounds to 1 decimal place, so some values may round to integers
            // We check that if there's a decimal in the output, it uses comma
            return !result.includes('.') || result.includes(',');
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Null and undefined should return "0%" (the fallback value).
   */
  it('formatPercent returns "0%" for null and undefined', () => {
    expect(formatPercent(null)).toBe('0%');
    expect(formatPercent(undefined)).toBe('0%');
  });

  /**
   * Zero should return "0%".
   */
  it('formatPercent returns "0%" for zero', () => {
    expect(formatPercent(0)).toBe('0%');
  });

  /**
   * The output should be a non-empty string for any decimal.
   */
  it('formatPercent returns non-empty string for any decimal', () => {
    fc.assert(
      fc.property(
        decimalArbitrary,
        (decimal) => {
          const result = formatPercent(decimal);
          return typeof result === 'string' && result.length > 0;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * The numeric value in the output should be approximately decimal * 100.
   */
  it('formatPercent output represents decimal * 100', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0, max: 2, noNaN: true, noDefaultInfinity: true }),
        (decimal) => {
          const result = formatPercent(decimal);
          
          // Extract the numeric part (remove % and replace comma with dot for parsing)
          const numericPart = result.replace('%', '').replace(',', '.').trim();
          const parsedValue = parseFloat(numericPart);
          
          // Should be approximately decimal * 100 (within rounding tolerance)
          const expected = decimal * 100;
          const tolerance = 0.15; // Allow for rounding to 1 decimal place
          
          return Math.abs(parsedValue - expected) <= tolerance;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Negative decimals should produce negative percentages.
   */
  it('formatPercent handles negative decimals correctly', () => {
    fc.assert(
      fc.property(
        fc.double({ min: -10, max: -0.01, noNaN: true, noDefaultInfinity: true }),
        (decimal) => {
          const result = formatPercent(decimal);
          
          // Should contain minus sign for negative percentages
          return result.includes('-') && result.endsWith('%');
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Test specific examples to verify correct formatting.
   */
  describe('Specific percentage formatting examples', () => {
    it('formats 0.755 as "75,5%"', () => {
      const result = formatPercent(0.755);
      expect(result).toBe('75,5%');
    });

    it('formats 1.5 as "150%"', () => {
      const result = formatPercent(1.5);
      expect(result).toBe('150%');
    });

    it('formats 0.5 as "50%"', () => {
      const result = formatPercent(0.5);
      expect(result).toBe('50%');
    });

    it('formats 1.0 as "100%"', () => {
      const result = formatPercent(1.0);
      expect(result).toBe('100%');
    });

    it('formats 0.1 as "10%"', () => {
      const result = formatPercent(0.1);
      expect(result).toBe('10%');
    });

    it('formats 0.123 as "12,3%"', () => {
      const result = formatPercent(0.123);
      expect(result).toBe('12,3%');
    });

    it('formats negative 0.25 as "-25%"', () => {
      const result = formatPercent(-0.25);
      expect(result).toBe('-25%');
    });

    it('formats 0.001 as "0,1%"', () => {
      const result = formatPercent(0.001);
      expect(result).toBe('0,1%');
    });
  });

  /**
   * Test that output uses comma (not dot) as decimal separator.
   */
  describe('Indonesian locale decimal separator', () => {
    it('uses comma as decimal separator for 75.5%', () => {
      const result = formatPercent(0.755);
      expect(result).toContain(',');
      expect(result).not.toContain('.');
    });

    it('uses comma as decimal separator for 12.3%', () => {
      const result = formatPercent(0.123);
      expect(result).toContain(',');
      expect(result).not.toContain('.');
    });

    it('integer percentages do not have decimal separator', () => {
      const result = formatPercent(0.5); // 50%
      expect(result).toBe('50%');
      expect(result).not.toContain(',');
      expect(result).not.toContain('.');
    });
  });
});


// =====================================================
// Property 13: Date Formatting Round-Trip Consistency
// **Validates: Requirements 4.1**
// =====================================================
describe('Property 13: Date Formatting Round-Trip Consistency', () => {
  /**
   * For any valid Date object, formatting with toInputDate and then parsing
   * the result back to a Date SHALL produce a date with the same year, month,
   * and day as the original.
   * 
   * **Validates: Requirements 4.1 (round-trip validation)**
   */

  /**
   * Custom arbitrary for generating valid dates within a reasonable range.
   */
  const validDateArbitraryForRoundTrip = fc.date({
    min: new Date('1970-01-01'),
    max: new Date('2100-12-31'),
  }).filter((d) => !isNaN(d.getTime()));

  /**
   * Round-trip: toInputDate → parse → same year/month/day.
   */
  it('toInputDate round-trip preserves year, month, and day', () => {
    fc.assert(
      fc.property(
        validDateArbitraryForRoundTrip,
        (date) => {
          // Format the date
          const formatted = toInputDate(date);
          
          // Should not be empty (fallback for invalid dates)
          if (formatted === '') return false;
          
          // Parse the formatted string back to a Date
          // Note: "YYYY-MM-DD" is parsed as UTC midnight by JavaScript
          const parsedBack = new Date(formatted);
          
          // Check if parsing was successful
          if (isNaN(parsedBack.getTime())) return false;
          
          // Compare year, month, and day
          // Original date uses local time
          const originalYear = date.getFullYear();
          const originalMonth = date.getMonth();
          const originalDay = date.getDate();
          
          // Parsed date is in UTC, so we use UTC methods
          const parsedYear = parsedBack.getUTCFullYear();
          const parsedMonth = parsedBack.getUTCMonth();
          const parsedDay = parsedBack.getUTCDate();
          
          return (
            originalYear === parsedYear &&
            originalMonth === parsedMonth &&
            originalDay === parsedDay
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Round-trip should work for dates at different times of day.
   * The time component should not affect the date round-trip.
   */
  it('toInputDate round-trip works regardless of time component', () => {
    fc.assert(
      fc.property(
        validDateArbitraryForRoundTrip,
        fc.integer({ min: 0, max: 23 }), // Hour
        fc.integer({ min: 0, max: 59 }), // Minute
        fc.integer({ min: 0, max: 59 }), // Second
        (date, hour, minute, second) => {
          // Create a date with specific time
          const dateWithTime = new Date(
            date.getFullYear(),
            date.getMonth(),
            date.getDate(),
            hour,
            minute,
            second
          );
          
          // Format the date
          const formatted = toInputDate(dateWithTime);
          
          // Should not be empty
          if (formatted === '') return false;
          
          // Parse back
          const parsedBack = new Date(formatted);
          
          // Check if parsing was successful
          if (isNaN(parsedBack.getTime())) return false;
          
          // Compare year, month, and day (time should be ignored)
          const originalYear = dateWithTime.getFullYear();
          const originalMonth = dateWithTime.getMonth();
          const originalDay = dateWithTime.getDate();
          
          const parsedYear = parsedBack.getUTCFullYear();
          const parsedMonth = parsedBack.getUTCMonth();
          const parsedDay = parsedBack.getUTCDate();
          
          return (
            originalYear === parsedYear &&
            originalMonth === parsedMonth &&
            originalDay === parsedDay
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Round-trip should work for edge case dates (first/last day of month, leap years).
   */
  it('toInputDate round-trip works for edge case dates', () => {
    const edgeCaseDates = [
      new Date(2026, 0, 1),   // First day of year
      new Date(2026, 11, 31), // Last day of year
      new Date(2024, 1, 29),  // Leap year Feb 29
      new Date(2026, 0, 31),  // Last day of January
      new Date(2026, 3, 30),  // Last day of April
      new Date(2026, 5, 30),  // Last day of June
      new Date(2000, 0, 1),   // Y2K
      new Date(2099, 11, 31), // Far future
    ];

    fc.assert(
      fc.property(
        fc.constantFrom(...edgeCaseDates),
        (date) => {
          const formatted = toInputDate(date);
          
          if (formatted === '') return false;
          
          const parsedBack = new Date(formatted);
          
          if (isNaN(parsedBack.getTime())) return false;
          
          const originalYear = date.getFullYear();
          const originalMonth = date.getMonth();
          const originalDay = date.getDate();
          
          const parsedYear = parsedBack.getUTCFullYear();
          const parsedMonth = parsedBack.getUTCMonth();
          const parsedDay = parsedBack.getUTCDate();
          
          return (
            originalYear === parsedYear &&
            originalMonth === parsedMonth &&
            originalDay === parsedDay
          );
        }
      ),
      { numRuns: edgeCaseDates.length }
    );
  });

  /**
   * Test specific round-trip examples.
   */
  describe('Specific round-trip examples', () => {
    const testCases = [
      { date: new Date(2026, 0, 15), expected: '2026-01-15' },
      { date: new Date(2026, 11, 31), expected: '2026-12-31' },
      { date: new Date(2024, 1, 29), expected: '2024-02-29' }, // Leap year
      { date: new Date(2026, 0, 1), expected: '2026-01-01' },
      { date: new Date(2000, 0, 1), expected: '2000-01-01' },
    ];

    testCases.forEach(({ date, expected }) => {
      it(`round-trip for ${expected}`, () => {
        // Format
        const formatted = toInputDate(date);
        expect(formatted).toBe(expected);
        
        // Parse back
        const parsedBack = new Date(formatted);
        
        // Verify year, month, day match
        expect(parsedBack.getUTCFullYear()).toBe(date.getFullYear());
        expect(parsedBack.getUTCMonth()).toBe(date.getMonth());
        expect(parsedBack.getUTCDate()).toBe(date.getDate());
      });
    });
  });

  /**
   * The formatted output should always be parseable back to a valid Date.
   */
  it('toInputDate output is always parseable to a valid Date', () => {
    fc.assert(
      fc.property(
        validDateArbitraryForRoundTrip,
        (date) => {
          const formatted = toInputDate(date);
          
          if (formatted === '') return false;
          
          const parsedBack = new Date(formatted);
          
          // Should be a valid Date (not NaN)
          return !isNaN(parsedBack.getTime());
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Multiple round-trips should produce the same result.
   * format → parse → format should equal the first format.
   */
  it('multiple round-trips produce consistent results', () => {
    fc.assert(
      fc.property(
        validDateArbitraryForRoundTrip,
        (date) => {
          // First round-trip
          const formatted1 = toInputDate(date);
          if (formatted1 === '') return false;
          
          const parsed1 = new Date(formatted1);
          if (isNaN(parsed1.getTime())) return false;
          
          // Second round-trip (using parsed date)
          // Note: We need to create a local date from the UTC parsed date
          const localDate = new Date(
            parsed1.getUTCFullYear(),
            parsed1.getUTCMonth(),
            parsed1.getUTCDate()
          );
          const formatted2 = toInputDate(localDate);
          
          // Both formatted strings should be identical
          return formatted1 === formatted2;
        }
      ),
      { numRuns: 100 }
    );
  });
});
