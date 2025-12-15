'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { UserProfile, UserRole } from '@/types/permissions'
import { DEFAULT_PERMISSIONS } from '@/lib/permissions'
import { updateUserRoleAction } from './actions'
import { Pencil, Shield, ShieldCheck, ShieldX } from 'lucide-react'

interface UserManagementClientProps {
  users: UserProfile[]
  currentUserId: string
}

const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrator',
  manager: 'Manager',
  ops: 'Operations',
  finance: 'Finance',
  viewer: 'Viewer',
}

const ROLE_COLORS: Record<UserRole, string> = {
  admin: 'bg-red-100 text-red-800',
  manager: 'bg-blue-100 text-blue-800',
  ops: 'bg-green-100 text-green-800',
  finance: 'bg-purple-100 text-purple-800',
  viewer: 'bg-gray-100 text-gray-800',
}

export function UserManagementClient({ users, currentUserId }: UserManagementClientProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null)
  const [selectedRole, setSelectedRole] = useState<UserRole>('viewer')
  const [customPermissions, setCustomPermissions] = useState({
    can_see_revenue: false,
    can_see_profit: false,
    can_approve_pjo: false,
    can_manage_invoices: false,
    can_manage_users: false,
    can_create_pjo: false,
    can_fill_costs: false,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleEditUser = (user: UserProfile) => {
    setEditingUser(user)
    setSelectedRole(user.role as UserRole)
    setCustomPermissions({
      can_see_revenue: user.can_see_revenue,
      can_see_profit: user.can_see_profit,
      can_approve_pjo: user.can_approve_pjo,
      can_manage_invoices: user.can_manage_invoices,
      can_manage_users: user.can_manage_users,
      can_create_pjo: user.can_create_pjo,
      can_fill_costs: user.can_fill_costs,
    })
  }

  const handleRoleChange = (role: UserRole) => {
    setSelectedRole(role)
    // Apply default permissions for the role
    setCustomPermissions(DEFAULT_PERMISSIONS[role])
  }

  const handlePermissionToggle = (permission: keyof typeof customPermissions) => {
    setCustomPermissions((prev) => ({
      ...prev,
      [permission]: !prev[permission],
    }))
  }

  const handleSave = async () => {
    if (!editingUser) return

    setIsSubmitting(true)
    try {
      const result = await updateUserRoleAction(
        editingUser.user_id,
        selectedRole,
        customPermissions
      )

      if (result.success) {
        toast({
          title: 'User updated',
          description: `${editingUser.full_name || editingUser.email}'s role has been updated.`,
        })
        setEditingUser(null)
        router.refresh()
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to update user',
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
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Permissions</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">
                  {user.full_name || 'No name'}
                  {user.user_id === currentUserId && (
                    <Badge variant="outline" className="ml-2">
                      You
                    </Badge>
                  )}
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Badge className={ROLE_COLORS[user.role as UserRole]}>
                    {ROLE_LABELS[user.role as UserRole] || user.role}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    {user.can_see_revenue && (
                      <Badge variant="secondary" className="text-xs">
                        Revenue
                      </Badge>
                    )}
                    {user.can_approve_pjo && (
                      <Badge variant="secondary" className="text-xs">
                        Approve
                      </Badge>
                    )}
                    {user.can_manage_users && (
                      <Badge variant="secondary" className="text-xs">
                        Admin
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm" onClick={() => handleEditUser(user)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Edit User Dialog */}
      <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User Permissions</DialogTitle>
            <DialogDescription>
              {editingUser?.full_name || editingUser?.email}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Role Selection */}
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={selectedRole} onValueChange={(v) => handleRoleChange(v as UserRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-red-600" />
                      Administrator
                    </div>
                  </SelectItem>
                  <SelectItem value="manager">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-blue-600" />
                      Manager
                    </div>
                  </SelectItem>
                  <SelectItem value="ops">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-green-600" />
                      Operations
                    </div>
                  </SelectItem>
                  <SelectItem value="finance">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-purple-600" />
                      Finance
                    </div>
                  </SelectItem>
                  <SelectItem value="viewer">
                    <div className="flex items-center gap-2">
                      <ShieldX className="h-4 w-4 text-gray-600" />
                      Viewer
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Custom Permissions */}
            <div className="space-y-4">
              <Label>Custom Permissions</Label>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="can_see_revenue" className="font-normal">
                    Can see revenue
                  </Label>
                  <Switch
                    id="can_see_revenue"
                    checked={customPermissions.can_see_revenue}
                    onCheckedChange={() => handlePermissionToggle('can_see_revenue')}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="can_see_profit" className="font-normal">
                    Can see profit
                  </Label>
                  <Switch
                    id="can_see_profit"
                    checked={customPermissions.can_see_profit}
                    onCheckedChange={() => handlePermissionToggle('can_see_profit')}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="can_approve_pjo" className="font-normal">
                    Can approve PJO
                  </Label>
                  <Switch
                    id="can_approve_pjo"
                    checked={customPermissions.can_approve_pjo}
                    onCheckedChange={() => handlePermissionToggle('can_approve_pjo')}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="can_create_pjo" className="font-normal">
                    Can create PJO
                  </Label>
                  <Switch
                    id="can_create_pjo"
                    checked={customPermissions.can_create_pjo}
                    onCheckedChange={() => handlePermissionToggle('can_create_pjo')}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="can_fill_costs" className="font-normal">
                    Can fill costs
                  </Label>
                  <Switch
                    id="can_fill_costs"
                    checked={customPermissions.can_fill_costs}
                    onCheckedChange={() => handlePermissionToggle('can_fill_costs')}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="can_manage_invoices" className="font-normal">
                    Can manage invoices
                  </Label>
                  <Switch
                    id="can_manage_invoices"
                    checked={customPermissions.can_manage_invoices}
                    onCheckedChange={() => handlePermissionToggle('can_manage_invoices')}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="can_manage_users" className="font-normal">
                    Can manage users
                  </Label>
                  <Switch
                    id="can_manage_users"
                    checked={customPermissions.can_manage_users}
                    onCheckedChange={() => handlePermissionToggle('can_manage_users')}
                    disabled={
                      editingUser?.user_id === currentUserId &&
                      customPermissions.can_manage_users
                    }
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingUser(null)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
