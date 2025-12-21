import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SettingsTabs } from '@/components/settings/settings-tabs'
import { getUserPreferences, getNotificationTypesWithPreferences } from './actions'
import { DEFAULT_PREFERENCES } from '@/types/user-preferences'

export const metadata = {
  title: 'User Preferences | Settings',
  description: 'Customize your display, notification, and workflow preferences',
}

export default async function PreferencesPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // Fetch preferences and notification types
  const [prefsResult, typesResult] = await Promise.all([
    getUserPreferences(),
    getNotificationTypesWithPreferences(),
  ])

  const preferences = prefsResult.success && prefsResult.data
    ? prefsResult.data
    : DEFAULT_PREFERENCES

  const notificationTypes = typesResult.success && typesResult.data
    ? typesResult.data
    : []

  return (
    <div className="container max-w-4xl py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences
        </p>
      </div>

      <SettingsTabs
        initialPreferences={preferences}
        notificationTypes={notificationTypes}
      />
    </div>
  )
}
