'use server';

// =====================================================
// v0.54: CUSTOMS - FEE & DUTY TRACKING Server Actions
// =====================================================

import { createClient } from '@/lib/supabase/server';
import { getUserProfile } from '@/lib/permissions-server';
import { revalidatePath } from 'next/cache';
import {
  CustomsFeeType,
  CustomsFee,
  CustomsFeeWithRelations,
  ContainerTracking,
  ContainerTrackingWithRelations,
  CustomsFeeFormData,
  PaymentFormData,
  ContainerFormData,
  FeeFilters,
  ContainerFilters,
  FeeCategory,
  PaymentStatus,
  ContainerStatus,
  JobCustomsCostSummary,
  PendingCustomsPayment,
  FeeStatistics,
  ContainerStatistics,
} from '@/types/customs-fees';
import {
  validateFeeForm,
  validateContainerForm,
  calculateFreeTimeEnd,
  calculateStorageDays,
  calculateStorageFee,
} from '@/lib/fee-utils';
import { ActionResult } from '@/types/actions';

const FEE_WRITE_ROLES = ['owner', 'director', 'sysadmin', 'finance_manager', 'finance', 'administration'] as const;
const FEE_READ_ROLES = ['owner', 'director', 'sysadmin', 'finance_manager', 'finance', 'administration', 'customs', 'operations_manager'] as const;

// =====================================================
// Fee Type Actions
// =====================================================

export async function getFeeTypes(): Promise<CustomsFeeType[]> {
  const profile = await getUserProfile();
  if (!profile || !(FEE_READ_ROLES as readonly string[]).includes(profile.role)) {
    return [];
  }

  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('customs_fee_types')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  if (error) {
    return [];
  }

  return (data ?? []) as CustomsFeeType[];
}

export async function getFeeTypesByCategory(category: FeeCategory): Promise<CustomsFeeType[]> {
  const profile = await getUserProfile();
  if (!profile || !(FEE_READ_ROLES as readonly string[]).includes(profile.role)) {
    return [];
  }

  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('customs_fee_types')
    .select('*')
    .eq('is_active', true)
    .eq('fee_category', category)
    .order('display_order', { ascending: true });

  if (error) {
    return [];
  }

  return (data ?? []) as CustomsFeeType[];
}

// =====================================================
// Fee CRUD Actions
// =====================================================

export async function createFee(
  data: CustomsFeeFormData
): Promise<ActionResult<CustomsFee>> {
  const userProfile = await getUserProfile();
  if (!userProfile || !(FEE_WRITE_ROLES as readonly string[]).includes(userProfile.role)) {
    return { success: false, error: 'Unauthorized' };
  }

  const validation = validateFeeForm(data);
  if (!validation.valid) {
    return { success: false, error: validation.errors[0]?.message || 'Validation failed' };
  }

  const supabase = await createClient();
  
  // Get current user and profile
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('id')
    .eq('user_id', user?.id || '')
    .single();

  const insertData = {
    document_type: data.document_type,
    pib_id: data.document_type === 'pib' ? data.pib_id : null,
    peb_id: data.document_type === 'peb' ? data.peb_id : null,
    job_order_id: data.job_order_id || null,
    fee_type_id: data.fee_type_id,
    description: data.description || null,
    currency: data.currency,
    amount: data.amount,
    vendor_id: data.vendor_id || null,
    vendor_invoice_number: data.vendor_invoice_number || null,
    notes: data.notes || null,
    created_by: profile?.id || null,
  };

  const { data: fee, error } = await supabase
    .from('customs_fees')
    .insert(insertData)
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/customs/fees');
  return { success: true, data: fee as CustomsFee };
}

export async function updateFee(
  id: string,
  data: Partial<CustomsFeeFormData>
): Promise<ActionResult<void>> {
  const profile = await getUserProfile();
  if (!profile || !(FEE_WRITE_ROLES as readonly string[]).includes(profile.role)) {
    return { success: false, error: 'Unauthorized' };
  }

  const supabase = await createClient();

  const updateData: Record<string, unknown> = {};
  
  if (data.fee_type_id) updateData.fee_type_id = data.fee_type_id;
  if (data.description !== undefined) updateData.description = data.description || null;
  if (data.currency) updateData.currency = data.currency;
  if (data.amount !== undefined) updateData.amount = data.amount;
  if (data.vendor_id !== undefined) updateData.vendor_id = data.vendor_id || null;
  if (data.vendor_invoice_number !== undefined) updateData.vendor_invoice_number = data.vendor_invoice_number || null;
  if (data.notes !== undefined) updateData.notes = data.notes || null;
  if (data.job_order_id !== undefined) updateData.job_order_id = data.job_order_id || null;

  const { error } = await supabase
    .from('customs_fees')
    .update(updateData)
    .eq('id', id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/customs/fees');
  return { success: true, data: undefined as void };
}

export async function deleteFee(id: string): Promise<ActionResult<void>> {
  const profile = await getUserProfile();
  if (!profile || !(FEE_WRITE_ROLES as readonly string[]).includes(profile.role)) {
    return { success: false, error: 'Unauthorized' };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from('customs_fees')
    .delete()
    .eq('id', id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/customs/fees');
  return { success: true, data: undefined as void };
}

export async function getFee(id: string): Promise<CustomsFeeWithRelations | null> {
  const profile = await getUserProfile();
  if (!profile || !(FEE_READ_ROLES as readonly string[]).includes(profile.role)) {
    return null;
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('customs_fees')
    .select(`
      *,
      fee_type:customs_fee_types(*),
      pib:pib_documents(id, internal_ref),
      peb:peb_documents(id, internal_ref),
      job_order:job_orders(id, jo_number),
      vendor:vendors(id, vendor_name)
    `)
    .eq('id', id)
    .single();

  if (error) {
    return null;
  }

  return data as CustomsFeeWithRelations;
}

export async function getFees(filters?: FeeFilters): Promise<CustomsFeeWithRelations[]> {
  const profile = await getUserProfile();
  if (!profile || !(FEE_READ_ROLES as readonly string[]).includes(profile.role)) {
    return [];
  }

  const supabase = await createClient();

  let query = supabase
    .from('customs_fees')
    .select(`
      *,
      fee_type:customs_fee_types(*),
      pib:pib_documents(id, internal_ref),
      peb:peb_documents(id, internal_ref),
      job_order:job_orders(id, jo_number),
      vendor:vendors(id, vendor_name)
    `)
    .order('created_at', { ascending: false });

  if (filters?.document_type) {
    query = query.eq('document_type', filters.document_type);
  }

  if (filters?.payment_status) {
    query = query.eq('payment_status', filters.payment_status);
  }

  if (filters?.date_from) {
    query = query.gte('created_at', filters.date_from);
  }

  if (filters?.date_to) {
    query = query.lte('created_at', filters.date_to);
  }

  const { data, error } = await query;

  if (error) {
    return [];
  }

  return (data ?? []) as CustomsFeeWithRelations[];
}

export async function getFeesByDocument(
  documentType: 'pib' | 'peb',
  documentId: string
): Promise<CustomsFeeWithRelations[]> {
  const profile = await getUserProfile();
  if (!profile || !(FEE_READ_ROLES as readonly string[]).includes(profile.role)) {
    return [];
  }

  const supabase = await createClient();

  const column = documentType === 'pib' ? 'pib_id' : 'peb_id';

  const { data, error } = await supabase
    .from('customs_fees')
    .select(`
      *,
      fee_type:customs_fee_types(*),
      pib:pib_documents(id, internal_ref),
      peb:peb_documents(id, internal_ref),
      job_order:job_orders(id, jo_number),
      vendor:vendors(id, vendor_name)
    `)
    .eq(column, documentId)
    .order('created_at', { ascending: false });

  if (error) {
    return [];
  }

  return (data ?? []) as CustomsFeeWithRelations[];
}

export async function getFeesByJob(jobOrderId: string): Promise<CustomsFeeWithRelations[]> {
  const profile = await getUserProfile();
  if (!profile || !(FEE_READ_ROLES as readonly string[]).includes(profile.role)) {
    return [];
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('customs_fees')
    .select(`
      *,
      fee_type:customs_fee_types(*),
      pib:pib_documents(id, internal_ref),
      peb:peb_documents(id, internal_ref),
      job_order:job_orders(id, jo_number),
      vendor:vendors(id, vendor_name)
    `)
    .eq('job_order_id', jobOrderId)
    .order('created_at', { ascending: false });

  if (error) {
    return [];
  }

  return (data ?? []) as CustomsFeeWithRelations[];
}

// =====================================================
// Payment Actions
// =====================================================

export async function markFeePaid(
  id: string,
  data: PaymentFormData
): Promise<ActionResult<void>> {
  const profile = await getUserProfile();
  if (!profile || !(FEE_WRITE_ROLES as readonly string[]).includes(profile.role)) {
    return { success: false, error: 'Unauthorized' };
  }

  if (!data.payment_date) {
    return { success: false, error: 'Payment date is required' };
  }

  const supabase = await createClient();

  const updateData = {
    payment_status: 'paid' as PaymentStatus,
    payment_date: data.payment_date,
    payment_reference: data.payment_reference || null,
    payment_method: data.payment_method || null,
    ntpn: data.ntpn || null,
    ntb: data.ntb || null,
    billing_code: data.billing_code || null,
    receipt_url: data.receipt_url || null,
  };

  const { error } = await supabase
    .from('customs_fees')
    .update(updateData)
    .eq('id', id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/customs/fees');
  return { success: true, data: undefined as void };
}

export async function markFeeWaived(
  id: string,
  notes?: string
): Promise<ActionResult<void>> {
  const profile = await getUserProfile();
  if (!profile || !(FEE_WRITE_ROLES as readonly string[]).includes(profile.role)) {
    return { success: false, error: 'Unauthorized' };
  }

  const supabase = await createClient();

  const updateData: Record<string, unknown> = {
    payment_status: 'waived' as PaymentStatus,
  };

  if (notes) {
    updateData.notes = notes;
  }

  const { error } = await supabase
    .from('customs_fees')
    .update(updateData)
    .eq('id', id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/customs/fees');
  return { success: true, data: undefined as void };
}

export async function cancelFee(
  id: string,
  notes?: string
): Promise<ActionResult<void>> {
  const profile = await getUserProfile();
  if (!profile || !(FEE_WRITE_ROLES as readonly string[]).includes(profile.role)) {
    return { success: false, error: 'Unauthorized' };
  }

  const supabase = await createClient();

  const updateData: Record<string, unknown> = {
    payment_status: 'cancelled' as PaymentStatus,
  };

  if (notes) {
    updateData.notes = notes;
  }

  const { error } = await supabase
    .from('customs_fees')
    .update(updateData)
    .eq('id', id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/customs/fees');
  return { success: true, data: undefined as void };
}

// =====================================================
// Container CRUD Actions
// =====================================================

export async function createContainer(
  data: ContainerFormData
): Promise<ActionResult<ContainerTracking>> {
  const profile = await getUserProfile();
  if (!profile || !(FEE_WRITE_ROLES as readonly string[]).includes(profile.role)) {
    return { success: false, error: 'Unauthorized' };
  }

  const validation = validateContainerForm(data);
  if (!validation.valid) {
    return { success: false, error: validation.errors[0]?.message || 'Validation failed' };
  }

  const supabase = await createClient();

  // Calculate free_time_end if arrival_date is provided
  let freeTimeEnd: string | null = null;
  if (data.arrival_date) {
    freeTimeEnd = calculateFreeTimeEnd(data.arrival_date, data.free_time_days);
  }

  const insertData = {
    pib_id: data.pib_id || null,
    peb_id: data.peb_id || null,
    job_order_id: data.job_order_id || null,
    container_number: data.container_number,
    container_size: data.container_size || null,
    container_type: data.container_type || null,
    seal_number: data.seal_number || null,
    terminal: data.terminal || null,
    arrival_date: data.arrival_date || null,
    free_time_days: data.free_time_days,
    free_time_end: freeTimeEnd,
    daily_rate: data.daily_rate || null,
  };

  const { data: container, error } = await supabase
    .from('container_tracking')
    .insert(insertData)
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/customs/containers');
  return { success: true, data: container as ContainerTracking };
}

export async function updateContainer(
  id: string,
  data: Partial<ContainerFormData>
): Promise<ActionResult<void>> {
  const profile = await getUserProfile();
  if (!profile || !(FEE_WRITE_ROLES as readonly string[]).includes(profile.role)) {
    return { success: false, error: 'Unauthorized' };
  }

  const supabase = await createClient();

  // First get current container to check if we need to recalculate free_time_end
  const { data: current } = await supabase
    .from('container_tracking')
    .select('arrival_date, free_time_days')
    .eq('id', id)
    .single();

  const updateData: Record<string, unknown> = {};
  
  if (data.container_number) updateData.container_number = data.container_number;
  if (data.container_size !== undefined) updateData.container_size = data.container_size || null;
  if (data.container_type !== undefined) updateData.container_type = data.container_type || null;
  if (data.seal_number !== undefined) updateData.seal_number = data.seal_number || null;
  if (data.terminal !== undefined) updateData.terminal = data.terminal || null;
  if (data.arrival_date !== undefined) updateData.arrival_date = data.arrival_date || null;
  if (data.free_time_days !== undefined) updateData.free_time_days = data.free_time_days;
  if (data.daily_rate !== undefined) updateData.daily_rate = data.daily_rate || null;
  if (data.pib_id !== undefined) updateData.pib_id = data.pib_id || null;
  if (data.peb_id !== undefined) updateData.peb_id = data.peb_id || null;
  if (data.job_order_id !== undefined) updateData.job_order_id = data.job_order_id || null;

  // Recalculate free_time_end if arrival_date or free_time_days changed
  const arrivalDate = data.arrival_date !== undefined ? data.arrival_date : current?.arrival_date;
  const freeTimeDays = data.free_time_days !== undefined ? data.free_time_days : current?.free_time_days;
  
  if (arrivalDate && freeTimeDays !== undefined) {
    updateData.free_time_end = calculateFreeTimeEnd(arrivalDate, freeTimeDays ?? 0);
  }

  const { error } = await supabase
    .from('container_tracking')
    .update(updateData)
    .eq('id', id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/customs/containers');
  return { success: true, data: undefined as void };
}

export async function deleteContainer(id: string): Promise<ActionResult<void>> {
  const profile = await getUserProfile();
  if (!profile || !(FEE_WRITE_ROLES as readonly string[]).includes(profile.role)) {
    return { success: false, error: 'Unauthorized' };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from('container_tracking')
    .delete()
    .eq('id', id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/customs/containers');
  return { success: true, data: undefined as void };
}

export async function getContainer(id: string): Promise<ContainerTrackingWithRelations | null> {
  const profile = await getUserProfile();
  if (!profile || !(FEE_READ_ROLES as readonly string[]).includes(profile.role)) {
    return null;
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('container_tracking')
    .select(`
      *,
      pib:pib_documents(id, internal_ref),
      peb:peb_documents(id, internal_ref),
      job_order:job_orders(id, jo_number)
    `)
    .eq('id', id)
    .single();

  if (error) {
    return null;
  }

  return data as ContainerTrackingWithRelations;
}

export async function getContainers(filters?: ContainerFilters): Promise<ContainerTrackingWithRelations[]> {
  const profile = await getUserProfile();
  if (!profile || !(FEE_READ_ROLES as readonly string[]).includes(profile.role)) {
    return [];
  }

  const supabase = await createClient();

  let query = supabase
    .from('container_tracking')
    .select(`
      *,
      pib:pib_documents(id, internal_ref),
      peb:peb_documents(id, internal_ref),
      job_order:job_orders(id, jo_number)
    `)
    .order('created_at', { ascending: false });

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  const { data, error } = await query;

  if (error) {
    return [];
  }

  return (data ?? []) as ContainerTrackingWithRelations[];
}

export async function getContainersByDocument(
  documentType: 'pib' | 'peb',
  documentId: string
): Promise<ContainerTrackingWithRelations[]> {
  const profile = await getUserProfile();
  if (!profile || !(FEE_READ_ROLES as readonly string[]).includes(profile.role)) {
    return [];
  }

  const supabase = await createClient();

  const column = documentType === 'pib' ? 'pib_id' : 'peb_id';

  const { data, error } = await supabase
    .from('container_tracking')
    .select(`
      *,
      pib:pib_documents(id, internal_ref),
      peb:peb_documents(id, internal_ref),
      job_order:job_orders(id, jo_number)
    `)
    .eq(column, documentId)
    .order('created_at', { ascending: false });

  if (error) {
    return [];
  }

  return (data ?? []) as ContainerTrackingWithRelations[];
}

// =====================================================
// Container Status Actions
// =====================================================

export async function updateContainerStatus(
  id: string,
  status: ContainerStatus,
  gateOutDate?: string
): Promise<ActionResult<void>> {
  const profile = await getUserProfile();
  if (!profile || !(FEE_WRITE_ROLES as readonly string[]).includes(profile.role)) {
    return { success: false, error: 'Unauthorized' };
  }

  const supabase = await createClient();

  const updateData: Record<string, unknown> = { status };

  if (gateOutDate) {
    updateData.gate_out_date = gateOutDate;
  }

  const { error } = await supabase
    .from('container_tracking')
    .update(updateData)
    .eq('id', id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/customs/containers');
  return { success: true, data: undefined as void };
}

export async function calculateContainerStorage(
  id: string
): Promise<ActionResult<{ storageDays: number; totalFee: number }>> {
  const profile = await getUserProfile();
  if (!profile || !(FEE_WRITE_ROLES as readonly string[]).includes(profile.role)) {
    return { success: false, error: 'Unauthorized' };
  }

  const supabase = await createClient();

  // Get container data
  const { data: container, error: fetchError } = await supabase
    .from('container_tracking')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchError || !container) {
    return { success: false, error: 'Container not found' };
  }

  if (!container.free_time_end || !container.gate_out_date) {
    return { success: false, error: 'Free time end and gate out date are required' };
  }

  const storageDays = calculateStorageDays(container.free_time_end, container.gate_out_date);
  const totalFee = container.daily_rate ? calculateStorageFee(storageDays, container.daily_rate) : 0;

  // Update container with calculated values
  const { error: updateError } = await supabase
    .from('container_tracking')
    .update({
      storage_days: storageDays,
      total_storage_fee: totalFee,
    })
    .eq('id', id);

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  revalidatePath('/customs/containers');
  return { success: true, data: { storageDays, totalFee } };
}

// =====================================================
// Summary Actions
// =====================================================

export async function getJobCustomsCosts(jobOrderId: string): Promise<JobCustomsCostSummary | null> {
  const profile = await getUserProfile();
  if (!profile || !(FEE_READ_ROLES as readonly string[]).includes(profile.role)) {
    return null;
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('job_customs_costs')
    .select('*')
    .eq('job_order_id', jobOrderId)
    .single();

  if (error) {
    return null;
  }

  return data as JobCustomsCostSummary;
}

export async function getAllJobCustomsCosts(): Promise<JobCustomsCostSummary[]> {
  const profile = await getUserProfile();
  if (!profile || !(FEE_READ_ROLES as readonly string[]).includes(profile.role)) {
    return [];
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('job_customs_costs')
    .select('*')
    .gt('total_customs_cost', 0)
    .order('total_customs_cost', { ascending: false });

  if (error) {
    return [];
  }

  return (data ?? []) as JobCustomsCostSummary[];
}

export async function getPendingPayments(): Promise<PendingCustomsPayment[]> {
  const profile = await getUserProfile();
  if (!profile || !(FEE_READ_ROLES as readonly string[]).includes(profile.role)) {
    return [];
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('pending_customs_payments')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    return [];
  }

  return (data ?? []) as PendingCustomsPayment[];
}

export async function getFeeStatistics(): Promise<FeeStatistics> {
  const profile = await getUserProfile();
  if (!profile || !(FEE_READ_ROLES as readonly string[]).includes(profile.role)) {
    return {
      total_fees: 0,
      total_pending: 0,
      total_paid: 0,
      pending_amount: 0,
      paid_amount: 0,
    };
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('customs_fees')
    .select('payment_status, amount');

  if (error) {
    return {
      total_fees: 0,
      total_pending: 0,
      total_paid: 0,
      pending_amount: 0,
      paid_amount: 0,
    };
  }

  const fees = data || [];
  const pending = fees.filter((f) => f.payment_status === 'pending');
  const paid = fees.filter((f) => f.payment_status === 'paid');

  return {
    total_fees: fees.length,
    total_pending: pending.length,
    total_paid: paid.length,
    pending_amount: pending.reduce((sum, f) => sum + (f.amount || 0), 0),
    paid_amount: paid.reduce((sum, f) => sum + (f.amount || 0), 0),
  };
}

export async function getContainerStatistics(): Promise<ContainerStatistics> {
  const profile = await getUserProfile();
  if (!profile || !(FEE_READ_ROLES as readonly string[]).includes(profile.role)) {
    return {
      total_containers: 0,
      at_port: 0,
      past_free_time: 0,
      total_demurrage: 0,
    };
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('container_tracking')
    .select('status, free_time_end, total_storage_fee');

  if (error) {
    return {
      total_containers: 0,
      at_port: 0,
      past_free_time: 0,
      total_demurrage: 0,
    };
  }

  const containers = data || [];
  const atPort = containers.filter((c) => c.status === 'at_port');
  const today = new Date().toISOString().split('T')[0];
  const pastFreeTime = atPort.filter((c) => c.free_time_end && c.free_time_end < today);
  const totalDemurrage = containers.reduce((sum, c) => sum + (c.total_storage_fee || 0), 0);

  return {
    total_containers: containers.length,
    at_port: atPort.length,
    past_free_time: pastFreeTime.length,
    total_demurrage: totalDemurrage,
  };
}

// =====================================================
// Helper Actions for Dropdowns
// =====================================================

export async function getPIBDocuments(): Promise<{ id: string; internal_ref: string }[]> {
  const profile = await getUserProfile();
  if (!profile || !(FEE_READ_ROLES as readonly string[]).includes(profile.role)) {
    return [];
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('pib_documents')
    .select('id, internal_ref')
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    return [];
  }

  return data || [];
}

export async function getPEBDocuments(): Promise<{ id: string; internal_ref: string }[]> {
  const profile = await getUserProfile();
  if (!profile || !(FEE_READ_ROLES as readonly string[]).includes(profile.role)) {
    return [];
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('peb_documents')
    .select('id, internal_ref')
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    return [];
  }

  return data || [];
}

export async function getJobOrders(): Promise<{ id: string; jo_number: string }[]> {
  const profile = await getUserProfile();
  if (!profile || !(FEE_READ_ROLES as readonly string[]).includes(profile.role)) {
    return [];
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('job_orders')
    .select('id, jo_number')
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    return [];
  }

  return data || [];
}

export async function getVendors(): Promise<{ id: string; vendor_name: string }[]> {
  const profile = await getUserProfile();
  if (!profile || !(FEE_READ_ROLES as readonly string[]).includes(profile.role)) {
    return [];
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('vendors')
    .select('id, vendor_name')
    .eq('is_active', true)
    .order('vendor_name', { ascending: true });

  if (error) {
    return [];
  }

  return data || [];
}
