'use server';

// =====================================================
// INCIDENT ANALYTICS ACTIONS: Statistics + Dashboard
// Split from incident-actions.ts
// =====================================================

import { createClient } from '@/lib/supabase/server';
import {
  Incident,
  IncidentStatistics,
  IncidentDashboardSummary,
  IncidentRow,
  IncidentPersonRow,
  transformIncidentRow,
  transformPersonRow,
} from '@/types/incident';
import {
  calculateDaysSinceLastLTI,
  calculateMonthlyTrend,
  countBySeverity,
  calculateTotalDaysLost,
  getOpenInvestigationsCount,
} from './incident-utils';

// Type helper for tables not yet in database.types.ts
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyTable = any;

// Helper function to bypass type checking for incident tables
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fromIncidentTable = (supabase: any, table: string) => supabase.from(table) as AnyTable;

// =====================================================
// STATISTICS FUNCTIONS
// =====================================================

/**
 * Get incident statistics for dashboard
 */
export async function getIncidentStatistics(
  year?: number,
  month?: number
): Promise<{ success: boolean; data?: IncidentStatistics; error?: string }> {
  try {
    const supabase = await createClient();

    const currentYear = year || new Date().getFullYear();
    const startDate = `${currentYear}-01-01`;
    const endDate = `${currentYear}-12-31`;

    // Get all incidents for the year
    const { data: incidents, error } = await fromIncidentTable(supabase, 'incidents')
      .select(`
        *,
        incident_persons (person_type, days_lost)
      `)
      .gte('incident_date', startDate)
      .lte('incident_date', endDate)
      .neq('status', 'rejected');

    if (error) {
      return { success: false, error: 'Failed to fetch statistics' };
    }

    // Transform incidents
    const transformedIncidents: Incident[] = (incidents || []).map((row: IncidentRow & { incident_persons?: IncidentPersonRow[] }) => {
      const incident = transformIncidentRow(row as IncidentRow);
      incident.persons = (row.incident_persons || []).map((p: IncidentPersonRow) =>
        transformPersonRow(p)
      );
      return incident;
    });

    // Filter by month if specified
    let filteredIncidents = transformedIncidents;
    if (month) {
      filteredIncidents = transformedIncidents.filter((inc) => {
        const incMonth = new Date(inc.incidentDate).getMonth() + 1;
        return incMonth === month;
      });
    }

    // Calculate statistics
    const totalIncidents = filteredIncidents.length;
    const nearMisses = filteredIncidents.filter((inc) => inc.incidentType === 'near_miss').length;
    const injuries = filteredIncidents.filter(
      (inc) => inc.incidentType === 'accident' && inc.persons?.some((p) => p.personType === 'injured')
    ).length;
    const daysLost = calculateTotalDaysLost(filteredIncidents);
    const openInvestigations = getOpenInvestigationsCount(filteredIncidents);
    const daysSinceLastLTI = calculateDaysSinceLastLTI(transformedIncidents);
    const bySeverity = countBySeverity(filteredIncidents);

    // Count by category
    const byCategory: Record<string, number> = {};
    filteredIncidents.forEach((inc) => {
      const key = inc.categoryName || inc.categoryId;
      byCategory[key] = (byCategory[key] || 0) + 1;
    });

    // Calculate monthly trend (last 6 months)
    const monthlyTrend = calculateMonthlyTrend(transformedIncidents, 6);

    return {
      success: true,
      data: {
        totalIncidents,
        nearMisses,
        injuries,
        daysLost,
        openInvestigations,
        daysSinceLastLTI,
        bySeverity,
        byCategory,
        monthlyTrend,
      },
    };
  } catch (error) {
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Get dashboard summary
 */
export async function getIncidentDashboardSummary(): Promise<{
  success: boolean;
  data?: IncidentDashboardSummary;
  error?: string;
}> {
  try {
    const supabase = await createClient();

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

    // Get open incidents count
    const { count: openIncidents } = await fromIncidentTable(supabase, 'incidents')
      .select('*', { count: 'exact', head: true })
      .in('status', ['reported', 'under_investigation', 'pending_actions']);

    // Get under investigation count
    const { count: underInvestigation } = await fromIncidentTable(supabase, 'incidents')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'under_investigation');

    // Get near misses MTD
    const { count: nearMissesMTD } = await fromIncidentTable(supabase, 'incidents')
      .select('*', { count: 'exact', head: true })
      .eq('incident_type', 'near_miss')
      .gte('incident_date', startOfMonth)
      .lte('incident_date', endOfMonth)
      .neq('status', 'rejected');

    // Get injuries MTD (accidents with injured persons)
    const { data: accidentsMTD } = await fromIncidentTable(supabase, 'incidents')
      .select(`
        id,
        incident_persons!inner (person_type)
      `)
      .eq('incident_type', 'accident')
      .gte('incident_date', startOfMonth)
      .lte('incident_date', endOfMonth)
      .neq('status', 'rejected');

    const injuriesMTD = (accidentsMTD || []).filter((inc: { incident_persons: { person_type: string }[] }) =>
      inc.incident_persons.some((p) => p.person_type === 'injured')
    ).length;

    // Get all incidents for LTI calculation
    const { data: allIncidents } = await fromIncidentTable(supabase, 'incidents')
      .select(`
        *,
        incident_persons (person_type, days_lost)
      `)
      .eq('incident_type', 'accident')
      .neq('status', 'rejected');

    const transformedIncidents: Incident[] = (allIncidents || []).map((row: IncidentRow & { incident_persons?: IncidentPersonRow[] }) => {
      const incident = transformIncidentRow(row as IncidentRow);
      incident.persons = (row.incident_persons || []).map((p: IncidentPersonRow) =>
        transformPersonRow(p)
      );
      return incident;
    });

    const daysSinceLastLTI = calculateDaysSinceLastLTI(transformedIncidents);

    return {
      success: true,
      data: {
        openIncidents: openIncidents || 0,
        underInvestigation: underInvestigation || 0,
        nearMissesMTD: nearMissesMTD || 0,
        injuriesMTD,
        daysSinceLastLTI,
      },
    };
  } catch (error) {
    return { success: false, error: 'An unexpected error occurred' };
  }
}
