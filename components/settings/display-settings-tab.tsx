'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Save, RotateCcw, Sun, Moon, Monitor } from 'lucide-react'
import {
  UserPreferences,
  DEFAULT_PREFERENCES,
  DATE_FORMAT_OPTIONS,
  NUMBER_FORMAT_OPTIONS,
  LANGUAGE_OPTIONS,
  TIMEZONE_OPTIONS,
  Theme,
  Language,
  DateFormat,
  NumberFormat,
} from '@/types/user-preferences'
import {
  getDateFormatPreview,
  getNumberFormatPreview,
  applyTheme,
} from '@/lib/user-preferences-utils'
import { saveUserPreferences, resetPreferencesToDefaults } from '@/app/(main)/settings/preferences/actions'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

interface DisplaySettingsTabProps {
  initialPreferences: UserPreferences
}

export function DisplaySettingsTab({ initialPreferences }: DisplaySettingsTabProps) {
  const [preferences, setPreferences] = useState(initialPreferences.display)
  const [isSaving, setIsSaving] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const { toast } = useToast()

  const handleThemeChange = (theme: Theme) => {
    setPreferences((prev) => ({ ...prev, theme }))
    applyTheme(theme)
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const result = await saveUserPreferences({ display: preferences })
      if (result.success) {
        toast({
          title: 'Settings saved',
          description: 'Your display settings have been updated.',
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

  const handleReset = async () => {
    setIsResetting(true)
    try {
      const result = await resetPreferencesToDefaults()
      if (result.success) {
        setPreferences(DEFAULT_PREFERENCES.display)
        applyTheme(DEFAULT_PREFERENCES.display.theme)
        toast({
          title: 'Settings reset',
          description: 'Your settings have been reset to defaults.',
        })
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to reset settings',
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
      setIsResetting(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sun className="h-5 w-5" />
            Display Settings
          </CardTitle>
          <CardDescription>
            Customize how the application looks and displays information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Theme */}
          <div className="space-y-3">
            <Label>Theme</Label>
            <RadioGroup
              value={preferences.theme}
              onValueChange={(value) => handleThemeChange(value as Theme)}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="light" id="theme-light" />
                <Label htmlFor="theme-light" className="flex items-center gap-2 cursor-pointer">
                  <Sun className="h-4 w-4" />
                  Light
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="dark" id="theme-dark" />
                <Label htmlFor="theme-dark" className="flex items-center gap-2 cursor-pointer">
                  <Moon className="h-4 w-4" />
                  Dark
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="system" id="theme-system" />
                <Label htmlFor="theme-system" className="flex items-center gap-2 cursor-pointer">
                  <Monitor className="h-4 w-4" />
                  System
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Language */}
          <div className="space-y-3">
            <Label htmlFor="language">Language</Label>
            <Select
              value={preferences.language}
              onValueChange={(value) =>
                setPreferences((prev) => ({ ...prev, language: value as Language }))
              }
            >
              <SelectTrigger id="language" className="w-full max-w-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date Format */}
          <div className="space-y-3">
            <Label htmlFor="dateFormat">Date Format</Label>
            <Select
              value={preferences.dateFormat}
              onValueChange={(value) =>
                setPreferences((prev) => ({ ...prev, dateFormat: value as DateFormat }))
              }
            >
              <SelectTrigger id="dateFormat" className="w-full max-w-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DATE_FORMAT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Preview: {getDateFormatPreview(preferences.dateFormat)}
            </p>
          </div>

          {/* Number Format */}
          <div className="space-y-3">
            <Label htmlFor="numberFormat">Number Format</Label>
            <Select
              value={preferences.numberFormat}
              onValueChange={(value) =>
                setPreferences((prev) => ({ ...prev, numberFormat: value as NumberFormat }))
              }
            >
              <SelectTrigger id="numberFormat" className="w-full max-w-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {NUMBER_FORMAT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Preview: {getNumberFormatPreview(preferences.numberFormat)}
            </p>
          </div>

          {/* Timezone */}
          <div className="space-y-3">
            <Label htmlFor="timezone">Timezone</Label>
            <Select
              value={preferences.timezone}
              onValueChange={(value) =>
                setPreferences((prev) => ({ ...prev, timezone: value }))
              }
            >
              <SelectTrigger id="timezone" className="w-full max-w-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIMEZONE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Compact Mode */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="compactMode">Compact Mode</Label>
              <p className="text-sm text-muted-foreground">
                Show more information in less space
              </p>
            </div>
            <Switch
              id="compactMode"
              checked={preferences.compactMode}
              onCheckedChange={(checked) =>
                setPreferences((prev) => ({ ...prev, compactMode: checked }))
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" disabled={isResetting}>
              {isResetting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RotateCcw className="mr-2 h-4 w-4" />
              )}
              Reset to Defaults
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Reset to Defaults?</AlertDialogTitle>
              <AlertDialogDescription>
                This will reset all your preferences to their default values. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleReset}>Reset</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Save Changes
        </Button>
      </div>
    </div>
  )
}
