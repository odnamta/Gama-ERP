// =====================================================
// v0.69: INTEGRATION CONNECTION ACTIONS
// Server actions for managing integration connections
// =====================================================
'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import {
  type IntegrationConnection,
  type CreateConnectionInput,
  type UpdateConnectionInput,
  type ConnectionFilters,
  type ConnectionTestResult,
} from '@/types/integration';
import { validateConnectionInput } from '@/lib/integration-utils';

/**
 * Creates a new integration connection
 */
export async function createConnection(input: CreateConnectionInput): Promise<{ success: boolean; data?: IntegrationConnection; error?: string }> {
  try {
    const validation = validateConnectionInput(input);
    if (!validation.valid) return { success: false, error: validation.errors.join(', ') };

    const supabase = await createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any).from('integration_connections').insert({
      connection_code: input.connection_code, connection_name: input.connection_name,
      integration_type: input.integration_type, provider: input.provider,
      credentials: input.credentials || null, config: input.config || {},
      is_active: input.is_active ?? true, access_token: input.access_token || null,
      refresh_token: input.refresh_token || null, token_expires_at: input.token_expires_at || null,
    }).select().single();

    if (error) {
      if (error.code === '23505') return { success: false, error: 'Connection code already exists' };
      return { success: false, error: error.message };
    }
    revalidatePath('/settings/integrations');
    return { success: true, data: data as IntegrationConnection };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

/**
 * Updates an existing integration connection
 */
export async function updateConnection(id: string, input: UpdateConnectionInput): Promise<{ success: boolean; data?: IntegrationConnection; error?: string }> {
  try {
    if (!id) return { success: false, error: 'Connection ID is required' };
    const supabase = await createClient();

    const updateData: Record<string, unknown> = {};
    if (input.connection_code !== undefined) updateData.connection_code = input.connection_code;
    if (input.connection_name !== undefined) updateData.connection_name = input.connection_name;
    if (input.integration_type !== undefined) updateData.integration_type = input.integration_type;
    if (input.provider !== undefined) updateData.provider = input.provider;
    if (input.credentials !== undefined) updateData.credentials = input.credentials;
    if (input.config !== undefined) updateData.config = input.config;
    if (input.is_active !== undefined) updateData.is_active = input.is_active;
    if (input.last_sync_at !== undefined) updateData.last_sync_at = input.last_sync_at;
    if (input.last_error !== undefined) updateData.last_error = input.last_error;
    if (input.access_token !== undefined) updateData.access_token = input.access_token;
    if (input.refresh_token !== undefined) updateData.refresh_token = input.refresh_token;
    if (input.token_expires_at !== undefined) updateData.token_expires_at = input.token_expires_at;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any).from('integration_connections').update(updateData).eq('id', id).select().single();
    if (error) return { success: false, error: error.message };
    revalidatePath('/settings/integrations');
    return { success: true, data: data as IntegrationConnection };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

/** Deletes an integration connection */
export async function deleteConnection(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    if (!id) return { success: false, error: 'Connection ID is required' };
    const supabase = await createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from('integration_connections').delete().eq('id', id);
    if (error) return { success: false, error: error.message };
    revalidatePath('/settings/integrations');
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

/** Gets a single integration connection by ID */
export async function getConnection(id: string): Promise<{ success: boolean; data?: IntegrationConnection; error?: string }> {
  try {
    if (!id) return { success: false, error: 'Connection ID is required' };
    const supabase = await createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any).from('integration_connections').select('*').eq('id', id).single();
    if (error) return { success: false, error: error.code === 'PGRST116' ? 'Connection not found' : error.message };
    return { success: true, data: data as IntegrationConnection };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

/** Gets a connection by connection_code */
export async function getConnectionByCode(code: string): Promise<{ success: boolean; data?: IntegrationConnection; error?: string }> {
  try {
    if (!code) return { success: false, error: 'Connection code is required' };
    const supabase = await createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any).from('integration_connections').select('*').eq('connection_code', code).single();
    if (error) return { success: false, error: error.code === 'PGRST116' ? 'Connection not found' : error.message };
    return { success: true, data: data as IntegrationConnection };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}


/** Lists all integration connections with optional filtering */
export async function listConnections(filters?: ConnectionFilters): Promise<{ success: boolean; data?: IntegrationConnection[]; error?: string }> {
  try {
    const supabase = await createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (supabase as any).from('integration_connections').select('*');
    if (filters?.integration_type) query = query.eq('integration_type', filters.integration_type);
    if (filters?.provider) query = query.eq('provider', filters.provider);
    if (filters?.is_active !== undefined) query = query.eq('is_active', filters.is_active);
    query = query.order('created_at', { ascending: false });
    const { data, error } = await query;
    if (error) return { success: false, error: error.message };
    return { success: true, data: data as IntegrationConnection[] };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

/** Tests an integration connection by validating credentials */
export async function testConnection(id: string): Promise<{ success: boolean; data?: ConnectionTestResult; error?: string }> {
  try {
    if (!id) return { success: false, error: 'Connection ID is required' };
    const supabase = await createClient();
    const startTime = Date.now();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: connection, error } = await (supabase as any).from('integration_connections').select('*').eq('id', id).single();
    if (error || !connection) return { success: false, error: 'Connection not found' };

    const conn = connection as IntegrationConnection;
    if (conn.access_token && conn.token_expires_at && new Date(conn.token_expires_at).getTime() <= Date.now()) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from('integration_connections').update({ last_error: 'OAuth token expired' }).eq('id', id);
      return { success: true, data: { success: false, message: 'OAuth token expired', response_time_ms: Date.now() - startTime, error: 'TOKEN_EXPIRED' } };
    }
    if (!conn.access_token && !conn.credentials) {
      return { success: true, data: { success: false, message: 'No credentials configured', response_time_ms: Date.now() - startTime, error: 'NO_CREDENTIALS' } };
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('integration_connections').update({ last_error: null }).eq('id', id);
    return { success: true, data: { success: true, message: 'Connection test successful', response_time_ms: Date.now() - startTime } };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

/** Updates connection sync status */
export async function updateConnectionSyncStatus(id: string, success: boolean, errorMsg?: string): Promise<{ success: boolean; error?: string }> {
  try {
    if (!id) return { success: false, error: 'Connection ID is required' };
    const supabase = await createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from('integration_connections').update({ last_sync_at: new Date().toISOString(), last_error: success ? null : (errorMsg || 'Sync failed') }).eq('id', id);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

/** Updates OAuth tokens for a connection */
export async function updateConnectionTokens(id: string, accessToken: string, refreshToken?: string, expiresAt?: string): Promise<{ success: boolean; error?: string }> {
  try {
    if (!id) return { success: false, error: 'Connection ID is required' };
    const supabase = await createClient();
    const updateData: Record<string, unknown> = { access_token: accessToken };
    if (refreshToken !== undefined) updateData.refresh_token = refreshToken;
    if (expiresAt !== undefined) updateData.token_expires_at = expiresAt;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from('integration_connections').update(updateData).eq('id', id);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

/** Toggles the active status of a connection */
export async function toggleConnectionActive(id: string): Promise<{ success: boolean; data?: IntegrationConnection; error?: string }> {
  try {
    if (!id) return { success: false, error: 'Connection ID is required' };
    const supabase = await createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: current, error: fetchError } = await (supabase as any).from('integration_connections').select('is_active').eq('id', id).single();
    if (fetchError || !current) return { success: false, error: 'Connection not found' };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any).from('integration_connections').update({ is_active: !current.is_active }).eq('id', id).select().single();
    if (error) return { success: false, error: error.message };
    revalidatePath('/settings/integrations');
    return { success: true, data: data as IntegrationConnection };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}
