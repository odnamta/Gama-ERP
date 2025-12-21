'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Save, Settings, RefreshCw, FileText, Trash2 } from 'lucide-react'
import { UserPreferences, REFRESH_INTERVAL_OPTIONS } from '@/types/user-preferences'
import { saveUserPreferences } from '@/app/(main)/settings/preferences/actions'

interface WorkflowSettingsTabProps {
  initialPreferences: UserPreferences
}

export function WorkflowSettingsTab({ initialPreferences }: WorkflowSettingsTabProps) {
  const [workflowPrefs, setWorkflowPrefs] = useState(initialPreferences.workflow)
  const [dashboardPrefs, setDashboardPrefs] = useState(initialPreferences.dashboard)
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const result = await saveUserPreferences({
        workflow: workflowPrefs,
        dashboard: dashboardPrefs,
      })
      if (result.success) {
        toast({
          title: 'Settings saved',
          description: 'Your workflow settings have been updated.',
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
      {/* Workflow Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Workflow Preferences
          </CardTitle>
          <CardDescription>
            Configure how the application behaves during your workflow
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Auto-save */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <div className="space-y-0.5">
                <Label htmlFor="auto-save">Auto-save drafts</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically save your work as you type
                </p>
              </div>
            </div>
            <Switch
              id="auto-save"
              checked={workflowPrefs.autoSave}
              onCheckedChange={(checked) =>
                setWorkflowPrefs((prev) => ({ ...prev, autoSave: checked }))
              }
            />
          </div>

          {/* Confirm Delete */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Trash2 className="h-5 w-5 text-muted-foreground" />
              <div className="space-y-0.5">
                <Label htmlFor="confirm-delete">Confirm before delete</Label>
                <p className="text-sm text-muted-foreground">
                  Show confirmation dialog for destructive actions
                </p>
              </div>
            </div>
            <Switch
              id="confirm-delete"
              checked={workflowPrefs.confirmDelete}
              onCheckedChange={(checked) =>
                setWorkflowPrefs((prev) => ({ ...prev, confirmDelete: checked }))
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Dashboard Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Dashboard Settings
          </CardTitle>
          <CardDescription>
            Configure dashboard behavior and refresh settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Show Onboarding */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="show-onboarding">Show onboarding</Label>
              <p className="text-sm text-muted-foreground">
                Display onboarding tips and guides
              </p>
            </div>
            <Switch
              id="show-onboarding"
              checked={dashboardPrefs.showOnboarding}
              onCheckedChange={(checked) =>
                setDashboardPrefs((prev) => ({ ...prev, showOnboarding: checked }))
              }
            />
          </div>

          {/* Auto-refresh */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="auto-refresh">Auto-refresh dashboard</Label>
              <p className="text-sm text-muted-foreground">
                Keep dashboard data updated automatically
              </p>
            </div>
            <Switch
              id="auto-refresh"
              checked={dashboardPrefs.autoRefresh}
              onCheckedChange={(checked) =>
                setDashboardPrefs((prev) => ({ ...prev, autoRefresh: checked }))
              }
            />
          </div>

          {/* Refresh Interval */}
          {dashboardPrefs.autoRefresh && (
            <div className="space-y-3">
              <Label htmlFor="refresh-interval">Refresh interval</Label>
              <Select
                value={dashboardPrefs.refreshInterval.toString()}
                onValueChange={(value) =>
                  setDashboardPrefs((prev) => ({
                    ...prev,
                    refreshInterval: parseInt(value, 10),
                  }))
                }
              >
                <SelectTrigger id="refresh-interval" className="w-full max-w-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REFRESH_INTERVAL_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value.toString()}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
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
