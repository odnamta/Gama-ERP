// =====================================================
// v0.54: CUSTOMS - FEE & DUTY TRACKING Types
// =====================================================

// Fee Categories
export type FeeCategory = 'duty' | 'tax' | 'service' | 'storage' | 'penalty' | 'other';

// Payment Status
export type PaymentStatus = 'pending' | 'paid' | 'waived' | 'cancelled';

// Document Type
export type CustomsDocumentType = 'pib' | 'peb';

// Container Status
export type ContainerStatus = 'at_port' | 'gate_out' | 'delivered' | 'returned_empty';

// Container Size
export type ContainerSize = '20' | '40' | '40HC' | '45';

// Container Type
export type ContainerType = 'dry' | 'reefer' | 'flat_rack' | 'open_top';

// Free Time Status
export type FreeTimeStatus = 'ok' | 'warning' | 'critical';

// Fee Type Master
export interface CustomsFeeType {
  id: string;
  fee_code: string;
  fee_name: string;
  description: string | null;
  fee_category: FeeCategory;
  is_government_fee: boolean;
  is_active: boolean;
  display_order: number;
  created_at: string;
}

// Customs Fee
export interface CustomsFee {
  id: string;
  document_type: CustomsDocumentType;
  pib_id: string | null;
  peb_id: string | null;
  job_order_id: string | null;
  fee_type_id: string;
  description: string | null;
  currency: string;
  amount: number;
  payment_status: PaymentStatus;
  payment_date: string | null;
  payment_reference: string | null;
  payment_method: string | null;
  ntpn: string | null;
  ntb: string | null;
  billing_code: string | null;
  vendor_id: string | null;
  vendor_invoice_number: string | null;
  receipt_url: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// Fee with relations
export interface CustomsFeeWithRelations extends CustomsFee {
  fee_type?: CustomsFeeType;
  pib?: { id: string; internal_ref: string };
  peb?: { id: string; internal_ref: string };
  job_order?: { id: string; jo_number: string };
  vendor?: { id: string; vendor_name: string };
}

// Container Tracking
export interface ContainerTracking {
  id: string;
  pib_id: string | null;
  peb_id: string | null;
  job_order_id: string | null;
  container_number: string;
  container_size: ContainerSize | null;
  container_type: ContainerType | null;
  seal_number: string | null;
  terminal: string | null;
  arrival_date: string | null;
  free_time_days: number;
  free_time_end: string | null;
  gate_out_date: string | null;
  storage_days: number | null;
  daily_rate: number | null;
  total_storage_fee: number | null;
  status: ContainerStatus;
  created_at: string;
  updated_at: string;
}

// Container with relations
export interface ContainerTrackingWithRelations extends ContainerTracking {
  pib?: { id: string; internal_ref: string };
  peb?: { id: string; internal_ref: string };
  job_order?: { id: string; jo_number: string };
}

// Job Customs Cost Summary
export interface JobCustomsCostSummary {
  job_order_id: string;
  jo_number: string;
  customer_name: string;
  total_duties: number;
  total_taxes: number;
  total_services: number;
  total_storage: number;
  total_penalties: number;
  total_customs_cost: number;
  total_paid: number;
  total_pending: number;
}

// Pending Payment (from view)
export interface PendingCustomsPayment extends CustomsFee {
  fee_name: string;
  fee_category: FeeCategory;
  is_government_fee: boolean;
  pib_ref: string | null;
  peb_ref: string | null;
  jo_number: string | null;
}

// Form Data Types
export interface CustomsFeeFormData {
  document_type: CustomsDocumentType;
  pib_id?: string;
  peb_id?: string;
  job_order_id?: string;
  fee_type_id: string;
  description?: string;
  currency: string;
  amount: number;
  vendor_id?: string;
  vendor_invoice_number?: string;
  notes?: string;
}

export interface PaymentFormData {
  payment_date: string;
  payment_reference?: string;
  payment_method?: string;
  ntpn?: string;
  ntb?: string;
  billing_code?: string;
  receipt_url?: string;
}

export interface ContainerFormData {
  pib_id?: string;
  peb_id?: string;
  job_order_id?: string;
  container_number: string;
  container_size?: ContainerSize;
  container_type?: ContainerType;
  seal_number?: string;
  terminal?: string;
  arrival_date?: string;
  free_time_days: number;
  daily_rate?: number;
}

// Filter Types
export interface FeeFilters {
  document_type?: CustomsDocumentType;
  fee_category?: FeeCategory;
  payment_status?: PaymentStatus;
  date_from?: string;
  date_to?: string;
  search?: string;
}

export interface ContainerFilters {
  status?: ContainerStatus;
  search?: string;
}

// Statistics
export interface FeeStatistics {
  total_fees: number;
  total_pending: number;
  total_paid: number;
  pending_amount: number;
  paid_amount: number;
}

export interface ContainerStatistics {
  total_containers: number;
  at_port: number;
  past_free_time: number;
  total_demurrage: number;
}

// Validation Types
export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

// Constants
export const FEE_CATEGORIES: FeeCategory[] = ['duty', 'tax', 'service', 'storage', 'penalty', 'other'];

export const PAYMENT_STATUSES: PaymentStatus[] = ['pending', 'paid', 'waived', 'cancelled'];

export const CONTAINER_STATUSES: ContainerStatus[] = ['at_port', 'gate_out', 'delivered', 'returned_empty'];

export const CONTAINER_SIZES: ContainerSize[] = ['20', '40', '40HC', '45'];

export const CONTAINER_TYPES: ContainerType[] = ['dry', 'reefer', 'flat_rack', 'open_top'];

export const FEE_CATEGORY_LABELS: Record<FeeCategory, string> = {
  duty: 'Duty',
  tax: 'Tax',
  service: 'Service',
  storage: 'Storage',
  penalty: 'Penalty',
  other: 'Other',
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: 'Pending',
  paid: 'Paid',
  waived: 'Waived',
  cancelled: 'Cancelled',
};

export const CONTAINER_STATUS_LABELS: Record<ContainerStatus, string> = {
  at_port: 'At Port',
  gate_out: 'Gate Out',
  delivered: 'Delivered',
  returned_empty: 'Returned Empty',
};

export const CONTAINER_SIZE_LABELS: Record<ContainerSize, string> = {
  '20': "20'",
  '40': "40'",
  '40HC': "40' HC",
  '45': "45'",
};

export const CONTAINER_TYPE_LABELS: Record<ContainerType, string> = {
  dry: 'Dry',
  reefer: 'Reefer',
  flat_rack: 'Flat Rack',
  open_top: 'Open Top',
};

// Payment Methods
export const PAYMENT_METHODS = [
  'bank_transfer',
  'cash',
  'check',
  'online_banking',
  'other',
] as const;

export type PaymentMethod = typeof PAYMENT_METHODS[number];

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  bank_transfer: 'Bank Transfer',
  cash: 'Cash',
  check: 'Check',
  online_banking: 'Online Banking',
  other: 'Other',
};
