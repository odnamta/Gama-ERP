import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Building2, Users, Activity, Zap, FileText, Bell, Link2 } from 'lucide-react'
import Link from 'next/link'

export default async function SettingsPage() {
  const supabase = await createClient()
  
  // Check authentication
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }
  
  // Get user role
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('user_id', user.id)
    .single()
  
  const isAdmin = profile && ['admin', 'owner'].includes(profile.role)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">Manage system settings and preferences</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Company Settings - Admin/Owner only */}
        {isAdmin && (
          <Link href="/settings/company">
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">Company Settings</CardTitle>
                </div>
                <CardDescription>
                  Configure company information, invoice defaults, and document numbering
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        )}

        {/* User Management - Admin/Owner only */}
        {isAdmin && (
          <Link href="/settings/users">
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">User Management</CardTitle>
                </div>
                <CardDescription>
                  Manage user accounts, roles, and permissions
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        )}

        {/* Activity Log - Admin/Owner only */}
        {isAdmin && (
          <Link href="/settings/activity-log">
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">Activity Log</CardTitle>
                </div>
                <CardDescription>
                  View system activity and audit trail
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        )}

        {/* Scheduled Tasks - Admin/Owner only */}
        {isAdmin && (
          <Link href="/settings/automation/scheduled-tasks">
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">Scheduled Tasks</CardTitle>
                </div>
                <CardDescription>
                  Manage automated tasks and view execution history
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        )}

        {/* Integrations - Admin/Owner only */}
        {isAdmin && (
          <Link href="/settings/integrations">
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Link2 className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">Integrations</CardTitle>
                </div>
                <CardDescription>
                  Configure external system integrations and sync settings
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        )}

        {/* Document Templates - Admin/Owner only */}
        {isAdmin && (
          <Link href="/settings/document-templates">
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">Document Templates</CardTitle>
                </div>
                <CardDescription>
                  Manage document generation templates
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        )}

        {/* Notification Templates - Admin/Owner only */}
        {isAdmin && (
          <Link href="/settings/notification-templates">
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">Notification Templates</CardTitle>
                </div>
                <CardDescription>
                  Configure notification templates and preferences
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        )}
      </div>
    </div>
  )
}
