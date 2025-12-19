'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { BeritaAcaraFormData, BeritaAcaraWithRelations, BAStatus } from '@/types'
import { formatBANumber, canTransitionBAStatus, validateBAForm } from '@/lib/ba-utils'

/**
 * Generate a unique BA number for the current year
 * Format: BA-YYYY-NNNN
 * 
 * **Feature: v0.17-surat-jalan-berita-acara, Property 2: BA Number Generation Format**
 * **Validates: Requirements 3.2, 8.2**
 */
export async function generateBANumber(): Promise<string> {
  const supabase = await createClient()
  const year = new Date().getFullYear()
  
  const { count, error } = await supabase
    .from('berita_acara')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', `${year}-01-01`)
  
  if (error) {
    console.error('Error counting BA records:', error)
    throw new Error('Failed to generate BA number')
  }
  
  return formatBANumber(year, count || 0)
}

/**
 * Get list of Berita Acara documents for a Job Order
 */
export async function getBeritaAcaraList(joId: string): Promise<BeritaAcaraWithRelations[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('berita_acara')
    .select(`
      *,
      user_profiles:created_by (
        id,
        full_name
      )
    `)
    .eq('jo_id', joId)
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching Berita Acara list:', error)
    return []
  }
  
  return data as BeritaAcaraWithRelations[]
}


/**
 * Get a single Berita Acara by ID
 */
export async function getBeritaAcara(id: string): Promise<BeritaAcaraWithRelations | null> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('berita_acara')
    .select(`
      *,
      job_orders (
        id,
        jo_number,
        description
      ),
      user_profiles:created_by (
        id,
        full_name
      )
    `)
    .eq('id', id)
    .single()
  
  if (error) {
    console.error('Error fetching Berita Acara:', error)
    return null
  }
  
  return data as BeritaAcaraWithRelations
}

/**
 * Create a new Berita Acara
 * 
 * **Feature: v0.17-surat-jalan-berita-acara, Property 12: BA Initial Status**
 * **Validates: Requirements 3.4**
 */
export async function createBeritaAcara(
  joId: string,
  formData: BeritaAcaraFormData
): Promise<{ id?: string; error?: string }> {
  const supabase = await createClient()
  
  // Validate form data
  const validation = validateBAForm(formData)
  if (!validation.isValid) {
    return { error: validation.errors.join(', ') }
  }
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  
  // Generate BA number
  let baNumber: string
  try {
    baNumber = await generateBANumber()
  } catch {
    return { error: 'Failed to generate BA number' }
  }
  
  // Create Berita Acara with initial status 'draft'
  const { data, error } = await supabase
    .from('berita_acara')
    .insert({
      ba_number: baNumber,
      jo_id: joId,
      handover_date: formData.handover_date,
      location: formData.location,
      work_description: formData.work_description,
      cargo_condition: formData.cargo_condition,
      condition_notes: formData.condition_notes || null,
      company_representative: formData.company_representative,
      client_representative: formData.client_representative,
      photo_urls: formData.photo_urls || [],
      notes: formData.notes || null,
      status: 'draft',
      created_by: user?.id || null,
    })
    .select('id')
    .single()
  
  if (error) {
    console.error('Error creating Berita Acara:', error)
    return { error: error.message }
  }
  
  revalidatePath(`/job-orders/${joId}`)
  return { id: data.id }
}


/**
 * Update Berita Acara content (only in draft status)
 */
export async function updateBeritaAcara(
  id: string,
  formData: Partial<BeritaAcaraFormData>
): Promise<{ error?: string }> {
  const supabase = await createClient()
  
  // Fetch current BA
  const { data: ba, error: fetchError } = await supabase
    .from('berita_acara')
    .select('status, jo_id')
    .eq('id', id)
    .single()
  
  if (fetchError || !ba) {
    return { error: 'Berita Acara not found' }
  }
  
  // Only allow editing in draft status
  if (ba.status !== 'draft') {
    return { error: 'Berita Acara can only be edited in draft status' }
  }
  
  // Update BA
  const { error: updateError } = await supabase
    .from('berita_acara')
    .update({
      ...formData,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
  
  if (updateError) {
    return { error: updateError.message }
  }
  
  revalidatePath(`/job-orders/${ba.jo_id}`)
  return {}
}

/**
 * Update Berita Acara status
 * 
 * **Feature: v0.17-surat-jalan-berita-acara, Property 9: BA Signed Triggers JO Update**
 * **Validates: Requirements 4.1, 4.2, 4.3**
 */
export async function updateBeritaAcaraStatus(
  id: string,
  newStatus: BAStatus
): Promise<{ error?: string }> {
  const supabase = await createClient()
  
  // Fetch current BA
  const { data: ba, error: fetchError } = await supabase
    .from('berita_acara')
    .select('status, jo_id')
    .eq('id', id)
    .single()
  
  if (fetchError || !ba) {
    return { error: 'Berita Acara not found' }
  }
  
  // Validate status transition
  if (!canTransitionBAStatus(ba.status as BAStatus, newStatus)) {
    return { error: `Invalid status transition from ${ba.status} to ${newStatus}` }
  }
  
  // Prepare update data
  const updateData: Record<string, unknown> = {
    status: newStatus,
    updated_at: new Date().toISOString(),
  }
  
  // If signed, set signed_at
  if (newStatus === 'signed') {
    updateData.signed_at = new Date().toISOString()
  }
  
  // Update BA status
  const { error: updateError } = await supabase
    .from('berita_acara')
    .update(updateData)
    .eq('id', id)
  
  if (updateError) {
    return { error: updateError.message }
  }
  
  // If signed, update JO has_berita_acara flag
  if (newStatus === 'signed') {
    const { error: joError } = await supabase
      .from('job_orders')
      .update({
        has_berita_acara: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', ba.jo_id)
    
    if (joError) {
      console.error('Error updating JO has_berita_acara:', joError)
    }
  }
  
  revalidatePath(`/job-orders/${ba.jo_id}`)
  return {}
}