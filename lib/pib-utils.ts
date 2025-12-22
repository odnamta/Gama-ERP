// =====================================================
// v0.51: CUSTOMS - IMPORT DOCUMENTATION (PIB) Utilities
// =====================================================

import {
  PIBDocument,
  PIBItem,
  PIBStatus,
  PIBFormData,
  PIBItemFormData,
  PIBFilters,
  ItemDuties,
  PIBDutiesTotals,
  ValidationResult,
  ValidationError,
  PIB_STATUS_TRANSITIONS,
  DEFAULT_PPN_RATE,
} from '@/types/pib';

// =====================================================
// CIF Value Calculation
// =====================================================

/**
 * Calculates CIF (Cost, Insurance, Freight) value
 * Property 1: CIF = FOB + Freight + Insurance
 */
export function calculateCIFValue(
  fobValue: number,
  freightValue: number = 0,
  insuranceValue: number = 0
): number {
  return fobValue + freightValue + insuranceValue;
}

// =====================================================
// Item Duty Calculations
// =====================================================

/**
 * Calculates total price for an item
 * Property 2: Total Price = Quantity × Unit Price
 */
export function calculateItemTotalPrice(
  quantity: number,
  unitPrice: number
): number {
  return quantity * unitPrice;
}

/**
 * Calculates duties for a single item
 * Property 3: Duty Calculation
 * - Bea Masuk = total_price × (bm_rate / 100)
 * - PPN = (total_price + Bea_Masuk) × (ppn_rate / 100)
 * - PPh Import = (total_price + Bea_Masuk) × (pph_rate / 100)
 */
export function calculateItemDuties(
  totalPrice: number,
  bmRate: number = 0,
  ppnRate: number = DEFAULT_PPN_RATE,
  pphRate: number = 0
): ItemDuties {
  const beaMasuk = totalPrice * (bmRate / 100);
  const taxBase = totalPrice + beaMasuk;
  const ppn = taxBase * (ppnRate / 100);
  const pphImport = taxBase * (pphRate / 100);

  return {
    bea_masuk: Math.round(beaMasuk * 100) / 100,
    ppn: Math.round(ppn * 100) / 100,
    pph_import: Math.round(pphImport * 100) / 100,
    total: Math.round((beaMasuk + ppn + pphImport) * 100) / 100,
  };
}

// =====================================================
// PIB Duty Aggregation
// =====================================================

/**
 * Aggregates duties from all PIB items
 * Property 4: PIB Duty Aggregation
 * - PIB.beaMasuk = Σ(item.beaMasuk)
 * - PIB.ppn = Σ(item.ppn)
 * - PIB.pphImport = Σ(item.pphImport)
 * - PIB.totalDuties = beaMasuk + ppn + pphImport
 */
export function aggregatePIBDuties(items: PIBItem[]): PIBDutiesTotals {
  const totals = items.reduce(
    (acc, item) => ({
      bea_masuk: acc.bea_masuk + (item.bea_masuk || 0),
      ppn: acc.ppn + (item.ppn || 0),
      pph_import: acc.pph_import + (item.pph_import || 0),
    }),
    { bea_masuk: 0, ppn: 0, pph_import: 0 }
  );

  return {
    bea_masuk: Math.round(totals.bea_masuk * 100) / 100,
    ppn: Math.round(totals.ppn * 100) / 100,
    pph_import: Math.round(totals.pph_import * 100) / 100,
    total_duties: Math.round(
      (totals.bea_masuk + totals.ppn + totals.pph_import) * 100
    ) / 100,
  };
}

// =====================================================
// Currency Conversion
// =====================================================

/**
 * Converts value to IDR using exchange rate
 * Property 5: CIF_IDR = CIF × exchange_rate
 */
export function convertToIDR(value: number, exchangeRate: number): number {
  return Math.round(value * exchangeRate);
}


// =====================================================
// Reference Number Generation
// =====================================================

/**
 * Generates PIB internal reference number
 * Property 11: Format 'PIB-YYYY-NNNNN'
 */
export function generatePIBInternalRef(sequence: number, year?: number): string {
  const currentYear = year || new Date().getFullYear();
  const paddedSequence = String(sequence).padStart(5, '0');
  return `PIB-${currentYear}-${paddedSequence}`;
}

/**
 * Validates PIB internal reference format
 */
export function isValidPIBInternalRef(ref: string): boolean {
  const pattern = /^PIB-\d{4}-\d{5}$/;
  return pattern.test(ref);
}

// =====================================================
// Status Workflow Functions
// =====================================================

/**
 * Checks if a status transition is allowed
 */
export function canTransitionStatus(
  currentStatus: PIBStatus,
  newStatus: PIBStatus
): boolean {
  const allowedTransitions = PIB_STATUS_TRANSITIONS[currentStatus];
  return allowedTransitions.includes(newStatus);
}

/**
 * Gets the next allowed statuses from current status
 */
export function getNextAllowedStatuses(currentStatus: PIBStatus): PIBStatus[] {
  return PIB_STATUS_TRANSITIONS[currentStatus] || [];
}

/**
 * Checks if a PIB can be edited (only in draft status)
 */
export function canEditPIB(status: PIBStatus): boolean {
  return status === 'draft';
}

/**
 * Checks if a PIB can be deleted (only in draft status)
 */
export function canDeletePIB(status: PIBStatus): boolean {
  return status === 'draft';
}

// =====================================================
// Validation Functions
// =====================================================

/**
 * Validates PIB document form data
 */
export function validatePIBDocument(data: Partial<PIBFormData>): ValidationResult {
  const errors: ValidationError[] = [];

  if (!data.importer_name || data.importer_name.trim() === '') {
    errors.push({ field: 'importer_name', message: 'Importer name is required' });
  }

  if (!data.import_type_id) {
    errors.push({ field: 'import_type_id', message: 'Import type must be selected' });
  }

  if (!data.customs_office_id) {
    errors.push({ field: 'customs_office_id', message: 'Customs office must be selected' });
  }

  if (!data.transport_mode) {
    errors.push({ field: 'transport_mode', message: 'Transport mode is required' });
  }

  if (data.fob_value === undefined || data.fob_value === null || data.fob_value < 0) {
    errors.push({ field: 'fob_value', message: 'FOB value must be a positive number' });
  }

  if (data.exchange_rate !== undefined && data.exchange_rate !== null && data.exchange_rate <= 0) {
    errors.push({ field: 'exchange_rate', message: 'Exchange rate must be a positive number' });
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validates PIB item form data
 */
export function validatePIBItem(data: Partial<PIBItemFormData>): ValidationResult {
  const errors: ValidationError[] = [];

  if (!data.hs_code || data.hs_code.trim() === '') {
    errors.push({ field: 'hs_code', message: 'HS code is required' });
  } else if (!validateHSCode(data.hs_code)) {
    errors.push({ field: 'hs_code', message: 'Invalid HS code format' });
  }

  if (!data.goods_description || data.goods_description.trim() === '') {
    errors.push({ field: 'goods_description', message: 'Goods description is required' });
  }

  if (data.quantity === undefined || data.quantity === null || data.quantity <= 0) {
    errors.push({ field: 'quantity', message: 'Quantity must be a positive number' });
  }

  if (!data.unit || data.unit.trim() === '') {
    errors.push({ field: 'unit', message: 'Unit is required' });
  }

  if (data.unit_price === undefined || data.unit_price === null || data.unit_price < 0) {
    errors.push({ field: 'unit_price', message: 'Unit price must be a positive number' });
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validates HS code format (typically 8-10 digits)
 */
export function validateHSCode(hsCode: string): boolean {
  // HS codes are typically 6-10 digits, may have dots
  const cleanCode = hsCode.replace(/\./g, '');
  return /^\d{6,10}$/.test(cleanCode);
}


// =====================================================
// Filtering and Search Functions
// =====================================================

/**
 * Filters PIB documents based on criteria
 * Property 9: All returned documents match all filter criteria
 */
export function filterPIBDocuments(
  documents: PIBDocument[],
  filters: PIBFilters
): PIBDocument[] {
  return documents.filter((doc) => {
    // Filter by status
    if (filters.status && doc.status !== filters.status) {
      return false;
    }

    // Filter by customs office
    if (filters.customs_office_id && doc.customs_office_id !== filters.customs_office_id) {
      return false;
    }

    // Filter by date range (using eta_date)
    if (doc.eta_date) {
      const etaDate = new Date(doc.eta_date);
      
      if (filters.date_from) {
        const fromDate = new Date(filters.date_from);
        fromDate.setHours(0, 0, 0, 0);
        if (etaDate < fromDate) return false;
      }
      
      if (filters.date_to) {
        const toDate = new Date(filters.date_to);
        toDate.setHours(23, 59, 59, 999);
        if (etaDate > toDate) return false;
      }
    } else if (filters.date_from || filters.date_to) {
      // If date filter is set but document has no eta_date, exclude it
      return false;
    }

    return true;
  });
}

/**
 * Searches PIB documents by term
 * Property 10: All returned documents contain search term in reference, PIB number, importer name, or goods description
 */
export function searchPIBDocuments(
  documents: PIBDocument[],
  searchTerm: string
): PIBDocument[] {
  if (!searchTerm || searchTerm.trim() === '') {
    return documents;
  }

  const term = searchTerm.toLowerCase().trim();

  return documents.filter((doc) => {
    // Search in internal reference
    if (doc.internal_ref?.toLowerCase().includes(term)) {
      return true;
    }

    // Search in PIB number
    if (doc.pib_number?.toLowerCase().includes(term)) {
      return true;
    }

    // Search in importer name
    if (doc.importer_name?.toLowerCase().includes(term)) {
      return true;
    }

    // Search in AJU number
    if (doc.aju_number?.toLowerCase().includes(term)) {
      return true;
    }

    return false;
  });
}

// =====================================================
// Formatting Functions
// =====================================================

/**
 * Formats PIB status for display
 */
export function formatPIBStatus(status: PIBStatus): string {
  const labels: Record<PIBStatus, string> = {
    draft: 'Draft',
    submitted: 'Submitted',
    document_check: 'Document Check',
    physical_check: 'Physical Check',
    duties_paid: 'Duties Paid',
    released: 'Released',
    completed: 'Completed',
    cancelled: 'Cancelled',
  };
  return labels[status];
}

/**
 * Gets status badge color class
 */
export function getPIBStatusColor(status: PIBStatus): string {
  const colors: Record<PIBStatus, string> = {
    draft: 'bg-gray-100 text-gray-800 border-gray-200',
    submitted: 'bg-blue-100 text-blue-800 border-blue-200',
    document_check: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    physical_check: 'bg-orange-100 text-orange-800 border-orange-200',
    duties_paid: 'bg-purple-100 text-purple-800 border-purple-200',
    released: 'bg-green-100 text-green-800 border-green-200',
    completed: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    cancelled: 'bg-red-100 text-red-800 border-red-200',
  };
  return colors[status];
}

/**
 * Formats transport mode for display
 */
export function formatTransportMode(mode: string): string {
  const labels: Record<string, string> = {
    sea: 'Sea Freight',
    air: 'Air Freight',
    land: 'Land Transport',
  };
  return labels[mode] || mode;
}

/**
 * Formats currency value
 */
export function formatCurrency(value: number, currency: string = 'USD'): string {
  if (currency === 'IDR') {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  }
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Formats duty amount (always in IDR)
 */
export function formatDutyAmount(value: number): string {
  return formatCurrency(value, 'IDR');
}

/**
 * Formats date for display (DD/MM/YYYY)
 */
export function formatPIBDate(dateString: string | null): string {
  if (!dateString) return '-';
  
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  
  return `${day}/${month}/${year}`;
}

/**
 * Formats PIB reference for display
 */
export function formatPIBReference(internalRef: string, pibNumber?: string | null): string {
  if (pibNumber) {
    return `${internalRef} (${pibNumber})`;
  }
  return internalRef;
}
