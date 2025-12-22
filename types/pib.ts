// =====================================================
// v0.51: CUSTOMS - IMPORT DOCUMENTATION (PIB) Types
// =====================================================

// Enums
export type PIBStatus =
  | 'draft'
  | 'submitted'
  | 'document_check'
  | 'physical_check'
  | 'duties_paid'
  | 'released'
  | 'completed'
  | 'cancelled';

export type TransportMode = 'sea' | 'air' | 'land';

export type CustomsOfficeType = 'kppbc' | 'kpu';

// Reference Data Types
export interface CustomsOffice {
  id: string;
  office_code: string;
  office_name: string;
  office_type: CustomsOfficeType;
  city: string | null;
  address: string | null;
  phone: string | null;
  is_active: boolean;
  created_at: string;
}

export interface ImportType {
  id: string;
  type_code: string;
  type_name: string;
  description: string | null;
  default_bm_rate: number | null;
  default_ppn_rate: number;
  default_pph_rate: number | null;
  requires_permit: boolean;
  permit_type: string | null;
  is_active: boolean;
  created_at: string;
}

// Main Document Type
export interface PIBDocument {
  id: string;
  internal_ref: string;
  pib_number: string | null;
  aju_number: string | null;

  // Relations
  job_order_id: string | null;
  customer_id: string | null;

  // Importer
  importer_name: string;
  importer_npwp: string | null;
  importer_address: string | null;

  // Supplier
  supplier_name: string | null;
  supplier_country: string | null;

  // Classification
  import_type_id: string | null;
  customs_office_id: string | null;

  // Transport
  transport_mode: TransportMode | null;
  vessel_name: string | null;
  voyage_number: string | null;
  bill_of_lading: string | null;
  awb_number: string | null;

  // Ports
  port_of_loading: string | null;
  port_of_discharge: string | null;

  // Dates
  eta_date: string | null;
  ata_date: string | null;

  // Cargo
  total_packages: number | null;
  package_type: string | null;
  gross_weight_kg: number | null;

  // Values
  currency: string;
  fob_value: number | null;
  freight_value: number | null;
  insurance_value: number | null;
  cif_value: number | null; // Generated column

  // Exchange
  exchange_rate: number | null;
  cif_value_idr: number | null;

  // Duties
  bea_masuk: number;
  ppn: number;
  pph_import: number;
  total_duties: number; // Generated column

  // Status
  status: PIBStatus;
  submitted_at: string | null;
  duties_paid_at: string | null;
  released_at: string | null;

  // SPPB
  sppb_number: string | null;
  sppb_date: string | null;

  // Documents
  documents: PIBAttachment[];
  notes: string | null;

  // Audit
  created_by: string | null;
  created_at: string;
  updated_at: string;
}


export interface PIBDocumentWithRelations extends PIBDocument {
  import_type?: ImportType;
  customs_office?: CustomsOffice;
  customer?: { id: string; name: string };
  job_order?: { id: string; jo_number: string };
  item_count?: number;
}

// Line Item Type
export interface PIBItem {
  id: string;
  pib_id: string;
  item_number: number;

  // Classification
  hs_code: string;
  hs_description: string | null;

  // Description
  goods_description: string;
  brand: string | null;
  type_model: string | null;
  specifications: string | null;

  // Origin
  country_of_origin: string | null;

  // Quantity
  quantity: number;
  unit: string;

  // Weight
  net_weight_kg: number | null;
  gross_weight_kg: number | null;

  // Value
  unit_price: number | null;
  total_price: number | null;
  currency: string;

  // Duty Rates
  bm_rate: number | null;
  ppn_rate: number;
  pph_rate: number | null;

  // Calculated Duties
  bea_masuk: number | null;
  ppn: number | null;
  pph_import: number | null;

  // Permits
  requires_permit: boolean;
  permit_type: string | null;
  permit_number: string | null;
  permit_date: string | null;

  created_at: string;
}

// Status History Type
export interface PIBStatusHistory {
  id: string;
  pib_id: string;
  previous_status: PIBStatus | null;
  new_status: PIBStatus;
  notes: string | null;
  changed_by: string | null;
  changed_at: string;
}

// Attachment Type
export interface PIBAttachment {
  id: string;
  name: string;
  type: string;
  url: string;
  uploaded_at: string;
}

// Form Data Types
export interface PIBFormData {
  job_order_id?: string;
  customer_id?: string;
  importer_name: string;
  importer_npwp?: string;
  importer_address?: string;
  supplier_name?: string;
  supplier_country?: string;
  import_type_id: string;
  customs_office_id: string;
  transport_mode: TransportMode;
  vessel_name?: string;
  voyage_number?: string;
  bill_of_lading?: string;
  awb_number?: string;
  port_of_loading?: string;
  port_of_discharge?: string;
  eta_date?: string;
  total_packages?: number;
  package_type?: string;
  gross_weight_kg?: number;
  currency: string;
  fob_value: number;
  freight_value?: number;
  insurance_value?: number;
  exchange_rate?: number;
  notes?: string;
}

export interface PIBItemFormData {
  hs_code: string;
  hs_description?: string;
  goods_description: string;
  brand?: string;
  type_model?: string;
  specifications?: string;
  country_of_origin?: string;
  quantity: number;
  unit: string;
  net_weight_kg?: number;
  gross_weight_kg?: number;
  unit_price: number;
  currency?: string;
  bm_rate?: number;
  ppn_rate?: number;
  pph_rate?: number;
  requires_permit?: boolean;
  permit_type?: string;
  permit_number?: string;
  permit_date?: string;
}


// Status Update Data
export interface StatusUpdateData {
  pib_number?: string;
  aju_number?: string;
  sppb_number?: string;
  sppb_date?: string;
  notes?: string;
}

// Calculation Types
export interface ItemDuties {
  bea_masuk: number;
  ppn: number;
  pph_import: number;
  total: number;
}

export interface PIBDutiesTotals {
  bea_masuk: number;
  ppn: number;
  pph_import: number;
  total_duties: number;
}

export interface PIBStatistics {
  active_pibs: number;
  pending_clearance: number;
  in_transit: number;
  released_mtd: number;
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

// Filter Types
export interface PIBFilters {
  status?: PIBStatus;
  customs_office_id?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
}

// Constants
export const PIB_STATUSES: PIBStatus[] = [
  'draft',
  'submitted',
  'document_check',
  'physical_check',
  'duties_paid',
  'released',
  'completed',
  'cancelled',
];

export const TRANSPORT_MODES: TransportMode[] = ['sea', 'air', 'land'];

export const CUSTOMS_OFFICE_TYPES: CustomsOfficeType[] = ['kppbc', 'kpu'];

// Status workflow - defines allowed transitions
export const PIB_STATUS_TRANSITIONS: Record<PIBStatus, PIBStatus[]> = {
  draft: ['submitted', 'cancelled'],
  submitted: ['document_check', 'cancelled'],
  document_check: ['physical_check', 'duties_paid', 'cancelled'],
  physical_check: ['duties_paid', 'cancelled'],
  duties_paid: ['released'],
  released: ['completed'],
  completed: [],
  cancelled: [],
};

// Default duty rates
export const DEFAULT_PPN_RATE = 11;
export const DEFAULT_PPH_RATE = 2.5;
