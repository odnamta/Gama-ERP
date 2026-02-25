'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { WorkSchedule, WorkScheduleInput } from '@/types/attendance';
import { validateSchedule } from '@/lib/schedule-utils';

/**
 * Get all work schedules
 */
export async function getWorkSchedules(): Promise<{
  data: WorkSchedule[] | null;
  error: string | null;
}> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('work_schedules')
    .select('*')
    .order('is_default', { ascending: false })
    .order('schedule_name');

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as WorkSchedule[], error: null };
}

/**
 * Get default work schedule
 */
export async function getDefaultSchedule(): Promise<WorkSchedule | null> {
  const supabase = await createClient();

  const { data } = await supabase
    .from('work_schedules')
    .select('*')
    .eq('is_default', true)
    .eq('is_active', true)
    .single();

  return data as WorkSchedule | null;
}

/**
 * Get schedule by ID
 */
export async function getScheduleById(id: string): Promise<WorkSchedule | null> {
  const supabase = await createClient();

  const { data } = await supabase
    .from('work_schedules')
    .select('*')
    .eq('id', id)
    .single();

  return data as WorkSchedule | null;
}

/**
 * Get employee's work schedule (or default if not assigned)
 */
export async function getEmployeeSchedule(
  employeeId: string
): Promise<WorkSchedule | null> {
  const supabase = await createClient();

  // Get employee's schedule_id
  const { data: employee } = await supabase
    .from('employees')
    .select('schedule_id')
    .eq('id', employeeId)
    .single();

  if (employee?.schedule_id) {
    const { data: schedule } = await supabase
      .from('work_schedules')
      .select('*')
      .eq('id', employee.schedule_id)
      .eq('is_active', true)
      .single();

    if (schedule) return schedule as WorkSchedule;
  }

  // Return default schedule
  return getDefaultSchedule();
}

/**
 * Create or update work schedule
 */
export async function upsertWorkSchedule(
  data: WorkScheduleInput,
  id?: string
): Promise<{ success: boolean; schedule?: WorkSchedule; error?: string }> {
  const supabase = await createClient();

  // Validate schedule data
  const validation = validateSchedule(data);
  if (!validation.valid) {
    return { success: false, error: validation.errors.join(', ') };
  }

  const scheduleData = {
    schedule_name: data.schedule_name,
    work_start: data.work_start,
    work_end: data.work_end,
    break_start: data.break_start || null,
    break_end: data.break_end || null,
    late_grace_minutes: data.late_grace_minutes ?? 15,
    work_days: data.work_days ?? [1, 2, 3, 4, 5],
    is_default: data.is_default ?? false,
    is_active: data.is_active ?? true,
  };

  // If setting as default, unset other defaults first
  if (scheduleData.is_default) {
    await supabase
      .from('work_schedules')
      .update({ is_default: false })
      .neq('id', id || '');
  }

  let result;
  if (id) {
    // Update existing
    result = await supabase
      .from('work_schedules')
      .update(scheduleData)
      .eq('id', id)
      .select()
      .single();
  } else {
    // Create new
    result = await supabase
      .from('work_schedules')
      .insert(scheduleData)
      .select()
      .single();
  }

  if (result.error) {
    return { success: false, error: result.error.message };
  }

  revalidatePath('/hr/attendance/schedules');

  return { success: true, schedule: result.data as WorkSchedule };
}

/**
 * Set a schedule as the default
 */
export async function setDefaultSchedule(
  scheduleId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  // Unset all defaults
  await supabase
    .from('work_schedules')
    .update({ is_default: false })
    .neq('id', scheduleId);

  // Set new default
  const { error } = await supabase
    .from('work_schedules')
    .update({ is_default: true })
    .eq('id', scheduleId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/hr/attendance/schedules');

  return { success: true };
}

/**
 * Delete work schedule
 */
export async function deleteWorkSchedule(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  // Check if schedule is in use
  const { count } = await supabase
    .from('employees')
    .select('*', { count: 'exact', head: true })
    .eq('schedule_id', id);

  if (count && count > 0) {
    return {
      success: false,
      error: `Cannot delete schedule: ${count} employee(s) are using it`,
    };
  }

  // Check if it's the default
  const { data: schedule } = await supabase
    .from('work_schedules')
    .select('is_default')
    .eq('id', id)
    .single();

  if (schedule?.is_default) {
    return {
      success: false,
      error: 'Cannot delete the default schedule',
    };
  }

  const { error } = await supabase
    .from('work_schedules')
    .delete()
    .eq('id', id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/hr/attendance/schedules');

  return { success: true };
}

/**
 * Assign schedule to employee
 */
export async function assignScheduleToEmployee(
  employeeId: string,
  scheduleId: string | null
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('employees')
    .update({ schedule_id: scheduleId })
    .eq('id', employeeId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/hr/employees');

  return { success: true };
}
