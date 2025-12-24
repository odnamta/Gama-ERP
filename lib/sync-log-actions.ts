// =====================================================
// v0.69: SYNC LOG ACTIONS
// Server actions for managing sync logs
// =====================================================
'use server';

import { createClient } from '@/lib/supabase/server';
import {
  type SyncLog,
  type SyncLogFilters,
} from '@/types/integration';

/**
 * Lists sync logs with optional filtering
 */
export async function listSyncLogs(filters?: SyncLogFilters): Promise<{ success: boolean; data?: SyncLog[]; error?: string }> {
  try {
    const supabase = await createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (supabase as any).from('sync_log').select('*');

    if (filters?.connection_id) {
      query = query.eq('connection_id', filters.connection_id);
    }
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.from_date) {
      query = query.gte('started_at', filters.from_date);
    }
    if (filters?.to_date) {
      query = query.lte('started_at', filters.to_date);
    }

    query = query.order('started_at', { ascending: false }).limit(100);

    const { data, error } = await query;
    if (error) return { success: false, error: error.message };
    return { success: true, data: data as SyncLog[] };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

/**
 * Gets a single sync log by ID
 */
export async function getSyncLog(id: string): Promise<{ success: boolean; data?: SyncLog; error?: string }> {
  try {
    if (!id) return { success: false, error: 'Sync log ID is required' };

    const supabase = await createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any).from('sync_log').select('*').eq('id', id).single();

    if (error) return { success: false, error: error.code === 'PGRST116' ? 'Sync log not found' : error.message };
    return { success: true, data: data as SyncLog };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

/**
 * Gets sync logs for a specific connection
 */
export async function getSyncLogsForConnection(connectionId: string, limit: number = 50): Promise<{ success: boolean; data?: SyncLog[]; error?: string }> {
  try {
    if (!connectionId) return { success: false, error: 'Connection ID is required' };

    const supabase = await createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('sync_log')
      .select('*')
      .eq('connection_id', connectionId)
      .order('started_at', { ascending: false })
      .limit(limit);

    if (error) return { success: false, error: error.message };
    return { success: true, data: data as SyncLog[] };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

/**
 * Gets sync statistics for a connection
 */
export async function getSyncStats(connectionId?: string): Promise<{ 
  success: boolean; 
  data?: {
    total_syncs: number;
    successful_syncs: number;
    failed_syncs: number;
    partial_syncs: number;
    total_records_processed: number;
  }; 
  error?: string 
}> {
  try {
    const supabase = await createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (supabase as any).from('sync_log').select('status, records_processed');
    
    if (connectionId) {
      query = query.eq('connection_id', connectionId);
    }

    const { data, error } = await query;
    if (error) return { success: false, error: error.message };

    const logs = data as { status: string; records_processed: number }[];
    const stats = {
      total_syncs: logs.length,
      successful_syncs: logs.filter(l => l.status === 'completed').length,
      failed_syncs: logs.filter(l => l.status === 'failed').length,
      partial_syncs: logs.filter(l => l.status === 'partial').length,
      total_records_processed: logs.reduce((sum, l) => sum + (l.records_processed || 0), 0),
    };

    return { success: true, data: stats };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}
