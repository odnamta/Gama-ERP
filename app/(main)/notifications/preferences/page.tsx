'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { NotificationPreferences } from '@/types/notifications'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2, Bell, AlertTriangle, RefreshCw, Clock, Info, Workflow } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { NotificationPreferencesForm } from '@/components/notifications/notification-preferences-form'

const PREFERENCE_ITEMS = [
  {
    key: 'approval_enabled' as const,
    label: 'Approval Requests',
    description: 'Notifications when PJOs require your approval',
    icon: Bell,
  },
  {
    key: 'budget_alert_enabled' as const,
    label: 'Budget Alerts',
    description: 'Notifications when costs exceed budget thresholds',
    icon: AlertTriangle,
  },
  {
    key: 'status_change_enabled' as const,
    label: 'Status Changes',
    description: 'Notifications when PJO, JO, or Invoice status changes',
    icon: RefreshCw,
  },
  {
    key: 'overdue_enabled' as const,
    label: 'Overdue Alerts',
    description: 'Notifications when invoices become overdue',
    icon: Clock,
  },
  {
    key: 'system_enabled' as const,
    label: 'System Notifications',
    description: 'Notifications about user activity and system events',
    icon: Info,
  },
]

export default function NotificationPreferencesPage() {
  const supabase = createClient()
  const { toast } = useToast()

  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState<string | null>(null)

  useEffect(() => {
    async function loadPreferences() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!profile) return

      setUserId(profile.id)

      // Try to get existing preferences
      let { data: prefs } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', profile.id)
        .single()

      // If no preferences exist, create default ones
      if (!prefs) {
        const { data: newPrefs } = await supabase
          .from('notification_preferences')
          .insert({
            user_id: profile.id,
            approval_enabled: true,
            budget_alert_enabled: true,
            status_change_enabled: true,
            overdue_enabled: true,
            system_enabled: true,
          })
          .select()
          .single()

        prefs = newPrefs
      }

      setPreferences(prefs)
      setIsLoading(false)
    }

    loadPreferences()
  }, [supabase])

  const handleToggle = async (key: keyof NotificationPreferences, value: boolean) => {
    if (!preferences) return

    setIsSaving(key)

    const { error } = await supabase
      .from('notification_preferences')
      .update({ [key]: value, updated_at: new Date().toISOString() })
      .eq('id', preferences.id)

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to update preference',
        variant: 'destructive',
      })
    } else {
      setPreferences((prev) => (prev ? { ...prev, [key]: value } : null))
      toast({
        title: 'Saved',
        description: 'Notification preference updated',
      })
    }

    setIsSaving(null)
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 max-w-4xl">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Notification Preferences</h1>
        <p className="text-muted-foreground mt-1">
          Configure how and when you receive notifications
        </p>
      </div>

      <Tabs defaultValue="basic" className="space-y-6">
        <TabsList>
          <TabsTrigger value="basic" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Basic Preferences
          </TabsTrigger>
          <TabsTrigger value="workflow" className="flex items-center gap-2">
            <Workflow className="h-4 w-4" />
            Workflow Notifications
          </TabsTrigger>
        </TabsList>

        <TabsContent value="basic">
          <Card>
            <CardHeader>
              <CardTitle>Notification Types</CardTitle>
              <CardDescription>
                Toggle notifications on or off for each category
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {PREFERENCE_ITEMS.map((item) => {
                const Icon = item.icon
                const isEnabled = preferences?.[item.key] ?? true
                const isSavingThis = isSaving === item.key

                return (
                  <div key={item.key} className="flex items-center justify-between">
                    <div className="flex items-start gap-3">
                      <Icon className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <Label htmlFor={item.key} className="text-sm font-medium">
                          {item.label}
                        </Label>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {item.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isSavingThis && (
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      )}
                      <Switch
                        id={item.key}
                        checked={isEnabled}
                        onCheckedChange={(checked) => handleToggle(item.key, checked)}
                        disabled={isSavingThis}
                      />
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="workflow">
          {userId ? (
            <NotificationPreferencesForm userId={userId} />
          ) : (
            <Card>
              <CardContent className="py-12">
                <div className="flex items-center justify-center">
                  <p className="text-muted-foreground">Unable to load user preferences</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
