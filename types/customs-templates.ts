// =====================================================
// v0.55: CUSTOMS - DOCUMENT TEMPLATES Types
// =====================================================

// Document type categories
export type DocumentType =
  | 'packing_list'
  | 'commercial_invoice'
  | 'coo'
  | 'insurance_cert'
  | 'bill_of_lading'
  | 'shipping_instruction'
  | 'cargo_manifest';

// Paper settings
export type PaperSize = 'A4' | 'Letter';
export type Orientation = 'portrait' | 'landscape';

// Document status
export type GeneratedDocumentStatus = 'draft' | 'final' | 'sent' | 'archived';

// Placeholder source types
export type PlaceholderSourceType =
  | 'pib'
  | 'peb'
  | 'pib_items'
  | 'peb_items'
  | 'manual'
  | 'current_date';

// Placeholder definition
export interface PlaceholderDefinition {
  key: string;
  label: string;
  source: string;
  type?: 'text' | 'number' | 'date' | 'array';
  defaultValue?: string;
}

// Template entity
export interface CustomsDocumentTemplate {
  id: string;
  template_code: string;
  template_name: string;
  description: string | null;
  document_type: DocumentType;
  template_html: string;
  placeholders: PlaceholderDefinition[];
  paper_size: PaperSize;
  orientation: Orientation;
  include_company_header: boolean;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// Generated document entity
export interface GeneratedCustomsDocument {
  id: string;
  document_number: string;
  template_id: string;
  pib_id: string | null;
  peb_id: string | null;
  job_order_id: string | null;
  document_data: Record<string, unknown>;
  pdf_url: string | null;
  status: GeneratedDocumentStatus;
  created_by: string | null;
  created_at: string;
}

// With relations
export interface GeneratedDocumentWithRelations extends GeneratedCustomsDocument {
  template?: CustomsDocumentTemplate;
  pib?: { id: string; internal_ref: string; importer_name: string };
  peb?: { id: string; internal_ref: string; exporter_name: string };
  job_order?: { id: string; jo_number: string };
}

// Form data for template creation/editing
export interface TemplateFormData {
  template_code: string;
  template_name: string;
  description?: string;
  document_type: DocumentType;
  template_html: string;
  placeholders: PlaceholderDefinition[];
  paper_size: PaperSize;
  orientation: Orientation;
  include_company_header: boolean;
}

// Form data for document generation
export interface GenerateDocumentFormData {
  template_id: string;
  pib_id?: string;
  peb_id?: string;
  job_order_id?: string;
  document_data: Record<string, unknown>;
}

// Validation types
export interface TemplateValidationError {
  field: string;
  message: string;
}

export interface TemplateValidationResult {
  valid: boolean;
  errors: TemplateValidationError[];
}

export interface PlaceholderValidationResult {
  valid: boolean;
  missing: string[];
  unused: string[];
}

// Filter types
export interface TemplateFilters {
  document_type?: DocumentType;
  is_active?: boolean;
  search?: string;
}

export interface GeneratedDocumentFilters {
  status?: GeneratedDocumentStatus;
  template_id?: string;
  pib_id?: string;
  peb_id?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
}

// Constants
export const DOCUMENT_TYPES: DocumentType[] = [
  'packing_list',
  'commercial_invoice',
  'coo',
  'insurance_cert',
  'bill_of_lading',
  'shipping_instruction',
  'cargo_manifest',
];

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  packing_list: 'Packing List',
  commercial_invoice: 'Commercial Invoice',
  coo: 'Certificate of Origin',
  insurance_cert: 'Insurance Certificate',
  bill_of_lading: 'Bill of Lading',
  shipping_instruction: 'Shipping Instruction',
  cargo_manifest: 'Cargo Manifest',
};

export const PAPER_SIZES: PaperSize[] = ['A4', 'Letter'];

export const ORIENTATIONS: Orientation[] = ['portrait', 'landscape'];

export const GENERATED_DOCUMENT_STATUSES: GeneratedDocumentStatus[] = [
  'draft',
  'final',
  'sent',
  'archived',
];

export const DOCUMENT_STATUS_LABELS: Record<GeneratedDocumentStatus, string> = {
  draft: 'Draft',
  final: 'Final',
  sent: 'Sent',
  archived: 'Archived',
};

// Status workflow - defines allowed transitions
export const DOCUMENT_STATUS_TRANSITIONS: Record<GeneratedDocumentStatus, GeneratedDocumentStatus[]> = {
  draft: ['final', 'archived'],
  final: ['sent', 'archived'],
  sent: ['archived'],
  archived: [],
};

// Valid placeholder sources
export const VALID_PLACEHOLDER_SOURCES = [
  'manual',
  'current_date',
  'pib_items',
  'peb_items',
] as const;

// PIB field sources
export const PIB_FIELD_SOURCES = [
  'pib.importer_name',
  'pib.importer_npwp',
  'pib.importer_address',
  'pib.supplier_name',
  'pib.supplier_country',
  'pib.port_of_loading',
  'pib.port_of_discharge',
  'pib.vessel_name',
  'pib.voyage_number',
  'pib.bill_of_lading',
  'pib.awb_number',
  'pib.total_packages',
  'pib.package_type',
  'pib.gross_weight_kg',
  'pib.currency',
  'pib.fob_value',
  'pib.freight_value',
  'pib.insurance_value',
  'pib.cif_value',
] as const;

// PEB field sources
export const PEB_FIELD_SOURCES = [
  'peb.exporter_name',
  'peb.exporter_npwp',
  'peb.exporter_address',
  'peb.consignee_name',
  'peb.consignee_country',
  'peb.consignee_address',
  'peb.port_of_loading',
  'peb.port_of_discharge',
  'peb.final_destination',
  'peb.vessel_name',
  'peb.voyage_number',
  'peb.bill_of_lading',
  'peb.awb_number',
  'peb.total_packages',
  'peb.package_type',
  'peb.gross_weight_kg',
  'peb.currency',
  'peb.fob_value',
] as const;
