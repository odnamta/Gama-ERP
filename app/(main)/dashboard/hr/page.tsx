import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getHRDashboardMetrics } from '@/lib/dashboard/hr-dashboard-data'
import { Users, Calendar, FileText, Award, TrendingUp, Clock, AlertCircle } from 'lucide-react'

export default async function HRDashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role, department_scope')
    .eq('user_id', user.id)
    .single()

  if (!profile) {
    redirect('/login')
  }

  // Check access: hr role or manager with hr scope
  const hasAccess = profile.role === 'hr' ||
    (profile.role === 'manager' && profile.department_scope?.includes('hr')) ||
    ['owner', 'director'].includes(profile.role)

  if (!hasAccess) {
    redirect('/dashboard')
  }

  const metrics = await getHRDashboardMetrics()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Human Resources Dashboard</h1>
        <p className="text-muted-foreground">
          Manage employees, attendance, payroll, and skills development
        </p>
      </div>

      {/* Primary Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border p-4 bg-blue-50">
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold">Employee Count</h3>
          </div>
          <div className="text-2xl font-bold text-blue-700">{metrics.activeEmployees}</div>
          <p className="text-sm text-muted-foreground">Active employees</p>
          {metrics.inactiveEmployees > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              +{metrics.inactiveEmployees} inactive
            </p>
          )}
        </div>

        <div className="rounded-lg border p-4 bg-green-50">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="h-5 w-5 text-green-600" />
            <h3 className="font-semibold">Attendance Today</h3>
          </div>
          <div className="text-2xl font-bold text-green-700">{metrics.attendanceRate}%</div>
          <p className="text-sm text-muted-foreground">
            {metrics.presentToday} present, {metrics.absentToday} absent
          </p>
        </div>

        <div className="rounded-lg border p-4 bg-orange-50">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="h-5 w-5 text-orange-600" />
            <h3 className="font-semibold">Leave Requests</h3>
          </div>
          <div className="text-2xl font-bold text-orange-700">{metrics.pendingLeaveRequests}</div>
          <p className="text-sm text-muted-foreground">Pending approvals</p>
          {metrics.approvedLeavesToday > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.approvedLeavesToday} on leave today
            </p>
          )}
        </div>

        <div className="rounded-lg border p-4 bg-purple-50">
          <div className="flex items-center gap-2 mb-2">
            <Award className="h-5 w-5 text-purple-600" />
            <h3 className="font-semibold">Skills Coverage</h3>
          </div>
          <div className="text-2xl font-bold text-purple-700">{metrics.skillCoverageRate}%</div>
          <p className="text-sm text-muted-foreground">
            {metrics.employeesWithSkills} employees with skills
          </p>
        </div>
      </div>

      {/* Secondary Metrics */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold">New Hires</h3>
          </div>
          <div className="text-2xl font-bold">{metrics.newHiresThisMonth}</div>
          <p className="text-sm text-muted-foreground">This month</p>
        </div>

        <div className="rounded-lg border p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-5 w-5 text-green-600" />
            <h3 className="font-semibold">Upcoming Birthdays</h3>
          </div>
          <div className="text-2xl font-bold">{metrics.upcomingBirthdays}</div>
          <p className="text-sm text-muted-foreground">Next 7 days</p>
        </div>

        <div className="rounded-lg border p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="h-5 w-5 text-orange-600" />
            <h3 className="font-semibold">Expiring Certifications</h3>
          </div>
          <div className="text-2xl font-bold text-orange-600">{metrics.expiringCertifications}</div>
          <p className="text-sm text-muted-foreground">Next 30 days</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="rounded-lg border p-4">
        <h3 className="font-semibold mb-3">Quick Actions</h3>
        <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4">
          <a href="/hr/employees" className="text-sm text-blue-600 hover:underline">
            → View All Employees
          </a>
          <a href="/hr/attendance" className="text-sm text-blue-600 hover:underline">
            → Attendance Records
          </a>
          <a href="/hr/leave" className="text-sm text-blue-600 hover:underline">
            → Leave Management
          </a>
          <a href="/hr/skills" className="text-sm text-blue-600 hover:underline">
            → Skills & Training
          </a>
        </div>
      </div>
    </div>
  )
}