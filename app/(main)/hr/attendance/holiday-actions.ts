'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { Holiday, HolidayInput } from '@/types/attendance';
import { validateHoliday } from '@/lib/holiday-utils';

/**
 * Get holidays for a date range
 */
export async function getHolidays(
  startDate?: string,
  endDate?: string
): Promise<{ data: Holiday[] | null; error: string | null }> {
  const supabase = await createClient();

  let query = supabase
    .from('holidays')
    .select('*')
    .order('holiday_date');

  if (startDate) {
    query = query.gte('holiday_date', startDate);
  }
  if (endDate) {
    query = query.lte('holiday_date', endDate);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching holidays:', error);
    return { data: null, error: error.message };
  }

  return { data: data as Holiday[], error: null };
}

/**
 * Get holidays for a specific month
 */
export async function getHolidaysForMonth(
  year: number,
  month: number
): Promise<{ data: Holiday[] | null; error: string | null }> {
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const endDate = new Date(year, month, 0).toISOString().split('T')[0];

  return getHolidays(startDate, endDate);
}

/**
 * Get holiday by ID
 */
export async function getHolidayById(id: string): Promise<Holiday | null> {
  const supabase = await createClient();

  const { data } = await supabase
    .from('holidays')
    .select('*')
    .eq('id', id)
    .single();

  return data as Holiday | null;
}

/**
 * Check if a date is a holiday
 */
export async function isHolidayDate(date: string): Promise<boolean> {
  const supabase = await createClient();

  const { data } = await supabase
    .from('holidays')
    .select('id')
    .eq('holiday_date', date)
    .single();

  return !!data;
}

/**
 * Create a new holiday
 */
export async function createHoliday(
  data: HolidayInput
): Promise<{ success: boolean; holiday?: Holiday; error?: string }> {
  const supabase = await createClient();

  // Validate holiday data
  const validation = validateHoliday(data);
  if (!validation.valid) {
    return { success: false, error: validation.errors.join(', ') };
  }

  // Check for duplicate date
  const { data: existing } = await supabase
    .from('holidays')
    .select('id')
    .eq('holiday_date', data.holiday_date)
    .single();

  if (existing) {
    return { success: false, error: 'A holiday already exists for this date' };
  }

  const holidayData = {
    holiday_date: data.holiday_date,
    holiday_name: data.holiday_name,
    is_national: data.is_national ?? true,
    is_company: data.is_company ?? false,
  };

  const { data: holiday, error } = await supabase
    .from('holidays')
    .insert(holidayData)
    .select()
    .single();

  if (error) {
    console.error('Error creating holiday:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/hr/attendance/holidays');
  revalidatePath('/hr/attendance');
  revalidatePath('/hr/my-attendance');

  return { success: true, holiday: holiday as Holiday };
}

/**
 * Update an existing holiday
 */
export async function updateHoliday(
  id: string,
  data: HolidayInput
): Promise<{ success: boolean; holiday?: Holiday; error?: string }> {
  const supabase = await createClient();

  // Validate holiday data
  const validation = validateHoliday(data);
  if (!validation.valid) {
    return { success: false, error: validation.errors.join(', ') };
  }

  // Check for duplicate date (excluding current record)
  const { data: existing } = await supabase
    .from('holidays')
    .select('id')
    .eq('holiday_date', data.holiday_date)
    .neq('id', id)
    .single();

  if (existing) {
    return { success: false, error: 'A holiday already exists for this date' };
  }

  const holidayData = {
    holiday_date: data.holiday_date,
    holiday_name: data.holiday_name,
    is_national: data.is_national ?? true,
    is_company: data.is_company ?? false,
  };

  const { data: holiday, error } = await supabase
    .from('holidays')
    .update(holidayData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating holiday:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/hr/attendance/holidays');
  revalidatePath('/hr/attendance');
  revalidatePath('/hr/my-attendance');

  return { success: true, holiday: holiday as Holiday };
}

/**
 * Delete a holiday
 */
export async function deleteHoliday(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('holidays')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting holiday:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/hr/attendance/holidays');
  revalidatePath('/hr/attendance');
  revalidatePath('/hr/my-attendance');

  return { success: true };
}

/**
 * Get upcoming holidays
 */
export async function getUpcomingHolidays(
  limit: number = 5
): Promise<{ data: Holiday[] | null; error: string | null }> {
  const supabase = await createClient();
  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('holidays')
    .select('*')
    .gte('holiday_date', today)
    .order('holiday_date')
    .limit(limit);

  if (error) {
    console.error('Error fetching upcoming holidays:', error);
    return { data: null, error: error.message };
  }

  return { data: data as Holiday[], error: null };
}
