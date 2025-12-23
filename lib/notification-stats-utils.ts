// lib/notification-stats-utils.ts
// Notification statistics utilities for n8n Notification Workflows (v0.67)

import { createClient } from '@/lib/supabase/client';
import type {
  NotificationStats,
  StatsFilter,
  NotificationChannel,
  NotificationStatus,
  NotificationLogEntry,
} from '@/types/notification-workflows';

// ============================================================================
// Statistics Calculation
// ============================================================================

/**
 * Calculate notification statistics from log entries
 */
export function calculateStats(entries: NotificationLogEntry[]): NotificationStats {
  const total = entries.length;

  // Initialize counters
  const byChannel: Record<NotificationChannel, number> = {
    email: 0,
    whatsapp: 0,
    in_app: 0,
    push: 0,
  };

  const byStatus: Record<NotificationStatus, number> = {
    pending: 0,
    sent: 0,
    delivered: 0,
    failed: 0,
    bounced: 0,
  };

  const errorCounts: Map<string, number> = new Map();

  // Count entries
  for (const entry of entries) {
    // Count by channel
    if (entry.channel in byChannel) {
      byChannel[entry.channel]++;
    }

    // Count by status
    if (entry.status in byStatus) {
      byStatus[entry.status]++;
    }

    // Count errors
    if (entry.error_message) {
      const normalizedError = normalizeErrorMessage(entry.error_message);
      errorCounts.set(normalizedError, (errorCounts.get(normalizedError) || 0) + 1);
    }
  }

  // Calculate rates (excluding pending)
  const completedCount = total - byStatus.pending;
  const successCount = byStatus.delivered;
  const failureCount = byStatus.failed + byStatus.bounced;

  const successRate = completedCount > 0 ? (successCount / completedCount) * 100 : 0;
  const failureRate = completedCount > 0 ? (failureCount / completedCount) * 100 : 0;

  // Get common errors sorted by count
  const commonErrors = Array.from(errorCounts.entries())
    .map(([error, count]) => ({ error, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10); // Top 10 errors

  return {
    total_sent: total,
    by_channel: byChannel,
    by_status: byStatus,
    success_rate: Math.round(successRate * 100) / 100,
    failure_rate: Math.round(failureRate * 100) / 100,
    common_errors: commonErrors,
  };
}

/**
 * Normalize error messages for aggregation
 * Groups similar errors together
 */
function normalizeErrorMessage(error: string): string {
  // Truncate long errors
  if (error.length > 100) {
    error = error.substring(0, 100) + '...';
  }

  // Remove specific IDs, timestamps, etc.
  error = error
    .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '[UUID]')
    .replace(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/g, '[TIMESTAMP]')
    .replace(/\d{10,}/g, '[ID]');

  return error.trim();
}

// ============================================================================
// Statistics Queries
// ============================================================================

/**
 * Get statistics with optional filters
 */
export async function getNotificationStats(
  filter?: StatsFilter
): Promise<{ data: NotificationStats; error: string | null }> {
  const supabase = createClient();

  let query = supabase.from('notification_log').select('*');

  // Apply filters
  if (filter?.start_date) {
    query = query.gte('created_at', filter.start_date);
  }

  if (filter?.end_date) {
    query = query.lte('created_at', filter.end_date);
  }

  if (filter?.event_type) {
    // Need to join with templates to filter by event_type
    // For now, we'll filter in memory after fetching
  }

  if (filter?.channel) {
    query = query.eq('channel', filter.channel);
  }

  const { data, error } = await query;

  if (error) {
    return {
      data: createEmptyStats(),
      error: error.message,
    };
  }

  const stats = calculateStats((data as NotificationLogEntry[]) || []);
  return { data: stats, error: null };
}

/**
 * Get statistics grouped by channel
 */
export async function getStatsByChannel(
  filter?: Omit<StatsFilter, 'channel'>
): Promise<{ data: Record<NotificationChannel, NotificationStats>; error: string | null }> {
  const channels: NotificationChannel[] = ['email', 'whatsapp', 'in_app', 'push'];
  const result: Record<NotificationChannel, NotificationStats> = {} as Record<NotificationChannel, NotificationStats>;

  for (const channel of channels) {
    const { data, error } = await getNotificationStats({ ...filter, channel });
    if (error) {
      return { data: {} as Record<NotificationChannel, NotificationStats>, error };
    }
    result[channel] = data;
  }

  return { data: result, error: null };
}

/**
 * Get daily statistics for a date range
 */
export async function getDailyStats(
  startDate: string,
  endDate: string
): Promise<{ data: Array<{ date: string; stats: NotificationStats }>; error: string | null }> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('notification_log')
    .select('*')
    .gte('created_at', startDate)
    .lte('created_at', endDate)
    .order('created_at');

  if (error) {
    return { data: [], error: error.message };
  }

  // Group by date
  const entriesByDate: Record<string, NotificationLogEntry[]> = {};
  
  for (const entry of (data as NotificationLogEntry[]) || []) {
    const date = entry.created_at.split('T')[0];
    if (!entriesByDate[date]) {
      entriesByDate[date] = [];
    }
    entriesByDate[date].push(entry);
  }

  // Calculate stats for each date
  const dailyStats = Object.entries(entriesByDate)
    .map(([date, entries]) => ({
      date,
      stats: calculateStats(entries),
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return { data: dailyStats, error: null };
}

// ============================================================================
// Statistics Helpers
// ============================================================================

/**
 * Create empty statistics object
 */
export function createEmptyStats(): NotificationStats {
  return {
    total_sent: 0,
    by_channel: {
      email: 0,
      whatsapp: 0,
      in_app: 0,
      push: 0,
    },
    by_status: {
      pending: 0,
      sent: 0,
      delivered: 0,
      failed: 0,
      bounced: 0,
    },
    success_rate: 0,
    failure_rate: 0,
    common_errors: [],
  };
}

/**
 * Merge multiple statistics objects
 */
export function mergeStats(statsArray: NotificationStats[]): NotificationStats {
  if (statsArray.length === 0) {
    return createEmptyStats();
  }

  const merged = createEmptyStats();

  for (const stats of statsArray) {
    merged.total_sent += stats.total_sent;

    // Merge channel counts
    for (const channel of Object.keys(merged.by_channel) as NotificationChannel[]) {
      merged.by_channel[channel] += stats.by_channel[channel];
    }

    // Merge status counts
    for (const status of Object.keys(merged.by_status) as NotificationStatus[]) {
      merged.by_status[status] += stats.by_status[status];
    }

    // Merge errors
    for (const error of stats.common_errors) {
      const existing = merged.common_errors.find(e => e.error === error.error);
      if (existing) {
        existing.count += error.count;
      } else {
        merged.common_errors.push({ ...error });
      }
    }
  }

  // Recalculate rates
  const completedCount = merged.total_sent - merged.by_status.pending;
  const successCount = merged.by_status.delivered;
  const failureCount = merged.by_status.failed + merged.by_status.bounced;

  merged.success_rate = completedCount > 0 
    ? Math.round((successCount / completedCount) * 10000) / 100 
    : 0;
  merged.failure_rate = completedCount > 0 
    ? Math.round((failureCount / completedCount) * 10000) / 100 
    : 0;

  // Sort and limit errors
  merged.common_errors.sort((a, b) => b.count - a.count);
  merged.common_errors = merged.common_errors.slice(0, 10);

  return merged;
}

/**
 * Calculate percentage for a channel
 */
export function getChannelPercentage(stats: NotificationStats, channel: NotificationChannel): number {
  if (stats.total_sent === 0) return 0;
  return Math.round((stats.by_channel[channel] / stats.total_sent) * 10000) / 100;
}

/**
 * Calculate percentage for a status
 */
export function getStatusPercentage(stats: NotificationStats, status: NotificationStatus): number {
  if (stats.total_sent === 0) return 0;
  return Math.round((stats.by_status[status] / stats.total_sent) * 10000) / 100;
}

/**
 * Get the most used channel
 */
export function getMostUsedChannel(stats: NotificationStats): NotificationChannel | null {
  if (stats.total_sent === 0) return null;

  let maxChannel: NotificationChannel | null = null;
  let maxCount = 0;

  for (const [channel, count] of Object.entries(stats.by_channel)) {
    if (count > maxCount) {
      maxCount = count;
      maxChannel = channel as NotificationChannel;
    }
  }

  return maxChannel;
}

/**
 * Check if statistics indicate healthy delivery
 * (success rate > 90%, failure rate < 5%)
 */
export function isHealthyDelivery(stats: NotificationStats): boolean {
  // Need at least some completed notifications to assess
  const completedCount = stats.total_sent - stats.by_status.pending;
  if (completedCount < 10) return true; // Not enough data

  return stats.success_rate >= 90 && stats.failure_rate < 5;
}

/**
 * Get delivery health status
 */
export type DeliveryHealth = 'healthy' | 'warning' | 'critical' | 'unknown';

export function getDeliveryHealth(stats: NotificationStats): DeliveryHealth {
  const completedCount = stats.total_sent - stats.by_status.pending;
  
  if (completedCount < 10) return 'unknown';
  
  if (stats.success_rate >= 90 && stats.failure_rate < 5) {
    return 'healthy';
  }
  
  if (stats.success_rate >= 70 && stats.failure_rate < 15) {
    return 'warning';
  }
  
  return 'critical';
}
