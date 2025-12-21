'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { User, Palette, Bell, Settings } from 'lucide-react'
import { DisplaySettingsTab } from './display-settings-tab'
import { NotificationSettingsTab } from './notification-settings-tab'
import { WorkflowSettingsTab } from './workflow-settings-tab'
import { UserPreferences, NotificationTypeWithPreference } from '@/types/user-preferences'

interface SettingsTabsProps {
  initialPreferences: UserPreferences
  notificationTypes: NotificationTypeWithPreference[]
  profileContent?: React.ReactNode
}

export function SettingsTabs({
  initialPreferences,
  notificationTypes,
  profileContent,
}: SettingsTabsProps) {
  const [activeTab, setActiveTab] = useState('display')

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
      <TabsList className="grid w-full grid-cols-4 lg:w-[500px]">
        <TabsTrigger value="profile" className="flex items-center gap-2">
          <User className="h-4 w-4" />
          <span className="hidden sm:inline">Profile</span>
        </TabsTrigger>
        <TabsTrigger value="display" className="flex items-center gap-2">
          <Palette className="h-4 w-4" />
          <span className="hidden sm:inline">Display</span>
        </TabsTrigger>
        <TabsTrigger value="notifications" className="flex items-center gap-2">
          <Bell className="h-4 w-4" />
          <span className="hidden sm:inline">Notifications</span>
        </TabsTrigger>
        <TabsTrigger value="preferences" className="flex items-center gap-2">
          <Settings className="h-4 w-4" />
          <span className="hidden sm:inline">Preferences</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="profile" className="space-y-6">
        {profileContent || (
          <div className="text-muted-foreground">
            Profile settings will be displayed here.
          </div>
        )}
      </TabsContent>

      <TabsContent value="display" className="space-y-6">
        <DisplaySettingsTab initialPreferences={initialPreferences} />
      </TabsContent>

      <TabsContent value="notifications" className="space-y-6">
        <NotificationSettingsTab
          initialPreferences={initialPreferences}
          notificationTypes={notificationTypes}
        />
      </TabsContent>

      <TabsContent value="preferences" className="space-y-6">
        <WorkflowSettingsTab initialPreferences={initialPreferences} />
      </TabsContent>
    </Tabs>
  )
}
