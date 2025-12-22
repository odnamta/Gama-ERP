// types/assessment.ts
// TypeScript types for Engineering Technical Assessments module (v0.58)

export type AssessmentStatus =
  | 'draft'
  | 'in_progress'
  | 'pending_review'
  | 'approved'
  | 'rejected'
  | 'superseded';

export type ConclusionType =
  | 'approved'
  | 'approved_with_conditions'
  | 'not_approved'
  | 'further_study';

export interface TemplateSection {
  section: string;
  title: string;
}

export interface TechnicalAssessmentType {
  id: string;
  type_code: string;
  type_name: string;
  description: string | null;
  template_sections: TemplateSection[];
  is_active: boolean;
  display_order: number;
  created_at: string;
}

export interface CargoDimensions {
  length: number;
  width: number;
  height: number;
  cog_x: number;
  cog_y: number;
  cog_z: number;
}

export interface Calculation {
  name: string;
  formula: string;
  inputs: Record<string, number>;
  result: number;
  unit: string;
}

export interface EquipmentRecommendation {
  equipment_type: string;
  specification: string;
  quantity: number;
  notes: string;
}

export interface DocumentAttachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  uploaded_at: string;
}

export interface DrawingAttachment {
  id: string;
  name: string;
  url: string;
  drawing_number: string;
  revision: string;
  uploaded_at: string;
}


export interface TechnicalAssessment {
  id: string;
  assessment_number: string;
  assessment_type_id: string;
  assessment_type?: TechnicalAssessmentType;
  quotation_id: string | null;
  project_id: string | null;
  job_order_id: string | null;
  route_survey_id: string | null;
  customer_id: string | null;
  title: string;
  description: string | null;
  cargo_description: string | null;
  cargo_weight_tons: number | null;
  cargo_dimensions: CargoDimensions | null;
  assessment_data: Record<string, unknown>;
  calculations: Calculation[];
  equipment_recommended: EquipmentRecommendation[];
  recommendations: string | null;
  limitations: string | null;
  assumptions: string | null;
  conclusion: ConclusionType | null;
  conclusion_notes: string | null;
  prepared_by: string | null;
  prepared_at: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  approved_by: string | null;
  approved_at: string | null;
  status: AssessmentStatus;
  revision_number: number;
  previous_revision_id: string | null;
  revision_notes: string | null;
  documents: DocumentAttachment[];
  drawings: DrawingAttachment[];
  created_at: string;
  updated_at: string;
  // Joined relations
  quotation?: { quotation_number: string };
  project?: { name: string };
  job_order?: { jo_number: string };
  customer?: { name: string };
  route_survey?: { survey_number: string };
  lifting_plans?: LiftingPlan[];
  axle_calculations?: AxleLoadCalculation[];
  prepared_by_employee?: { full_name: string };
  reviewed_by_employee?: { full_name: string };
  approved_by_employee?: { full_name: string };
}

export interface LiftingPlan {
  id: string;
  assessment_id: string;
  lift_number: number;
  lift_description: string | null;
  load_weight_tons: number;
  rigging_weight_tons: number;
  total_lifted_weight_tons: number | null;
  crane_type: string | null;
  crane_capacity_tons: number | null;
  crane_radius_m: number | null;
  crane_boom_length_m: number | null;
  crane_capacity_at_radius_tons: number | null;
  utilization_percentage: number | null;
  rigging_configuration: string | null;
  sling_type: string | null;
  sling_capacity_tons: number | null;
  sling_quantity: number | null;
  spreader_beam: boolean;
  spreader_capacity_tons: number | null;
  crane_position: string | null;
  load_pickup_position: string | null;
  load_set_position: string | null;
  swing_radius_m: number | null;
  swing_clear: boolean | null;
  ground_bearing_required_kpa: number | null;
  ground_preparation: string | null;
  outrigger_mats: boolean;
  mat_size: string | null;
  lift_drawing_url: string | null;
  notes: string | null;
  created_at: string;
}

export interface AxleLoad {
  axle_number: number;
  axle_type: string;
  load_tons: number;
  max_allowed_tons: number;
  utilization_pct: number;
}

export interface AxleLoadCalculation {
  id: string;
  assessment_id: string;
  configuration_name: string | null;
  trailer_type: string | null;
  trailer_axle_count: number | null;
  trailer_axle_spacing_m: number | null;
  trailer_tare_weight_tons: number | null;
  prime_mover_type: string | null;
  prime_mover_axle_count: number | null;
  prime_mover_weight_tons: number | null;
  cargo_weight_tons: number | null;
  cargo_cog_from_front_m: number | null;
  axle_loads: AxleLoad[];
  total_weight_tons: number | null;
  max_single_axle_load_tons: number | null;
  max_tandem_axle_load_tons: number | null;
  within_legal_limits: boolean | null;
  permit_required: boolean | null;
  notes: string | null;
  created_at: string;
}


// Input types for actions
export interface CreateAssessmentInput {
  assessment_type_id: string;
  title: string;
  description?: string;
  quotation_id?: string;
  project_id?: string;
  job_order_id?: string;
  route_survey_id?: string;
  customer_id?: string;
  cargo_description?: string;
  cargo_weight_tons?: number;
  cargo_dimensions?: CargoDimensions;
}

export interface UpdateAssessmentInput extends Partial<CreateAssessmentInput> {
  assessment_data?: Record<string, unknown>;
  calculations?: Calculation[];
  equipment_recommended?: EquipmentRecommendation[];
  recommendations?: string;
  limitations?: string;
  assumptions?: string;
}

export interface CreateLiftingPlanInput {
  assessment_id: string;
  lift_number?: number;
  lift_description?: string;
  load_weight_tons: number;
  rigging_weight_tons?: number;
  crane_type?: string;
  crane_capacity_tons?: number;
  crane_radius_m?: number;
  crane_boom_length_m?: number;
  crane_capacity_at_radius_tons?: number;
  rigging_configuration?: string;
  sling_type?: string;
  sling_capacity_tons?: number;
  sling_quantity?: number;
  spreader_beam?: boolean;
  spreader_capacity_tons?: number;
  crane_position?: string;
  load_pickup_position?: string;
  load_set_position?: string;
  swing_radius_m?: number;
  swing_clear?: boolean;
  ground_bearing_required_kpa?: number;
  ground_preparation?: string;
  outrigger_mats?: boolean;
  mat_size?: string;
  lift_drawing_url?: string;
  notes?: string;
}

export interface UpdateLiftingPlanInput extends Partial<Omit<CreateLiftingPlanInput, 'assessment_id'>> {}

export interface CreateAxleCalcInput {
  assessment_id: string;
  configuration_name?: string;
  trailer_type?: string;
  trailer_axle_count?: number;
  trailer_axle_spacing_m?: number;
  trailer_tare_weight_tons?: number;
  prime_mover_type?: string;
  prime_mover_axle_count?: number;
  prime_mover_weight_tons?: number;
  cargo_weight_tons: number;
  cargo_cog_from_front_m?: number;
  axle_loads?: AxleLoad[];
  notes?: string;
}

export interface UpdateAxleCalcInput extends Partial<Omit<CreateAxleCalcInput, 'assessment_id'>> {}

export interface AssessmentFilters {
  assessment_type_id?: string;
  status?: AssessmentStatus;
  customer_id?: string;
  project_id?: string;
  quotation_id?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface ActionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Status counts for dashboard
export interface AssessmentStatusCounts {
  draft: number;
  in_progress: number;
  pending_review: number;
  approved: number;
  rejected: number;
  superseded: number;
  total: number;
}

// Indonesian legal axle limits (tons)
export const AXLE_LIMITS = {
  single: 8,
  tandem: 14,
  tridem: 21,
} as const;

// Valid conclusion values
export const VALID_CONCLUSIONS: ConclusionType[] = [
  'approved',
  'approved_with_conditions',
  'not_approved',
  'further_study',
];

// Valid status values
export const VALID_STATUSES: AssessmentStatus[] = [
  'draft',
  'in_progress',
  'pending_review',
  'approved',
  'rejected',
  'superseded',
];

// Status transition rules
export const STATUS_TRANSITIONS: Record<AssessmentStatus, AssessmentStatus[]> = {
  draft: ['in_progress', 'pending_review'],
  in_progress: ['pending_review', 'draft'],
  pending_review: ['approved', 'rejected', 'in_progress'],
  approved: ['superseded'],
  rejected: ['draft', 'in_progress'],
  superseded: [],
};
