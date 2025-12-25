/**
 * Property-based tests for login-history-utils.ts
 * Feature: system-audit-logging
 * 
 * Uses fast-check for property-based testing with minimum 100 iterations
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  parseUserAgent,
  createLoginInput,
  createFailedLoginInput,
  calculateSessionDuration,
  createLogoutUpdate,
  filterLoginHistory,
  sortLoginHistory,
  paginateLoginHistory,
  calculateSessionStatistics,
  formatSessionDuration,
  isValidLoginMethod,
  isValidLoginStatus,
  isValidDeviceType,
  getActiveSessions,
  getFailedLogins,
  getRecentFailedLogins,
  hasSuspiciousActivity,
  getUserLoginHistory,
} from '@/lib/login-history-utils';
import {
  LoginHistoryEntry,
  LoginMethod,
  DeviceType,
  LoginStatus,
  LoginHistoryFilters,
} from '@/types/login-history';

// =====================================================
// Generators
// =====================================================

const loginMethodGenerator = fc.constantFrom<LoginMethod>('password', 'google', 'magic_link');
const deviceTypeGenerator = fc.constantFrom<DeviceType>('desktop', 'mobile', 'tablet');
const loginStatusGenerator = fc.constantFrom<LoginStatus>('success', 'failed');

// Safe timestamp generator
const safeTimestampGenerator = fc.integer({ min: 0, max: 3650 }).map((daysFromBase) => {
  const baseDate = new Date('2020-01-01');
  baseDate.setDate(baseDate.getDate() + daysFromBase);
  return baseDate.toISOString();
});

// Safe date string generator
const safeDateStringGenerator = fc.integer({ min: 0, max: 3650 }).map((daysFromBase) => {
  const baseDate = new Date('2020-01-01');
  baseDate.setDate(baseDate.getDate() + daysFromBase);
  return baseDate.toISOString().split('T')[0];
});


// User agent generator with realistic patterns
const userAgentGenerator = fc.constantFrom(
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (iPad; CPU OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.144 Mobile Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 OPR/106.0.0.0'
);

// Browser generator
const browserGenerator = fc.constantFrom(
  'Chrome', 'Firefox', 'Safari', 'Edge', 'Opera', 'Unknown'
);

// OS generator
const osGenerator = fc.constantFrom(
  'Windows 10', 'macOS', 'Linux', 'Android', 'iOS', 'iPadOS', 'Unknown'
);

// Login history entry generator
const loginHistoryEntryGenerator = (overrides: Partial<LoginHistoryEntry> = {}): fc.Arbitrary<LoginHistoryEntry> =>
  fc.record({
    id: fc.uuid(),
    user_id: fc.uuid(),
    login_at: safeTimestampGenerator,
    logout_at: fc.option(safeTimestampGenerator, { nil: null }),
    session_duration_minutes: fc.option(fc.integer({ min: 1, max: 1440 }), { nil: null }),
    login_method: loginMethodGenerator,
    ip_address: fc.option(fc.ipV4(), { nil: null }),
    user_agent: fc.option(userAgentGenerator, { nil: null }),
    device_type: fc.option(deviceTypeGenerator, { nil: null }),
    browser: fc.option(browserGenerator, { nil: null }),
    os: fc.option(osGenerator, { nil: null }),
    country: fc.option(fc.constantFrom('Indonesia', 'Singapore', 'Malaysia', 'USA'), { nil: null }),
    city: fc.option(fc.constantFrom('Jakarta', 'Singapore', 'Kuala Lumpur', 'New York'), { nil: null }),
    status: loginStatusGenerator,
    failure_reason: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: null }),
  }).map((entry) => ({ ...entry, ...overrides }));

// Successful login entry generator
const successfulLoginEntryGenerator = (): fc.Arbitrary<LoginHistoryEntry> =>
  loginHistoryEntryGenerator({ status: 'success', failure_reason: null });

// Failed login entry generator
const failedLoginEntryGenerator = (): fc.Arbitrary<LoginHistoryEntry> =>
  fc.string({ minLength: 1, maxLength: 100 }).chain((reason) =>
    loginHistoryEntryGenerator({ status: 'failed', failure_reason: reason })
  );


// =====================================================
// Property 6: Login Session Lifecycle
// =====================================================

describe('Property 6: Login Session Lifecycle', () => {
  /**
   * Feature: system-audit-logging, Property 6: Login Session Lifecycle
   * For any successful login followed by a logout, the login_history record 
   * SHALL have login_at set to the login time, logout_at set to the logout time, 
   * and session_duration_minutes SHALL equal the difference between logout_at 
   * and login_at in minutes (rounded).
   * Validates: Requirements 3.1, 3.2
   */

  it('should set login_at to current time when creating login input', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        loginMethodGenerator,
        (userId, loginMethod) => {
          const before = new Date();
          const input = createLoginInput({ user_id: userId, login_method: loginMethod });
          const after = new Date();
          
          const loginAt = new Date(input.login_at);
          
          // login_at should be between before and after
          expect(loginAt.getTime()).toBeGreaterThanOrEqual(before.getTime() - 1000);
          expect(loginAt.getTime()).toBeLessThanOrEqual(after.getTime() + 1000);
          expect(input.status).toBe('success');
          expect(input.logout_at).toBeNull();
          expect(input.session_duration_minutes).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should calculate session duration correctly', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 1440 }), // 1 minute to 24 hours
        (durationMinutes) => {
          const loginAt = new Date('2024-01-01T10:00:00Z');
          const logoutAt = new Date(loginAt.getTime() + durationMinutes * 60 * 1000);
          
          const calculatedDuration = calculateSessionDuration(loginAt, logoutAt);
          
          expect(calculatedDuration).toBe(durationMinutes);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should calculate session duration with rounding', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 86400 }), // 1 second to 24 hours in seconds
        (durationSeconds) => {
          const loginAt = new Date('2024-01-01T10:00:00Z');
          const logoutAt = new Date(loginAt.getTime() + durationSeconds * 1000);
          
          const calculatedDuration = calculateSessionDuration(loginAt, logoutAt);
          const expectedDuration = Math.round(durationSeconds / 60);
          
          expect(calculatedDuration).toBe(expectedDuration);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should create logout update with correct duration', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 1440 }),
        (durationMinutes) => {
          const loginAt = new Date('2024-01-01T10:00:00Z');
          const logoutAt = new Date(loginAt.getTime() + durationMinutes * 60 * 1000);
          
          const update = createLogoutUpdate(loginAt.toISOString(), logoutAt);
          
          expect(update.logout_at).toBe(logoutAt.toISOString());
          expect(update.session_duration_minutes).toBe(durationMinutes);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle string timestamps for duration calculation', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 1440 }),
        (durationMinutes) => {
          const loginAt = '2024-01-01T10:00:00Z';
          const logoutAt = new Date(new Date(loginAt).getTime() + durationMinutes * 60 * 1000).toISOString();
          
          const calculatedDuration = calculateSessionDuration(loginAt, logoutAt);
          
          expect(calculatedDuration).toBe(durationMinutes);
        }
      ),
      { numRuns: 100 }
    );
  });
});


// =====================================================
// Property 7: User Agent Parsing
// =====================================================

describe('Property 7: User Agent Parsing', () => {
  /**
   * Feature: system-audit-logging, Property 7: User Agent Parsing
   * For any valid user agent string, the parseUserAgent function SHALL extract 
   * and return device_type (desktop, mobile, or tablet), browser name, and 
   * operating system name.
   * Validates: Requirements 3.3
   */

  it('should return valid device_type for any user agent', () => {
    fc.assert(
      fc.property(userAgentGenerator, (userAgent) => {
        const result = parseUserAgent(userAgent);
        
        expect(['desktop', 'mobile', 'tablet']).toContain(result.device_type);
      }),
      { numRuns: 100 }
    );
  });

  it('should return non-empty browser name for any user agent', () => {
    fc.assert(
      fc.property(userAgentGenerator, (userAgent) => {
        const result = parseUserAgent(userAgent);
        
        expect(result.browser).toBeDefined();
        expect(result.browser.length).toBeGreaterThan(0);
      }),
      { numRuns: 100 }
    );
  });

  it('should return non-empty OS name for any user agent', () => {
    fc.assert(
      fc.property(userAgentGenerator, (userAgent) => {
        const result = parseUserAgent(userAgent);
        
        expect(result.os).toBeDefined();
        expect(result.os.length).toBeGreaterThan(0);
      }),
      { numRuns: 100 }
    );
  });

  it('should detect mobile devices correctly', () => {
    const mobileUserAgents = [
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15',
      'Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 Mobile Safari/537.36',
    ];

    for (const ua of mobileUserAgents) {
      const result = parseUserAgent(ua);
      expect(result.device_type).toBe('mobile');
    }
  });

  it('should detect tablet devices correctly', () => {
    const tabletUserAgents = [
      'Mozilla/5.0 (iPad; CPU OS 17_2 like Mac OS X) AppleWebKit/605.1.15',
    ];

    for (const ua of tabletUserAgents) {
      const result = parseUserAgent(ua);
      expect(result.device_type).toBe('tablet');
    }
  });

  it('should detect desktop devices correctly', () => {
    const desktopUserAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0',
    ];

    for (const ua of desktopUserAgents) {
      const result = parseUserAgent(ua);
      expect(result.device_type).toBe('desktop');
    }
  });

  it('should handle empty user agent gracefully', () => {
    const result = parseUserAgent('');
    
    expect(result.device_type).toBe('desktop');
    expect(result.browser).toBe('Unknown');
    expect(result.os).toBe('Unknown');
  });

  it('should detect Chrome browser', () => {
    const chromeUA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
    const result = parseUserAgent(chromeUA);
    expect(result.browser).toBe('Chrome');
  });

  it('should detect Firefox browser', () => {
    const firefoxUA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0';
    const result = parseUserAgent(firefoxUA);
    expect(result.browser).toBe('Firefox');
  });

  it('should detect Safari browser', () => {
    const safariUA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15';
    const result = parseUserAgent(safariUA);
    expect(result.browser).toBe('Safari');
  });

  it('should detect Edge browser', () => {
    const edgeUA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0';
    const result = parseUserAgent(edgeUA);
    expect(result.browser).toBe('Edge');
  });

  it('should detect Windows OS', () => {
    const windowsUA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
    const result = parseUserAgent(windowsUA);
    expect(result.os).toBe('Windows 10');
  });

  it('should detect macOS', () => {
    const macUA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36';
    const result = parseUserAgent(macUA);
    expect(result.os).toBe('macOS');
  });
});


// =====================================================
// Property 14: Session Statistics Calculation
// =====================================================

describe('Property 14: Session Statistics Calculation', () => {
  /**
   * Feature: system-audit-logging, Property 14: Session Statistics Calculation
   * For any set of login_history records for a user with non-null 
   * session_duration_minutes, the calculated average session duration SHALL 
   * equal the sum of all session durations divided by the count of sessions.
   * Validates: Requirements 6.5
   */

  it('should calculate average session duration correctly', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        fc.array(fc.integer({ min: 1, max: 1440 }), { minLength: 1, maxLength: 20 }),
        (userId, durations) => {
          // Create entries with the specified durations
          const entries: LoginHistoryEntry[] = durations.map((duration, i) => ({
            id: `id-${i}`,
            user_id: userId,
            login_at: new Date(Date.now() - i * 86400000).toISOString(),
            logout_at: new Date(Date.now() - i * 86400000 + duration * 60000).toISOString(),
            session_duration_minutes: duration,
            login_method: 'password',
            ip_address: null,
            user_agent: null,
            device_type: null,
            browser: null,
            os: null,
            country: null,
            city: null,
            status: 'success',
            failure_reason: null,
          }));

          const stats = calculateSessionStatistics(userId, entries);
          
          const expectedSum = durations.reduce((sum, d) => sum + d, 0);
          const expectedAvg = expectedSum / durations.length;
          
          expect(stats.total_session_time_minutes).toBe(expectedSum);
          expect(stats.average_session_duration_minutes).toBeCloseTo(expectedAvg, 1);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should count successful and failed logins correctly', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        fc.array(loginHistoryEntryGenerator(), { minLength: 1, maxLength: 20 }),
        (userId, entries) => {
          // Set all entries to the same user
          const userEntries = entries.map((e) => ({ ...e, user_id: userId }));
          
          const stats = calculateSessionStatistics(userId, userEntries);
          
          const expectedSuccessful = userEntries.filter((e) => e.status === 'success').length;
          const expectedFailed = userEntries.filter((e) => e.status === 'failed').length;
          
          expect(stats.successful_logins).toBe(expectedSuccessful);
          expect(stats.failed_logins).toBe(expectedFailed);
          expect(stats.total_sessions).toBe(userEntries.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return zero average for entries without duration', () => {
    fc.assert(
      fc.property(fc.uuid(), (userId) => {
        const entries: LoginHistoryEntry[] = [
          {
            id: 'id-1',
            user_id: userId,
            login_at: new Date().toISOString(),
            logout_at: null,
            session_duration_minutes: null,
            login_method: 'password',
            ip_address: null,
            user_agent: null,
            device_type: null,
            browser: null,
            os: null,
            country: null,
            city: null,
            status: 'success',
            failure_reason: null,
          },
        ];

        const stats = calculateSessionStatistics(userId, entries);
        
        expect(stats.average_session_duration_minutes).toBe(0);
        expect(stats.total_session_time_minutes).toBe(0);
      }),
      { numRuns: 100 }
    );
  });

  it('should identify most used device type', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        deviceTypeGenerator,
        fc.integer({ min: 3, max: 10 }),
        (userId, dominantDevice, count) => {
          // Create entries with dominant device type
          const entries: LoginHistoryEntry[] = [];
          
          // Add dominant device entries
          for (let i = 0; i < count; i++) {
            entries.push({
              id: `id-${i}`,
              user_id: userId,
              login_at: new Date().toISOString(),
              logout_at: null,
              session_duration_minutes: null,
              login_method: 'password',
              ip_address: null,
              user_agent: null,
              device_type: dominantDevice,
              browser: null,
              os: null,
              country: null,
              city: null,
              status: 'success',
              failure_reason: null,
            });
          }
          
          // Add one entry with different device
          const otherDevice: DeviceType = dominantDevice === 'desktop' ? 'mobile' : 'desktop';
          entries.push({
            id: 'id-other',
            user_id: userId,
            login_at: new Date().toISOString(),
            logout_at: null,
            session_duration_minutes: null,
            login_method: 'password',
            ip_address: null,
            user_agent: null,
            device_type: otherDevice,
            browser: null,
            os: null,
            country: null,
            city: null,
            status: 'success',
            failure_reason: null,
          });

          const stats = calculateSessionStatistics(userId, entries);
          
          expect(stats.most_used_device).toBe(dominantDevice);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should collect unique login methods used', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        fc.array(loginMethodGenerator, { minLength: 1, maxLength: 5 }),
        (userId, methods) => {
          const entries: LoginHistoryEntry[] = methods.map((method, i) => ({
            id: `id-${i}`,
            user_id: userId,
            login_at: new Date().toISOString(),
            logout_at: null,
            session_duration_minutes: null,
            login_method: method,
            ip_address: null,
            user_agent: null,
            device_type: null,
            browser: null,
            os: null,
            country: null,
            city: null,
            status: 'success',
            failure_reason: null,
          }));

          const stats = calculateSessionStatistics(userId, entries);
          
          const uniqueMethods = [...new Set(methods)];
          expect(stats.login_methods_used.sort()).toEqual(uniqueMethods.sort());
        }
      ),
      { numRuns: 100 }
    );
  });
});


// =====================================================
// Property 8: Failed Login Recording
// =====================================================

describe('Property 8: Failed Login Recording', () => {
  /**
   * Feature: system-audit-logging, Property 8: Failed Login Recording
   * For any failed login attempt, the login_history record SHALL have status 
   * set to 'failed' and failure_reason SHALL contain a non-empty description 
   * of the failure.
   * Validates: Requirements 3.4
   */

  it('should set status to failed for failed login input', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 100 }),
        (failureReason) => {
          const input = createFailedLoginInput({ failure_reason: failureReason });
          
          expect(input.status).toBe('failed');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should set failure_reason to non-empty string', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 100 }),
        (failureReason) => {
          const input = createFailedLoginInput({ failure_reason: failureReason });
          
          expect(input.failure_reason).toBe(failureReason);
          expect(input.failure_reason!.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should default to "Unknown error" when failure_reason is empty', () => {
    const input = createFailedLoginInput({ failure_reason: '' });
    expect(input.failure_reason).toBe('Unknown error');
  });

  it('should parse user agent for failed logins', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 100 }),
        userAgentGenerator,
        (failureReason, userAgent) => {
          const input = createFailedLoginInput({ 
            failure_reason: failureReason,
            user_agent: userAgent,
          });
          
          expect(input.status).toBe('failed');
          expect(input.user_agent).toBe(userAgent);
          // Device info should be parsed from user agent
          expect(input.device_type).toBeDefined();
        }
      ),
      { numRuns: 100 }
    );
  });
});

// =====================================================
// Login History Filtering Tests
// =====================================================

describe('Login History Filtering', () => {
  it('should return all entries when no filters are applied', () => {
    fc.assert(
      fc.property(
        fc.array(loginHistoryEntryGenerator(), { minLength: 0, maxLength: 20 }),
        (entries) => {
          const result = filterLoginHistory(entries, {});
          expect(result.length).toBe(entries.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should filter by user_id correctly', () => {
    fc.assert(
      fc.property(
        fc.array(loginHistoryEntryGenerator(), { minLength: 1, maxLength: 20 }),
        fc.uuid(),
        (entries, userId) => {
          // Set some entries to have the target user_id
          const modifiedEntries = entries.map((e, i) => 
            i % 2 === 0 ? { ...e, user_id: userId } : e
          );
          
          const result = filterLoginHistory(modifiedEntries, { user_id: userId });
          
          // All results should have the specified user_id
          result.forEach((entry) => {
            expect(entry.user_id).toBe(userId);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should filter by status correctly', () => {
    fc.assert(
      fc.property(
        fc.array(loginHistoryEntryGenerator(), { minLength: 1, maxLength: 20 }),
        loginStatusGenerator,
        (entries, status) => {
          const result = filterLoginHistory(entries, { status });
          
          // All results should have the specified status
          result.forEach((entry) => {
            expect(entry.status).toBe(status);
          });
          
          // Count should match expected
          const expectedCount = entries.filter((e) => e.status === status).length;
          expect(result.length).toBe(expectedCount);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should filter by login_method correctly', () => {
    fc.assert(
      fc.property(
        fc.array(loginHistoryEntryGenerator(), { minLength: 1, maxLength: 20 }),
        loginMethodGenerator,
        (entries, method) => {
          const result = filterLoginHistory(entries, { login_method: method });
          
          // All results should have the specified method
          result.forEach((entry) => {
            expect(entry.login_method).toBe(method);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should filter by date range correctly', () => {
    fc.assert(
      fc.property(
        fc.array(loginHistoryEntryGenerator(), { minLength: 1, maxLength: 20 }),
        safeDateStringGenerator,
        safeDateStringGenerator,
        (entries, date1, date2) => {
          // Ensure start_date <= end_date
          const [startDate, endDate] = date1 <= date2 ? [date1, date2] : [date2, date1];
          
          const result = filterLoginHistory(entries, { start_date: startDate, end_date: endDate });
          
          // All results should be within the date range
          result.forEach((entry) => {
            const entryDate = new Date(entry.login_at);
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            
            expect(entryDate >= start).toBe(true);
            expect(entryDate <= end).toBe(true);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should filter by multiple criteria (AND logic)', () => {
    fc.assert(
      fc.property(
        fc.array(loginHistoryEntryGenerator(), { minLength: 5, maxLength: 20 }),
        loginStatusGenerator,
        loginMethodGenerator,
        (entries, status, method) => {
          const filters: LoginHistoryFilters = { status, login_method: method };
          const result = filterLoginHistory(entries, filters);
          
          // All results should match ALL criteria
          result.forEach((entry) => {
            expect(entry.status).toBe(status);
            expect(entry.login_method).toBe(method);
          });
        }
      ),
      { numRuns: 100 }
    );
  });
});


// =====================================================
// Login History Sorting Tests
// =====================================================

describe('Login History Sorting', () => {
  it('should sort by login_at descending by default', () => {
    fc.assert(
      fc.property(
        fc.array(loginHistoryEntryGenerator(), { minLength: 2, maxLength: 20 }),
        (entries) => {
          const sorted = sortLoginHistory(entries);
          
          for (let i = 1; i < sorted.length; i++) {
            const prevTime = new Date(sorted[i - 1].login_at).getTime();
            const currTime = new Date(sorted[i].login_at).getTime();
            expect(prevTime).toBeGreaterThanOrEqual(currTime);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should not mutate original array', () => {
    fc.assert(
      fc.property(
        fc.array(loginHistoryEntryGenerator(), { minLength: 1, maxLength: 10 }),
        (entries) => {
          const original = [...entries];
          sortLoginHistory(entries);
          expect(entries).toEqual(original);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should sort ascending when specified', () => {
    fc.assert(
      fc.property(
        fc.array(loginHistoryEntryGenerator(), { minLength: 2, maxLength: 20 }),
        (entries) => {
          const sorted = sortLoginHistory(entries, 'login_at', 'asc');
          
          for (let i = 1; i < sorted.length; i++) {
            const prevTime = new Date(sorted[i - 1].login_at).getTime();
            const currTime = new Date(sorted[i].login_at).getTime();
            expect(prevTime).toBeLessThanOrEqual(currTime);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

// =====================================================
// Login History Pagination Tests
// =====================================================

describe('Login History Pagination', () => {
  it('should return correct page size', () => {
    fc.assert(
      fc.property(
        fc.array(loginHistoryEntryGenerator(), { minLength: 10, maxLength: 50 }),
        fc.integer({ min: 1, max: 20 }),
        (entries, pageSize) => {
          const result = paginateLoginHistory(entries, { page: 1, page_size: pageSize });
          
          expect(result.data.length).toBeLessThanOrEqual(pageSize);
          expect(result.page_size).toBe(pageSize);
          expect(result.total).toBe(entries.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should calculate total pages correctly', () => {
    fc.assert(
      fc.property(
        fc.array(loginHistoryEntryGenerator(), { minLength: 1, maxLength: 50 }),
        fc.integer({ min: 1, max: 20 }),
        (entries, pageSize) => {
          const result = paginateLoginHistory(entries, { page: 1, page_size: pageSize });
          
          const expectedTotalPages = Math.ceil(entries.length / pageSize);
          expect(result.total_pages).toBe(expectedTotalPages);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// =====================================================
// Query Helper Tests
// =====================================================

describe('Query Helpers', () => {
  it('should get active sessions (no logout)', () => {
    fc.assert(
      fc.property(
        fc.array(loginHistoryEntryGenerator(), { minLength: 1, maxLength: 20 }),
        (entries) => {
          // Modify some entries to be active (no logout)
          const modifiedEntries = entries.map((e, i) => 
            i % 2 === 0 
              ? { ...e, status: 'success' as const, logout_at: null } 
              : e
          );
          
          const result = getActiveSessions(modifiedEntries);
          
          // All results should be successful with no logout
          result.forEach((entry) => {
            expect(entry.status).toBe('success');
            expect(entry.logout_at).toBeNull();
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should get failed logins only', () => {
    fc.assert(
      fc.property(
        fc.array(loginHistoryEntryGenerator(), { minLength: 1, maxLength: 20 }),
        (entries) => {
          const result = getFailedLogins(entries);
          
          // All results should be failed
          result.forEach((entry) => {
            expect(entry.status).toBe('failed');
          });
          
          // Count should match expected
          const expectedCount = entries.filter((e) => e.status === 'failed').length;
          expect(result.length).toBe(expectedCount);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should get user login history sorted by login_at descending', () => {
    fc.assert(
      fc.property(
        fc.array(loginHistoryEntryGenerator(), { minLength: 1, maxLength: 20 }),
        fc.uuid(),
        (entries, userId) => {
          // Set some entries to have the target user_id
          const modifiedEntries = entries.map((e, i) => 
            i % 2 === 0 ? { ...e, user_id: userId } : e
          );
          
          const result = getUserLoginHistory(modifiedEntries, userId);
          
          // All results should have the specified user_id
          result.forEach((entry) => {
            expect(entry.user_id).toBe(userId);
          });
          
          // Results should be sorted by login_at descending
          for (let i = 1; i < result.length; i++) {
            const prevTime = new Date(result[i - 1].login_at).getTime();
            const currTime = new Date(result[i].login_at).getTime();
            expect(prevTime).toBeGreaterThanOrEqual(currTime);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

// =====================================================
// Validation Tests
// =====================================================

describe('Validation Functions', () => {
  it('should validate all login methods as valid', () => {
    const methods: LoginMethod[] = ['password', 'google', 'magic_link'];
    for (const method of methods) {
      expect(isValidLoginMethod(method)).toBe(true);
    }
  });

  it('should reject invalid login methods', () => {
    fc.assert(
      fc.property(
        fc.string().filter((s) => !['password', 'google', 'magic_link'].includes(s)),
        (invalidMethod) => {
          expect(isValidLoginMethod(invalidMethod)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should validate all login statuses as valid', () => {
    const statuses: LoginStatus[] = ['success', 'failed'];
    for (const status of statuses) {
      expect(isValidLoginStatus(status)).toBe(true);
    }
  });

  it('should reject invalid login statuses', () => {
    fc.assert(
      fc.property(
        fc.string().filter((s) => !['success', 'failed'].includes(s)),
        (invalidStatus) => {
          expect(isValidLoginStatus(invalidStatus)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should validate all device types as valid', () => {
    const deviceTypes: DeviceType[] = ['desktop', 'mobile', 'tablet'];
    for (const deviceType of deviceTypes) {
      expect(isValidDeviceType(deviceType)).toBe(true);
    }
  });

  it('should reject invalid device types', () => {
    fc.assert(
      fc.property(
        fc.string().filter((s) => !['desktop', 'mobile', 'tablet'].includes(s)),
        (invalidDeviceType) => {
          expect(isValidDeviceType(invalidDeviceType)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// =====================================================
// Formatting Tests
// =====================================================

describe('Formatting Functions', () => {
  it('should format session duration correctly', () => {
    expect(formatSessionDuration(null)).toBe('Active');
    expect(formatSessionDuration(0)).toBe('Less than a minute');
    expect(formatSessionDuration(1)).toBe('1 minute');
    expect(formatSessionDuration(30)).toBe('30 minutes');
    expect(formatSessionDuration(60)).toBe('1 hour');
    expect(formatSessionDuration(90)).toBe('1h 30m');
    expect(formatSessionDuration(120)).toBe('2 hours');
  });
});
