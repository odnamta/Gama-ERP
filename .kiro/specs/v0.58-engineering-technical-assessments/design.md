# Design Document: Engineering Technical Assessments

## Overview

The Engineering Technical Assessments module provides a comprehensive system for creating, managing, and reviewing technical engineering documents essential for heavy-haul logistics operations. The system supports multiple assessment types including lifting studies, load calculations, equipment specifications, structural assessments, and transport feasibility studies.

The architecture follows the existing Gama ERP patterns with:
- Supabase PostgreSQL for data persistence with RLS policies
- Next.js App Router for UI with server actions
- TypeScript for type safety
- shadcn/ui components for consistent UI

Key features include:
- Template-based assessment creation with predefined sections per type
- Auto-generated assessment numbers with type-specific prefixes
- Detailed lifting plan calculations with crane capacity and utilization tracking
- Axle load distribution calculations with legal compliance checking
- Multi-stage review workflow with revision control
- Document and drawing attachments

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           UI Layer (Next.js)                            │
├─────────────────────────────────────────────────────────────────────────┤
│  /engineering/assessments          Assessment list with filters         │
│  /engineering/assessments/new      Create new assessment                │
│  /engineering/assessments/[id]     Assessment detail view (tabs)        │
│  /engineering/assessments/[id]/edit Edit assessment                     │
│  /engineering/assessments/[id]/lifting-plan  Manage lifting plans       │
│  /engineering/assessments/[id]/axle-calc     Manage axle calculations   │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        Business Logic Layer                             │
├─────────────────────────────────────────────────────────────────────────┤
│  lib/assessment-utils.ts     Utility functions, calculations            │
│  lib/assessment-actions.ts   Server actions for CRUD operations         │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         Data Layer (Supabase)                           │
├─────────────────────────────────────────────────────────────────────────┤
│  technical_assessment_types   Assessment type definitions               │
│  technical_assessments        Main assessment records                   │
│  lifting_plans                Lifting study details                     │
│  axle_load_calculations       Transport load calculations               │
└─────────────────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### UI Components

```
components/assessments/
├── assessment-list.tsx           # List view with filters and status cards
├── assessment-status-cards.tsx   # Status count summary cards
├── assessment-form.tsx           # Create/edit assessment form
├── assessment-detail-view.tsx    # Tabbed detail view
├── assessment-summary-tab.tsx    # Summary with cargo/COG data
├── calculations-tab.tsx          # Calculations display/editor
├── lifting-plan-tab.tsx          # Lifting plans management
├── axle-calc-tab.tsx             # Axle load calculations
├── drawings-tab.tsx              # Drawings viewer
├── documents-tab.tsx             # Documents list
├── lifting-plan-form.tsx         # Create/edit lifting plan
├── lifting-plan-table.tsx        # Lifting plans list
├── crane-capacity-table.tsx      # Crane capacity display
├── rigging-config-form.tsx       # Rigging configuration
├── axle-calc-form.tsx            # Axle calculation form
├── axle-load-table.tsx           # Axle loads display
├── conclusion-form.tsx           # Conclusion and recommendations
├── review-workflow-panel.tsx     # Review/approval actions
└── revision-history.tsx          # Revision history display
```

### Server Actions Interface

```typescript
// lib/assessment-actions.ts

// Assessment CRUD
createAssessment(data: CreateAssessmentInput): Promise<ActionResult<TechnicalAssessment>>
updateAssessment(id: string, data: UpdateAssessmentInput): Promise<ActionResult<TechnicalAssessment>>
deleteAssessment(id: string): Promise<ActionResult<void>>
getAssessment(id: string): Promise<TechnicalAssessment | null>
getAssessments(filters: AssessmentFilters): Promise<TechnicalAssessment[]>

// Workflow actions
submitForReview(id: string, preparedBy: string): Promise<ActionResult<TechnicalAssessment>>
reviewAssessment(id: string, reviewedBy: string): Promise<ActionResult<TechnicalAssessment>>
approveAssessment(id: string, approvedBy: string, conclusion: string, notes?: string): Promise<ActionResult<TechnicalAssessment>>
rejectAssessment(id: string, notes: string): Promise<ActionResult<TechnicalAssessment>>
createRevision(id: string, revisionNotes: string): Promise<ActionResult<TechnicalAssessment>>

// Lifting plans
createLiftingPlan(data: CreateLiftingPlanInput): Promise<ActionResult<LiftingPlan>>
updateLiftingPlan(id: string, data: UpdateLiftingPlanInput): Promise<ActionResult<LiftingPlan>>
deleteLiftingPlan(id: string): Promise<ActionResult<void>>
getLiftingPlans(assessmentId: string): Promise<LiftingPlan[]>

// Axle calculations
createAxleCalculation(data: CreateAxleCalcInput): Promise<ActionResult<AxleLoadCalculation>>
updateAxleCalculation(id: string, data: UpdateAxleCalcInput): Promise<ActionResult<AxleLoadCalculation>>
deleteAxleCalculation(id: string): Promise<ActionResult<void>>
getAxleCalculations(assessmentId: string): Promise<AxleLoadCalculation[]>
```

### Utility Functions Interface

```typescript
// lib/assessment-utils.ts

// Number generation
generateAssessmentNumber(typeCode: string): string

// Lifting calculations
calculateTotalLiftedWeight(loadWeight: number, riggingWeight: number): number
calculateUtilizationPercentage(totalWeight: number, capacityAtRadius: number): number
isUtilizationSafe(utilizationPct: number, threshold?: number): boolean
calculateGroundBearing(totalWeight: number, outriggerArea: number): number

// Axle load calculations
calculateAxleLoads(config: AxleLoadConfig): AxleLoadResult[]
calculateTotalWeight(cargo: number, trailer: number, primeMover: number): number
isWithinLegalLimits(axleLoads: AxleLoadResult[], limits: AxleLimits): boolean
determinePermitRequired(axleLoads: AxleLoadResult[], limits: AxleLimits): boolean

// Status helpers
getStatusColor(status: AssessmentStatus): string
getStatusLabel(status: AssessmentStatus): string
canTransitionTo(currentStatus: AssessmentStatus, targetStatus: AssessmentStatus): boolean

// Validation
validateAssessmentData(data: AssessmentData, type: AssessmentType): ValidationResult
validateLiftingPlan(plan: LiftingPlanInput): ValidationResult
validateAxleCalculation(calc: AxleCalcInput): ValidationResult

// Formatting
formatAssessmentNumber(number: string): string
formatWeight(tons: number): string
formatPercentage(value: number): string
formatDimensions(dims: CargoDimensions): string
```

## Data Models

### TypeScript Types

```typescript
// types/assessment.ts

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
  lifting_plans?: LiftingPlan[];
  axle_calculations?: AxleLoadCalculation[];
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
  ground_bearing_required_kpa?: number;
  ground_preparation?: string;
  outrigger_mats?: boolean;
  mat_size?: string;
}

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
}

export interface AssessmentFilters {
  assessment_type_id?: string;
  status?: AssessmentStatus;
  customer_id?: string;
  project_id?: string;
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
```

### Database Schema

The database schema follows the provided SQL specification with:
- `technical_assessment_types` - Assessment type definitions with template sections
- `technical_assessments` - Main assessment records with flexible JSON data
- `lifting_plans` - Detailed lifting study data
- `axle_load_calculations` - Transport load distribution data
- Auto-generated assessment numbers via trigger function
- Appropriate indexes for common queries



## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Assessment Data Round-Trip

*For any* valid TechnicalAssessment object with cargo_dimensions, assessment_data, calculations, and equipment_recommended, storing it to the database and retrieving it should produce an equivalent object with all JSON fields intact.

**Validates: Requirements 1.1, 2.4, 2.5, 2.6, 2.7**

### Property 2: Assessment Number Format

*For any* created assessment with a given assessment_type, the generated assessment_number should match the pattern `{TYPE_PREFIX}-YYYY-NNNN` where TYPE_PREFIX is the first 3 characters of the type_code, YYYY is the current year, and NNNN is a zero-padded sequence number.

**Validates: Requirements 2.1**

### Property 3: Required Field Validation

*For any* assessment creation attempt, if assessment_type_id or title is missing, the creation should fail with a validation error. Similarly, for lifting plans without assessment_id or load_weight_tons, and axle calculations without assessment_id or cargo_weight_tons, creation should fail.

**Validates: Requirements 2.3, 6.1, 7.1**

### Property 4: Workflow State Transitions

*For any* assessment, the status transitions should follow the valid workflow:
- draft → in_progress → pending_review → approved/rejected
- When submitted for review, prepared_by and prepared_at must be set
- When reviewed, reviewed_by and reviewed_at must be set
- When approved, approved_by and approved_at must be set, and conclusion must be valid
- When rejected, status becomes rejected

**Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5**

### Property 5: Revision Tracking Invariants

*For any* assessment, revision_number starts at 1. When a revision is created, the new assessment has revision_number = previous + 1, previous_revision_id links to the old assessment, and the old assessment status becomes superseded. Creating a revision without revision_notes should fail.

**Validates: Requirements 5.1, 5.2, 5.3, 5.4**

### Property 6: Lifting Plan Calculations

*For any* lifting plan with load_weight_tons and rigging_weight_tons, total_lifted_weight_tons should equal load_weight_tons + rigging_weight_tons. If crane_capacity_at_radius_tons is set, utilization_percentage should equal (total_lifted_weight_tons / crane_capacity_at_radius_tons) * 100. If utilization_percentage > 80, the lift should be flagged for additional review.

**Validates: Requirements 6.2, 6.4, 6.5**

### Property 7: Axle Load Calculations

*For any* axle load calculation with cargo_weight_tons, trailer_tare_weight_tons, and prime_mover_weight_tons, total_weight_tons should equal the sum of all weights. The within_legal_limits flag should be true if and only if all axle loads are within their max_allowed_tons. If any axle exceeds its limit, permit_required should be true.

**Validates: Requirements 7.5, 7.6, 7.7, 7.8**

### Property 8: Filter Results Correctness

*For any* filter criteria applied to assessments, all returned assessments should match the filter criteria. Status counts should accurately reflect the number of assessments in each status. Sorting should produce correctly ordered results.

**Validates: Requirements 9.2, 9.3, 9.4**

### Property 9: Conclusion Value Validation

*For any* assessment with a conclusion set, the value must be one of: 'approved', 'approved_with_conditions', 'not_approved', or 'further_study'. Any other value should be rejected.

**Validates: Requirements 3.1**

### Property 10: Multiple Lifting Plans Per Assessment

*For any* assessment, multiple lifting plans can be created with sequential lift_numbers. Each lifting plan should have a unique lift_number within the same assessment.

**Validates: Requirements 6.9**

## Error Handling

### Validation Errors

| Error Code | Condition | User Message |
|------------|-----------|--------------|
| MISSING_TYPE | assessment_type_id not provided | Assessment type is required |
| MISSING_TITLE | title not provided | Assessment title is required |
| INVALID_TYPE | assessment_type_id doesn't exist | Invalid assessment type |
| MISSING_LOAD_WEIGHT | load_weight_tons not provided for lifting plan | Load weight is required |
| MISSING_CARGO_WEIGHT | cargo_weight_tons not provided for axle calc | Cargo weight is required |
| INVALID_CONCLUSION | conclusion not in allowed values | Invalid conclusion value |
| MISSING_REVISION_NOTES | revision_notes not provided when creating revision | Revision notes are required |

### Workflow Errors

| Error Code | Condition | User Message |
|------------|-----------|--------------|
| INVALID_TRANSITION | Status transition not allowed | Cannot transition from {current} to {target} |
| ALREADY_APPROVED | Attempting to modify approved assessment | Cannot modify approved assessment |
| NOT_PENDING_REVIEW | Attempting to approve/reject non-pending assessment | Assessment must be pending review |

### Database Errors

| Error Code | Condition | User Message |
|------------|-----------|--------------|
| FK_VIOLATION | Referenced entity doesn't exist | Referenced {entity} not found |
| UNIQUE_VIOLATION | Duplicate assessment number | Assessment number already exists |

## Testing Strategy

### Property-Based Testing

The module will use **fast-check** for property-based testing with minimum 100 iterations per property.

Property tests will be implemented in `__tests__/assessment-utils.property.test.ts`:

1. **Assessment Data Round-Trip**: Generate random assessment data with JSON fields, store and retrieve, verify equality
2. **Assessment Number Format**: Generate assessments with different types, verify number format
3. **Required Field Validation**: Generate incomplete inputs, verify validation failures
4. **Workflow State Transitions**: Generate state transition sequences, verify valid transitions succeed and invalid fail
5. **Revision Tracking**: Generate revision chains, verify invariants hold
6. **Lifting Plan Calculations**: Generate random weights and capacities, verify calculation formulas
7. **Axle Load Calculations**: Generate random configurations, verify totals and compliance flags
8. **Filter Results**: Generate assessment sets with various attributes, apply filters, verify results
9. **Conclusion Validation**: Generate random strings, verify only valid conclusions accepted
10. **Multiple Lifting Plans**: Generate multiple plans per assessment, verify uniqueness

### Unit Tests

Unit tests in `__tests__/assessment-utils.test.ts` will cover:

- Utility function edge cases (zero weights, null values)
- Status color and label mappings
- Format functions (weights, percentages, dimensions)
- Validation error messages

### Integration Tests

Integration tests will verify:

- Server action CRUD operations
- Workflow transitions with database state
- Revision chain integrity
- Filter and sort with real data
