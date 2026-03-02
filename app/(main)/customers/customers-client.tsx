'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Customer } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CustomerTable } from '@/components/customers/customer-table'
import { CustomerDialog } from '@/components/customers/customer-dialog'
import { CustomerFormData } from '@/components/customers/customer-form'
import { createCustomer, updateCustomer, deleteCustomer } from './actions'
import { useToast } from '@/hooks/use-toast'
import { Plus, Users, Briefcase, Receipt } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface CustomerStats {
  totalCustomers: number
  totalProjects: number
  totalInvoices: number
}

interface CustomersClientProps {
  customers: Customer[]
  stats?: CustomerStats
}

export function CustomersClient({ customers, stats }: CustomersClientProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingCustomer, setDeletingCustomer] = useState<Customer | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleAddClick = () => {
    setEditingCustomer(null)
    setDialogOpen(true)
  }

  const handleEditClick = (customer: Customer) => {
    setEditingCustomer(customer)
    setDialogOpen(true)
  }

  const handleDeleteClick = (customer: Customer) => {
    setDeletingCustomer(customer)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!deletingCustomer) return

    setIsDeleting(true)
    const result = await deleteCustomer(deletingCustomer.id)
    setIsDeleting(false)

    if (result.error) {
      toast({
        title: 'Error',
        description: result.error,
        variant: 'destructive',
      })
    } else {
      toast({
        title: 'Success',
        description: 'Customer deleted successfully.',
      })
      router.refresh()
    }

    setDeleteDialogOpen(false)
    setDeletingCustomer(null)
  }

  const handleSubmit = async (data: CustomerFormData): Promise<{ error?: string }> => {
    if (editingCustomer) {
      const result = await updateCustomer(editingCustomer.id, data)
      if (result.error) {
        toast({
          title: 'Error',
          description: result.error,
          variant: 'destructive',
        })
      } else {
        toast({
          title: 'Success',
          description: 'Customer updated successfully.',
        })
      }
      return result
    } else {
      const result = await createCustomer(data)
      if (result.error) {
        toast({
          title: 'Error',
          description: result.error,
          variant: 'destructive',
        })
      } else {
        toast({
          title: 'Success',
          description: 'Customer added successfully.',
        })
      }
      return result
    }
  }

  const handleSuccess = () => {
    router.refresh()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Customers</h2>
          <p className="text-muted-foreground">Manage customer accounts and contacts</p>
        </div>
        <Button onClick={handleAddClick}>
          <Plus className="mr-2 h-4 w-4" /> Add Customer
        </Button>
      </div>

      {stats && (
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Users className="h-8 w-8 text-blue-500" />
              <div>
                <div className="text-2xl font-bold">{stats.totalCustomers}</div>
                <div className="text-xs text-muted-foreground">Customer Aktif</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Briefcase className="h-8 w-8 text-green-500" />
              <div>
                <div className="text-2xl font-bold">{stats.totalProjects}</div>
                <div className="text-xs text-muted-foreground">Proyek Aktif</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Receipt className="h-8 w-8 text-orange-500" />
              <div>
                <div className="text-2xl font-bold">{stats.totalInvoices}</div>
                <div className="text-xs text-muted-foreground">Total Invoice</div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>All Customers</CardTitle>
          <CardDescription>View and manage all customers</CardDescription>
        </CardHeader>
        <CardContent>
          <CustomerTable customers={customers} onEdit={handleEditClick} onDelete={handleDeleteClick} />
        </CardContent>
      </Card>

      <CustomerDialog
        customer={editingCustomer}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleSubmit}
        onSuccess={handleSuccess}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Customer</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deletingCustomer?.name}&quot;? This action can be undone by an administrator.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
