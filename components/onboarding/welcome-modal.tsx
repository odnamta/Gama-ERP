'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { dismissWelcomeModal, requestRoleChange } from '@/lib/onboarding-actions'
import { UserRole } from '@/types/permissions'
import {
  Sparkles,
  Users,
  Briefcase,
  FileText,
  Ship,
  FileCheck,
  UserPlus,
  TrendingUp,
  Package,
  Shield,
  Heart,
  Leaf,
  ChevronRight,
  Bell
} from 'lucide-react'

interface WelcomeModalProps {
  userId: string
  userName: string
  userRole: UserRole
  userEmail: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

// Role-specific quick start actions
const ROLE_QUICK_STARTS: Record<UserRole, {
  title: string
  description: string
  icon: typeof Sparkles
  actions: Array<{ label: string; href: string; icon: typeof ChevronRight }>
}> = {
  owner: {
    title: 'Welcome, Owner!',
    description: 'You have full access to all modules. Here are some key areas to get started:',
    icon: Shield,
    actions: [
      { label: 'Manage Users', href: '/settings/users', icon: Users },
      { label: 'View Executive Dashboard', href: '/dashboard/executive', icon: TrendingUp },
      { label: 'Review System Settings', href: '/settings', icon: Shield },
    ],
  },
  director: {
    title: 'Welcome, Director!',
    description: 'Oversee all operations and manage the business:',
    icon: Briefcase,
    actions: [
      { label: 'View Executive Dashboard', href: '/dashboard/executive', icon: TrendingUp },
      { label: 'Review Job Orders', href: '/job-orders', icon: FileText },
      { label: 'Check Financial Reports', href: '/reports/financial', icon: TrendingUp },
    ],
  },
  finance_manager: {
    title: 'Welcome, Finance Manager!',
    description: 'Manage finances, invoices, and approvals:',
    icon: TrendingUp,
    actions: [
      { label: 'Review Pending Approvals', href: '/proforma-jo', icon: FileCheck },
      { label: 'Manage Invoices', href: '/invoices', icon: FileText },
      { label: 'View Finance Dashboard', href: '/dashboard/finance-manager', icon: TrendingUp },
    ],
  },
  marketing_manager: {
    title: 'Welcome, Marketing Manager!',
    description: 'Manage customers, quotations, and sales:',
    icon: Users,
    actions: [
      { label: 'View Customers', href: '/customers', icon: Users },
      { label: 'Create Quotation', href: '/quotations/new', icon: FileText },
      { label: 'Review PJOs', href: '/proforma-jo', icon: FileCheck },
    ],
  },
  operations_manager: {
    title: 'Welcome, Operations Manager!',
    description: 'Oversee job execution and equipment:',
    icon: Package,
    actions: [
      { label: 'View Active Jobs', href: '/job-orders', icon: Briefcase },
      { label: 'Manage Equipment', href: '/equipment', icon: Package },
      { label: 'Check Operations Dashboard', href: '/dashboard/operations-manager', icon: TrendingUp },
    ],
  },
  hr: {
    title: 'Welcome to HR Module!',
    description: 'Manage employees, payroll, and leave:',
    icon: Heart,
    actions: [
      { label: 'View Employees', href: '/hr/employees', icon: Users },
      { label: 'Manage Payroll', href: '/hr/payroll', icon: TrendingUp },
      { label: 'Leave Management', href: '/hr/leave', icon: FileText },
    ],
  },
  hse: {
    title: 'Welcome to HSE Module!',
    description: 'Manage health, safety, and environment compliance:',
    icon: Leaf,
    actions: [
      { label: 'HSE Dashboard', href: '/hse', icon: Leaf },
      { label: 'Safety Reports', href: '/hse/reports', icon: FileText },
      { label: 'Compliance Tracking', href: '/hse/compliance', icon: FileCheck },
    ],
  },
  agency: {
    title: 'Welcome to Agency Module!',
    description: 'Manage shipping agency operations:',
    icon: Ship,
    actions: [
      { label: 'Manage Bookings', href: '/agency/bookings', icon: Briefcase },
      { label: 'Bill of Lading', href: '/agency/bl', icon: FileText },
      { label: 'Vessel Schedule', href: '/agency/vessels', icon: Ship },
    ],
  },
  customs: {
    title: 'Welcome to Customs Module!',
    description: 'Manage PIB/PEB documentation:',
    icon: FileCheck,
    actions: [
      { label: 'Import Documentation', href: '/customs/import', icon: FileText },
      { label: 'Export Documentation', href: '/customs/export', icon: FileText },
      { label: 'Customs Fees', href: '/customs/fees', icon: TrendingUp },
    ],
  },
  administration: {
    title: 'Welcome, Admin!',
    description: 'Manage PJOs, job orders, and documentation:',
    icon: FileText,
    actions: [
      { label: 'Create PJO', href: '/proforma-jo/new', icon: FileCheck },
      { label: 'View Job Orders', href: '/job-orders', icon: Briefcase },
      { label: 'Manage Documents', href: '/documents', icon: FileText },
    ],
  },
  finance: {
    title: 'Welcome to Finance!',
    description: 'Handle financial operations and transactions:',
    icon: TrendingUp,
    actions: [
      { label: 'View Invoices', href: '/invoices', icon: FileText },
      { label: 'Manage Disbursements', href: '/disbursements', icon: TrendingUp },
      { label: 'Financial Reports', href: '/reports/financial', icon: TrendingUp },
    ],
  },
  marketing: {
    title: 'Welcome to Marketing!',
    description: 'Support sales and customer relations:',
    icon: Users,
    actions: [
      { label: 'View Customers', href: '/customers', icon: Users },
      { label: 'Create Quotation', href: '/quotations/new', icon: FileText },
      { label: 'View PJOs', href: '/proforma-jo', icon: FileCheck },
    ],
  },
  ops: {
    title: 'Welcome to Operations!',
    description: 'Execute and track job orders:',
    icon: Briefcase,
    actions: [
      { label: 'View Job Orders', href: '/job-orders', icon: Briefcase },
      { label: 'Equipment Management', href: '/equipment', icon: Package },
      { label: 'Track Progress', href: '/dashboard', icon: TrendingUp },
    ],
  },
  engineer: {
    title: 'Welcome, Engineer!',
    description: 'Provide technical assessments and support:',
    icon: Package,
    actions: [
      { label: 'View Job Orders', href: '/job-orders', icon: Briefcase },
      { label: 'Technical Reports', href: '/reports', icon: FileText },
      { label: 'Equipment Status', href: '/equipment', icon: Package },
    ],
  },
  sysadmin: {
    title: 'Welcome, System Admin!',
    description: 'Manage system settings and configurations:',
    icon: Shield,
    actions: [
      { label: 'System Settings', href: '/settings', icon: Shield },
      { label: 'User Management', href: '/settings/users', icon: Users },
      { label: 'System Logs', href: '/settings/system-logs', icon: FileText },
    ],
  },
}

export function WelcomeModal({
  userId,
  userName,
  userRole,
  userEmail,
  open,
  onOpenChange,
}: WelcomeModalProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [notificationSent, setNotificationSent] = useState(false)

  const quickStart = ROLE_QUICK_STARTS[userRole] || ROLE_QUICK_STARTS.ops
  const IconComponent = quickStart.icon

  const handleGetStarted = () => {
    startTransition(async () => {
      await dismissWelcomeModal(userId)
      onOpenChange(false)

      // Navigate to first action if available
      if (quickStart.actions[0]) {
        router.push(quickStart.actions[0].href)
      }
    })
  }

  const handleRequestRoleChange = async () => {
    startTransition(async () => {
      const result = await requestRoleChange(
        userId,
        userEmail,
        userName,
        userRole
      )

      if (result.success) {
        setNotificationSent(true)
        // Keep notification sent state for 5 seconds
        setTimeout(() => {
          setNotificationSent(false)
        }, 5000)
      } else {
        // Show error toast if available, or just console error
        console.error('Failed to send role change request:', result.error)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <IconComponent className="h-6 w-6 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-2xl">
                {quickStart.title}
              </DialogTitle>
              <DialogDescription className="text-base mt-1">
                Welcome, <span className="font-medium">{userName}</span>! 👋
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <p className="text-muted-foreground">
            {quickStart.description}
          </p>

          {/* Quick Actions */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Quick Start Actions:</p>
            <div className="grid gap-2">
              {quickStart.actions.map((action) => {
                const ActionIcon = action.icon
                return (
                  <Card
                    key={action.href}
                    className="cursor-pointer hover:bg-accent transition-colors"
                    onClick={() => {
                      router.push(action.href)
                      handleGetStarted()
                    }}
                  >
                    <CardContent className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-3">
                        <ActionIcon className="h-5 w-5 text-primary" />
                        <span className="font-medium">{action.label}</span>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>

          {/* Role Assignment Notice for auto-assigned users */}
          {(userRole === 'marketing' || userRole === 'ops') && (
            <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Bell className="h-5 w-5 text-orange-600 mt-0.5" />
                  <div className="flex-1 space-y-2">
                    <p className="text-sm font-medium text-orange-900 dark:text-orange-100">
                      Role Assignment Notice
                    </p>
                    <p className="text-sm text-orange-800 dark:text-orange-200">
                      You&apos;ve been assigned the <span className="font-medium">{userRole}</span> role by default.
                      If this doesn&apos;t match your responsibilities, you can request a role change.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRequestRoleChange}
                      disabled={notificationSent}
                      className="border-orange-300 hover:bg-orange-100"
                    >
                      {notificationSent ? (
                        <>✓ Request Sent</>
                      ) : (
                        <>
                          <UserPlus className="h-4 w-4 mr-2" />
                          Request Role Change
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Help Resources */}
          <Card className="bg-muted/50">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">
                📚 Need help? Visit the <a href="/help" className="text-primary hover:underline">Help Center</a> or
                take a <a href="/help/tours" className="text-primary hover:underline">Guided Tour</a> to learn more.
              </p>
            </CardContent>
          </Card>
        </div>

        <DialogFooter className="sm:space-x-2">
          <Button
            variant="outline"
            onClick={() => {
              handleGetStarted()
            }}
          >
            Skip for Now
          </Button>
          <Button
            onClick={handleGetStarted}
            disabled={isPending}
          >
            {isPending ? 'Loading...' : "Let's Get Started!"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
