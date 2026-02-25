'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import {
  ManpowerCostSummary,
  ManpowerCostWithDepartment,
  ManpowerCostTrendPoint,
  DepartmentCostPercentage,
} from '@/types/manpower-cost';
import {
  calculateTotalRow,
  calculateDepartmentPercentages,
  getLastNMonths,
  getMonthAbbreviation,
  validatePeriod,
  generateExportFilename,
} from '@/lib/manpower-cost-utils';

// Database row types for new tables (not yet in generated types)
interface ManpowerCostSummaryRow {
  id: string;
  department_id: string;
  period_year: number;
  period_month: number;
  employee_count: number | null;
  total_base_salary: number | null;
  total_allowances: number | null;
  total_overtime: number | null;
  total_gross: number | null;
  total_deductions: number | null;
  total_net: number | null;
  total_company_contributions: number | null;
  total_company_cost: number | null;
  avg_salary: number | null;
  cost_per_employee: number | null;
  calculated_at: string | null;
  created_at: string | null;
  department?: {
    id: string;
    department_name: string;
  } | null;
}

interface PayrollPeriodRow {
  period_year: number;
  period_month: number;
  period_name: string;
}

// ============================================
// Manpower Cost Summary
// ============================================

/**
 * Refresh manpower cost summary for a period
 */
export async function refreshManpowerCostSummary(
  year: number,
  month: number
): Promise<{ success: boolean; error?: string }> {
  if (!validatePeriod(year, month)) {
    return { success: false, error: 'Invalid year or month' };
  }

  const supabase = await createClient();
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.rpc as any)('refresh_manpower_cost_summary', {
    p_year: year,
    p_month: month,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/hr/manpower-cost');
  return { success: true };
}


/**
 * Get manpower cost summary for a period with department details
 */
export async function getManpowerCostSummary(
  year: number,
  month: number
): Promise<ManpowerCostWithDepartment[]> {
  if (!validatePeriod(year, month)) {
    return [];
  }

  const supabase = await createClient();
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('manpower_cost_summary')
    .select(`
      *,
      department:departments(id, department_name)
    `)
    .eq('period_year', year)
    .eq('period_month', month)
    .order('total_company_cost', { ascending: false });

  if (error) {
    return [];
  }

  return ((data || []) as ManpowerCostSummaryRow[]).map(item => ({
    id: item.id,
    department_id: item.department_id,
    period_year: item.period_year,
    period_month: item.period_month,
    employee_count: item.employee_count || 0,
    total_base_salary: item.total_base_salary || 0,
    total_allowances: item.total_allowances || 0,
    total_overtime: item.total_overtime || 0,
    total_gross: item.total_gross || 0,
    total_deductions: item.total_deductions || 0,
    total_net: item.total_net || 0,
    total_company_contributions: item.total_company_contributions || 0,
    total_company_cost: item.total_company_cost || 0,
    avg_salary: item.avg_salary || 0,
    cost_per_employee: item.cost_per_employee || 0,
    calculated_at: item.calculated_at,
    created_at: item.created_at || new Date().toISOString(),
    department: {
      id: item.department?.id || item.department_id,
      name: item.department?.department_name || 'Unknown',
    },
  }));
}

/**
 * Get total company cost for a period
 */
export async function getTotalCompanyCost(
  year: number,
  month: number
): Promise<number> {
  const summaries = await getManpowerCostSummary(year, month);
  const totals = calculateTotalRow(summaries);
  return totals.total_company_cost;
}

/**
 * Get cost trend data for last N months
 */
export async function getCostTrendData(
  endYear: number,
  endMonth: number,
  months: number = 6
): Promise<ManpowerCostTrendPoint[]> {
  if (!validatePeriod(endYear, endMonth)) {
    return [];
  }

  const supabase = await createClient();
  const periods = getLastNMonths(endYear, endMonth, months);
  
  const trendData: ManpowerCostTrendPoint[] = [];

  for (const period of periods) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('manpower_cost_summary')
      .select('total_company_cost')
      .eq('period_year', period.year)
      .eq('period_month', period.month);

    if (error) {
      continue;
    }

    const totalCost = (data || []).reduce(
      (sum: number, item: { total_company_cost: number | null }) => 
        sum + (item.total_company_cost || 0),
      0
    );

    trendData.push({
      period_year: period.year,
      period_month: period.month,
      month_label: getMonthAbbreviation(period.month),
      total_company_cost: totalCost,
    });
  }

  return trendData;
}

/**
 * Get department cost percentages for chart
 */
export async function getDepartmentCostPercentages(
  year: number,
  month: number
): Promise<DepartmentCostPercentage[]> {
  const summaries = await getManpowerCostSummary(year, month);
  return calculateDepartmentPercentages(summaries);
}

/**
 * Get manpower cost for overhead allocation
 */
export async function getManpowerCostForOverhead(
  year: number,
  month: number
): Promise<ManpowerCostSummary[]> {
  if (!validatePeriod(year, month)) {
    return [];
  }

  const supabase = await createClient();
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('manpower_cost_summary')
    .select('*')
    .eq('period_year', year)
    .eq('period_month', month);

  if (error) {
    return [];
  }

  return ((data || []) as ManpowerCostSummaryRow[]).map(item => ({
    id: item.id,
    department_id: item.department_id,
    period_year: item.period_year,
    period_month: item.period_month,
    employee_count: item.employee_count || 0,
    total_base_salary: item.total_base_salary || 0,
    total_allowances: item.total_allowances || 0,
    total_overtime: item.total_overtime || 0,
    total_gross: item.total_gross || 0,
    total_deductions: item.total_deductions || 0,
    total_net: item.total_net || 0,
    total_company_contributions: item.total_company_contributions || 0,
    total_company_cost: item.total_company_cost || 0,
    avg_salary: item.avg_salary || 0,
    cost_per_employee: item.cost_per_employee || 0,
    calculated_at: item.calculated_at,
    created_at: item.created_at || new Date().toISOString(),
  }));
}


// ============================================
// Dashboard Data
// ============================================

/**
 * Get all dashboard data in a single call
 */
export async function getManpowerCostDashboardData(
  year: number,
  month: number
): Promise<{
  summaries: ManpowerCostWithDepartment[];
  totalCompanyCost: number;
  percentages: DepartmentCostPercentage[];
  trendData: ManpowerCostTrendPoint[];
}> {
  const summaries = await getManpowerCostSummary(year, month);
  const totals = calculateTotalRow(summaries);
  const percentages = calculateDepartmentPercentages(summaries);
  const trendData = await getCostTrendData(year, month, 6);

  return {
    summaries,
    totalCompanyCost: totals.total_company_cost,
    percentages,
    trendData,
  };
}

// ============================================
// Export
// ============================================

/**
 * Get export data for Excel download
 */
export async function getManpowerCostExportData(
  year: number,
  month: number
): Promise<{
  success: boolean;
  data?: {
    rows: Array<{
      department: string;
      employee_count: number;
      base_salary: number;
      allowances: number;
      overtime: number;
      gross_salary: number;
      deductions: number;
      net_salary: number;
      company_contributions: number;
      total_company_cost: number;
      avg_salary: number;
      cost_per_employee: number;
    }>;
    totals: {
      employee_count: number;
      base_salary: number;
      allowances: number;
      overtime: number;
      gross_salary: number;
      deductions: number;
      net_salary: number;
      company_contributions: number;
      total_company_cost: number;
      avg_salary: number;
      cost_per_employee: number;
    };
    filename: string;
  };
  error?: string;
}> {
  if (!validatePeriod(year, month)) {
    return { success: false, error: 'Invalid year or month' };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('user_id', user.id)
    .single();

  const allowedRoles = ['finance', 'director', 'sysadmin', 'owner', 'marketing_manager', 'finance_manager', 'operations_manager'];
  const userRole = (profile as { role: string } | null)?.role;
  if (!userRole || !allowedRoles.includes(userRole)) {
    return { success: false, error: 'You do not have permission to export data' };
  }

  const summaries = await getManpowerCostSummary(year, month);
  
  if (summaries.length === 0) {
    return { success: false, error: 'No data found for the specified period' };
  }

  const rows = summaries.map(s => ({
    department: s.department?.name || 'Unknown',
    employee_count: s.employee_count,
    base_salary: s.total_base_salary,
    allowances: s.total_allowances,
    overtime: s.total_overtime,
    gross_salary: s.total_gross,
    deductions: s.total_deductions,
    net_salary: s.total_net,
    company_contributions: s.total_company_contributions,
    total_company_cost: s.total_company_cost,
    avg_salary: s.avg_salary,
    cost_per_employee: s.cost_per_employee,
  }));

  const totals = calculateTotalRow(summaries);

  return {
    success: true,
    data: {
      rows,
      totals: {
        employee_count: totals.employee_count,
        base_salary: totals.total_base_salary,
        allowances: totals.total_allowances,
        overtime: totals.total_overtime,
        gross_salary: totals.total_gross,
        deductions: totals.total_deductions,
        net_salary: totals.total_net,
        company_contributions: totals.total_company_contributions,
        total_company_cost: totals.total_company_cost,
        avg_salary: totals.avg_salary,
        cost_per_employee: totals.cost_per_employee,
      },
      filename: generateExportFilename(year, month),
    },
  };
}

// ============================================
// Available Periods
// ============================================

/**
 * Get list of available periods (from payroll_periods)
 */
export async function getAvailablePeriods(): Promise<Array<{ year: number; month: number; name: string }>> {
  const supabase = await createClient();
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('payroll_periods')
    .select('period_year, period_month, period_name')
    .order('period_year', { ascending: false })
    .order('period_month', { ascending: false });

  if (error) {
    return [];
  }

  return ((data || []) as PayrollPeriodRow[]).map(p => ({
    year: p.period_year,
    month: p.period_month,
    name: p.period_name,
  }));
}
