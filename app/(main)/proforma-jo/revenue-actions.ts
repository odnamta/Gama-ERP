'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { PJORevenueItem } from '@/types'

const revenueItemSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  quantity: z.number().positive('Quantity must be positive'),
  unit: z.string().min(1, 'Unit is required'),
  unit_price: z.number().min(0, 'Unit price cannot be negative'),
  source_type: z.enum(['quotation', 'contract', 'manual']).optional(),
  notes: z.string().optional(),
})

export type RevenueItemFormData = z.infer<typeof revenueItemSchema>

export async function getRevenueItems(pjoId: string): Promise<PJORevenueItem[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('pjo_revenue_items')
    .select('*')
    .eq('pjo_id', pjoId)
    .order('created_at', { ascending: true })
  
  if (error) {
    console.error('Error fetching revenue items:', error)
    return []
  }
  
  return data as PJORevenueItem[]
}

export async function createRevenueItem(
  pjoId: string,
  data: RevenueItemFormData
): Promise<{ error?: string; item?: PJORevenueItem }> {
  const validation = revenueItemSchema.safeParse(data)
  if (!validation.success) {
    return { error: validation.error.issues[0].message }
  }

  const supabase = await createClient()

  // Check PJO status - only allow in draft
  const { data: pjo, error: pjoError } = await supabase
    .from('proforma_job_orders')
    .select('status')
    .eq('id', pjoId)
    .single()

  if (pjoError || !pjo) {
    return { error: 'PJO not found' }
  }

  if (pjo.status !== 'draft') {
    return { error: 'Revenue items can only be added to draft PJOs' }
  }

  const { data: newItem, error } = await supabase
    .from('pjo_revenue_items')
    .insert({
      pjo_id: pjoId,
      description: data.description,
      quantity: data.quantity,
      unit: data.unit,
      unit_price: data.unit_price,
      source_type: data.source_type || 'manual',
      notes: data.notes || null,
    })
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  // Update PJO calculated totals
  await updatePJORevenueTotals(pjoId)

  revalidatePath(`/proforma-jo/${pjoId}`)
  revalidatePath(`/proforma-jo/${pjoId}/edit`)
  return { item: newItem as PJORevenueItem }
}

export async function updateRevenueItem(
  id: string,
  data: Partial<RevenueItemFormData>
): Promise<{ error?: string; item?: PJORevenueItem }> {
  const supabase = await createClient()

  // Get the item to find pjo_id
  const { data: existingItem, error: fetchError } = await supabase
    .from('pjo_revenue_items')
    .select('pjo_id')
    .eq('id', id)
    .single()

  if (fetchError || !existingItem) {
    return { error: 'Revenue item not found' }
  }

  // Check PJO status
  const { data: pjo, error: pjoError } = await supabase
    .from('proforma_job_orders')
    .select('status')
    .eq('id', existingItem.pjo_id)
    .single()

  if (pjoError || !pjo) {
    return { error: 'PJO not found' }
  }

  if (pjo.status !== 'draft') {
    return { error: 'Revenue items can only be edited in draft PJOs' }
  }

  const { data: updatedItem, error } = await supabase
    .from('pjo_revenue_items')
    .update({
      ...data,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  await updatePJORevenueTotals(existingItem.pjo_id)

  revalidatePath(`/proforma-jo/${existingItem.pjo_id}`)
  revalidatePath(`/proforma-jo/${existingItem.pjo_id}/edit`)
  return { item: updatedItem as PJORevenueItem }
}

export async function deleteRevenueItem(id: string): Promise<{ error?: string }> {
  const supabase = await createClient()

  // Get the item to find pjo_id
  const { data: existingItem, error: fetchError } = await supabase
    .from('pjo_revenue_items')
    .select('pjo_id')
    .eq('id', id)
    .single()

  if (fetchError || !existingItem) {
    return { error: 'Revenue item not found' }
  }

  // Check PJO status
  const { data: pjo, error: pjoError } = await supabase
    .from('proforma_job_orders')
    .select('status')
    .eq('id', existingItem.pjo_id)
    .single()

  if (pjoError || !pjo) {
    return { error: 'PJO not found' }
  }

  if (pjo.status !== 'draft') {
    return { error: 'Revenue items can only be deleted from draft PJOs' }
  }

  const { error } = await supabase
    .from('pjo_revenue_items')
    .delete()
    .eq('id', id)

  if (error) {
    return { error: error.message }
  }

  await updatePJORevenueTotals(existingItem.pjo_id)

  revalidatePath(`/proforma-jo/${existingItem.pjo_id}`)
  revalidatePath(`/proforma-jo/${existingItem.pjo_id}/edit`)
  return {}
}

async function updatePJORevenueTotals(pjoId: string): Promise<void> {
  const supabase = await createClient()

  // Get all revenue items
  const { data: items } = await supabase
    .from('pjo_revenue_items')
    .select('quantity, unit_price')
    .eq('pjo_id', pjoId)

  const total = items?.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0) ?? 0

  // Update PJO
  await supabase
    .from('proforma_job_orders')
    .update({
      total_revenue_calculated: total,
      total_revenue: total,
      updated_at: new Date().toISOString(),
    })
    .eq('id', pjoId)
}
