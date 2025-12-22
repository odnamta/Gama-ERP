// =====================================================
// v0.42: EQUIPMENT - MAINTENANCE TRACKING UTILITIES
// Pure utility functions for maintenance calculations
// =====================================================

import {
  MaintenanceTriggerType,
  MaintenanceUrgency,
  MaintenancePartInput,
  MaintenanceRecordInput,
  MaintenanceScheduleInput,
  ValidationResult,
} from '@/types/maintenance';

/**
 * Calculate total price for a single part
 * @param quantity - Part quantity
 * @param unitPrice - Price per unit
 * @returns Total price (quantity × unitPrice)
 */
export function calculatePartTotal(quantity: number, unitPrice: number): number {
  return quantity * unitPrice;
}

/**
 * Calculate total parts cost from array of parts
 * @param parts - Array of maintenance parts
 * @returns Sum of all part totals
 */
export function calculatePartsCost(parts: MaintenancePartInput[]): number {
  return parts.reduce((sum, part) => sum + calculatePartTotal(part.quantity, part.unitPrice), 0);
}

/**
 * Calculate total maintenance cost
 * @param laborCost - Labor cost
 * @param partsCost - Parts cost
 * @param externalCost - External/third-party cost
 * @returns Total cost (labor + parts + external)
 */
export function calculateTotalCost(
  laborCost: number,
  partsCost: number,
  externalCost: number
): number {
  return laborCost + partsCost + externalCost;
}

/**
 * Determine maintenance urgency status based on trigger type and due values
 * @param triggerType - Type of schedule trigger (km, hours, days, date)
 * @param nextDueDate - Next due date (for date/days triggers)
 * @param nextDueKm - Next due kilometer reading (for km trigger)
 * @param currentKm - Current asset kilometer reading
 * @param warningDays - Days before due to show warning
 * @param warningKm - Kilometers before due to show warning
 * @returns Urgency status: 'overdue', 'due_soon', or 'ok'
 */
export function getMaintenanceUrgency(
  triggerType: MaintenanceTriggerType,
  nextDueDate: string | undefined,
  nextDueKm: number | undefined,
  currentKm: number | undefined,
  warningDays: number,
  warningKm: number
): MaintenanceUrgency {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Date-based or days-based triggers
  if (triggerType === 'date' || triggerType === 'days') {
    if (!nextDueDate) return 'ok';
    
    const dueDate = new Date(nextDueDate);
    dueDate.setHours(0, 0, 0, 0);

    // Check if overdue
    if (dueDate <= today) return 'overdue';

    // Check if within warning threshold
    const warningDate = new Date(dueDate);
    warningDate.setDate(warningDate.getDate() - warningDays);
    if (today >= warningDate) return 'due_soon';

    return 'ok';
  }

  // Kilometer-based trigger
  if (triggerType === 'km') {
    if (nextDueKm === undefined || currentKm === undefined) return 'ok';

    // Check if overdue
    if (currentKm >= nextDueKm) return 'overdue';

    // Check if within warning threshold
    if (currentKm >= nextDueKm - warningKm) return 'due_soon';

    return 'ok';
  }

  // Hours-based trigger (similar to km)
  if (triggerType === 'hours') {
    // For now, treat hours similar to km
    return 'ok';
  }

  return 'ok';
}


/**
 * Calculate remaining days or km until maintenance due
 * @param triggerType - Type of schedule trigger
 * @param nextDueDate - Next due date
 * @param nextDueKm - Next due kilometer reading
 * @param currentKm - Current asset kilometer reading
 * @returns Remaining days (for date/days) or km (for km trigger)
 */
export function calculateRemaining(
  triggerType: MaintenanceTriggerType,
  nextDueDate: string | undefined,
  nextDueKm: number | undefined,
  currentKm: number | undefined
): number {
  if (triggerType === 'date' || triggerType === 'days') {
    if (!nextDueDate) return 999999;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(nextDueDate);
    dueDate.setHours(0, 0, 0, 0);
    const diffTime = dueDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  if (triggerType === 'km') {
    if (nextDueKm === undefined || currentKm === undefined) return 999999;
    return nextDueKm - currentKm;
  }

  return 999999;
}

/**
 * Calculate next due date based on trigger type and interval
 * @param triggerType - Type of schedule trigger
 * @param triggerValue - Interval value (days for days trigger)
 * @param completionDate - Date when maintenance was completed
 * @returns Next due date or null if not applicable
 */
export function calculateNextDueDate(
  triggerType: MaintenanceTriggerType,
  triggerValue: number | undefined,
  completionDate: Date
): Date | null {
  if (triggerType === 'days' && triggerValue) {
    const nextDate = new Date(completionDate);
    nextDate.setDate(nextDate.getDate() + triggerValue);
    return nextDate;
  }

  if (triggerType === 'date') {
    // For specific date types like KIR, add 6 months
    const nextDate = new Date(completionDate);
    nextDate.setMonth(nextDate.getMonth() + 6);
    return nextDate;
  }

  return null;
}

/**
 * Calculate next due km based on current km and interval
 * @param currentKm - Current kilometer reading
 * @param intervalKm - Kilometer interval
 * @returns Next due kilometer reading
 */
export function calculateNextDueKm(currentKm: number, intervalKm: number): number {
  return currentKm + intervalKm;
}

/**
 * Format maintenance record number
 * @param sequence - Sequence number
 * @param year - Year
 * @returns Formatted record number (MNT-YYYY-NNNNN)
 */
export function formatMaintenanceRecordNumber(sequence: number, year: number): string {
  return `MNT-${year}-${String(sequence).padStart(5, '0')}`;
}

/**
 * Validate maintenance record number format
 * @param recordNumber - Record number to validate
 * @returns True if valid format
 */
export function isValidRecordNumberFormat(recordNumber: string): boolean {
  const pattern = /^MNT-\d{4}-\d{5}$/;
  return pattern.test(recordNumber);
}

/**
 * Parse maintenance record number
 * @param recordNumber - Record number to parse
 * @returns Object with year and sequence, or null if invalid
 */
export function parseRecordNumber(recordNumber: string): { year: number; sequence: number } | null {
  const match = recordNumber.match(/^MNT-(\d{4})-(\d{5})$/);
  if (!match) return null;
  return {
    year: parseInt(match[1], 10),
    sequence: parseInt(match[2], 10),
  };
}


/**
 * Validate maintenance record input
 * @param input - Maintenance record input to validate
 * @returns Validation result with valid flag and error messages
 */
export function validateMaintenanceRecordInput(input: MaintenanceRecordInput): ValidationResult {
  const errors: string[] = [];

  // Required fields
  if (!input.assetId) errors.push('Asset is required');
  if (!input.maintenanceTypeId) errors.push('Maintenance type is required');
  if (!input.maintenanceDate) errors.push('Maintenance date is required');
  if (!input.description?.trim()) errors.push('Description is required');

  // Cost validation
  if (input.laborCost < 0) errors.push('Labor cost cannot be negative');
  if (input.externalCost < 0) errors.push('External cost cannot be negative');

  // Performed at validation
  const validPerformedAt = ['internal', 'external', 'field'];
  if (!validPerformedAt.includes(input.performedAt)) {
    errors.push('Invalid location type');
  }

  // Parts validation
  for (let i = 0; i < input.parts.length; i++) {
    const part = input.parts[i];
    if (!part.partName?.trim()) {
      errors.push(`Part ${i + 1}: Part name is required`);
    }
    if (part.quantity <= 0) {
      errors.push(`Part ${i + 1}: Quantity must be positive`);
    }
    if (part.unitPrice < 0) {
      errors.push(`Part ${i + 1}: Unit price cannot be negative`);
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate maintenance schedule input
 * @param input - Maintenance schedule input to validate
 * @returns Validation result with valid flag and error messages
 */
export function validateMaintenanceScheduleInput(input: MaintenanceScheduleInput): ValidationResult {
  const errors: string[] = [];

  // Required fields
  if (!input.assetId) errors.push('Asset is required');
  if (!input.maintenanceTypeId) errors.push('Maintenance type is required');
  if (!input.triggerType) errors.push('Trigger type is required');

  // Trigger type validation
  const validTriggerTypes = ['km', 'hours', 'days', 'date'];
  if (input.triggerType && !validTriggerTypes.includes(input.triggerType)) {
    errors.push('Invalid trigger type');
  }

  // Trigger-specific validation
  if (input.triggerType === 'km' && !input.triggerValue) {
    errors.push('Interval (km) is required for km-based schedules');
  }
  if (input.triggerType === 'days' && !input.triggerValue) {
    errors.push('Interval (days) is required for time-based schedules');
  }
  if (input.triggerType === 'date' && !input.triggerDate) {
    errors.push('Due date is required for date-based schedules');
  }
  if (input.triggerType === 'hours' && !input.triggerValue) {
    errors.push('Interval (hours) is required for hour-based schedules');
  }

  // Warning threshold validation
  if (input.warningKm !== undefined && input.warningKm < 0) {
    errors.push('Warning km cannot be negative');
  }
  if (input.warningDays !== undefined && input.warningDays < 0) {
    errors.push('Warning days cannot be negative');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Format currency for display (Indonesian Rupiah)
 * @param amount - Amount to format
 * @returns Formatted currency string
 */
export function formatMaintenanceCost(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format remaining value for display
 * @param remaining - Remaining value (days or km)
 * @param triggerType - Type of trigger
 * @returns Formatted string
 */
export function formatRemaining(remaining: number, triggerType: MaintenanceTriggerType): string {
  if (triggerType === 'date' || triggerType === 'days') {
    if (remaining < 0) {
      return `${Math.abs(remaining)} days overdue`;
    }
    if (remaining === 0) {
      return 'Due today';
    }
    return `${remaining} days`;
  }

  if (triggerType === 'km') {
    if (remaining < 0) {
      return `${Math.abs(remaining).toLocaleString()} km overdue`;
    }
    return `${remaining.toLocaleString()} km`;
  }

  return String(remaining);
}

/**
 * Get urgency color class for styling
 * @param urgency - Urgency status
 * @returns Tailwind color class
 */
export function getUrgencyColorClass(urgency: MaintenanceUrgency): string {
  switch (urgency) {
    case 'overdue':
      return 'text-red-600 bg-red-50 border-red-200';
    case 'due_soon':
      return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    case 'ok':
      return 'text-green-600 bg-green-50 border-green-200';
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200';
  }
}

/**
 * Get urgency badge variant
 * @param urgency - Urgency status
 * @returns Badge variant string
 */
export function getUrgencyBadgeVariant(urgency: MaintenanceUrgency): 'destructive' | 'warning' | 'success' | 'secondary' {
  switch (urgency) {
    case 'overdue':
      return 'destructive';
    case 'due_soon':
      return 'warning';
    case 'ok':
      return 'success';
    default:
      return 'secondary';
  }
}

/**
 * Get status display text
 * @param status - Maintenance record status
 * @returns Display text
 */
export function getStatusDisplayText(status: string): string {
  const statusMap: Record<string, string> = {
    scheduled: 'Scheduled',
    in_progress: 'In Progress',
    completed: 'Completed',
    cancelled: 'Cancelled',
  };
  return statusMap[status] || status;
}

/**
 * Get performed at display text
 * @param performedAt - Where maintenance was performed
 * @returns Display text
 */
export function getPerformedAtDisplayText(performedAt: string): string {
  const performedAtMap: Record<string, string> = {
    internal: 'Internal Workshop',
    external: 'External Workshop',
    field: 'Field Service',
  };
  return performedAtMap[performedAt] || performedAt;
}
