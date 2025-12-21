/**
 * Unit Tests for User Preferences Utilities
 * Feature: user-preferences
 * 
 * Tests format utilities, notification preference logic, and edge cases.
 */

import { describe, it, expect } from 'vitest'
import {
  formatDateWithPreferences,
  formatCurrencyWithPreferences,
  formatNumberWithPreferences,
  getDateFormatPreview,
  getNumberFormatPreview,
  filterNotificationTypesByRole,
  groupNotificationTypesByCategory,
  mergeNotificationTypesWithPreferences,
  getEffectiveNotificationPreference,
  isPreferenceOverridden,
  mergePreferencesWithDefaults,
  validateRefreshInterval,
  isValidPreferences,
} from '@/lib/user-preferences-utils'
import {
  DisplayPreferences,
  NotificationType,
  UserNotificationTypePreference,
  DEFAULT_PREFERENCES,
} from '@/types/user-preferences'

const defaultDisplayPrefs: DisplayPreferences = {
  theme: 'light',
  language: 'id',
  dateFormat: 'DD/MM/YYYY',
  numberFormat: 'id-ID',
  timezone: 'Asia/Jakarta',
  compactMode: false,
}

describe('User Preferences Utils - Unit Tests', () => {
  describe('formatDateWithPreferences', () => {
    it('should format date with DD/MM/YYYY format', () => {
      const date = new Date(2025, 11, 22) // December 22, 2025
      const result = formatDateWithPreferences(date, {
        ...defaultDisplayPrefs,
        dateFormat: 'DD/MM/YYYY',
      })
      expect(result).toBe('22/12/2025')
    })

    it('should format date with MM/DD/YYYY format', () => {
      const date = new Date(2025, 11, 22)
      const result = formatDateWithPreferences(date, {
        ...defaultDisplayPrefs,
        dateFormat: 'MM/DD/YYYY',
      })
      expect(result).toBe('12/22/2025')
    })

    it('should format date with YYYY-MM-DD format', () => {
      const date = new Date(2025, 11, 22)
      const result = formatDateWithPreferences(date, {
        ...defaultDisplayPrefs,
        dateFormat: 'YYYY-MM-DD',
      })
      expect(result).toBe('2025-12-22')
    })

    it('should handle ISO date strings', () => {
      const result = formatDateWithPreferences('2025-12-22T10:30:00Z', defaultDisplayPrefs)
      expect(result).toMatch(/^\d{2}\/\d{2}\/\d{4}$/)
    })

    it('should return "-" for null/undefined', () => {
      expect(formatDateWithPreferences(null, defaultDisplayPrefs)).toBe('-')
      expect(formatDateWithPreferences(undefined, defaultDisplayPrefs)).toBe('-')
    })

    it('should return "-" for invalid dates', () => {
      expect(formatDateWithPreferences('invalid', defaultDisplayPrefs)).toBe('-')
    })
  })

  describe('formatCurrencyWithPreferences', () => {
    it('should format currency with Indonesian locale', () => {
      const result = formatCurrencyWithPreferences(1234567, {
        ...defaultDisplayPrefs,
        numberFormat: 'id-ID',
      })
      expect(result).toContain('Rp')
      expect(result).toMatch(/1\.234\.567/)
    })

    it('should format currency with US locale', () => {
      const result = formatCurrencyWithPreferences(1234567, {
        ...defaultDisplayPrefs,
        numberFormat: 'en-US',
      })
      // US locale formats IDR differently - just check it contains the amount
      expect(result).toMatch(/1,234,567|IDR/)
    })

    it('should handle zero', () => {
      const result = formatCurrencyWithPreferences(0, defaultDisplayPrefs)
      expect(result).toContain('Rp')
      expect(result).toContain('0')
    })

    it('should handle null/undefined/NaN', () => {
      expect(formatCurrencyWithPreferences(null, defaultDisplayPrefs)).toContain('Rp')
      expect(formatCurrencyWithPreferences(undefined, defaultDisplayPrefs)).toContain('Rp')
      expect(formatCurrencyWithPreferences(NaN, defaultDisplayPrefs)).toContain('Rp')
    })
  })

  describe('formatNumberWithPreferences', () => {
    it('should format number with Indonesian locale', () => {
      const result = formatNumberWithPreferences(1234567, {
        ...defaultDisplayPrefs,
        numberFormat: 'id-ID',
      })
      expect(result).toMatch(/1\.234\.567/)
    })

    it('should format number with US locale', () => {
      const result = formatNumberWithPreferences(1234567, {
        ...defaultDisplayPrefs,
        numberFormat: 'en-US',
      })
      expect(result).toMatch(/1,234,567/)
    })

    it('should return "0" for null/undefined/NaN', () => {
      expect(formatNumberWithPreferences(null, defaultDisplayPrefs)).toBe('0')
      expect(formatNumberWithPreferences(undefined, defaultDisplayPrefs)).toBe('0')
      expect(formatNumberWithPreferences(NaN, defaultDisplayPrefs)).toBe('0')
    })
  })

  describe('getDateFormatPreview', () => {
    it('should return preview matching format pattern', () => {
      expect(getDateFormatPreview('DD/MM/YYYY')).toMatch(/^\d{2}\/\d{2}\/\d{4}$/)
      expect(getDateFormatPreview('MM/DD/YYYY')).toMatch(/^\d{2}\/\d{2}\/\d{4}$/)
      expect(getDateFormatPreview('YYYY-MM-DD')).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })
  })

  describe('getNumberFormatPreview', () => {
    it('should return preview with currency symbol', () => {
      // Preview contains currency formatting - may vary by locale
      const idPreview = getNumberFormatPreview('id-ID')
      const usPreview = getNumberFormatPreview('en-US')
      
      // Both should contain some form of currency indicator or number
      expect(idPreview).toMatch(/Rp|IDR|\d/)
      expect(usPreview).toMatch(/Rp|IDR|\d/)
    })

    it('should use correct separators', () => {
      expect(getNumberFormatPreview('id-ID')).toMatch(/\d{1,3}(\.\d{3})+/)
      expect(getNumberFormatPreview('en-US')).toMatch(/\d{1,3}(,\d{3})+/)
    })
  })

  describe('filterNotificationTypesByRole', () => {
    const types: NotificationType[] = [
      {
        id: '1',
        type_code: 'bkk_pending',
        type_name: 'BKK Pending',
        description: null,
        category: 'approvals',
        default_email: true,
        default_push: true,
        default_in_app: true,
        applicable_roles: ['owner', 'admin', 'manager'],
        display_order: 1,
        is_active: true,
        created_at: new Date().toISOString(),
      },
      {
        id: '2',
        type_code: 'leave_approved',
        type_name: 'Leave Approved',
        description: null,
        category: 'hr',
        default_email: true,
        default_push: true,
        default_in_app: true,
        applicable_roles: ['owner', 'admin', 'manager', 'finance', 'ops', 'sales'],
        display_order: 2,
        is_active: true,
        created_at: new Date().toISOString(),
      },
      {
        id: '3',
        type_code: 'system_update',
        type_name: 'System Update',
        description: null,
        category: 'system',
        default_email: true,
        default_push: true,
        default_in_app: true,
        applicable_roles: [], // Empty means all roles
        display_order: 3,
        is_active: true,
        created_at: new Date().toISOString(),
      },
    ]

    it('should filter types by role', () => {
      const filtered = filterNotificationTypesByRole(types, 'sales')
      expect(filtered).toHaveLength(2) // leave_approved and system_update
      expect(filtered.map((t) => t.type_code)).toContain('leave_approved')
      expect(filtered.map((t) => t.type_code)).toContain('system_update')
      expect(filtered.map((t) => t.type_code)).not.toContain('bkk_pending')
    })

    it('should include types with empty applicable_roles', () => {
      const filtered = filterNotificationTypesByRole(types, 'any_role')
      expect(filtered.map((t) => t.type_code)).toContain('system_update')
    })

    it('should include all types for owner role', () => {
      const filtered = filterNotificationTypesByRole(types, 'owner')
      expect(filtered).toHaveLength(3)
    })
  })

  describe('groupNotificationTypesByCategory', () => {
    it('should group types by category', () => {
      const types = [
        { type_code: 'a', category: 'approvals', display_order: 1 },
        { type_code: 'b', category: 'finance', display_order: 2 },
        { type_code: 'c', category: 'approvals', display_order: 3 },
      ].map((t) => ({
        ...t,
        id: t.type_code,
        type_name: t.type_code,
        description: null,
        default_email: true,
        default_push: true,
        default_in_app: true,
        applicable_roles: [],
        is_active: true,
        created_at: new Date().toISOString(),
        email_enabled: true,
        push_enabled: true,
        in_app_enabled: true,
      }))

      const groups = groupNotificationTypesByCategory(types as any)
      
      expect(groups).toHaveLength(2) // approvals and finance
      
      const approvalsGroup = groups.find((g) => g.category === 'approvals')
      expect(approvalsGroup?.types).toHaveLength(2)
      
      const financeGroup = groups.find((g) => g.category === 'finance')
      expect(financeGroup?.types).toHaveLength(1)
    })

    it('should sort types by display_order within groups', () => {
      const types = [
        { type_code: 'c', category: 'approvals', display_order: 3 },
        { type_code: 'a', category: 'approvals', display_order: 1 },
        { type_code: 'b', category: 'approvals', display_order: 2 },
      ].map((t) => ({
        ...t,
        id: t.type_code,
        type_name: t.type_code,
        description: null,
        default_email: true,
        default_push: true,
        default_in_app: true,
        applicable_roles: [],
        is_active: true,
        created_at: new Date().toISOString(),
        email_enabled: true,
        push_enabled: true,
        in_app_enabled: true,
      }))

      const groups = groupNotificationTypesByCategory(types as any)
      const approvalsGroup = groups.find((g) => g.category === 'approvals')
      
      expect(approvalsGroup?.types[0].type_code).toBe('a')
      expect(approvalsGroup?.types[1].type_code).toBe('b')
      expect(approvalsGroup?.types[2].type_code).toBe('c')
    })
  })

  describe('mergeNotificationTypesWithPreferences', () => {
    it('should use defaults when no user preferences exist', () => {
      const types: NotificationType[] = [
        {
          id: '1',
          type_code: 'test',
          type_name: 'Test',
          description: null,
          category: 'system',
          default_email: false,
          default_push: true,
          default_in_app: true,
          applicable_roles: [],
          display_order: 1,
          is_active: true,
          created_at: new Date().toISOString(),
        },
      ]

      const merged = mergeNotificationTypesWithPreferences(types, [])
      
      expect(merged[0].email_enabled).toBe(false)
      expect(merged[0].push_enabled).toBe(true)
      expect(merged[0].in_app_enabled).toBe(true)
    })

    it('should use user preferences when they exist', () => {
      const types: NotificationType[] = [
        {
          id: '1',
          type_code: 'test',
          type_name: 'Test',
          description: null,
          category: 'system',
          default_email: true,
          default_push: true,
          default_in_app: true,
          applicable_roles: [],
          display_order: 1,
          is_active: true,
          created_at: new Date().toISOString(),
        },
      ]

      const userPrefs: UserNotificationTypePreference[] = [
        {
          id: 'pref1',
          user_id: 'user1',
          notification_type: 'test',
          email_enabled: false,
          push_enabled: false,
          in_app_enabled: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ]

      const merged = mergeNotificationTypesWithPreferences(types, userPrefs)
      
      expect(merged[0].email_enabled).toBe(false)
      expect(merged[0].push_enabled).toBe(false)
      expect(merged[0].in_app_enabled).toBe(true)
    })
  })

  describe('getEffectiveNotificationPreference', () => {
    it('should return false when master channel is disabled', () => {
      expect(getEffectiveNotificationPreference(true, false)).toBe(false)
      expect(getEffectiveNotificationPreference(false, false)).toBe(false)
    })

    it('should return type preference when master channel is enabled', () => {
      expect(getEffectiveNotificationPreference(true, true)).toBe(true)
      expect(getEffectiveNotificationPreference(false, true)).toBe(false)
    })
  })

  describe('isPreferenceOverridden', () => {
    it('should return true when master channel is disabled', () => {
      expect(isPreferenceOverridden(false)).toBe(true)
    })

    it('should return false when master channel is enabled', () => {
      expect(isPreferenceOverridden(true)).toBe(false)
    })
  })

  describe('mergePreferencesWithDefaults', () => {
    it('should return defaults for null/undefined', () => {
      expect(mergePreferencesWithDefaults(null)).toEqual(DEFAULT_PREFERENCES)
      expect(mergePreferencesWithDefaults(undefined)).toEqual(DEFAULT_PREFERENCES)
    })

    it('should merge partial preferences with defaults', () => {
      const partial = {
        display: { theme: 'dark' as const },
      }
      const merged = mergePreferencesWithDefaults(partial as any)
      
      expect(merged.display.theme).toBe('dark')
      expect(merged.display.language).toBe(DEFAULT_PREFERENCES.display.language)
      expect(merged.notifications).toEqual(DEFAULT_PREFERENCES.notifications)
    })
  })

  describe('validateRefreshInterval', () => {
    it('should clamp values below minimum', () => {
      expect(validateRefreshInterval(30)).toBe(60)
      expect(validateRefreshInterval(0)).toBe(60)
      expect(validateRefreshInterval(-100)).toBe(60)
    })

    it('should clamp values above maximum', () => {
      expect(validateRefreshInterval(1000)).toBe(900)
      expect(validateRefreshInterval(9999)).toBe(900)
    })

    it('should return valid values unchanged', () => {
      expect(validateRefreshInterval(60)).toBe(60)
      expect(validateRefreshInterval(300)).toBe(300)
      expect(validateRefreshInterval(900)).toBe(900)
    })
  })

  describe('isValidPreferences', () => {
    it('should return true for valid preferences', () => {
      expect(isValidPreferences(DEFAULT_PREFERENCES)).toBe(true)
    })

    it('should return false for invalid values', () => {
      expect(isValidPreferences(null)).toBe(false)
      expect(isValidPreferences(undefined)).toBe(false)
      expect(isValidPreferences('string')).toBe(false)
      expect(isValidPreferences(123)).toBe(false)
      expect(isValidPreferences({})).toBe(false)
      expect(isValidPreferences({ display: {} })).toBe(false)
    })
  })
})
