import { format } from 'date-fns'
import {
  DisplayPreferences,
  UserPreferences,
  DEFAULT_PREFERENCES,
  NotificationType,
  NotificationTypeWithPreference,
  NotificationTypeGroup,
  NotificationCategory,
  CATEGORY_LABELS,
  UserNotificationTypePreference,
  DateFormat,
  NumberFormat,
} from '@/types/user-preferences'

/**
 * Format a date according to user preferences
 */
export function formatDateWithPreferences(
  date: Date | string | null | undefined,
  preferences: DisplayPreferences
): string {
  if (!date) return '-'
  
  try {
    const d = new Date(date)
    if (isNaN(d.getTime())) return '-'
    
    switch (preferences.dateFormat) {
      case 'DD/MM/YYYY':
        return format(d, 'dd/MM/yyyy')
      case 'MM/DD/YYYY':
        return format(d, 'MM/dd/yyyy')
      case 'YYYY-MM-DD':
        return format(d, 'yyyy-MM-dd')
      default:
        return format(d, 'dd/MM/yyyy')
    }
  } catch {
    return '-'
  }
}

/**
 * Format currency according to user preferences
 */
export function formatCurrencyWithPreferences(
  amount: number | null | undefined,
  preferences: DisplayPreferences
): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return formatCurrencyWithLocale(0, preferences.numberFormat)
  }
  return formatCurrencyWithLocale(amount, preferences.numberFormat)
}

/**
 * Format currency with specific locale
 */
function formatCurrencyWithLocale(amount: number, locale: NumberFormat): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

/**
 * Format a number according to user preferences
 */
export function formatNumberWithPreferences(
  num: number | null | undefined,
  preferences: DisplayPreferences
): string {
  if (num === null || num === undefined || isNaN(num)) {
    return '0'
  }
  return new Intl.NumberFormat(preferences.numberFormat).format(num)
}

/**
 * Get a preview of the date format
 */
export function getDateFormatPreview(dateFormat: DateFormat): string {
  const now = new Date()
  switch (dateFormat) {
    case 'DD/MM/YYYY':
      return format(now, 'dd/MM/yyyy')
    case 'MM/DD/YYYY':
      return format(now, 'MM/dd/yyyy')
    case 'YYYY-MM-DD':
      return format(now, 'yyyy-MM-dd')
    default:
      return format(now, 'dd/MM/yyyy')
  }
}

/**
 * Get a preview of the number format
 */
export function getNumberFormatPreview(numberFormat: NumberFormat): string {
  const sample = 1234567.89
  return new Intl.NumberFormat(numberFormat, {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(sample)
}

/**
 * Apply theme to document root
 */
export function applyTheme(theme: 'light' | 'dark' | 'system'): void {
  if (typeof window === 'undefined') return
  
  const root = document.documentElement
  
  if (theme === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    root.classList.toggle('dark', prefersDark)
  } else {
    root.classList.toggle('dark', theme === 'dark')
  }
}

/**
 * Merge user preferences with defaults to ensure all keys exist
 */
export function mergePreferencesWithDefaults(
  userPrefs: Partial<UserPreferences> | null | undefined
): UserPreferences {
  if (!userPrefs) return { ...DEFAULT_PREFERENCES }
  
  return {
    display: {
      ...DEFAULT_PREFERENCES.display,
      ...(userPrefs.display || {}),
    },
    notifications: {
      ...DEFAULT_PREFERENCES.notifications,
      ...(userPrefs.notifications || {}),
    },
    dashboard: {
      ...DEFAULT_PREFERENCES.dashboard,
      ...(userPrefs.dashboard || {}),
    },
    workflow: {
      ...DEFAULT_PREFERENCES.workflow,
      ...(userPrefs.workflow || {}),
    },
  }
}

/**
 * Filter notification types by user role
 */
export function filterNotificationTypesByRole(
  types: NotificationType[],
  userRole: string
): NotificationType[] {
  return types.filter(
    (type) =>
      type.applicable_roles.length === 0 ||
      type.applicable_roles.includes(userRole)
  )
}

/**
 * Group notification types by category
 */
export function groupNotificationTypesByCategory(
  types: NotificationTypeWithPreference[]
): NotificationTypeGroup[] {
  const groups: Map<NotificationCategory, NotificationTypeWithPreference[]> = new Map()
  
  // Initialize groups in display order
  const categoryOrder: NotificationCategory[] = ['approvals', 'finance', 'operations', 'hr', 'system']
  categoryOrder.forEach((cat) => groups.set(cat, []))
  
  // Group types
  types.forEach((type) => {
    const category = type.category as NotificationCategory
    const group = groups.get(category)
    if (group) {
      group.push(type)
    }
  })
  
  // Convert to array and filter empty groups
  return categoryOrder
    .map((category) => ({
      category,
      label: CATEGORY_LABELS[category],
      types: (groups.get(category) || []).sort((a, b) => a.display_order - b.display_order),
    }))
    .filter((group) => group.types.length > 0)
}

/**
 * Merge notification types with user preferences
 */
export function mergeNotificationTypesWithPreferences(
  types: NotificationType[],
  userPrefs: UserNotificationTypePreference[]
): NotificationTypeWithPreference[] {
  const prefsMap = new Map(userPrefs.map((p) => [p.notification_type, p]))
  
  return types.map((type) => {
    const userPref = prefsMap.get(type.type_code)
    return {
      ...type,
      email_enabled: userPref?.email_enabled ?? type.default_email,
      push_enabled: userPref?.push_enabled ?? type.default_push,
      in_app_enabled: userPref?.in_app_enabled ?? type.default_in_app,
    }
  })
}

/**
 * Get effective notification preference considering master channel settings
 */
export function getEffectiveNotificationPreference(
  typePreference: boolean,
  masterChannelEnabled: boolean
): boolean {
  // If master channel is disabled, the effective preference is always false
  return masterChannelEnabled && typePreference
}

/**
 * Check if a notification type preference is overridden by master channel
 */
export function isPreferenceOverridden(
  masterChannelEnabled: boolean
): boolean {
  return !masterChannelEnabled
}

/**
 * Validate refresh interval is within acceptable range
 */
export function validateRefreshInterval(interval: number): number {
  const MIN_INTERVAL = 60 // 1 minute
  const MAX_INTERVAL = 900 // 15 minutes
  return Math.max(MIN_INTERVAL, Math.min(MAX_INTERVAL, interval))
}

/**
 * Check if preferences object is valid
 */
export function isValidPreferences(prefs: unknown): prefs is UserPreferences {
  if (!prefs || typeof prefs !== 'object') return false
  
  const p = prefs as Record<string, unknown>
  
  return (
    typeof p.display === 'object' &&
    typeof p.notifications === 'object' &&
    typeof p.dashboard === 'object' &&
    typeof p.workflow === 'object'
  )
}
