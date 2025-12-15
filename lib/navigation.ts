import {
  LayoutDashboard,
  Users,
  FolderKanban,
  FileText,
  Briefcase,
  Receipt,
  Settings,
  LucideIcon,
} from 'lucide-react'
import { UserRole, UserPermissions } from '@/types/permissions'

export interface NavItem {
  title: string
  href: string
  icon: LucideIcon
  roles: UserRole[]
  permission?: keyof UserPermissions
  children?: NavSubItem[]
}

export interface NavSubItem {
  title: string
  href: string
  permission?: keyof UserPermissions
}

/**
 * Navigation items with role-based access control
 */
export const NAV_ITEMS: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    roles: ['admin', 'manager', 'ops', 'finance', 'viewer'],
  },
  {
    title: 'Customers',
    href: '/customers',
    icon: Users,
    roles: ['admin', 'manager', 'finance'],
  },
  {
    title: 'Projects',
    href: '/projects',
    icon: FolderKanban,
    roles: ['admin', 'manager', 'ops', 'finance', 'viewer'],
  },
  {
    title: 'Proforma JO',
    href: '/proforma-jo',
    icon: FileText,
    roles: ['admin', 'manager', 'ops', 'finance'],
  },
  {
    title: 'Job Orders',
    href: '/job-orders',
    icon: Briefcase,
    roles: ['admin', 'manager', 'ops', 'finance'],
  },
  {
    title: 'Invoices',
    href: '/invoices',
    icon: Receipt,
    roles: ['admin', 'finance'],
    permission: 'can_manage_invoices',
  },
  {
    title: 'Settings',
    href: '/settings',
    icon: Settings,
    roles: ['admin'],
    children: [
      {
        title: 'Users',
        href: '/settings/users',
        permission: 'can_manage_users',
      },
    ],
  },
]

/**
 * Filter navigation items based on user role and permissions
 */
export function filterNavItems(
  items: NavItem[],
  userRole: UserRole,
  permissions: Partial<UserPermissions>
): NavItem[] {
  return items
    .filter((item) => {
      // Check role access
      if (!item.roles.includes(userRole)) {
        return false
      }
      // Check permission if specified
      if (item.permission && !permissions[item.permission]) {
        return false
      }
      return true
    })
    .map((item) => {
      // Filter children if present
      if (item.children) {
        const filteredChildren = item.children.filter((child) => {
          if (child.permission && !permissions[child.permission]) {
            return false
          }
          return true
        })
        return { ...item, children: filteredChildren }
      }
      return item
    })
}
