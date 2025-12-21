/**
 * Property-Based Tests for User Preferences Utilities
 * Feature: user-preferences
 * 
 * Tests format utilities and notification preference logic using property-based testing.
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
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
  mergePreferencesWithDefaults,
} from '@/lib/user-preferences-utils'
import {
  DisplayPreferences,
  NotificationType,
  NotificationCategory,
  UserNotificationTypePreference,
  UserPreferences,
  DEFAULT_PREFERENCES,
  DateFormat,
  NumberFormat,
} from '@/types/user-preferences'

// Arbitraries for generating test data
const dateFormatArb = fc.constantFrom<DateFormat>('DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD')
const numberFormatArb = fc.constantFrom<NumberFormat>('id-ID', 'en-US')
const categoryArb = fc.constantFrom<NotificationCategory>('approvals', 'finance', 'operations', 'hr', 'system')
const roleArb = fc.constantFrom('owner', 'admin', 'manager', 'finance', 'ops', 'sales')

const displayPreferencesArb: fc.Arbitrary<DisplayPreferences> = fc.record({
  theme: fc.constantFrom('light', 'dark', 'system'),
  language: fc.constantFrom('id', 'en'),
  dateFormat: dateFormatArb,
  numberFormat: numberFormatArb,
  timezone: fc.constantFrom('Asia/Jakarta', 'Asia/Makassar', 'UTC'),
  compactMode: fc.boolean(),
})

const notificationTypeArb: fc.Arbitrary<NotificationType> = fc.record({
  id: fc.uuid(),
  type_code: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
  type_name: fc.string({ minLength: 1, maxLength: 100 }),
  description: fc.option(fc.string(), { nil: null }),
  category: categoryArb,
  default_email: fc.boolean(),
  default_push: fc.boolean(),
  default_in_app: fc.boolean(),
  applicable_roles: fc.array(roleArb, { minLength: 0, maxLength: 6 }),
  display_order: fc.integer({ min: 0, max: 100 }),
  is_active: fc.constant(true),
  created_at: fc.date({ min: new Date('2000-01-01'), max: new Date('2099-12-31') })
    .filter(d => !isNaN(d.getTime()))
    .map(d => d.toISOString()),
})

describe('User Preferences Utils - Property Tests', () => {
  /**
   * Property 2: Date Formatting Consistency
   * For any valid Date and any supported date format preference,
   * the formatDateWithPreferences function should produce a string
   * that matches the expected pattern for that format.
   * 
   * Validates: Requirements 2.3, 2.7, 7.2
   */
  describe('Property 2: Date Formatting Consistency', () => {
    it('should format dates according to the specified format pattern', () => {
      fc.assert(
        fc.property(
          fc.date({ min: new Date('2000-01-01'), max: new Date('2099-12-31') }).filter(d => !isNaN(d.getTime())),
          displayPreferencesArb,
          (date, prefs) => {
            const result = formatDateWithPreferences(date, prefs)
            
            // Result should not be empty or error indicator for valid dates
            expect(result).not.toBe('-')
            
            // Check format pattern
            switch (prefs.dateFormat) {
              case 'DD/MM/YYYY':
                expect(result).toMatch(/^\d{2}\/\d{2}\/\d{4}$/)
                break
              case 'MM/DD/YYYY':
                expect(result).toMatch(/^\d{2}\/\d{2}\/\d{4}$/)
                break
              case 'YYYY-MM-DD':
                expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/)
                break
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should return consistent preview for each format', () => {
      fc.assert(
        fc.property(dateFormatArb, (dateFormat) => {
          const preview = getDateFormatPreview(dateFormat)
          
          switch (dateFormat) {
            case 'DD/MM/YYYY':
              expect(preview).toMatch(/^\d{2}\/\d{2}\/\d{4}$/)
              break
            case 'MM/DD/YYYY':
              expect(preview).toMatch(/^\d{2}\/\d{2}\/\d{4}$/)
              break
            case 'YYYY-MM-DD':
              expect(preview).toMatch(/^\d{4}-\d{2}-\d{2}$/)
              break
          }
        }),
        { numRuns: 100 }
      )
    })
  })

  /**
   * Property 3: Number Formatting Consistency
   * For any valid number and any supported number format preference,
   * the formatting functions should produce strings using the correct
   * locale-specific separators.
   * 
   * Validates: Requirements 2.4, 7.3
   */
  describe('Property 3: Number Formatting Consistency', () => {
    it('should format currency with correct locale separators', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1000, max: 1000000000 }), // Start from 1000 to ensure separators
          displayPreferencesArb,
          (amount, prefs) => {
            const result = formatCurrencyWithPreferences(amount, prefs)
            
            // Should contain currency indicator (Rp for id-ID, IDR for en-US)
            expect(result).toMatch(/Rp|IDR/)
            
            // Indonesian format uses dots as thousand separators
            // English format uses commas as thousand separators
            if (prefs.numberFormat === 'id-ID') {
              expect(result).toMatch(/\d{1,3}(\.\d{3})+/)
            } else {
              expect(result).toMatch(/\d{1,3}(,\d{3})+/)
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should format numbers with correct locale separators', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1000, max: 1000000000 }),
          displayPreferencesArb,
          (num, prefs) => {
            const result = formatNumberWithPreferences(num, prefs)
            
            // Indonesian format uses dots, English uses commas
            if (prefs.numberFormat === 'id-ID') {
              expect(result).toMatch(/\d{1,3}(\.\d{3})+/)
            } else {
              expect(result).toMatch(/\d{1,3}(,\d{3})+/)
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should return consistent preview for each number format', () => {
      fc.assert(
        fc.property(numberFormatArb, (numberFormat) => {
          const preview = getNumberFormatPreview(numberFormat)
          
          // Preview uses sample value 1234567.89 which will have separators
          if (numberFormat === 'id-ID') {
            expect(preview).toMatch(/\d{1,3}(\.\d{3})+/)
          } else {
            expect(preview).toMatch(/\d{1,3}(,\d{3})+/)
          }
        }),
        { numRuns: 100 }
      )
    })
  })

  /**
   * Property 4: Notification Type Role Filtering
   * For any user role and set of notification types, the filtered types
   * should only include types where the user's role is in applicable_roles.
   * 
   * Validates: Requirements 4.2
   */
  describe('Property 4: Notification Type Role Filtering', () => {
    it('should only return types applicable to the user role', () => {
      fc.assert(
        fc.property(
          fc.array(notificationTypeArb, { minLength: 1, maxLength: 20 }),
          roleArb,
          (types, role) => {
            const filtered = filterNotificationTypesByRole(types, role)
            
            // All filtered types should either have empty applicable_roles
            // or include the user's role
            filtered.forEach((type) => {
              const isApplicable =
                type.applicable_roles.length === 0 ||
                type.applicable_roles.includes(role)
              expect(isApplicable).toBe(true)
            })
            
            // No type that should be included is missing
            types.forEach((type) => {
              const shouldBeIncluded =
                type.applicable_roles.length === 0 ||
                type.applicable_roles.includes(role)
              if (shouldBeIncluded) {
                expect(filtered).toContainEqual(type)
              }
            })
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  /**
   * Property 5: Notification Type Category Grouping
   * For any set of notification types, grouping by category should produce
   * groups where all types within a group have the same category value.
   * 
   * Validates: Requirements 4.1
   */
  describe('Property 5: Notification Type Category Grouping', () => {
    it('should group types by category correctly', () => {
      fc.assert(
        fc.property(
          fc.array(notificationTypeArb, { minLength: 1, maxLength: 20 }),
          (types) => {
            // Deduplicate by type_code to avoid issues
            const uniqueTypes = types.filter((t, i, arr) => 
              arr.findIndex(x => x.type_code === t.type_code) === i
            )
            
            // Add preference fields to make NotificationTypeWithPreference
            const typesWithPrefs = uniqueTypes.map((t) => ({
              ...t,
              email_enabled: true,
              push_enabled: true,
              in_app_enabled: true,
            }))
            
            const groups = groupNotificationTypesByCategory(typesWithPrefs)
            
            // Each group should only contain types of that category
            groups.forEach((group) => {
              group.types.forEach((type) => {
                expect(type.category).toBe(group.category)
              })
            })
            
            // No type should appear in multiple groups
            const allTypeCodes = groups.flatMap((g) => g.types.map((t) => t.type_code))
            const uniqueTypeCodes = new Set(allTypeCodes)
            expect(allTypeCodes.length).toBe(uniqueTypeCodes.size)
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  /**
   * Property 7: Notification Preference Fallback to Defaults
   * For any notification type without a user-specific preference,
   * the system should return the default values from notification_types.
   * 
   * Validates: Requirements 4.6
   */
  describe('Property 7: Notification Preference Fallback to Defaults', () => {
    it('should use defaults when no user preference exists', () => {
      fc.assert(
        fc.property(
          fc.array(notificationTypeArb, { minLength: 1, maxLength: 10 }),
          (types) => {
            // Empty user preferences - should fall back to defaults
            const merged = mergeNotificationTypesWithPreferences(types, [])
            
            merged.forEach((mergedType, index) => {
              const originalType = types[index]
              expect(mergedType.email_enabled).toBe(originalType.default_email)
              expect(mergedType.push_enabled).toBe(originalType.default_push)
              expect(mergedType.in_app_enabled).toBe(originalType.default_in_app)
            })
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should use user preferences when they exist', () => {
      fc.assert(
        fc.property(
          notificationTypeArb,
          fc.boolean(),
          fc.boolean(),
          fc.boolean(),
          (type, emailEnabled, pushEnabled, inAppEnabled) => {
            const userPref: UserNotificationTypePreference = {
              id: 'test-id',
              user_id: 'user-id',
              notification_type: type.type_code,
              email_enabled: emailEnabled,
              push_enabled: pushEnabled,
              in_app_enabled: inAppEnabled,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }
            
            const merged = mergeNotificationTypesWithPreferences([type], [userPref])
            
            // When user pref exists for this type, it should use user values
            expect(merged[0].email_enabled).toBe(emailEnabled)
            expect(merged[0].push_enabled).toBe(pushEnabled)
            expect(merged[0].in_app_enabled).toBe(inAppEnabled)
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  /**
   * Property 8: Master Channel Override Logic
   * If the master channel is disabled, the effective preference should
   * be false regardless of the per-type setting.
   * 
   * Validates: Requirements 4.5
   */
  describe('Property 8: Master Channel Override Logic', () => {
    it('should return false when master channel is disabled', () => {
      fc.assert(
        fc.property(fc.boolean(), (typePreference) => {
          const effective = getEffectiveNotificationPreference(typePreference, false)
          expect(effective).toBe(false)
        }),
        { numRuns: 100 }
      )
    })

    it('should return type preference when master channel is enabled', () => {
      fc.assert(
        fc.property(fc.boolean(), (typePreference) => {
          const effective = getEffectiveNotificationPreference(typePreference, true)
          expect(effective).toBe(typePreference)
        }),
        { numRuns: 100 }
      )
    })
  })

  /**
   * Property 10: Default Preferences Initialization
   * For any newly created user without explicit preferences,
   * the preferences should match DEFAULT_PREFERENCES.
   * 
   * Validates: Requirements 1.5
   */
  describe('Property 10: Default Preferences Initialization', () => {
    it('should return defaults when preferences are null or undefined', () => {
      const fromNull = mergePreferencesWithDefaults(null)
      const fromUndefined = mergePreferencesWithDefaults(undefined)
      
      expect(fromNull).toEqual(DEFAULT_PREFERENCES)
      expect(fromUndefined).toEqual(DEFAULT_PREFERENCES)
    })

    it('should merge partial preferences with defaults', () => {
      fc.assert(
        fc.property(
          fc.record({
            display: fc.option(
              fc.record({
                theme: fc.constantFrom('light' as const, 'dark' as const, 'system' as const),
              }),
              { nil: undefined }
            ),
          }),
          (partialPrefs) => {
            const merged = mergePreferencesWithDefaults(partialPrefs as Partial<UserPreferences>)
            
            // Should have all required sections
            expect(merged.display).toBeDefined()
            expect(merged.notifications).toBeDefined()
            expect(merged.dashboard).toBeDefined()
            expect(merged.workflow).toBeDefined()
            
            // Should have all display properties with valid values
            expect(['light', 'dark', 'system']).toContain(merged.display.theme)
            expect(['id', 'en']).toContain(merged.display.language)
            expect(['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD']).toContain(merged.display.dateFormat)
            expect(['id-ID', 'en-US']).toContain(merged.display.numberFormat)
            expect(typeof merged.display.timezone).toBe('string')
            expect(typeof merged.display.compactMode).toBe('boolean')
          }
        ),
        { numRuns: 100 }
      )
    })
  })
})
