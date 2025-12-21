'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Save, Bell, Mail, Volume2, Monitor } from 'lucide-react'
import {
  UserPreferences,
  NotificationTypeWithPreference,
  DIGEST_OPTIONS,
  DigestFrequency,
} from '@/types/user-preferences'
import { groupNotificationTypesByCategory, isPreferenceOverridden } from '@/lib/user-preferences-utils'
import { saveUserPreferences, saveNotificationTypePreference } from '@/app/(main)/settings/preferences/actions'
import { NotificationTypeRow } from './notification-type-row'

interface NotificationSettingsTabProps {
  initialPreferences: UserPreferences
  notificationTypes: NotificationTypeWithPreference[]
}

export function NotificationSettingsTab({
  initialPreferences,
  notificationTypes,
}: NotificationSettingsTabProps) {
  const [channelPrefs, setChannelPrefs] = useState(initialPreferences.notifications)
  const [typePrefs, setTypePrefs] = useState(notificationTypes)
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()

  const groupedTypes = groupNotificationTypesByCategory(typePrefs)

  const handleChannelChange = async (
    channel: 'email' | 'push' | 'desktop' | 'sound',
    enabled: boolean
  ) => {
    setChannelPrefs((prev) => ({ ...prev, [channel]: enabled }))
  }

  const handleDigestChange = (digest: DigestFrequency) => {
    setChannelPrefs((prev) => ({ ...prev, digest }))
  }

  const handleTypePreferenceChange = async (
    typeCode: string,
    channel: 'email' | 'push' | 'in_app',
    enabled: boolean
  ) => {
    // Update local state
    setTypePrefs((prev) =>
      prev.map((type) =>
        type.type_code === typeCode
          ? { ...type, [`${channel}_enabled`]: enabled }
          : type
      )
    )

    // Save to server
    const result = await saveNotificationTypePreference(typeCode, channel, enabled)
    if (!result.success) {
      // Revert on failure
      setTypePrefs((prev) =>
        prev.map((type) =>
          type.type_code === typeCode
            ? { ...type, [`${channel}_enabled`]: !enabled }
            : type
        )
      )
      toast({
        title: 'Error',
        description: result.error || 'Failed to save preference',
        variant: 'destructive',
      })
    }
  }

  const handleSaveChannels = async () => {
    setIsSaving(true)
    try {
      const result = await saveUserPreferences({ notifications: channelPrefs })
      if (result.success) {
        toast({
          title: 'Settings saved',
          description: 'Your notification settings have been updated.',
        })
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to save settings',
          variant: 'destructive',
        })
      }
    } catch {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Channel Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Channels
          </CardTitle>
          <CardDescription>
            Choose how you want to receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Email */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div className="space-y-0.5">
                <Label htmlFor="email-notifications">Email notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive notifications via email
                </p>
              </div>
            </div>
            <Switch
              id="email-notifications"
              checked={channelPrefs.email}
              onCheckedChange={(checked) => handleChannelChange('email', checked)}
            />
          </div>

          {/* In-App / Push */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-muted-foreground" />
              <div className="space-y-0.5">
                <Label htmlFor="push-notifications">In-app notifications</Label>
                <p className="text-sm text-muted-foreground">
                  See notifications in the app
                </p>
              </div>
            </div>
            <Switch
              id="push-notifications"
              checked={channelPrefs.push}
              onCheckedChange={(checked) => handleChannelChange('push', checked)}
            />
          </div>

          {/* Desktop */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Monitor className="h-5 w-5 text-muted-foreground" />
              <div className="space-y-0.5">
                <Label htmlFor="desktop-notifications">Desktop notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Browser push notifications
                </p>
              </div>
            </div>
            <Switch
              id="desktop-notifications"
              checked={channelPrefs.desktop}
              onCheckedChange={(checked) => handleChannelChange('desktop', checked)}
            />
          </div>

          {/* Sound */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Volume2 className="h-5 w-5 text-muted-foreground" />
              <div className="space-y-0.5">
                <Label htmlFor="sound-notifications">Sound</Label>
                <p className="text-sm text-muted-foreground">
                  Play sound for new notifications
                </p>
              </div>
            </div>
            <Switch
              id="sound-notifications"
              checked={channelPrefs.sound}
              onCheckedChange={(checked) => handleChannelChange('sound', checked)}
            />
          </div>

          {/* Email Digest */}
          <div className="space-y-3">
            <Label htmlFor="digest">Email Digest</Label>
            <Select
              value={channelPrefs.digest}
              onValueChange={(value) => handleDigestChange(value as DigestFrequency)}
            >
              <SelectTrigger id="digest" className="w-full max-w-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DIGEST_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSaveChannels} disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save Channel Settings
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Per-Type Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Types</CardTitle>
          <CardDescription>
            Configure notifications for specific events
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {groupedTypes.map((group) => (
            <div key={group.category} className="space-y-3">
              <h4 className="font-medium text-sm uppercase tracking-wide text-muted-foreground">
                {group.label}
              </h4>
              <div className="rounded-lg border">
                <div className="grid grid-cols-[1fr,80px,80px] gap-2 p-3 border-b bg-muted/50 text-sm font-medium">
                  <div>Notification</div>
                  <div className="text-center">Email</div>
                  <div className="text-center">In-App</div>
                </div>
                {group.types.map((type) => (
                  <NotificationTypeRow
                    key={type.type_code}
                    type={type}
                    emailDisabled={isPreferenceOverridden(channelPrefs.email)}
                    inAppDisabled={isPreferenceOverridden(channelPrefs.push)}
                    onEmailChange={(enabled) =>
                      handleTypePreferenceChange(type.type_code, 'email', enabled)
                    }
                    onInAppChange={(enabled) =>
                      handleTypePreferenceChange(type.type_code, 'in_app', enabled)
                    }
                  />
                ))}
              </div>
            </div>
          ))}

          {groupedTypes.length === 0 && (
            <p className="text-muted-foreground text-center py-4">
              No notification types available for your role.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
