// PPE Categories
export type PPECategory =
  | 'head'
  | 'eye'
  | 'ear'
  | 'respiratory'
  | 'hand'
  | 'body'
  | 'foot'
  | 'fall_protection';

export const PPE_CATEGORIES: PPECategory[] = [
  'head',
  'eye',
  'ear',
  'respiratory',
  'hand',
  'body',
  'foot',
  'fall_protection',
];

// Issuance Status
export type IssuanceStatus =
  | 'active'
  | 'returned'
  | 'replaced'
  | 'lost'
  | 'damaged';

export const ISSUANCE_STATUSES: IssuanceStatus[] = [
  'active',
  'returned',
  'replaced',
  'lost',
  'damaged',
];

// Condition values
export type PPECondition = 'new' | 'good' | 'fair' | 'poor' | 'failed';

export const PPE_CONDITIONS: PPECondition[] = ['new', 'good', 'fair', 'poor', 'failed'];

// Inspection actions
export type InspectionAction = 'none' | 'clean' | 'repair' | 'replace';

export const INSPECTION_ACTIONS: InspectionAction[] = ['none', 'clean', 'repair', 'replace'];

// Compliance status
export type PPEComplianceStatus =
  | 'issued'
  | 'missing'
  | 'overdue'
  | 'due_soon'
  | 'not_required';

// PPE Type
export interface PPEType {
  id: string;
  ppe_code: string;
  ppe_name: string;
  description: string | null;
  category: PPECategory;
  replacement_interval_days: number | null;
  is_mandatory: boolean;
  required_for_roles: string[];
  required_for_activities: string[];
  has_sizes: boolean;
  available_sizes: string[];
  unit_cost: number | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
}

// PPE Inventory
export interface PPEInventory {
  id: string;
  ppe_type_id: string;
  size: string | null;
  quantity_in_stock: number;
  reorder_level: number;
  storage_location: string | null;
  last_purchase_date: string | null;
  last_purchase_qty: number | null;
  last_purchase_cost: number | null;
  updated_at: string;
  // Joined
  ppe_type?: PPEType;
}


// Employee type (minimal for PPE module)
export interface PPEEmployee {
  id: string;
  employee_code: string;
  full_name: string;
  status: string;
}

// User Profile (minimal for PPE module)
export interface PPEUserProfile {
  id: string;
  full_name: string | null;
  email: string | null;
}

// PPE Issuance
export interface PPEIssuance {
  id: string;
  employee_id: string;
  ppe_type_id: string;
  quantity: number;
  size: string | null;
  serial_number: string | null;
  issued_date: string;
  issued_by: string | null;
  condition_at_issue: string;
  expected_replacement_date: string | null;
  returned_date: string | null;
  returned_condition: string | null;
  replacement_reason: string | null;
  status: IssuanceStatus;
  notes: string | null;
  created_at: string;
  // Joined
  employee?: PPEEmployee;
  ppe_type?: PPEType;
  issued_by_user?: PPEUserProfile;
  inspections?: PPEInspection[];
}

// PPE Inspection
export interface PPEInspection {
  id: string;
  issuance_id: string;
  inspection_date: string;
  condition: PPECondition;
  findings: string | null;
  action_required: InspectionAction | null;
  action_taken: string | null;
  inspected_by: string | null;
  created_at: string;
  // Joined
  inspected_by_user?: PPEUserProfile;
  issuance?: PPEIssuance;
}

// View types
export interface PPEReplacementDue {
  id: string;
  employee_code: string;
  full_name: string;
  ppe_name: string;
  size: string | null;
  issued_date: string;
  expected_replacement_date: string;
  days_overdue: number;
}

export interface EmployeePPEStatus {
  employee_id: string;
  employee_code: string;
  full_name: string;
  ppe_type_id: string;
  ppe_code: string;
  ppe_name: string;
  is_mandatory: boolean;
  issuance_id: string | null;
  issued_date: string | null;
  expected_replacement_date: string | null;
  ppe_status: PPEComplianceStatus;
}

// Dashboard metrics
export interface PPEDashboardMetrics {
  totalActiveIssuances: number;
  replacementsDueSoon: number;
  replacementsOverdue: number;
  employeesMissingPPE: number;
  lowStockItems: number;
  totalPPETypes: number;
}

// Compliance summary
export interface ComplianceIssueCounts {
  missing: number;
  overdue: number;
  dueSoon: number;
  issued: number;
}

export interface EmployeeComplianceSummary {
  employeeId: string;
  employeeName: string;
  totalMandatory: number;
  issued: number;
  missing: number;
  overdue: number;
  dueSoon: number;
  isCompliant: boolean;
}

// Input types
export interface CreatePPETypeInput {
  ppe_code: string;
  ppe_name: string;
  description?: string;
  category: PPECategory;
  replacement_interval_days?: number | null;
  is_mandatory?: boolean;
  has_sizes?: boolean;
  available_sizes?: string[];
  unit_cost?: number | null;
}

export interface UpdatePPETypeInput {
  ppe_code?: string;
  ppe_name?: string;
  description?: string | null;
  category?: PPECategory;
  replacement_interval_days?: number | null;
  is_mandatory?: boolean;
  has_sizes?: boolean;
  available_sizes?: string[];
  unit_cost?: number | null;
  is_active?: boolean;
  display_order?: number;
}

export interface UpdateInventoryInput {
  quantity_in_stock?: number;
  reorder_level?: number;
  storage_location?: string | null;
}

export interface IssuePPEInput {
  employee_id: string;
  ppe_type_id: string;
  quantity?: number;
  size?: string | null;
  serial_number?: string | null;
  issued_date: string;
  issued_by?: string | null;
  condition_at_issue?: string;
  notes?: string | null;
}

export interface ReturnPPEInput {
  returned_date: string;
  returned_condition: string;
  replacement_reason?: string | null;
  notes?: string | null;
}

export interface ReplacePPEInput {
  returned_date: string;
  returned_condition: string;
  replacement_reason: string;
  notes?: string | null;
  // New issuance data
  new_size?: string | null;
  new_serial_number?: string | null;
  new_condition_at_issue?: string;
}

export interface RecordInspectionInput {
  issuance_id: string;
  inspection_date: string;
  condition: PPECondition;
  findings?: string | null;
  action_required?: InspectionAction | null;
  inspected_by?: string | null;
}

export interface RecordPurchaseInput {
  ppe_type_id: string;
  size?: string | null;
  quantity: number;
  purchase_date: string;
  unit_cost: number;
  storage_location?: string | null;
}
