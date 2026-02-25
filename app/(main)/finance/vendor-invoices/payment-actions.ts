'use server'

/**
 * Vendor Invoice Payment + Summary Actions
 * Split from actions.ts
 */

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type {
  VendorInvoiceStatus,
  VendorPaymentFormData,
  VendorPaymentWithRecorder,
  APSummary,
  APSummaryWithAging,
} from '@/types/vendor-invoices'
import {
  canViewVendorInvoices,
  canEditVendorInvoices,
  canDeleteVendorInvoices,
  validatePaymentAmount,
  isValidPaymentMethod,
  determineVendorInvoiceStatus,
} from '@/lib/vendor-invoice-utils'

/**
 * Get current user profile with role (private helper)
 */
async function getCurrentUserProfile() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('id, role, full_name')
    .eq('user_id', user.id)
    .single()

  return profile
}

/**
 * Record payment against vendor invoice
 */
export async function recordVendorPayment(
  data: VendorPaymentFormData
): Promise<{ id?: string; error?: string }> {
  const supabase = await createClient()

  // Get current user
  const profile = await getCurrentUserProfile()
  if (!profile) {
    return { error: 'User not authenticated' }
  }

  // Check permission
  if (!canEditVendorInvoices(profile.role)) {
    return { error: 'You do not have permission to record payments' }
  }

  // Validate payment amount
  const amountValidation = validatePaymentAmount(data.amount)
  if (!amountValidation.isValid) {
    return { error: amountValidation.error }
  }

  // Validate payment method
  if (!isValidPaymentMethod(data.payment_method)) {
    return { error: 'Invalid payment method selected' }
  }

  // Get current invoice
  const { data: invoice, error: fetchError } = await supabase
    .from('vendor_invoices')
    .select('id, status, total_amount, amount_paid')
    .eq('id', data.vendor_invoice_id)
    .single()

  if (fetchError || !invoice) {
    return { error: 'Vendor invoice not found' }
  }

  // Cannot record payment for cancelled invoices
  if (invoice.status === 'cancelled') {
    return { error: 'Cannot record payment for cancelled invoice' }
  }

  // Create payment record
  const { data: payment, error: paymentError } = await supabase
    .from('vendor_payments')
    .insert({
      vendor_invoice_id: data.vendor_invoice_id,
      payment_date: data.payment_date,
      amount: data.amount,
      payment_method: data.payment_method,
      reference_number: data.reference_number || null,
      bank_name: data.bank_name || null,
      bank_account: data.bank_account || null,
      proof_url: data.proof_url || null,
      notes: data.notes || null,
      created_by: profile.id,
    })
    .select('id')
    .single()

  if (paymentError) {
    return { error: paymentError.message }
  }

  // Calculate new amount_paid and determine new status
  const newAmountPaid = (invoice.amount_paid ?? 0) + data.amount
  const newStatus = determineVendorInvoiceStatus(
    invoice.total_amount,
    newAmountPaid,
    (invoice.status as VendorInvoiceStatus) ?? 'received'
  )

  // Update invoice
  const { error: updateError } = await supabase
    .from('vendor_invoices')
    .update({
      amount_paid: newAmountPaid,
      status: newStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', data.vendor_invoice_id)

  if (updateError) {
    // Payment was recorded but invoice update failed - log but don't fail
  }

  revalidatePath('/finance/vendor-invoices')
  revalidatePath(`/finance/vendor-invoices/${data.vendor_invoice_id}`)

  return { id: payment.id }
}

/**
 * Get payments for a vendor invoice
 */
export async function getVendorPayments(
  vendorInvoiceId: string
): Promise<VendorPaymentWithRecorder[]> {
  const supabase = await createClient()

  // Get current user
  const profile = await getCurrentUserProfile()
  if (!profile) {
    return []
  }

  // Check permission
  if (!canViewVendorInvoices(profile.role)) {
    return []
  }

  const { data, error } = await supabase
    .from('vendor_payments')
    .select(`
      *,
      recorder:user_profiles!vendor_payments_created_by_fkey (
        id,
        full_name
      )
    `)
    .eq('vendor_invoice_id', vendorInvoiceId)
    .order('payment_date', { ascending: false })

  if (error) {
    return []
  }

  return data as VendorPaymentWithRecorder[]
}

/**
 * Delete a vendor payment
 */
export async function deleteVendorPayment(
  paymentId: string
): Promise<{ error?: string }> {
  const supabase = await createClient()

  // Get current user
  const profile = await getCurrentUserProfile()
  if (!profile) {
    return { error: 'User not authenticated' }
  }

  // Check permission
  if (!canDeleteVendorInvoices(profile.role)) {
    return { error: 'You do not have permission to delete payments' }
  }

  // Get payment details
  const { data: payment, error: fetchError } = await supabase
    .from('vendor_payments')
    .select('id, vendor_invoice_id, amount')
    .eq('id', paymentId)
    .single()

  if (fetchError || !payment) {
    return { error: 'Payment not found' }
  }

  // Get current invoice
  const { data: invoice, error: invoiceError } = await supabase
    .from('vendor_invoices')
    .select('id, status, total_amount, amount_paid')
    .eq('id', payment.vendor_invoice_id)
    .single()

  if (invoiceError || !invoice) {
    return { error: 'Vendor invoice not found' }
  }

  // Delete payment
  const { error: deleteError } = await supabase
    .from('vendor_payments')
    .delete()
    .eq('id', paymentId)

  if (deleteError) {
    return { error: deleteError.message }
  }

  // Recalculate invoice amount_paid and status
  const newAmountPaid = Math.max(0, (invoice.amount_paid ?? 0) - payment.amount)
  const newStatus = determineVendorInvoiceStatus(
    invoice.total_amount,
    newAmountPaid,
    (invoice.status as VendorInvoiceStatus) ?? 'received'
  )

  // Update invoice
  await supabase
    .from('vendor_invoices')
    .update({
      amount_paid: newAmountPaid,
      status: newStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', payment.vendor_invoice_id)

  revalidatePath('/finance/vendor-invoices')
  revalidatePath(`/finance/vendor-invoices/${payment.vendor_invoice_id}`)

  return {}
}

/**
 * Get AP summary statistics
 */
export async function getAPSummary(): Promise<APSummary> {
  const supabase = await createClient()

  // Get current user
  const profile = await getCurrentUserProfile()
  if (!profile) {
    return {
      totalUnpaid: 0,
      dueToday: 0,
      overdue: 0,
      paidMTD: 0,
      pendingVerification: 0,
    }
  }

  // Check permission
  if (!canViewVendorInvoices(profile.role)) {
    return {
      totalUnpaid: 0,
      dueToday: 0,
      overdue: 0,
      paidMTD: 0,
      pendingVerification: 0,
    }
  }

  const today = new Date().toISOString().split('T')[0]
  const monthStart = new Date()
  monthStart.setDate(1)
  const monthStartStr = monthStart.toISOString().split('T')[0]

  // Get all unpaid invoices
  const { data: invoices, error: invoicesError } = await supabase
    .from('vendor_invoices')
    .select('id, status, due_date, amount_due, total_amount, amount_paid')
    .not('status', 'in', '("paid","cancelled")')

  if (invoicesError) {
    return {
      totalUnpaid: 0,
      dueToday: 0,
      overdue: 0,
      paidMTD: 0,
      pendingVerification: 0,
    }
  }

  // Get payments this month
  const { data: payments, error: paymentsError } = await supabase
    .from('vendor_payments')
    .select('amount')
    .gte('payment_date', monthStartStr)
    .lte('payment_date', today)

  if (paymentsError) {
  }

  // Calculate summary
  let totalUnpaid = 0
  let dueToday = 0
  let overdue = 0
  let pendingVerification = 0

  for (const invoice of invoices || []) {
    const amountDue = invoice.total_amount - (invoice.amount_paid ?? 0)
    totalUnpaid += amountDue

    if (invoice.status === 'received') {
      pendingVerification++
    }

    if (invoice.due_date) {
      if (invoice.due_date === today) {
        dueToday += amountDue
      } else if (invoice.due_date < today) {
        overdue += amountDue
      }
    }
  }

  const paidMTD = (payments || []).reduce((sum, p) => sum + Number(p.amount), 0)

  return {
    totalUnpaid,
    dueToday,
    overdue,
    paidMTD,
    pendingVerification,
  }
}

/**
 * Get AP summary with aging buckets
 */
export async function getAPSummaryWithAging(): Promise<APSummaryWithAging> {
  const supabase = await createClient()

  // Get base summary
  const summary = await getAPSummary()

  // Get current user
  const profile = await getCurrentUserProfile()
  if (!profile || !canViewVendorInvoices(profile.role)) {
    return {
      ...summary,
      aging: {
        current: 0,
        days1to30: 0,
        days31to60: 0,
        days61to90: 0,
        days90plus: 0,
      },
    }
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Get all unpaid invoices with due dates
  const { data: invoices, error } = await supabase
    .from('vendor_invoices')
    .select('due_date, total_amount, amount_paid')
    .not('status', 'in', '("paid","cancelled")')

  if (error) {
    return {
      ...summary,
      aging: {
        current: 0,
        days1to30: 0,
        days31to60: 0,
        days61to90: 0,
        days90plus: 0,
      },
    }
  }

  // Calculate aging buckets
  const aging = {
    current: 0,
    days1to30: 0,
    days31to60: 0,
    days61to90: 0,
    days90plus: 0,
  }

  for (const invoice of invoices || []) {
    const amountDue = invoice.total_amount - (invoice.amount_paid ?? 0)

    if (!invoice.due_date) {
      aging.current += amountDue
      continue
    }

    const dueDate = new Date(invoice.due_date)
    dueDate.setHours(0, 0, 0, 0)
    const diffTime = today.getTime() - dueDate.getTime()
    const daysOverdue = Math.floor(diffTime / (1000 * 60 * 60 * 24))

    if (daysOverdue <= 0) {
      aging.current += amountDue
    } else if (daysOverdue <= 30) {
      aging.days1to30 += amountDue
    } else if (daysOverdue <= 60) {
      aging.days31to60 += amountDue
    } else if (daysOverdue <= 90) {
      aging.days61to90 += amountDue
    } else {
      aging.days90plus += amountDue
    }
  }

  return {
    ...summary,
    aging,
  }
}


// =====================================================
// PJO Conversion Integration
// =====================================================

/**
 * Update vendor invoice JO reference when PJO is converted to JO
 */
export async function updateVendorInvoiceJOReference(
  pjoId: string,
  joId: string
): Promise<{ error?: string; updatedCount?: number }> {
  const supabase = await createClient()

  // Get current user
  const profile = await getCurrentUserProfile()
  if (!profile) {
    return { error: 'User not authenticated' }
  }

  // Check permission
  if (!canEditVendorInvoices(profile.role)) {
    return { error: 'You do not have permission to update vendor invoices' }
  }

  // Update all vendor invoices linked to this PJO
  const { data, error } = await supabase
    .from('vendor_invoices')
    .update({
      jo_id: joId,
      updated_at: new Date().toISOString(),
    })
    .eq('pjo_id', pjoId)
    .select('id')

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/finance/vendor-invoices')

  return { updatedCount: data?.length || 0 }
}
