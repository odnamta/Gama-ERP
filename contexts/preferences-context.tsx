'use client'

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from 'react'
import {
  UserPreferences,
  DEFAULT_PREFERENCES,
  DisplayPreferences,
} from '@/types/user-preferences'
import {
  formatDateWithPreferences,
  formatCurrencyWithPreferences,
  formatNumberWithPreferences,
  applyTheme,
  mergePreferencesWithDefaults,
} from '@/lib/user-preferences-utils'
import { getUserPreferences, saveUserPreferences } from '@/app/(main)/settings/preferences/actions'

interface PreferencesContextType {
  preferences: UserPreferences
  isLoading: boolean
  error: string | null
  updatePreferences: (updates: Partial<UserPreferences>) => Promise<boolean>
  updateDisplayPreferences: (updates: Partial<DisplayPreferences>) => Promise<boolean>
  resetToDefaults: () => void
  formatDate: (date: Date | string | null | undefined) => string
  formatCurrency: (amount: number | null | undefined) => string
  formatNumber: (num: number | null | undefined) => string
  refreshPreferences: () => Promise<void>
}

const PreferencesContext = createContext<PreferencesContextType | null>(null)

interface PreferencesProviderProps {
  children: ReactNode
  initialPreferences?: UserPreferences
}

export function PreferencesProvider({
  children,
  initialPreferences,
}: PreferencesProviderProps) {
  const [preferences, setPreferences] = useState<UserPreferences>(
    initialPreferences || DEFAULT_PREFERENCES
  )
  const [isLoading, setIsLoading] = useState(!initialPreferences)
  const [error, setError] = useState<string | null>(null)

  // Load preferences on mount
  useEffect(() => {
    if (!initialPreferences) {
      loadPreferences()
    }
  }, [initialPreferences])

  // Apply theme when preferences change
  useEffect(() => {
    applyTheme(preferences.display.theme)
  }, [preferences.display.theme])

  // Listen for system theme changes when theme is 'system'
  useEffect(() => {
    if (preferences.display.theme !== 'system') return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => applyTheme('system')
    
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [preferences.display.theme])

  const loadPreferences = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const result = await getUserPreferences()
      if (result.success && result.data) {
        setPreferences(result.data)
      } else {
        setError(result.error || 'Failed to load preferences')
        setPreferences(DEFAULT_PREFERENCES)
      }
    } catch (err) {
      console.error('Error loading preferences:', err)
      setError('Failed to load preferences')
      setPreferences(DEFAULT_PREFERENCES)
    } finally {
      setIsLoading(false)
    }
  }

  const updatePreferences = useCallback(
    async (updates: Partial<UserPreferences>): Promise<boolean> => {
      const newPreferences = mergePreferencesWithDefaults({
        ...preferences,
        ...updates,
        display: { ...preferences.display, ...updates.display },
        notifications: { ...preferences.notifications, ...updates.notifications },
        dashboard: { ...preferences.dashboard, ...updates.dashboard },
        workflow: { ...preferences.workflow, ...updates.workflow },
      })

      // Optimistically update local state
      setPreferences(newPreferences)

      // Save to server
      const result = await saveUserPreferences(updates)
      if (!result.success) {
        // Revert on failure
        setPreferences(preferences)
        setError(result.error || 'Failed to save preferences')
        return false
      }

      setError(null)
      return true
    },
    [preferences]
  )

  const updateDisplayPreferences = useCallback(
    async (updates: Partial<DisplayPreferences>): Promise<boolean> => {
      return updatePreferences({ display: { ...preferences.display, ...updates } })
    },
    [preferences, updatePreferences]
  )

  const resetToDefaults = useCallback(() => {
    setPreferences(DEFAULT_PREFERENCES)
  }, [])

  const refreshPreferences = useCallback(async () => {
    await loadPreferences()
  }, [])

  // Formatting functions that use current preferences
  const formatDate = useCallback(
    (date: Date | string | null | undefined) => {
      return formatDateWithPreferences(date, preferences.display)
    },
    [preferences.display]
  )

  const formatCurrency = useCallback(
    (amount: number | null | undefined) => {
      return formatCurrencyWithPreferences(amount, preferences.display)
    },
    [preferences.display]
  )

  const formatNumber = useCallback(
    (num: number | null | undefined) => {
      return formatNumberWithPreferences(num, preferences.display)
    },
    [preferences.display]
  )

  const value: PreferencesContextType = {
    preferences,
    isLoading,
    error,
    updatePreferences,
    updateDisplayPreferences,
    resetToDefaults,
    formatDate,
    formatCurrency,
    formatNumber,
    refreshPreferences,
  }

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  )
}

export function usePreferences() {
  const context = useContext(PreferencesContext)
  if (!context) {
    throw new Error('usePreferences must be used within a PreferencesProvider')
  }
  return context
}

/**
 * Hook to get just the formatting functions without the full context
 * Useful for components that only need formatting
 */
export function useFormatters() {
  const { formatDate, formatCurrency, formatNumber } = usePreferences()
  return { formatDate, formatCurrency, formatNumber }
}

/**
 * Hook to get display preferences
 */
export function useDisplayPreferences() {
  const { preferences, updateDisplayPreferences } = usePreferences()
  return {
    display: preferences.display,
    updateDisplay: updateDisplayPreferences,
  }
}

/**
 * Hook to get notification preferences
 */
export function useNotificationPreferences() {
  const { preferences, updatePreferences } = usePreferences()
  return {
    notifications: preferences.notifications,
    updateNotifications: (updates: Partial<UserPreferences['notifications']>) =>
      updatePreferences({ notifications: { ...preferences.notifications, ...updates } }),
  }
}

/**
 * Hook to get workflow preferences
 */
export function useWorkflowPreferences() {
  const { preferences, updatePreferences } = usePreferences()
  return {
    workflow: preferences.workflow,
    updateWorkflow: (updates: Partial<UserPreferences['workflow']>) =>
      updatePreferences({ workflow: { ...preferences.workflow, ...updates } }),
  }
}

/**
 * Hook to get dashboard preferences
 */
export function useDashboardPreferences() {
  const { preferences, updatePreferences } = usePreferences()
  return {
    dashboard: preferences.dashboard,
    updateDashboard: (updates: Partial<UserPreferences['dashboard']>) =>
      updatePreferences({ dashboard: { ...preferences.dashboard, ...updates } }),
  }
}
