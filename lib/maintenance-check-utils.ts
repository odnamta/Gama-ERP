// =====================================================
// v0.70: MAINTENANCE CHECK UTILITIES
// Utilities for scheduled maintenance check operations
// =====================================================

import {
  MaintenancePriority,
  MaintenanceItem,
  MaintenanceCheckResult,
  MaintenanceCheckSummary,
  MAINTENANCE_PRIORITY_THRESHOLDS,
  DEFAULT_MAINTENANCE_LOOKAHEAD_DAYS,
} from '@/types/maintenance-check';

// =====================================================
// MAINTENANCE DETECTION FUNCTIONS
// =====================================================

/**
 * Calculate days until a due date from today
 * @param dueDate - The due date string (ISO format)
 * @param referenceDate - Optional reference date (defaults to today)
 * @returns Number of days until due (negative if overdue)
 */
export function calculateDaysUntilDue(dueDate: string, referenceDate?: Date): number {
  const today = referenceDate || new Date();
  today.setHours(0, 0, 0, 0);
  
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  
  const diffTime = due.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Check if a maintenance item is overdue
 * @param daysUntilDue - Days until the maintenance is due
 * @returns True if overdue (negative days)
 */
export function isMaintenanceOverdue(daysUntilDue: number): boolean {
  return daysUntilDue < 0;
}

/**
 * Check if a maintenance item is upcoming within the specified days
 * @param daysUntilDue - Days until the maintenance is due
 * @param withinDays - Number of days to look ahead
 * @returns True if due within the specified days
 */
export function isMaintenanceUpcoming(daysUntilDue: number, withinDays: number = DEFAULT_MAINTENANCE_LOOKAHEAD_DAYS): boolean {
  return daysUntilDue >= 0 && daysUntilDue <= withinDays;
}

/**
 * Filter maintenance items to get upcoming maintenance within specified days
 * @param items - Array of maintenance items
 * @param withinDays - Number of days to look ahead (default: 7)
 * @returns Array of upcoming maintenance items
 */
export function getUpcomingMaintenanceItems(
  items: MaintenanceItem[],
  withinDays: number = DEFAULT_MAINTENANCE_LOOKAHEAD_DAYS
): MaintenanceItem[] {
  return items.filter(item => 
    !item.is_overdue && item.days_until_due >= 0 && item.days_until_due <= withinDays
  );
}

/**
 * Filter maintenance items to get overdue maintenance
 * @param items - Array of maintenance items
 * @returns Array of overdue maintenance items
 */
export function getOverdueMaintenanceItems(items: MaintenanceItem[]): MaintenanceItem[] {
  return items.filter(item => item.is_overdue);
}

// =====================================================
// MAINTENANCE PRIORITIZATION FUNCTIONS
// =====================================================

/**
 * Classify maintenance priority based on days until due
 * - critical: overdue (days_until_due < 0)
 * - high: due within 3 days
 * - normal: due within 7 days or more
 * 
 * @param daysUntilDue - Days until the maintenance is due
 * @returns MaintenancePriority classification
 */
export function classifyMaintenancePriority(daysUntilDue: number): MaintenancePriority {
  // Overdue items are always critical
  if (daysUntilDue < 0) {
    return 'critical';
  }
  
  // Due within 3 days is high priority
  if (daysUntilDue <= MAINTENANCE_PRIORITY_THRESHOLDS.high) {
    return 'high';
  }
  
  // Everything else is normal priority
  return 'normal';
}

/**
 * Classify maintenance priority for a maintenance item
 * Uses the item's days_until_due or is_overdue flag
 * 
 * @param item - MaintenanceItem to classify
 * @returns MaintenancePriority classification
 */
export function classifyMaintenanceItemPriority(item: MaintenanceItem): MaintenancePriority {
  // If explicitly marked as overdue, it's critical
  if (item.is_overdue) {
    return 'critical';
  }
  
  return classifyMaintenancePriority(item.days_until_due);
}

/**
 * Group maintenance items by status (overdue vs upcoming)
 * @param items - Array of maintenance items
 * @returns MaintenanceCheckResult with grouped items
 */
export function groupMaintenanceItems(items: MaintenanceItem[]): MaintenanceCheckResult {
  const overdue: MaintenanceItem[] = [];
  const upcoming: MaintenanceItem[] = [];
  const equipmentIds = new Set<string>();
  
  for (const item of items) {
    equipmentIds.add(item.equipment_id);
    
    if (item.is_overdue || item.days_until_due < 0) {
      overdue.push(item);
    } else {
      upcoming.push(item);
    }
  }
  
  return {
    overdue,
    upcoming,
    equipment_count: equipmentIds.size,
    maintenance_items_found: items.length,
  };
}

/**
 * Create a maintenance item from raw data
 * @param data - Raw maintenance data
 * @param referenceDate - Optional reference date for calculating days until due
 * @returns MaintenanceItem
 */
export function createMaintenanceItem(
  data: {
    id: string;
    equipment_id: string;
    equipment_name: string;
    equipment_code: string;
    maintenance_type: string;
    maintenance_type_id: string;
    due_date: string;
    trigger_type: string;
    current_reading?: number | null;
    due_reading?: number | null;
  },
  referenceDate?: Date
): MaintenanceItem {
  const daysUntilDue = calculateDaysUntilDue(data.due_date, referenceDate);
  const isOverdue = isMaintenanceOverdue(daysUntilDue);
  const priority = classifyMaintenancePriority(daysUntilDue);
  
  return {
    id: data.id,
    equipment_id: data.equipment_id,
    equipment_name: data.equipment_name,
    equipment_code: data.equipment_code,
    maintenance_type: data.maintenance_type,
    maintenance_type_id: data.maintenance_type_id,
    due_date: data.due_date,
    days_until_due: daysUntilDue,
    is_overdue: isOverdue,
    priority,
    trigger_type: data.trigger_type,
    current_reading: data.current_reading ?? null,
    due_reading: data.due_reading ?? null,
  };
}

/**
 * Generate a summary of the maintenance check results
 * @param result - MaintenanceCheckResult
 * @param lookaheadDays - Number of days used for lookahead
 * @returns MaintenanceCheckSummary
 */
export function generateMaintenanceCheckSummary(
  result: MaintenanceCheckResult,
  lookaheadDays: number = DEFAULT_MAINTENANCE_LOOKAHEAD_DAYS
): MaintenanceCheckSummary {
  const allItems = [...result.overdue, ...result.upcoming];
  
  const byPriority: Record<MaintenancePriority, { count: number }> = {
    critical: { count: 0 },
    high: { count: 0 },
    normal: { count: 0 },
  };
  
  for (const item of allItems) {
    byPriority[item.priority].count++;
  }
  
  return {
    equipment_count: result.equipment_count,
    maintenance_items_found: result.maintenance_items_found,
    by_priority: byPriority,
    overdue_count: result.overdue.length,
    upcoming_count: result.upcoming.length,
    check_date: new Date().toISOString(),
    lookahead_days: lookaheadDays,
  };
}

/**
 * Sort maintenance items by priority (critical first, then high, then normal)
 * Within same priority, sort by days until due (most urgent first)
 * @param items - Array of maintenance items
 * @returns Sorted array of maintenance items
 */
export function sortMaintenanceItemsByPriority(items: MaintenanceItem[]): MaintenanceItem[] {
  const priorityOrder: Record<MaintenancePriority, number> = {
    critical: 0,
    high: 1,
    normal: 2,
  };
  
  return [...items].sort((a, b) => {
    // First sort by priority
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priorityDiff !== 0) {
      return priorityDiff;
    }
    
    // Then sort by days until due (most urgent first)
    return a.days_until_due - b.days_until_due;
  });
}

/**
 * Get priority display label
 * @param priority - MaintenancePriority
 * @returns Human-readable label
 */
export function getPriorityLabel(priority: MaintenancePriority): string {
  const labels: Record<MaintenancePriority, string> = {
    critical: 'Critical',
    high: 'High',
    normal: 'Normal',
  };
  return labels[priority];
}

/**
 * Get priority badge variant for UI styling
 * @param priority - MaintenancePriority
 * @returns Badge variant string
 */
export function getPriorityBadgeVariant(priority: MaintenancePriority): 'destructive' | 'warning' | 'secondary' {
  switch (priority) {
    case 'critical':
      return 'destructive';
    case 'high':
      return 'warning';
    case 'normal':
      return 'secondary';
  }
}

/**
 * Validate that a maintenance item has all required fields
 * @param item - MaintenanceItem to validate
 * @returns True if valid
 */
export function isValidMaintenanceItem(item: MaintenanceItem): boolean {
  return (
    typeof item.id === 'string' && item.id.length > 0 &&
    typeof item.equipment_id === 'string' && item.equipment_id.length > 0 &&
    typeof item.equipment_name === 'string' && item.equipment_name.length > 0 &&
    typeof item.equipment_code === 'string' && item.equipment_code.length > 0 &&
    typeof item.maintenance_type === 'string' && item.maintenance_type.length > 0 &&
    typeof item.maintenance_type_id === 'string' && item.maintenance_type_id.length > 0 &&
    typeof item.due_date === 'string' && item.due_date.length > 0 &&
    typeof item.days_until_due === 'number' &&
    typeof item.is_overdue === 'boolean' &&
    ['critical', 'high', 'normal'].includes(item.priority) &&
    typeof item.trigger_type === 'string'
  );
}
