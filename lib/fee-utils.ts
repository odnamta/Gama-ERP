// =====================================================
// v0.54: CUSTOMS - FEE & DUTY TRACKING Utilities
// =====================================================

import { addDays, differenceInDays, parseISO, isAfter, isBefore, startOfDay } from 'date-fns';
import {
  FeeCategory,
  PaymentStatus,
  ContainerStatus,
  CustomsDocumentType,
  CustomsFeeFormData,
  ContainerFormData,
  CustomsFeeWithRelations,
  ContainerTrackingWithRelations,
  FeeFilters,
  ContainerFilters,
  FreeTimeStatus,
  ValidationResult,
  FEE_CATEGORIES,
  PAYMENT_STATUSES,
  CONTAINER_STATUSES,
} from '@/types/customs-fees';

// =====================================================
// Fee Utility Functions
// =====================================================

/**
 * Format fee amount with currency
 */
export function formatFeeAmount(amount: number, currency: string = 'IDR'): string {
  if (currency === 'IDR') {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Get payment status badge variant for UI
 */
export function getPaymentStatusVariant(
  status: PaymentStatus
): 'default' | 'secondary' | 'success' | 'destructive' | 'warning' {
  switch (status) {
    case 'pending':
      return 'warning';
    case 'paid':
      return 'success';
    case 'waived':
      return 'secondary';
    case 'cancelled':
      return 'destructive';
    default:
      return 'default';
  }
}

/**
 * Get fee category badge variant for UI
 */
export function getFeeCategoryVariant(
  category: FeeCategory
): 'default' | 'secondary' | 'success' | 'destructive' | 'warning' {
  switch (category) {
    case 'duty':
      return 'default';
    case 'tax':
      return 'secondary';
    case 'service':
      return 'success';
    case 'storage':
      return 'warning';
    case 'penalty':
      return 'destructive';
    default:
      return 'default';
  }
}

/**
 * Validate fee category
 */
export function isValidFeeCategory(category: string): category is FeeCategory {
  return FEE_CATEGORIES.includes(category as FeeCategory);
}

/**
 * Validate payment status
 */
export function isValidPaymentStatus(status: string): status is PaymentStatus {
  return PAYMENT_STATUSES.includes(status as PaymentStatus);
}

/**
 * Validate document type
 */
export function isValidDocumentType(type: string): type is CustomsDocumentType {
  return type === 'pib' || type === 'peb';
}

/**
 * Validate fee document link
 */
export function isValidDocumentLink(
  documentType: CustomsDocumentType,
  pibId: string | undefined | null,
  pebId: string | undefined | null
): boolean {
  if (documentType === 'pib') {
    return !!pibId && pibId.length > 0;
  }
  if (documentType === 'peb') {
    return !!pebId && pebId.length > 0;
  }
  return false;
}

/**
 * Validate fee amount
 */
export function isValidFeeAmount(amount: number): boolean {
  return typeof amount === 'number' && !isNaN(amount) && amount > 0;
}

/**
 * Validate fee form data
 */
export function validateFeeForm(data: CustomsFeeFormData): ValidationResult {
  const errors: { field: string; message: string }[] = [];

  // Document type validation
  if (!data.document_type) {
    errors.push({ field: 'document_type', message: 'Document type is required' });
  } else if (!isValidDocumentType(data.document_type)) {
    errors.push({ field: 'document_type', message: 'Invalid document type' });
  }

  // Document link validation
  if (data.document_type === 'pib' && !data.pib_id) {
    errors.push({ field: 'pib_id', message: 'PIB document is required' });
  }
  if (data.document_type === 'peb' && !data.peb_id) {
    errors.push({ field: 'peb_id', message: 'PEB document is required' });
  }

  // Fee type validation
  if (!data.fee_type_id) {
    errors.push({ field: 'fee_type_id', message: 'Fee type is required' });
  }

  // Amount validation
  if (!data.amount) {
    errors.push({ field: 'amount', message: 'Amount is required' });
  } else if (!isValidFeeAmount(data.amount)) {
    errors.push({ field: 'amount', message: 'Amount must be a positive number' });
  }

  // Currency validation
  if (!data.currency || data.currency.trim() === '') {
    errors.push({ field: 'currency', message: 'Currency is required' });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Aggregate fees by category
 */
export function aggregateFeesByCategory(
  fees: CustomsFeeWithRelations[]
): Record<FeeCategory, number> {
  const result: Record<FeeCategory, number> = {
    duty: 0,
    tax: 0,
    service: 0,
    storage: 0,
    penalty: 0,
    other: 0,
  };

  for (const fee of fees) {
    const category = fee.fee_type?.fee_category || 'other';
    if (isValidFeeCategory(category)) {
      result[category] += fee.amount;
    }
  }

  return result;
}

/**
 * Filter fees by criteria
 */
export function filterFees(
  fees: CustomsFeeWithRelations[],
  filters: FeeFilters
): CustomsFeeWithRelations[] {
  return fees.filter((fee) => {
    // Document type filter
    if (filters.document_type && fee.document_type !== filters.document_type) {
      return false;
    }

    // Fee category filter
    if (filters.fee_category && fee.fee_type?.fee_category !== filters.fee_category) {
      return false;
    }

    // Payment status filter
    if (filters.payment_status && fee.payment_status !== filters.payment_status) {
      return false;
    }

    // Date range filter
    if (filters.date_from) {
      const feeDate = parseISO(fee.created_at);
      const fromDate = parseISO(filters.date_from);
      if (isBefore(feeDate, startOfDay(fromDate))) {
        return false;
      }
    }

    if (filters.date_to) {
      const feeDate = parseISO(fee.created_at);
      const toDate = parseISO(filters.date_to);
      if (isAfter(feeDate, addDays(startOfDay(toDate), 1))) {
        return false;
      }
    }

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const matchesDescription = fee.description?.toLowerCase().includes(searchLower);
      const matchesFeeType = fee.fee_type?.fee_name.toLowerCase().includes(searchLower);
      const matchesPibRef = fee.pib?.internal_ref?.toLowerCase().includes(searchLower);
      const matchesPebRef = fee.peb?.internal_ref?.toLowerCase().includes(searchLower);
      const matchesJobNumber = fee.job_order?.jo_number?.toLowerCase().includes(searchLower);

      if (!matchesDescription && !matchesFeeType && !matchesPibRef && !matchesPebRef && !matchesJobNumber) {
        return false;
      }
    }

    return true;
  });
}

// =====================================================
// Container Utility Functions
// =====================================================

/**
 * Calculate free time end date
 */
export function calculateFreeTimeEnd(arrivalDate: string, freeTimeDays: number): string {
  // Parse as local date to avoid timezone issues
  const [year, month, day] = arrivalDate.split('-').map(Number);
  const arrival = new Date(year, month - 1, day);
  const freeTimeEnd = addDays(arrival, freeTimeDays);
  
  // Format as YYYY-MM-DD
  const y = freeTimeEnd.getFullYear();
  const m = String(freeTimeEnd.getMonth() + 1).padStart(2, '0');
  const d = String(freeTimeEnd.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Calculate storage days
 */
export function calculateStorageDays(freeTimeEnd: string, gateOutDate: string): number {
  // Parse as local dates to avoid timezone issues
  const [fy, fm, fd] = freeTimeEnd.split('-').map(Number);
  const [gy, gm, gd] = gateOutDate.split('-').map(Number);
  const freeEnd = new Date(fy, fm - 1, fd);
  const gateOut = new Date(gy, gm - 1, gd);
  const days = differenceInDays(gateOut, freeEnd);
  return Math.max(0, days);
}

/**
 * Calculate total storage fee
 */
export function calculateStorageFee(storageDays: number, dailyRate: number): number {
  if (storageDays <= 0 || dailyRate <= 0) {
    return 0;
  }
  return Math.round(storageDays * dailyRate * 100) / 100;
}

/**
 * Get days until free time expires (negative if expired)
 */
export function getDaysUntilFreeTimeExpires(freeTimeEnd: string): number {
  const [y, m, d] = freeTimeEnd.split('-').map(Number);
  const freeEnd = new Date(y, m - 1, d);
  const today = startOfDay(new Date());
  return differenceInDays(freeEnd, today);
}

/**
 * Get free time status for a container
 */
export function getFreeTimeStatus(freeTimeEnd: string | null): FreeTimeStatus {
  if (!freeTimeEnd) {
    return 'ok';
  }

  const daysRemaining = getDaysUntilFreeTimeExpires(freeTimeEnd);

  if (daysRemaining < 0) {
    return 'critical';
  }
  if (daysRemaining <= 2) {
    return 'warning';
  }
  return 'ok';
}

/**
 * Get free time status variant for UI
 */
export function getFreeTimeStatusVariant(
  status: FreeTimeStatus
): 'default' | 'success' | 'warning' | 'destructive' {
  switch (status) {
    case 'ok':
      return 'success';
    case 'warning':
      return 'warning';
    case 'critical':
      return 'destructive';
    default:
      return 'default';
  }
}

/**
 * Validate container status
 */
export function isValidContainerStatus(status: string): status is ContainerStatus {
  return CONTAINER_STATUSES.includes(status as ContainerStatus);
}

/**
 * Get container status badge variant for UI
 */
export function getContainerStatusVariant(
  status: ContainerStatus
): 'default' | 'secondary' | 'success' | 'warning' {
  switch (status) {
    case 'at_port':
      return 'warning';
    case 'gate_out':
      return 'secondary';
    case 'delivered':
      return 'success';
    case 'returned_empty':
      return 'default';
    default:
      return 'default';
  }
}

/**
 * Validate container form data
 */
export function validateContainerForm(data: ContainerFormData): ValidationResult {
  const errors: { field: string; message: string }[] = [];

  // Container number validation
  if (!data.container_number || data.container_number.trim() === '') {
    errors.push({ field: 'container_number', message: 'Container number is required' });
  }

  // Free time days validation
  if (data.free_time_days === undefined || data.free_time_days === null) {
    errors.push({ field: 'free_time_days', message: 'Free time days is required' });
  } else if (data.free_time_days < 0) {
    errors.push({ field: 'free_time_days', message: 'Free time days must be non-negative' });
  }

  // Daily rate validation (if provided)
  if (data.daily_rate !== undefined && data.daily_rate !== null && data.daily_rate < 0) {
    errors.push({ field: 'daily_rate', message: 'Daily rate must be non-negative' });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Filter containers by criteria
 */
export function filterContainers(
  containers: ContainerTrackingWithRelations[],
  filters: ContainerFilters
): ContainerTrackingWithRelations[] {
  return containers.filter((container) => {
    // Status filter
    if (filters.status && container.status !== filters.status) {
      return false;
    }

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const matchesNumber = container.container_number.toLowerCase().includes(searchLower);
      const matchesTerminal = container.terminal?.toLowerCase().includes(searchLower);
      const matchesPibRef = container.pib?.internal_ref?.toLowerCase().includes(searchLower);
      const matchesPebRef = container.peb?.internal_ref?.toLowerCase().includes(searchLower);
      const matchesJobNumber = container.job_order?.jo_number?.toLowerCase().includes(searchLower);

      if (!matchesNumber && !matchesTerminal && !matchesPibRef && !matchesPebRef && !matchesJobNumber) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Calculate container storage details
 */
export function calculateContainerStorageDetails(
  arrivalDate: string | null,
  freeTimeDays: number,
  gateOutDate: string | null,
  dailyRate: number | null
): {
  freeTimeEnd: string | null;
  storageDays: number;
  totalStorageFee: number;
} {
  if (!arrivalDate) {
    return { freeTimeEnd: null, storageDays: 0, totalStorageFee: 0 };
  }

  const freeTimeEnd = calculateFreeTimeEnd(arrivalDate, freeTimeDays);

  if (!gateOutDate) {
    return { freeTimeEnd, storageDays: 0, totalStorageFee: 0 };
  }

  const storageDays = calculateStorageDays(freeTimeEnd, gateOutDate);
  const totalStorageFee = dailyRate ? calculateStorageFee(storageDays, dailyRate) : 0;

  return { freeTimeEnd, storageDays, totalStorageFee };
}
