'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { toRomanMonth, calculateProfit } from '@/lib/pjo-utils'

const pjoSchema = z.object({
  project_id: z.string().min(1, 'Please select a project'),
  jo_date: z.string().min(1, 'Date is required'),
  commodity: z.string().optional(),
  quantity: z.number().optional(),
  quantity_unit: z.string().optional(),
  pol: z.string().optional(),
  pod: z.string().optional(),
  pol_place_id: z.string().optional(),
  pol_lat: z.number().optional(),
  pol_lng: z.number().optional(),
  pod_place_id: z.string().optional(),
  pod_lat: z.number().optional(),
  pod_lng: z.number().optional(),
  etd: z.string().optional(),
  eta: z.string().optional(),
  carrier_type: z.string().optional(),
  total_revenue: z.number().min(0, 'Revenue must be non-negative'),
  total_expenses: z.number().min(0, 'Expenses must be non-negative'),
  notes: z.string().optional(),
})

export type PJOFormData = z.infer<typeof pjoSchema>

/**
 * Generate the next PJO number for the current month
 * Format: NNNN/CARGO/MM/YYYY where MM is Roman numeral
 */
export async function generatePJONumber(): Promise<string> {
  const supabase = await createClient()
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  const romanMonth = toRomanMonth(month)

  // Pattern to match current month's PJO numbers
  const pattern = `%/CARGO/${romanMonth}/${year}`

  const { data: lastPJO } = await supabase
    .from('proforma_job_orders')
    .select('pjo_number')
    .like('pjo_number', pattern)
    .order('pjo_number', { ascending: false })
    .limit(1)
    .single()

  let sequence = 1
  if (lastPJO?.pjo_number) {
    const match = lastPJO.pjo_number.match(/^(\d{4})\//)
    if (match) {
      sequence = parseInt(match[1], 10) + 1
    }
  }

  const paddedSequence = sequence.toString().padStart(4, '0')
  return `${paddedSequence}/CARGO/${romanMonth}/${year}`
}

export async function createPJO(data: PJOFormData): Promise<{ error?: string; id?: string }> {
  const validation = pjoSchema.safeParse(data)
  if (!validation.success) {
    return { error: validation.error.issues[0].message }
  }

  const supabase = await createClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'You must be logged in to create a PJO' }
  }

  // Get project to find customer_id
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('customer_id')
    .eq('id', data.project_id)
    .single()

  if (projectError || !project) {
    return { error: 'Project not found' }
  }

  // Generate PJO number
  const pjoNumber = await generatePJONumber()
  const profit = calculateProfit(data.total_revenue, data.total_expenses)

  const { data: newPJO, error } = await supabase
    .from('proforma_job_orders')
    .insert({
      pjo_number: pjoNumber,
      project_id: data.project_id,
      customer_id: project.customer_id,
      description: data.commodity || '',
      jo_date: data.jo_date || null,
      commodity: data.commodity || null,
      quantity: data.quantity || null,
      quantity_unit: data.quantity_unit || null,
      pol: data.pol || null,
      pod: data.pod || null,
      pol_place_id: data.pol_place_id || null,
      pol_lat: data.pol_lat || null,
      pol_lng: data.pol_lng || null,
      pod_place_id: data.pod_place_id || null,
      pod_lat: data.pod_lat || null,
      pod_lng: data.pod_lng || null,
      etd: data.etd || null,
      eta: data.eta || null,
      carrier_type: data.carrier_type || null,
      total_revenue: data.total_revenue,
      total_expenses: data.total_expenses,
      profit: profit,
      notes: data.notes || null,
      status: 'draft',
      created_by: user.id,
      is_active: true,
    })
    .select('id')
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/proforma-jo')
  revalidatePath(`/projects/${data.project_id}`)
  return { id: newPJO.id }
}

export async function updatePJO(
  id: string,
  data: PJOFormData
): Promise<{ error?: string }> {
  const validation = pjoSchema.safeParse(data)
  if (!validation.success) {
    return { error: validation.error.issues[0].message }
  }

  const supabase = await createClient()

  // Check if PJO is in draft status
  const { data: existingPJO, error: fetchError } = await supabase
    .from('proforma_job_orders')
    .select('status, project_id')
    .eq('id', id)
    .single()

  if (fetchError || !existingPJO) {
    return { error: 'PJO not found' }
  }

  if (existingPJO.status !== 'draft') {
    return { error: 'Only draft PJOs can be edited' }
  }

  const profit = calculateProfit(data.total_revenue, data.total_expenses)

  const { error } = await supabase
    .from('proforma_job_orders')
    .update({
      jo_date: data.jo_date || null,
      commodity: data.commodity || null,
      quantity: data.quantity || null,
      quantity_unit: data.quantity_unit || null,
      pol: data.pol || null,
      pod: data.pod || null,
      pol_place_id: data.pol_place_id || null,
      pol_lat: data.pol_lat || null,
      pol_lng: data.pol_lng || null,
      pod_place_id: data.pod_place_id || null,
      pod_lat: data.pod_lat || null,
      pod_lng: data.pod_lng || null,
      etd: data.etd || null,
      eta: data.eta || null,
      carrier_type: data.carrier_type || null,
      total_revenue: data.total_revenue,
      total_expenses: data.total_expenses,
      profit: profit,
      notes: data.notes || null,
      description: data.commodity || '',
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/proforma-jo')
  revalidatePath(`/proforma-jo/${id}`)
  revalidatePath(`/projects/${existingPJO.project_id}`)
  return {}
}

export async function deletePJO(id: string): Promise<{ error?: string }> {
  const supabase = await createClient()

  // Check if PJO is in draft status
  const { data: existingPJO, error: fetchError } = await supabase
    .from('proforma_job_orders')
    .select('status, project_id')
    .eq('id', id)
    .single()

  if (fetchError || !existingPJO) {
    return { error: 'PJO not found' }
  }

  if (existingPJO.status !== 'draft') {
    return { error: 'Only draft PJOs can be deleted' }
  }

  // Soft delete
  const { error } = await supabase
    .from('proforma_job_orders')
    .update({ is_active: false })
    .eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/proforma-jo')
  revalidatePath(`/projects/${existingPJO.project_id}`)
  return {}
}

export async function submitForApproval(id: string): Promise<{ error?: string }> {
  const supabase = await createClient()

  // Check current status
  const { data: existingPJO, error: fetchError } = await supabase
    .from('proforma_job_orders')
    .select('status')
    .eq('id', id)
    .single()

  if (fetchError || !existingPJO) {
    return { error: 'PJO not found' }
  }

  if (existingPJO.status !== 'draft') {
    return { error: 'Only draft PJOs can be submitted for approval' }
  }

  const { error } = await supabase
    .from('proforma_job_orders')
    .update({
      status: 'pending_approval',
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/proforma-jo')
  revalidatePath(`/proforma-jo/${id}`)
  return {}
}

export async function approvePJO(id: string): Promise<{ error?: string }> {
  const supabase = await createClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'You must be logged in to approve a PJO' }
  }

  // Check current status
  const { data: existingPJO, error: fetchError } = await supabase
    .from('proforma_job_orders')
    .select('status')
    .eq('id', id)
    .single()

  if (fetchError || !existingPJO) {
    return { error: 'PJO not found' }
  }

  if (existingPJO.status !== 'pending_approval') {
    return { error: 'Only pending approval PJOs can be approved' }
  }

  const { error } = await supabase
    .from('proforma_job_orders')
    .update({
      status: 'approved',
      approved_by: user.id,
      approved_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/proforma-jo')
  revalidatePath(`/proforma-jo/${id}`)
  return {}
}

export async function rejectPJO(id: string, reason: string): Promise<{ error?: string }> {
  const supabase = await createClient()

  if (!reason.trim()) {
    return { error: 'Rejection reason is required' }
  }

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'You must be logged in to reject a PJO' }
  }

  // Check current status
  const { data: existingPJO, error: fetchError } = await supabase
    .from('proforma_job_orders')
    .select('status')
    .eq('id', id)
    .single()

  if (fetchError || !existingPJO) {
    return { error: 'PJO not found' }
  }

  if (existingPJO.status !== 'pending_approval') {
    return { error: 'Only pending approval PJOs can be rejected' }
  }

  const { error } = await supabase
    .from('proforma_job_orders')
    .update({
      status: 'rejected',
      rejection_reason: reason,
      approved_by: user.id,
      approved_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/proforma-jo')
  revalidatePath(`/proforma-jo/${id}`)
  return {}
}
