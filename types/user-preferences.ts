// User Preferences Types for v0.39

export type Theme = 'light' | 'dark' | 'system'
export type Language = 'id' | 'en'
export type DateFormat = 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD'
export type NumberFormat = 'id-ID' | 'en-US'
export type DigestFrequency = 'none' | 'daily' | 'weekly'
export type NotificationCategory = 'approvals' | 'finance' | 'operations' | 'hr' | 'system'

export interface DisplayPreferences {
  theme: Theme
  language: Language
  dateFormat: DateFormat
  numberFormat: NumberFormat
  timezone: string
  compactMode: boolean
}

export interface NotificationChannelPreferences {
  email: boolean
  push: boolean
  desktop: boolean
  sound: boolean
  digest: DigestFrequency
}

export interface DashboardPreferences {
  showOnboarding: boolean
  autoRefresh: boolean
  refreshInterval: number // seconds
}

export interface WorkflowPreferences {
  defaultCustomer: string | null
  autoSave: boolean
  confirmDelete: boolean
}

export interface UserPreferences {
  display: DisplayPreferences
  notifications: NotificationChannelPreferences
  dashboard: DashboardPreferences
  workflow: WorkflowPreferences
}

export interface NotificationType {
  id: string
  type_code: string
  type_name: string
  description: string | null
  category: NotificationCategory
  default_email: boolean
  default_push: boolean
  default_in_app: boolean
  applicable_roles: string[]
  display_order: number
  is_active: boolean
  created_at: string
}

export interface UserNotificationTypePreference {
  id: string
  user_id: string
  notification_type: string
  email_enabled: boolean
  push_enabled: boolean
  in_app_enabled: boolean
  created_at: string
  updated_at: string
}

export interface NotificationTypeWithPreference extends NotificationType {
  email_enabled: boolean
  push_enabled: boolean
  in_app_enabled: boolean
}

export interface NotificationTypeGroup {
  category: NotificationCategory
  label: string
  types: NotificationTypeWithPreference[]
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  display: {
    theme: 'light',
    language: 'id',
    dateFormat: 'DD/MM/YYYY',
    numberFormat: 'id-ID',
    timezone: 'Asia/Jakarta',
    compactMode: false,
  },
  notifications: {
    email: true,
    push: true,
    desktop: false,
    sound: true,
    digest: 'daily',
  },
  dashboard: {
    showOnboarding: true,
    autoRefresh: true,
    refreshInterval: 300,
  },
  workflow: {
    defaultCustomer: null,
    autoSave: true,
    confirmDelete: true,
  },
}

export const CATEGORY_LABELS: Record<NotificationCategory, string> = {
  approvals: 'Approvals',
  finance: 'Finance',
  operations: 'Operations',
  hr: 'Human Resources',
  system: 'System',
}

export const DATE_FORMAT_OPTIONS: { value: DateFormat; label: string }[] = [
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (22/12/2025)' },
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (12/22/2025)' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (2025-12-22)' },
]

export const NUMBER_FORMAT_OPTIONS: { value: NumberFormat; label: string }[] = [
  { value: 'id-ID', label: 'Indonesian (1.234.567,89)' },
  { value: 'en-US', label: 'English (1,234,567.89)' },
]

export const LANGUAGE_OPTIONS: { value: Language; label: string }[] = [
  { value: 'id', label: 'Indonesian (Bahasa)' },
  { value: 'en', label: 'English' },
]

export const TIMEZONE_OPTIONS: { value: string; label: string }[] = [
  { value: 'Asia/Jakarta', label: 'Asia/Jakarta (WIB)' },
  { value: 'Asia/Makassar', label: 'Asia/Makassar (WITA)' },
  { value: 'Asia/Jayapura', label: 'Asia/Jayapura (WIT)' },
  { value: 'Asia/Singapore', label: 'Asia/Singapore (SGT)' },
  { value: 'UTC', label: 'UTC' },
]

export const DIGEST_OPTIONS: { value: DigestFrequency; label: string }[] = [
  { value: 'none', label: 'No digest' },
  { value: 'daily', label: 'Daily summary' },
  { value: 'weekly', label: 'Weekly summary' },
]

export const REFRESH_INTERVAL_OPTIONS: { value: number; label: string }[] = [
  { value: 60, label: '1 minute' },
  { value: 300, label: '5 minutes' },
  { value: 600, label: '10 minutes' },
  { value: 900, label: '15 minutes' },
]
