'use server';

// =====================================================
// v0.74: AGENCY - VESSEL TRACKING & SCHEDULES SERVER ACTIONS
// =====================================================

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import {
  Vessel,
  VesselRow,
  VesselFormData,
  VesselFilters,
  VesselSchedule,
  VesselScheduleRow,
  ScheduleFormData,
  ScheduleFilters,
  UpcomingArrival,
  UpcomingArrivalRow,
  ArrivalFilters,
  VesselPositionRecord,
  VesselPositionRow,
  PositionFormData,
  VesselPosition,
  ShipmentTracking,
  ShipmentTrackingRow,
  TrackingEventFormData,
  TrackingSearchParams,
  TrackingSearchResult,
  TrackingSubscription,
  TrackingSubscriptionRow,
  SubscriptionFormData,
  TrackingType,
} from '@/types/agency';
import {
  rowToVessel,
  rowToSchedule,
  rowToUpcomingArrival,
  rowToPosition,
  rowToTracking,
  rowToSubscription,
  validateIMO,
  validateMMSI,
  validateCoordinates,
  validateNavigationData,
  validateContainerNumber,
  calculateDelayHours,
  sortTrackingEventsByTimestamp,
} from '@/lib/vessel-tracking-utils';

// =====================================================
// ACTION RESULT TYPE
// =====================================================

interface ActionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Type assertion helper for Supabase client
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseAny = any;

// =====================================================
// VESSEL CRUD OPERATIONS
// =====================================================

/**
 * Create a new Vessel
 * Validates IMO and MMSI uniqueness per Requirements 1.4, 1.5
 * @param data - Vessel form data
 * @returns ActionResult with created Vessel or error
 * 
 * **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 1.6**
 */
export async function createVessel(data: VesselFormData): Promise<ActionResult<Vessel>> {
  try {
    // Validate required fields
    if (!data.vesselName?.trim()) {
      return { success: false, error: 'Vessel name is required' };
    }

    // Validate IMO format if provided
    if (data.imoNumber) {
      const imoValidation = validateIMO(data.imoNumber);
      if (!imoValidation.isValid) {
        return { success: false, error: imoValidation.errors[0]?.message || 'Invalid IMO number' };
      }
    }

    // Validate MMSI format if provided
    if (data.mmsi) {
      const mmsiValidation = validateMMSI(data.mmsi);
      if (!mmsiValidation.isValid) {
        return { success: false, error: mmsiValidation.errors[0]?.message || 'Invalid MMSI' };
      }
    }

    const supabase = await createClient();

    // Check IMO uniqueness if provided (Requirement 1.4)
    if (data.imoNumber) {
      const { data: existingIMO } = await (supabase as SupabaseAny)
        .from('vessels')
        .select('id')
        .eq('imo_number', data.imoNumber)
        .maybeSingle();

      if (existingIMO) {
        return { success: false, error: 'A vessel with this IMO number already exists' };
      }
    }

    // Check MMSI uniqueness if provided (Requirement 1.5)
    if (data.mmsi) {
      const { data: existingMMSI } = await (supabase as SupabaseAny)
        .from('vessels')
        .select('id')
        .eq('mmsi', data.mmsi)
        .maybeSingle();

      if (existingMMSI) {
        return { success: false, error: 'A vessel with this MMSI already exists' };
      }
    }

    const insertData = {
      imo_number: data.imoNumber || null,
      mmsi: data.mmsi || null,
      vessel_name: data.vesselName,
      vessel_type: data.vesselType || null,
      flag: data.flag || null,
      call_sign: data.callSign || null,
      length_m: data.lengthM || null,
      beam_m: data.beamM || null,
      draft_m: data.draftM || null,
      gross_tonnage: data.grossTonnage || null,
      deadweight_tons: data.deadweightTons || null,
      teu_capacity: data.teuCapacity || null,
      owner: data.owner || null,
      operator: data.operator || null,
      shipping_line_id: data.shippingLineId || null,
      current_status: data.currentStatus || null,
      last_port: data.lastPort || null,
      next_port: data.nextPort || null,
      is_active: true,
    };

    const { data: result, error } = await (supabase as SupabaseAny)
      .from('vessels')
      .insert(insertData)
      .select(`
        *,
        shipping_lines:shipping_line_id(id, line_name, line_code)
      `)
      .single();

    if (error) throw error;

    revalidatePath('/agency/vessels');
    return { success: true, data: rowToVessel(result as VesselRow) };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to create vessel' };
  }
}

/**
 * Update an existing Vessel
 * Validates IMO and MMSI uniqueness per Requirements 1.4, 1.5
 * @param id - Vessel ID
 * @param data - Partial vessel form data to update
 * @returns ActionResult with updated Vessel or error
 * 
 * **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 1.6**
 */
export async function updateVessel(id: string, data: Partial<VesselFormData>): Promise<ActionResult<Vessel>> {
  try {
    const supabase = await createClient();

    // Check if vessel exists
    const { data: existing } = await (supabase as SupabaseAny)
      .from('vessels')
      .select('id, imo_number, mmsi')
      .eq('id', id)
      .single();

    if (!existing) {
      return { success: false, error: 'Vessel not found' };
    }

    // Validate IMO format if provided
    if (data.imoNumber !== undefined && data.imoNumber) {
      const imoValidation = validateIMO(data.imoNumber);
      if (!imoValidation.isValid) {
        return { success: false, error: imoValidation.errors[0]?.message || 'Invalid IMO number' };
      }

      // Check IMO uniqueness if changed (Requirement 1.4)
      if (data.imoNumber !== existing.imo_number) {
        const { data: existingIMO } = await (supabase as SupabaseAny)
          .from('vessels')
          .select('id')
          .eq('imo_number', data.imoNumber)
          .neq('id', id)
          .maybeSingle();

        if (existingIMO) {
          return { success: false, error: 'A vessel with this IMO number already exists' };
        }
      }
    }

    // Validate MMSI format if provided
    if (data.mmsi !== undefined && data.mmsi) {
      const mmsiValidation = validateMMSI(data.mmsi);
      if (!mmsiValidation.isValid) {
        return { success: false, error: mmsiValidation.errors[0]?.message || 'Invalid MMSI' };
      }

      // Check MMSI uniqueness if changed (Requirement 1.5)
      if (data.mmsi !== existing.mmsi) {
        const { data: existingMMSI } = await (supabase as SupabaseAny)
          .from('vessels')
          .select('id')
          .eq('mmsi', data.mmsi)
          .neq('id', id)
          .maybeSingle();

        if (existingMMSI) {
          return { success: false, error: 'A vessel with this MMSI already exists' };
        }
      }
    }

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    // Only update fields that are provided
    if (data.imoNumber !== undefined) updateData.imo_number = data.imoNumber || null;
    if (data.mmsi !== undefined) updateData.mmsi = data.mmsi || null;
    if (data.vesselName !== undefined) updateData.vessel_name = data.vesselName;
    if (data.vesselType !== undefined) updateData.vessel_type = data.vesselType || null;
    if (data.flag !== undefined) updateData.flag = data.flag || null;
    if (data.callSign !== undefined) updateData.call_sign = data.callSign || null;
    if (data.lengthM !== undefined) updateData.length_m = data.lengthM || null;
    if (data.beamM !== undefined) updateData.beam_m = data.beamM || null;
    if (data.draftM !== undefined) updateData.draft_m = data.draftM || null;
    if (data.grossTonnage !== undefined) updateData.gross_tonnage = data.grossTonnage || null;
    if (data.deadweightTons !== undefined) updateData.deadweight_tons = data.deadweightTons || null;
    if (data.teuCapacity !== undefined) updateData.teu_capacity = data.teuCapacity || null;
    if (data.owner !== undefined) updateData.owner = data.owner || null;
    if (data.operator !== undefined) updateData.operator = data.operator || null;
    if (data.shippingLineId !== undefined) updateData.shipping_line_id = data.shippingLineId || null;
    if (data.currentStatus !== undefined) updateData.current_status = data.currentStatus || null;
    if (data.lastPort !== undefined) updateData.last_port = data.lastPort || null;
    if (data.nextPort !== undefined) updateData.next_port = data.nextPort || null;

    const { data: result, error } = await (supabase as SupabaseAny)
      .from('vessels')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        shipping_lines:shipping_line_id(id, line_name, line_code)
      `)
      .single();

    if (error) throw error;

    revalidatePath('/agency/vessels');
    revalidatePath(`/agency/vessels/${id}`);
    return { success: true, data: rowToVessel(result as VesselRow) };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to update vessel' };
  }
}

/**
 * Delete (soft delete) a Vessel
 * Sets is_active to false to preserve historical data per Requirement 1.7
 * @param id - Vessel ID
 * @returns ActionResult with success or error
 * 
 * **Validates: Requirements 1.7**
 */
export async function deleteVessel(id: string): Promise<ActionResult<void>> {
  try {
    const supabase = await createClient();

    // Check if vessel exists
    const { data: existing } = await (supabase as SupabaseAny)
      .from('vessels')
      .select('id, vessel_name')
      .eq('id', id)
      .single();

    if (!existing) {
      return { success: false, error: 'Vessel not found' };
    }

    // Soft delete by setting is_active to false (Requirement 1.7)
    const { error } = await (supabase as SupabaseAny)
      .from('vessels')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) throw error;

    revalidatePath('/agency/vessels');
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to delete vessel' };
  }
}

/**
 * Get a single Vessel by ID
 * @param id - Vessel ID
 * @returns Vessel or null
 * 
 * **Validates: Requirements 1.1, 1.2, 1.3, 1.6**
 */
export async function getVessel(id: string): Promise<Vessel | null> {
  try {
    const supabase = await createClient();

    const { data, error } = await (supabase as SupabaseAny)
      .from('vessels')
      .select(`
        *,
        shipping_lines:shipping_line_id(id, line_name, line_code)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data ? rowToVessel(data as VesselRow) : null;
  } catch (error) {
    return null;
  }
}

/**
 * Get all Vessels with optional filters
 * By default, only returns active vessels unless includeInactive is true
 * @param filters - Optional filters for search, type, status, etc.
 * @returns Array of Vessel
 * 
 * **Validates: Requirements 1.1-1.7**
 */
export async function getVessels(filters?: VesselFilters): Promise<Vessel[]> {
  try {
    const supabase = await createClient();

    let query = (supabase as SupabaseAny)
      .from('vessels')
      .select(`
        *,
        shipping_lines:shipping_line_id(id, line_name, line_code)
      `)
      .order('vessel_name', { ascending: true });

    // By default, only show active vessels (Requirement 1.7)
    if (filters?.isActive !== undefined) {
      query = query.eq('is_active', filters.isActive);
    } else {
      query = query.eq('is_active', true);
    }

    // Apply filters
    if (filters?.vesselType) {
      query = query.eq('vessel_type', filters.vesselType);
    }

    if (filters?.status) {
      query = query.eq('current_status', filters.status);
    }

    if (filters?.shippingLineId) {
      query = query.eq('shipping_line_id', filters.shippingLineId);
    }

    if (filters?.search) {
      query = query.or(`vessel_name.ilike.%${filters.search}%,imo_number.ilike.%${filters.search}%,mmsi.ilike.%${filters.search}%,call_sign.ilike.%${filters.search}%`);
    }

    const { data, error } = await query;

    if (error) throw error;
    return (data || []).map((row: VesselRow) => rowToVessel(row));
  } catch (error) {
    return [];
  }
}


// =====================================================
// SCHEDULE CRUD OPERATIONS
// =====================================================

/**
 * Create a new Vessel Schedule
 * Validates uniqueness of vessel+voyage+port combination per Requirement 2.5
 * Auto-calculates delay hours when actual times are provided per Requirement 2.6
 * @param data - Schedule form data
 * @returns ActionResult with created VesselSchedule or error
 * 
 * **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8**
 */
export async function createSchedule(data: ScheduleFormData): Promise<ActionResult<VesselSchedule>> {
  try {
    // Validate required fields
    if (!data.vesselId?.trim()) {
      return { success: false, error: 'Vessel is required' };
    }
    if (!data.voyageNumber?.trim()) {
      return { success: false, error: 'Voyage number is required' };
    }
    if (!data.portName?.trim()) {
      return { success: false, error: 'Port name is required' };
    }

    const supabase = await createClient();

    // Check vessel exists
    const { data: vessel } = await (supabase as SupabaseAny)
      .from('vessels')
      .select('id')
      .eq('id', data.vesselId)
      .single();

    if (!vessel) {
      return { success: false, error: 'Vessel not found' };
    }

    // Check uniqueness of vessel+voyage+port combination (Requirement 2.5)
    const uniqueQuery = (supabase as SupabaseAny)
      .from('vessel_schedules')
      .select('id')
      .eq('vessel_id', data.vesselId)
      .eq('voyage_number', data.voyageNumber);

    // If portId is provided, use it for uniqueness check; otherwise use port_name
    if (data.portId) {
      uniqueQuery.eq('port_id', data.portId);
    } else {
      uniqueQuery.eq('port_name', data.portName);
    }

    const { data: existingSchedule } = await uniqueQuery.maybeSingle();

    if (existingSchedule) {
      return { success: false, error: 'A schedule for this vessel/voyage/port already exists' };
    }

    // Calculate delay hours if both scheduled and actual arrival are provided (Requirement 2.6)
    let delayHours = 0;
    if (data.scheduledArrival && data.actualArrival) {
      delayHours = calculateDelayHours(data.scheduledArrival, data.actualArrival);
    }

    const insertData = {
      vessel_id: data.vesselId,
      voyage_number: data.voyageNumber,
      service_name: data.serviceName || null,
      service_code: data.serviceCode || null,
      schedule_type: data.scheduleType || 'scheduled',
      port_id: data.portId || null,
      port_name: data.portName,
      terminal: data.terminal || null,
      berth: data.berth || null,
      scheduled_arrival: data.scheduledArrival || null,
      scheduled_departure: data.scheduledDeparture || null,
      actual_arrival: data.actualArrival || null,
      actual_departure: data.actualDeparture || null,
      cargo_cutoff: data.cargoCutoff || null,
      doc_cutoff: data.docCutoff || null,
      vgm_cutoff: data.vgmCutoff || null,
      status: data.status || 'scheduled',
      delay_hours: delayHours,
      delay_reason: data.delayReason || null,
      notes: data.notes || null,
    };

    const { data: result, error } = await (supabase as SupabaseAny)
      .from('vessel_schedules')
      .insert(insertData)
      .select(`
        *,
        vessels:vessel_id(id, vessel_name, imo_number, vessel_type),
        ports:port_id(id, port_code, port_name)
      `)
      .single();

    if (error) throw error;

    revalidatePath('/agency/schedules');
    revalidatePath('/agency/vessels');
    return { success: true, data: rowToSchedule(result as VesselScheduleRow) };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to create schedule' };
  }
}

/**
 * Update an existing Vessel Schedule
 * Auto-calculates delay hours when actual times are updated per Requirement 2.6
 * Records status transition timestamp per Requirement 2.8
 * @param id - Schedule ID
 * @param data - Partial schedule form data to update
 * @returns ActionResult with updated VesselSchedule or error
 * 
 * **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8**
 */
export async function updateSchedule(id: string, data: Partial<ScheduleFormData>): Promise<ActionResult<VesselSchedule>> {
  try {
    const supabase = await createClient();

    // Check if schedule exists
    const { data: existing } = await (supabase as SupabaseAny)
      .from('vessel_schedules')
      .select('*')
      .eq('id', id)
      .single();

    if (!existing) {
      return { success: false, error: 'Schedule not found' };
    }

    // Check uniqueness if vessel, voyage, or port is being changed (Requirement 2.5)
    const vesselId = data.vesselId ?? existing.vessel_id;
    const voyageNumber = data.voyageNumber ?? existing.voyage_number;
    const portId = data.portId !== undefined ? data.portId : existing.port_id;
    const portName = data.portName ?? existing.port_name;

    if (data.vesselId || data.voyageNumber || data.portId !== undefined || data.portName) {
      const uniqueQuery = (supabase as SupabaseAny)
        .from('vessel_schedules')
        .select('id')
        .eq('vessel_id', vesselId)
        .eq('voyage_number', voyageNumber)
        .neq('id', id);

      if (portId) {
        uniqueQuery.eq('port_id', portId);
      } else {
        uniqueQuery.eq('port_name', portName);
      }

      const { data: existingSchedule } = await uniqueQuery.maybeSingle();

      if (existingSchedule) {
        return { success: false, error: 'A schedule for this vessel/voyage/port already exists' };
      }
    }

    // Calculate delay hours if actual arrival is being updated (Requirement 2.6)
    const scheduledArrival = data.scheduledArrival ?? existing.scheduled_arrival;
    const actualArrival = data.actualArrival ?? existing.actual_arrival;
    
    let delayHours = existing.delay_hours;
    if (data.actualArrival !== undefined || data.scheduledArrival !== undefined) {
      if (scheduledArrival && actualArrival) {
        delayHours = calculateDelayHours(scheduledArrival, actualArrival);
      } else {
        delayHours = 0;
      }
    }

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
      delay_hours: delayHours,
    };

    // Only update fields that are provided
    if (data.vesselId !== undefined) updateData.vessel_id = data.vesselId;
    if (data.voyageNumber !== undefined) updateData.voyage_number = data.voyageNumber;
    if (data.serviceName !== undefined) updateData.service_name = data.serviceName || null;
    if (data.serviceCode !== undefined) updateData.service_code = data.serviceCode || null;
    if (data.scheduleType !== undefined) updateData.schedule_type = data.scheduleType;
    if (data.portId !== undefined) updateData.port_id = data.portId || null;
    if (data.portName !== undefined) updateData.port_name = data.portName;
    if (data.terminal !== undefined) updateData.terminal = data.terminal || null;
    if (data.berth !== undefined) updateData.berth = data.berth || null;
    if (data.scheduledArrival !== undefined) updateData.scheduled_arrival = data.scheduledArrival || null;
    if (data.scheduledDeparture !== undefined) updateData.scheduled_departure = data.scheduledDeparture || null;
    if (data.actualArrival !== undefined) updateData.actual_arrival = data.actualArrival || null;
    if (data.actualDeparture !== undefined) updateData.actual_departure = data.actualDeparture || null;
    if (data.cargoCutoff !== undefined) updateData.cargo_cutoff = data.cargoCutoff || null;
    if (data.docCutoff !== undefined) updateData.doc_cutoff = data.docCutoff || null;
    if (data.vgmCutoff !== undefined) updateData.vgm_cutoff = data.vgmCutoff || null;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.delayReason !== undefined) updateData.delay_reason = data.delayReason || null;
    if (data.notes !== undefined) updateData.notes = data.notes || null;

    const { data: result, error } = await (supabase as SupabaseAny)
      .from('vessel_schedules')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        vessels:vessel_id(id, vessel_name, imo_number, vessel_type),
        ports:port_id(id, port_code, port_name)
      `)
      .single();

    if (error) throw error;

    revalidatePath('/agency/schedules');
    revalidatePath(`/agency/schedules/${id}`);
    revalidatePath('/agency/vessels');
    return { success: true, data: rowToSchedule(result as VesselScheduleRow) };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to update schedule' };
  }
}

/**
 * Delete a Vessel Schedule
 * @param id - Schedule ID
 * @returns ActionResult with success or error
 */
export async function deleteSchedule(id: string): Promise<ActionResult<void>> {
  try {
    const supabase = await createClient();

    // Check if schedule exists
    const { data: existing } = await (supabase as SupabaseAny)
      .from('vessel_schedules')
      .select('id')
      .eq('id', id)
      .single();

    if (!existing) {
      return { success: false, error: 'Schedule not found' };
    }

    const { error } = await (supabase as SupabaseAny)
      .from('vessel_schedules')
      .delete()
      .eq('id', id);

    if (error) throw error;

    revalidatePath('/agency/schedules');
    revalidatePath('/agency/vessels');
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to delete schedule' };
  }
}

/**
 * Get a single Vessel Schedule by ID
 * @param id - Schedule ID
 * @returns VesselSchedule or null
 * 
 * **Validates: Requirements 2.1, 2.2, 2.3, 2.4**
 */
export async function getSchedule(id: string): Promise<VesselSchedule | null> {
  try {
    const supabase = await createClient();

    const { data, error } = await (supabase as SupabaseAny)
      .from('vessel_schedules')
      .select(`
        *,
        vessels:vessel_id(id, vessel_name, imo_number, vessel_type),
        ports:port_id(id, port_code, port_name)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data ? rowToSchedule(data as VesselScheduleRow) : null;
  } catch (error) {
    return null;
  }
}

/**
 * Get all Vessel Schedules with optional filters
 * @param filters - Optional filters for vessel, voyage, port, status, delay, date range
 * @returns Array of VesselSchedule
 * 
 * **Validates: Requirements 2.1-2.8**
 */
export async function getSchedules(filters?: ScheduleFilters): Promise<VesselSchedule[]> {
  try {
    const supabase = await createClient();

    let query = (supabase as SupabaseAny)
      .from('vessel_schedules')
      .select(`
        *,
        vessels:vessel_id(id, vessel_name, imo_number, vessel_type),
        ports:port_id(id, port_code, port_name)
      `)
      .order('scheduled_arrival', { ascending: true, nullsFirst: false });

    // Apply filters
    if (filters?.vesselId) {
      query = query.eq('vessel_id', filters.vesselId);
    }

    if (filters?.voyageNumber) {
      query = query.eq('voyage_number', filters.voyageNumber);
    }

    if (filters?.portId) {
      query = query.eq('port_id', filters.portId);
    }

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.hasDelay !== undefined) {
      if (filters.hasDelay) {
        query = query.gt('delay_hours', 0);
      } else {
        query = query.lte('delay_hours', 0);
      }
    }

    if (filters?.dateFrom) {
      query = query.gte('scheduled_arrival', filters.dateFrom);
    }

    if (filters?.dateTo) {
      query = query.lte('scheduled_arrival', filters.dateTo);
    }

    const { data, error } = await query;

    if (error) throw error;
    return (data || []).map((row: VesselScheduleRow) => rowToSchedule(row));
  } catch (error) {
    return [];
  }
}

/**
 * Get upcoming vessel arrivals from the view
 * Supports date range filtering per Requirement 7.5
 * Returns arrivals sorted by scheduled arrival time per Requirement 7.6
 * @param filters - Optional filters for date range, port, vessel type
 * @returns Array of UpcomingArrival
 * 
 * **Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5, 7.6**
 */
export async function getUpcomingArrivals(filters?: ArrivalFilters): Promise<UpcomingArrival[]> {
  try {
    const supabase = await createClient();

    let query = (supabase as SupabaseAny)
      .from('upcoming_vessel_arrivals')
      .select('*')
      .order('scheduled_arrival', { ascending: true });

    // Apply date range filters (Requirement 7.5)
    if (filters?.dateFrom) {
      query = query.gte('scheduled_arrival', filters.dateFrom);
    }

    if (filters?.dateTo) {
      query = query.lte('scheduled_arrival', filters.dateTo);
    }

    if (filters?.portId) {
      // Note: The view may not have port_id, so we filter by port_name if needed
      // This depends on the view definition
    }

    if (filters?.vesselType) {
      query = query.eq('vessel_type', filters.vesselType);
    }

    const { data, error } = await query;

    if (error) throw error;
    return (data || []).map((row: UpcomingArrivalRow) => rowToUpcomingArrival(row));
  } catch (error) {
    return [];
  }
}


// =====================================================
// POSITION TRACKING OPERATIONS
// =====================================================

/**
 * Record a new vessel position
 * Updates the vessel's current_position field per Requirement 3.4
 * Preserves position history per Requirement 3.5
 * @param data - Position form data
 * @returns ActionResult with created VesselPositionRecord or error
 * 
 * **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**
 */
export async function recordPosition(data: PositionFormData): Promise<ActionResult<VesselPositionRecord>> {
  try {
    // Validate required fields
    if (!data.vesselId?.trim()) {
      return { success: false, error: 'Vessel ID is required' };
    }
    if (!data.timestamp?.trim()) {
      return { success: false, error: 'Timestamp is required' };
    }

    // Validate coordinates (Requirements 9.3, 9.4)
    const coordValidation = validateCoordinates(data.latitude, data.longitude);
    if (!coordValidation.isValid) {
      return { success: false, error: coordValidation.errors[0]?.message || 'Invalid coordinates' };
    }

    // Validate navigation data if provided (Requirements 9.5, 9.6)
    if (data.course !== undefined && data.speedKnots !== undefined) {
      const navValidation = validateNavigationData(data.course, data.speedKnots);
      if (!navValidation.isValid) {
        return { success: false, error: navValidation.errors[0]?.message || 'Invalid navigation data' };
      }
    } else if (data.course !== undefined) {
      // Validate course alone
      if (data.course < 0 || data.course > 360) {
        return { success: false, error: 'Course must be between 0 and 360 degrees' };
      }
    } else if (data.speedKnots !== undefined) {
      // Validate speed alone
      if (data.speedKnots < 0) {
        return { success: false, error: 'Speed cannot be negative' };
      }
    }

    const supabase = await createClient();

    // Check if vessel exists
    const { data: vessel, error: vesselError } = await (supabase as SupabaseAny)
      .from('vessels')
      .select('id, vessel_name')
      .eq('id', data.vesselId)
      .single();

    if (vesselError || !vessel) {
      return { success: false, error: 'Vessel not found' };
    }

    // Insert position record (Requirement 3.5 - preserve history)
    const insertData = {
      vessel_id: data.vesselId,
      timestamp: data.timestamp,
      latitude: data.latitude,
      longitude: data.longitude,
      course: data.course ?? null,
      speed_knots: data.speedKnots ?? null,
      status: data.status ?? null,
      destination: data.destination ?? null,
      source: data.source ?? 'manual',
    };

    const { data: positionResult, error: positionError } = await (supabase as SupabaseAny)
      .from('vessel_positions')
      .insert(insertData)
      .select('*')
      .single();

    if (positionError) throw positionError;

    // Update vessel's current_position (Requirement 3.4)
    const currentPosition: VesselPosition = {
      lat: data.latitude,
      lng: data.longitude,
      course: data.course,
      speed: data.speedKnots,
      updatedAt: data.timestamp,
    };

    const { error: updateError } = await (supabase as SupabaseAny)
      .from('vessels')
      .update({
        current_position: currentPosition,
        current_status: data.status ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', data.vesselId);

    if (updateError) {
      // Don't fail the whole operation, position was recorded
    }

    revalidatePath('/agency/vessels');
    revalidatePath(`/agency/vessels/${data.vesselId}`);
    return { success: true, data: rowToPosition(positionResult as VesselPositionRow) };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to record position' };
  }
}

/**
 * Get position history for a vessel
 * Returns positions in chronological order (oldest first)
 * @param vesselId - Vessel ID
 * @param limit - Maximum number of records to return (default: 100)
 * @returns Array of VesselPositionRecord in chronological order
 * 
 * **Validates: Requirements 3.5**
 */
export async function getPositionHistory(vesselId: string, limit: number = 100): Promise<VesselPositionRecord[]> {
  try {
    if (!vesselId?.trim()) {
      return [];
    }

    const supabase = await createClient();

    const { data, error } = await (supabase as SupabaseAny)
      .from('vessel_positions')
      .select('*')
      .eq('vessel_id', vesselId)
      .order('timestamp', { ascending: true })
      .limit(limit);

    if (error) throw error;
    return (data || []).map((row: VesselPositionRow) => rowToPosition(row));
  } catch (error) {
    return [];
  }
}


// =====================================================
// SHIPMENT TRACKING OPERATIONS
// =====================================================

/**
 * Record a new tracking event for a shipment
 * Links events to bookings, B/Ls, or containers per Requirements 4.1
 * Supports all event types per Requirement 4.2
 * @param data - Tracking event form data
 * @returns ActionResult with created ShipmentTracking or error
 * 
 * **Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5, 4.7**
 */
export async function recordTrackingEvent(data: TrackingEventFormData): Promise<ActionResult<ShipmentTracking>> {
  try {
    // Validate required fields
    if (!data.eventType?.trim()) {
      return { success: false, error: 'Event type is required' };
    }
    if (!data.eventTimestamp?.trim()) {
      return { success: false, error: 'Event timestamp is required' };
    }

    // Must have at least one reference (booking, B/L, or container)
    if (!data.bookingId && !data.blId && !data.containerNumber && !data.containerId) {
      return { success: false, error: 'At least one reference (booking, B/L, or container) is required' };
    }

    // Validate container number format if provided (Requirement 4.7)
    if (data.containerNumber) {
      const isValidContainer = validateContainerNumber(data.containerNumber);
      if (!isValidContainer) {
        return { success: false, error: 'Invalid container number format (must be 4 letters + 7 digits with valid check digit)' };
      }
    }

    const supabase = await createClient();

    // Validate booking exists if provided
    if (data.bookingId) {
      const { data: booking, error: bookingError } = await (supabase as SupabaseAny)
        .from('freight_bookings')
        .select('id')
        .eq('id', data.bookingId)
        .maybeSingle();

      if (bookingError || !booking) {
        return { success: false, error: 'Booking not found' };
      }
    }

    // Validate B/L exists if provided
    if (data.blId) {
      const { data: bl, error: blError } = await (supabase as SupabaseAny)
        .from('bills_of_lading')
        .select('id')
        .eq('id', data.blId)
        .maybeSingle();

      if (blError || !bl) {
        return { success: false, error: 'Bill of Lading not found' };
      }
    }

    // Validate container exists if containerId provided
    if (data.containerId) {
      const { data: container, error: containerError } = await (supabase as SupabaseAny)
        .from('booking_containers')
        .select('id')
        .eq('id', data.containerId)
        .maybeSingle();

      if (containerError || !container) {
        return { success: false, error: 'Container not found' };
      }
    }

    const insertData = {
      booking_id: data.bookingId || null,
      bl_id: data.blId || null,
      container_id: data.containerId || null,
      tracking_number: data.trackingNumber || null,
      container_number: data.containerNumber || null,
      event_type: data.eventType,
      event_timestamp: data.eventTimestamp,
      location_name: data.locationName || null,
      location_code: data.locationCode || null,
      terminal: data.terminal || null,
      vessel_name: data.vesselName || null,
      voyage_number: data.voyageNumber || null,
      description: data.description || null,
      is_actual: data.isActual !== undefined ? data.isActual : true,
      source: data.source || null,
    };

    const { data: result, error } = await (supabase as SupabaseAny)
      .from('shipment_tracking')
      .insert(insertData)
      .select(`
        *,
        freight_bookings:booking_id(id, booking_number, cargo_description),
        bills_of_lading:bl_id(id, bl_number, cargo_description)
      `)
      .single();

    if (error) throw error;

    revalidatePath('/agency/tracking');
    return { success: true, data: rowToTracking(result as ShipmentTrackingRow) };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to record tracking event' };
  }
}

/**
 * Get tracking events with optional filters
 * Returns events in chronological order per Requirement 4.6
 * @param params - Search parameters for filtering events
 * @returns Array of ShipmentTracking in chronological order
 * 
 * **Validates: Requirements 4.1, 4.3, 4.4, 4.5, 4.6**
 */
export async function getTrackingEvents(params?: TrackingSearchParams): Promise<ShipmentTracking[]> {
  try {
    const supabase = await createClient();

    let query = (supabase as SupabaseAny)
      .from('shipment_tracking')
      .select(`
        *,
        freight_bookings:booking_id(id, booking_number, cargo_description),
        bills_of_lading:bl_id(id, bl_number, cargo_description)
      `)
      .order('event_timestamp', { ascending: true });

    // Apply filters
    if (params?.bookingId) {
      query = query.eq('booking_id', params.bookingId);
    }

    if (params?.blId) {
      query = query.eq('bl_id', params.blId);
    }

    if (params?.containerNumber) {
      query = query.eq('container_number', params.containerNumber);
    }

    if (params?.trackingNumber) {
      query = query.eq('tracking_number', params.trackingNumber);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Transform and ensure chronological order
    const events = (data || []).map((row: ShipmentTrackingRow) => rowToTracking(row));
    return sortTrackingEventsByTimestamp(events);
  } catch (error) {
    return [];
  }
}

/**
 * Search tracking by B/L number, booking number, or container number
 * Returns all related tracking events per Requirements 5.1, 5.2, 5.3
 * @param query - Search query (B/L number, booking number, or container number)
 * @returns TrackingSearchResult with type, reference, and events
 * 
 * **Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5, 5.6**
 */
export async function searchTracking(query: string): Promise<TrackingSearchResult | null> {
  try {
    if (!query?.trim()) {
      return null;
    }

    const searchQuery = query.trim().toUpperCase();
    const supabase = await createClient();

    // Try to detect the type of reference
    // Container numbers: 4 letters + 7 digits (e.g., MSCU1234567)
    // B/L numbers: typically contain letters and numbers with dashes
    // Booking numbers: typically start with BK- or similar prefix

    let searchType: 'bl' | 'booking' | 'container' = 'container';
    let referenceId: string | null = null;
    let booking = null;
    let bl = null;
    let events: ShipmentTracking[] = [];

    // Check if it's a container number format (4 letters + 7 digits)
    const containerPattern = /^[A-Z]{4}\d{7}$/;
    const isContainerNumber = containerPattern.test(searchQuery);

    if (isContainerNumber) {
      // Search by container number (Requirement 5.3)
      searchType = 'container';
      
      const { data: trackingData, error: trackingError } = await (supabase as SupabaseAny)
        .from('shipment_tracking')
        .select(`
          *,
          freight_bookings:booking_id(id, booking_number, cargo_description, vessel_name, voyage_number),
          bills_of_lading:bl_id(id, bl_number, cargo_description, vessel_name, voyage_number)
        `)
        .eq('container_number', searchQuery)
        .order('event_timestamp', { ascending: true });

      if (!trackingError && trackingData && trackingData.length > 0) {
        events = trackingData.map((row: ShipmentTrackingRow) => rowToTracking(row));
        
        // Get linked booking/BL info from first event
        if (trackingData[0].freight_bookings) {
          booking = trackingData[0].freight_bookings;
        }
        if (trackingData[0].bills_of_lading) {
          bl = trackingData[0].bills_of_lading;
        }
      }
    } else {
      // Try B/L search first (Requirement 5.1)
      const { data: blData, error: blError } = await (supabase as SupabaseAny)
        .from('bills_of_lading')
        .select('id, bl_number, cargo_description, vessel_name, voyage_number, booking_id')
        .or(`bl_number.ilike.%${searchQuery}%,carrier_bl_number.ilike.%${searchQuery}%`)
        .maybeSingle();

      if (!blError && blData) {
        searchType = 'bl';
        referenceId = blData.id;
        bl = blData;

        // Get booking info if linked
        if (blData.booking_id) {
          const { data: bookingData } = await (supabase as SupabaseAny)
            .from('freight_bookings')
            .select('id, booking_number, cargo_description, vessel_name, voyage_number')
            .eq('id', blData.booking_id)
            .maybeSingle();
          
          if (bookingData) {
            booking = bookingData;
          }
        }

        // Get tracking events for this B/L
        const { data: trackingData } = await (supabase as SupabaseAny)
          .from('shipment_tracking')
          .select('*')
          .eq('bl_id', blData.id)
          .order('event_timestamp', { ascending: true });

        if (trackingData) {
          events = trackingData.map((row: ShipmentTrackingRow) => rowToTracking(row));
        }
      } else {
        // Try booking search (Requirement 5.2)
        const { data: bookingData, error: bookingError } = await (supabase as SupabaseAny)
          .from('freight_bookings')
          .select('id, booking_number, cargo_description, vessel_name, voyage_number')
          .or(`booking_number.ilike.%${searchQuery}%,carrier_booking_number.ilike.%${searchQuery}%`)
          .maybeSingle();

        if (!bookingError && bookingData) {
          searchType = 'booking';
          referenceId = bookingData.id;
          booking = bookingData;

          // Get tracking events for this booking
          const { data: trackingData } = await (supabase as SupabaseAny)
            .from('shipment_tracking')
            .select('*')
            .eq('booking_id', bookingData.id)
            .order('event_timestamp', { ascending: true });

          if (trackingData) {
            events = trackingData.map((row: ShipmentTrackingRow) => rowToTracking(row));
          }

          // Also check for linked B/L
          const { data: linkedBl } = await (supabase as SupabaseAny)
            .from('bills_of_lading')
            .select('id, bl_number, cargo_description, vessel_name, voyage_number')
            .eq('booking_id', bookingData.id)
            .maybeSingle();

          if (linkedBl) {
            bl = linkedBl;
          }
        }
      }
    }

    // If no results found
    if (events.length === 0 && !booking && !bl) {
      return null;
    }

    // Build vessel info from booking or B/L
    let vesselInfo = undefined;
    const vesselSource = bl || booking;
    if (vesselSource && vesselSource.vessel_name) {
      vesselInfo = {
        name: vesselSource.vessel_name,
        voyage: vesselSource.voyage_number || '',
        position: undefined, // Would need to look up from vessels table
      };
    }

    return {
      type: searchType,
      reference: searchQuery,
      booking: booking ? {
        id: booking.id,
        bookingNumber: booking.booking_number,
        cargoDescription: booking.cargo_description,
        vesselName: booking.vessel_name,
        voyageNumber: booking.voyage_number,
      } as unknown as import('@/types/agency').FreightBooking : undefined,
      bl: bl ? {
        id: bl.id,
        blNumber: bl.bl_number,
        cargoDescription: bl.cargo_description,
        vesselName: bl.vessel_name,
        voyageNumber: bl.voyage_number,
      } as unknown as import('@/types/agency').BillOfLading : undefined,
      events: sortTrackingEventsByTimestamp(events),
      vessel: vesselInfo,
    };
  } catch (error) {
    return null;
  }
}

/**
 * Get a single tracking event by ID
 * @param id - Tracking event ID
 * @returns ShipmentTracking or null
 */
export async function getTrackingEvent(id: string): Promise<ShipmentTracking | null> {
  try {
    if (!id?.trim()) {
      return null;
    }

    const supabase = await createClient();

    const { data, error } = await (supabase as SupabaseAny)
      .from('shipment_tracking')
      .select(`
        *,
        freight_bookings:booking_id(id, booking_number, cargo_description),
        bills_of_lading:bl_id(id, bl_number, cargo_description)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data ? rowToTracking(data as ShipmentTrackingRow) : null;
  } catch (error) {
    return null;
  }
}

/**
 * Delete a tracking event
 * @param id - Tracking event ID
 * @returns ActionResult with success or error
 */
export async function deleteTrackingEvent(id: string): Promise<ActionResult<void>> {
  try {
    if (!id?.trim()) {
      return { success: false, error: 'Tracking event ID is required' };
    }

    const supabase = await createClient();

    // Check if event exists
    const { data: existing } = await (supabase as SupabaseAny)
      .from('shipment_tracking')
      .select('id')
      .eq('id', id)
      .single();

    if (!existing) {
      return { success: false, error: 'Tracking event not found' };
    }

    const { error } = await (supabase as SupabaseAny)
      .from('shipment_tracking')
      .delete()
      .eq('id', id);

    if (error) throw error;

    revalidatePath('/agency/tracking');
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to delete tracking event' };
  }
}


// =====================================================
// SUBSCRIPTION MANAGEMENT OPERATIONS
// =====================================================

/**
 * Create a new tracking subscription
 * Validates reference exists and prevents duplicate subscriptions per Requirement 6.6
 * @param data - Subscription form data
 * @param userId - User ID creating the subscription
 * @returns ActionResult with created TrackingSubscription or error
 * 
 * **Validates: Requirements 6.1, 6.2, 6.3, 6.6**
 */
export async function createSubscription(
  data: SubscriptionFormData,
  userId?: string
): Promise<ActionResult<TrackingSubscription>> {
  try {
    // Validate required fields
    if (!data.trackingType?.trim()) {
      return { success: false, error: 'Tracking type is required' };
    }
    if (!data.referenceId?.trim()) {
      return { success: false, error: 'Reference ID is required' };
    }

    // Validate tracking type (Requirement 6.1)
    const validTypes: TrackingType[] = ['vessel', 'container', 'booking'];
    if (!validTypes.includes(data.trackingType)) {
      return { success: false, error: 'Invalid tracking type. Must be vessel, container, or booking' };
    }

    const supabase = await createClient();

    // Get current user if not provided
    let effectiveUserId = userId;
    if (!effectiveUserId) {
      const { data: { user } } = await supabase.auth.getUser();
      effectiveUserId = user?.id;
    }

    // Validate reference exists (Requirement 6.3)
    let referenceNumber: string | undefined;
    
    if (data.trackingType === 'vessel') {
      const { data: vessel, error: vesselError } = await (supabase as SupabaseAny)
        .from('vessels')
        .select('id, vessel_name')
        .eq('id', data.referenceId)
        .maybeSingle();

      if (vesselError || !vessel) {
        return { success: false, error: 'Vessel not found' };
      }
      referenceNumber = vessel.vessel_name;
    } else if (data.trackingType === 'booking') {
      const { data: booking, error: bookingError } = await (supabase as SupabaseAny)
        .from('freight_bookings')
        .select('id, booking_number')
        .eq('id', data.referenceId)
        .maybeSingle();

      if (bookingError || !booking) {
        return { success: false, error: 'Booking not found' };
      }
      referenceNumber = booking.booking_number;
    } else if (data.trackingType === 'container') {
      // For container type, the referenceId could be a container ID or we use the referenceNumber
      // Check if it's a booking_containers record
      const { data: container, error: containerError } = await (supabase as SupabaseAny)
        .from('booking_containers')
        .select('id, container_number')
        .eq('id', data.referenceId)
        .maybeSingle();

      if (!containerError && container) {
        referenceNumber = container.container_number;
      } else {
        // If not found in booking_containers, use the provided referenceNumber
        referenceNumber = data.referenceNumber;
      }
    }

    // Use provided referenceNumber if available
    if (data.referenceNumber) {
      referenceNumber = data.referenceNumber;
    }

    // Check for duplicate subscription (Requirement 6.6)
    const duplicateQuery = (supabase as SupabaseAny)
      .from('tracking_subscriptions')
      .select('id')
      .eq('tracking_type', data.trackingType)
      .eq('reference_id', data.referenceId);

    if (effectiveUserId) {
      duplicateQuery.eq('user_id', effectiveUserId);
    } else if (data.email) {
      duplicateQuery.eq('email', data.email);
    }

    const { data: existingSubscription } = await duplicateQuery.maybeSingle();

    if (existingSubscription) {
      return { success: false, error: 'You are already subscribed to this shipment' };
    }

    // Insert subscription (Requirement 6.2 - notification preferences)
    const insertData = {
      tracking_type: data.trackingType,
      reference_id: data.referenceId,
      reference_number: referenceNumber || null,
      user_id: effectiveUserId || null,
      email: data.email || null,
      notify_departure: data.notifyDeparture !== undefined ? data.notifyDeparture : true,
      notify_arrival: data.notifyArrival !== undefined ? data.notifyArrival : true,
      notify_delay: data.notifyDelay !== undefined ? data.notifyDelay : true,
      notify_milestone: data.notifyMilestone !== undefined ? data.notifyMilestone : true,
      is_active: true,
    };

    const { data: result, error } = await (supabase as SupabaseAny)
      .from('tracking_subscriptions')
      .insert(insertData)
      .select('*')
      .single();

    if (error) throw error;

    revalidatePath('/agency/tracking');
    return { success: true, data: rowToSubscription(result as TrackingSubscriptionRow) };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to create subscription' };
  }
}

/**
 * Update an existing tracking subscription
 * Allows updating notification preferences and active status
 * @param id - Subscription ID
 * @param data - Partial subscription form data to update
 * @returns ActionResult with updated TrackingSubscription or error
 * 
 * **Validates: Requirements 6.4, 6.5**
 */
export async function updateSubscription(
  id: string,
  data: Partial<SubscriptionFormData> & { isActive?: boolean }
): Promise<ActionResult<TrackingSubscription>> {
  try {
    if (!id?.trim()) {
      return { success: false, error: 'Subscription ID is required' };
    }

    const supabase = await createClient();

    // Check if subscription exists
    const { data: existing, error: existingError } = await (supabase as SupabaseAny)
      .from('tracking_subscriptions')
      .select('*')
      .eq('id', id)
      .single();

    if (existingError || !existing) {
      return { success: false, error: 'Subscription not found' };
    }

    // Build update data
    const updateData: Record<string, unknown> = {};

    // Update notification preferences (Requirement 6.4)
    if (data.notifyDeparture !== undefined) updateData.notify_departure = data.notifyDeparture;
    if (data.notifyArrival !== undefined) updateData.notify_arrival = data.notifyArrival;
    if (data.notifyDelay !== undefined) updateData.notify_delay = data.notifyDelay;
    if (data.notifyMilestone !== undefined) updateData.notify_milestone = data.notifyMilestone;
    
    // Update active status (Requirement 6.5)
    if (data.isActive !== undefined) updateData.is_active = data.isActive;
    
    // Update email if provided
    if (data.email !== undefined) updateData.email = data.email || null;

    // Only update if there are changes
    if (Object.keys(updateData).length === 0) {
      return { success: true, data: rowToSubscription(existing as TrackingSubscriptionRow) };
    }

    const { data: result, error } = await (supabase as SupabaseAny)
      .from('tracking_subscriptions')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;

    revalidatePath('/agency/tracking');
    return { success: true, data: rowToSubscription(result as TrackingSubscriptionRow) };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to update subscription' };
  }
}

/**
 * Delete a tracking subscription
 * @param id - Subscription ID
 * @returns ActionResult with success or error
 */
export async function deleteSubscription(id: string): Promise<ActionResult<void>> {
  try {
    if (!id?.trim()) {
      return { success: false, error: 'Subscription ID is required' };
    }

    const supabase = await createClient();

    // Check if subscription exists
    const { data: existing, error: existingError } = await (supabase as SupabaseAny)
      .from('tracking_subscriptions')
      .select('id')
      .eq('id', id)
      .single();

    if (existingError || !existing) {
      return { success: false, error: 'Subscription not found' };
    }

    const { error } = await (supabase as SupabaseAny)
      .from('tracking_subscriptions')
      .delete()
      .eq('id', id);

    if (error) throw error;

    revalidatePath('/agency/tracking');
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to delete subscription' };
  }
}

/**
 * Get all subscriptions for a user
 * @param userId - User ID (optional, uses current user if not provided)
 * @returns Array of TrackingSubscription
 * 
 * **Validates: Requirements 6.4**
 */
export async function getUserSubscriptions(userId?: string): Promise<TrackingSubscription[]> {
  try {
    const supabase = await createClient();

    // Get current user if not provided
    let effectiveUserId = userId;
    if (!effectiveUserId) {
      const { data: { user } } = await supabase.auth.getUser();
      effectiveUserId = user?.id;
    }

    if (!effectiveUserId) {
      return [];
    }

    const { data, error } = await (supabase as SupabaseAny)
      .from('tracking_subscriptions')
      .select('*')
      .eq('user_id', effectiveUserId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map((row: TrackingSubscriptionRow) => rowToSubscription(row));
  } catch (error) {
    return [];
  }
}

/**
 * Get a single subscription by ID
 * @param id - Subscription ID
 * @returns TrackingSubscription or null
 */
export async function getSubscription(id: string): Promise<TrackingSubscription | null> {
  try {
    if (!id?.trim()) {
      return null;
    }

    const supabase = await createClient();

    const { data, error } = await (supabase as SupabaseAny)
      .from('tracking_subscriptions')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data ? rowToSubscription(data as TrackingSubscriptionRow) : null;
  } catch (error) {
    return null;
  }
}

/**
 * Get subscriptions by reference (for notification purposes)
 * @param trackingType - Type of tracking (vessel, container, booking)
 * @param referenceId - Reference ID
 * @returns Array of active TrackingSubscription
 */
export async function getSubscriptionsByReference(
  trackingType: TrackingType,
  referenceId: string
): Promise<TrackingSubscription[]> {
  try {
    if (!trackingType?.trim() || !referenceId?.trim()) {
      return [];
    }

    const supabase = await createClient();

    const { data, error } = await (supabase as SupabaseAny)
      .from('tracking_subscriptions')
      .select('*')
      .eq('tracking_type', trackingType)
      .eq('reference_id', referenceId)
      .eq('is_active', true);

    if (error) throw error;
    return (data || []).map((row: TrackingSubscriptionRow) => rowToSubscription(row));
  } catch (error) {
    return [];
  }
}
