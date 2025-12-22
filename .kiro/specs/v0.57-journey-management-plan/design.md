# Design Document: Journey Management Plan (JMP)

## Overview

The Journey Management Plan (JMP) module provides comprehensive planning and execution tracking for heavy-haul cargo movements. It integrates with the Route Survey module (v0.56) to leverage pre-assessed route data and creates detailed operational plans including convoy configuration, checkpoint schedules, risk assessments, and emergency procedures.

The module follows a workflow from draft creation through approval to active execution, with real-time checkpoint tracking and post-journey documentation.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           JMP Module Architecture                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                  │
│  │ Route Survey │───▶│     JMP      │───▶│  Execution   │                  │
│  │   (v0.56)    │    │   Creation   │    │   Tracking   │                  │
│  └──────────────┘    └──────────────┘    └──────────────┘                  │
│         │                   │                   │                           │
│         ▼                   ▼                   ▼                           │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                  │
│  │ Cargo Data   │    │  Approval    │    │  Checkpoint  │                  │
│  │ Route Data   │    │  Workflow    │    │   Updates    │                  │
│  └──────────────┘    └──────────────┘    └──────────────┘                  │
│                                                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                              Data Layer                                      │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │  journey_management_plans  │  jmp_checkpoints  │  jmp_risk_assessment  │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### TypeScript Types

```typescript
// types/jmp.ts

// Enums
export type JmpStatus = 'draft' | 'pending_review' | 'approved' | 'active' | 'completed' | 'cancelled';

export type CheckpointLocationType = 'departure' | 'waypoint' | 'rest_stop' | 'checkpoint' | 'fuel_stop' | 'arrival';

export type CheckpointStatus = 'pending' | 'arrived' | 'departed' | 'skipped';

export type RiskCategory = 
  | 'road_condition' 
  | 'weather' 
  | 'traffic' 
  | 'mechanical' 
  | 'security' 
  | 'health' 
  | 'environmental' 
  | 'schedule' 
  | 'permit';

export type Likelihood = 'rare' | 'unlikely' | 'possible' | 'likely' | 'almost_certain';

export type Consequence = 'insignificant' | 'minor' | 'moderate' | 'major' | 'catastrophic';

export type RiskLevel = 'low' | 'medium' | 'high' | 'extreme';

// JSONB Structures
export interface MovementWindow {
  day: string;
  startTime: string;
  endTime: string;
  notes?: string;
}

export interface ConvoyConfiguration {
  leadVehicle?: {
    type: string;
    plateNumber?: string;
    driver?: string;
  };
  cargoTransport: {
    type: string;
    trailerType?: string;
    plateNumber?: string;
    driver?: string;
  };
  escortVehicles?: {
    count: number;
    type: string;
    company?: string;
  };
  chaseVehicle?: {
    type: string;
    plateNumber?: string;
    driver?: string;
  };
  supportVehicles?: Array<{
    type: string;
    purpose: string;
    plateNumber?: string;
  }>;
}

export interface DriverAssignment {
  employeeId?: string;
  name: string;
  vehicle: string;
  role: string;
  phone: string;
}

export interface EscortDetails {
  type: string;
  company: string;
  contact: string;
  vehiclesCount: number;
}

export interface RadioFrequency {
  channel: string;
  frequency: string;
  usage: string;
}

export interface EmergencyContact {
  name: string;
  role: string;
  phone: string;
  availableHours?: string;
}

export interface ReportingSchedule {
  location: string;
  km: number;
  expectedTime: string;
  reportTo: string;
}

export interface ContingencyPlan {
  scenario: string;
  response: string;
  contacts: string[];
}

export interface NearbyFacility {
  name: string;
  address?: string;
  phone?: string;
  distance?: string;
}

export interface JmpPermit {
  permitType: string;
  permitNumber: string;
  issuingAuthority: string;
  validFrom: string;
  validTo: string;
}

export interface JmpDocument {
  type: string;
  url: string;
  name?: string;
  uploadedAt?: string;
}

// Main Interfaces
export interface JourneyManagementPlan {
  id: string;
  jmpNumber: string;
  
  // Relations
  routeSurveyId?: string;
  jobOrderId?: string;
  projectId?: string;
  customerId?: string;
  
  // Journey details
  journeyTitle: string;
  journeyDescription?: string;
  
  // Cargo
  cargoDescription: string;
  totalLengthM?: number;
  totalWidthM?: number;
  totalHeightM?: number;
  totalWeightTons?: number;
  
  // Route
  originLocation: string;
  destinationLocation: string;
  routeDistanceKm?: number;
  
  // Schedule
  plannedDeparture?: string;
  plannedArrival?: string;
  journeyDurationHours?: number;
  
  // Movement windows
  movementWindows: MovementWindow[];
  
  // Convoy
  convoyConfiguration?: ConvoyConfiguration;
  
  // Team
  convoyCommanderId?: string;
  drivers: DriverAssignment[];
  escortDetails?: EscortDetails;
  
  // Communication
  radioFrequencies: RadioFrequency[];
  emergencyContacts: EmergencyContact[];
  
  // Checkpoints & Reporting
  reportingSchedule: ReportingSchedule[];
  
  // Contingency
  contingencyPlans: ContingencyPlan[];
  emergencyProcedures?: string;
  nearestHospitals: NearbyFacility[];
  nearestWorkshops: NearbyFacility[];
  
  // Permits
  permits: JmpPermit[];
  
  // Weather
  weatherRestrictions?: string;
  goNoGoCriteria?: string;
  
  // Approvals
  preparedBy?: string;
  preparedAt?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  approvedBy?: string;
  approvedAt?: string;
  
  // Status
  status: JmpStatus;
  
  // Execution
  actualDeparture?: string;
  actualArrival?: string;
  
  // Post-journey
  journeyLog?: string;
  incidentsOccurred: boolean;
  incidentSummary?: string;
  lessonsLearned?: string;
  
  // Documents
  documents: JmpDocument[];
  
  createdAt: string;
  updatedAt: string;
}

export interface JmpCheckpoint {
  id: string;
  jmpId: string;
  checkpointOrder: number;
  
  // Location
  locationName: string;
  locationType: CheckpointLocationType;
  kmFromStart?: number;
  coordinates?: string;
  
  // Schedule
  plannedArrival?: string;
  plannedDeparture?: string;
  stopDurationMinutes?: number;
  
  // Actual
  actualArrival?: string;
  actualDeparture?: string;
  
  // Activities
  activities?: string;
  
  // Reporting
  reportRequired: boolean;
  reportTo?: string;
  
  // Status
  status: CheckpointStatus;
  notes?: string;
  
  createdAt: string;
}

export interface JmpRiskAssessment {
  id: string;
  jmpId: string;
  riskCategory: RiskCategory;
  riskDescription: string;
  likelihood: Likelihood;
  consequence: Consequence;
  riskLevel: RiskLevel;
  controlMeasures: string;
  residualRiskLevel?: RiskLevel;
  responsible?: string;
  createdAt: string;
}

// Form Data
export interface JmpFormData {
  routeSurveyId?: string;
  jobOrderId?: string;
  projectId?: string;
  customerId?: string;
  journeyTitle: string;
  journeyDescription?: string;
  cargoDescription: string;
  totalLengthM?: number;
  totalWidthM?: number;
  totalHeightM?: number;
  totalWeightTons?: number;
  originLocation: string;
  destinationLocation: string;
  routeDistanceKm?: number;
  plannedDeparture?: string;
  plannedArrival?: string;
  journeyDurationHours?: number;
  movementWindows?: MovementWindow[];
  convoyConfiguration?: ConvoyConfiguration;
  convoyCommanderId?: string;
  drivers?: DriverAssignment[];
  escortDetails?: EscortDetails;
  weatherRestrictions?: string;
  goNoGoCriteria?: string;
}

export interface CheckpointFormData {
  locationName: string;
  locationType: CheckpointLocationType;
  kmFromStart?: number;
  coordinates?: string;
  plannedArrival?: string;
  plannedDeparture?: string;
  stopDurationMinutes?: number;
  activities?: string;
  reportRequired?: boolean;
  reportTo?: string;
}

export interface RiskFormData {
  riskCategory: RiskCategory;
  riskDescription: string;
  likelihood: Likelihood;
  consequence: Consequence;
  controlMeasures: string;
  residualRiskLevel?: RiskLevel;
  responsible?: string;
}

// Extended types with relations
export interface JmpWithRelations extends JourneyManagementPlan {
  customer?: { id: string; name: string };
  project?: { id: string; name: string };
  jobOrder?: { id: string; jo_number: string };
  routeSurvey?: { id: string; survey_number: string };
  convoyCommander?: { id: string; full_name: string; phone?: string };
  checkpoints?: JmpCheckpoint[];
  risks?: JmpRiskAssessment[];
}

// Utility types
export interface JmpStatusCounts {
  draft: number;
  pending_review: number;
  approved: number;
  active: number;
  completed: number;
}

export interface JmpFilters {
  status: JmpStatus | 'all';
  customerId: string | 'all';
  dateFrom?: string;
  dateTo?: string;
  search: string;
}

export interface ActiveJourneyProgress {
  jmpId: string;
  checkpointsCompleted: number;
  totalCheckpoints: number;
  progressPercent: number;
  isOnSchedule: boolean;
  currentCheckpoint?: string;
}
```

### Database Row Types

```typescript
// Database row types (snake_case)
export interface JmpRow {
  id: string;
  jmp_number: string;
  route_survey_id: string | null;
  job_order_id: string | null;
  project_id: string | null;
  customer_id: string | null;
  journey_title: string;
  journey_description: string | null;
  cargo_description: string;
  total_length_m: number | null;
  total_width_m: number | null;
  total_height_m: number | null;
  total_weight_tons: number | null;
  origin_location: string;
  destination_location: string;
  route_distance_km: number | null;
  planned_departure: string | null;
  planned_arrival: string | null;
  journey_duration_hours: number | null;
  movement_windows: MovementWindow[];
  convoy_configuration: ConvoyConfiguration | null;
  convoy_commander_id: string | null;
  drivers: DriverAssignment[];
  escort_details: EscortDetails | null;
  radio_frequencies: RadioFrequency[];
  emergency_contacts: EmergencyContact[];
  reporting_schedule: ReportingSchedule[];
  contingency_plans: ContingencyPlan[];
  emergency_procedures: string | null;
  nearest_hospitals: NearbyFacility[];
  nearest_workshops: NearbyFacility[];
  permits: JmpPermit[];
  weather_restrictions: string | null;
  go_no_go_criteria: string | null;
  prepared_by: string | null;
  prepared_at: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  approved_by: string | null;
  approved_at: string | null;
  status: JmpStatus;
  actual_departure: string | null;
  actual_arrival: string | null;
  journey_log: string | null;
  incidents_occurred: boolean;
  incident_summary: string | null;
  lessons_learned: string | null;
  documents: JmpDocument[];
  created_at: string;
  updated_at: string;
}

export interface JmpCheckpointRow {
  id: string;
  jmp_id: string;
  checkpoint_order: number;
  location_name: string;
  location_type: CheckpointLocationType;
  km_from_start: number | null;
  coordinates: string | null;
  planned_arrival: string | null;
  planned_departure: string | null;
  stop_duration_minutes: number | null;
  actual_arrival: string | null;
  actual_departure: string | null;
  activities: string | null;
  report_required: boolean;
  report_to: string | null;
  status: CheckpointStatus;
  notes: string | null;
  created_at: string;
}

export interface JmpRiskRow {
  id: string;
  jmp_id: string;
  risk_category: RiskCategory;
  risk_description: string;
  likelihood: Likelihood;
  consequence: Consequence;
  risk_level: RiskLevel;
  control_measures: string;
  residual_risk_level: RiskLevel | null;
  responsible: string | null;
  created_at: string;
}
```

### Utility Functions

```typescript
// lib/jmp-utils.ts

/**
 * Calculate risk level from likelihood and consequence using standard matrix
 */
export function calculateRiskLevel(likelihood: Likelihood, consequence: Consequence): RiskLevel;

/**
 * Validate JMP form data
 */
export function validateJmpForm(data: JmpFormData): ValidationResult;

/**
 * Validate checkpoint data
 */
export function validateCheckpoint(data: CheckpointFormData): ValidationResult;

/**
 * Check if permit is valid for journey date
 */
export function isPermitValid(permit: JmpPermit, journeyDate: string): boolean;

/**
 * Get permit validity status
 */
export function getPermitStatus(permit: JmpPermit, journeyDate: string): 'valid' | 'expiring_soon' | 'expired';

/**
 * Calculate journey progress from checkpoints
 */
export function calculateJourneyProgress(checkpoints: JmpCheckpoint[]): ActiveJourneyProgress;

/**
 * Check if journey is on schedule
 */
export function isOnSchedule(checkpoint: JmpCheckpoint): boolean;

/**
 * Calculate time variance between planned and actual
 */
export function calculateTimeVariance(planned: string, actual: string): number;

/**
 * Sort checkpoints by km from start
 */
export function sortCheckpointsByDistance(checkpoints: JmpCheckpoint[]): JmpCheckpoint[];

/**
 * Validate checkpoint sequence (must have departure at 0 and arrival at end)
 */
export function validateCheckpointSequence(checkpoints: JmpCheckpoint[], routeDistanceKm: number): ValidationResult;

/**
 * Convert database row to JMP object
 */
export function mapRowToJmp(row: JmpRow): JourneyManagementPlan;

/**
 * Convert JMP object to database row
 */
export function mapJmpToRow(jmp: Partial<JourneyManagementPlan>): Partial<JmpRow>;

/**
 * Format JMP status for display
 */
export function formatJmpStatus(status: JmpStatus): string;

/**
 * Get status badge color
 */
export function getJmpStatusColor(status: JmpStatus): string;

/**
 * Format risk level for display
 */
export function formatRiskLevel(level: RiskLevel): string;

/**
 * Get risk level badge color
 */
export function getRiskLevelColor(level: RiskLevel): string;
```

### Server Actions

```typescript
// lib/jmp-actions.ts

/**
 * Create a new JMP
 */
export async function createJmp(data: JmpFormData): Promise<ActionResult<JourneyManagementPlan>>;

/**
 * Update an existing JMP
 */
export async function updateJmp(id: string, data: Partial<JmpFormData>): Promise<ActionResult<JourneyManagementPlan>>;

/**
 * Delete a JMP (only draft status)
 */
export async function deleteJmp(id: string): Promise<ActionResult<void>>;

/**
 * Create JMP from route survey (pre-populate data)
 */
export async function createJmpFromSurvey(surveyId: string): Promise<ActionResult<JourneyManagementPlan>>;

/**
 * Submit JMP for review
 */
export async function submitJmpForReview(id: string): Promise<ActionResult<JourneyManagementPlan>>;

/**
 * Approve JMP
 */
export async function approveJmp(id: string): Promise<ActionResult<JourneyManagementPlan>>;

/**
 * Reject JMP (return to draft)
 */
export async function rejectJmp(id: string, reason: string): Promise<ActionResult<JourneyManagementPlan>>;

/**
 * Start journey execution
 */
export async function startJourney(id: string): Promise<ActionResult<JourneyManagementPlan>>;

/**
 * Complete journey
 */
export async function completeJourney(id: string, data: PostJourneyData): Promise<ActionResult<JourneyManagementPlan>>;

/**
 * Cancel journey
 */
export async function cancelJourney(id: string, reason: string): Promise<ActionResult<JourneyManagementPlan>>;

// Checkpoint actions
export async function addCheckpoint(jmpId: string, data: CheckpointFormData): Promise<ActionResult<JmpCheckpoint>>;
export async function updateCheckpoint(id: string, data: Partial<CheckpointFormData>): Promise<ActionResult<JmpCheckpoint>>;
export async function deleteCheckpoint(id: string): Promise<ActionResult<void>>;
export async function markCheckpointArrival(id: string, actualTime: string): Promise<ActionResult<JmpCheckpoint>>;
export async function markCheckpointDeparture(id: string, actualTime: string): Promise<ActionResult<JmpCheckpoint>>;

// Risk actions
export async function addRisk(jmpId: string, data: RiskFormData): Promise<ActionResult<JmpRiskAssessment>>;
export async function updateRisk(id: string, data: Partial<RiskFormData>): Promise<ActionResult<JmpRiskAssessment>>;
export async function deleteRisk(id: string): Promise<ActionResult<void>>;

// Query functions
export async function getJmpById(id: string): Promise<JmpWithRelations | null>;
export async function getJmpList(filters: JmpFilters): Promise<JmpWithRelations[]>;
export async function getActiveJourneys(): Promise<JmpWithRelations[]>;
export async function getJmpStatusCounts(): Promise<JmpStatusCounts>;
```

### React Components

```
components/jmp/
├── jmp-list.tsx              # List view with filters
├── jmp-status-cards.tsx      # Status count cards
├── jmp-form.tsx              # Main JMP form
├── jmp-detail-view.tsx       # Detail view with tabs
├── convoy-config-form.tsx    # Convoy configuration editor
├── convoy-diagram.tsx        # Visual convoy representation
├── team-assignment-form.tsx  # Team/driver assignment
├── checkpoint-table.tsx      # Checkpoint schedule table
├── checkpoint-form.tsx       # Add/edit checkpoint dialog
├── checkpoint-tracker.tsx    # Real-time checkpoint tracking
├── risk-assessment-table.tsx # Risk assessment list
├── risk-form.tsx             # Add/edit risk dialog
├── risk-matrix.tsx           # Visual risk matrix
├── emergency-contacts-form.tsx # Emergency contacts editor
├── permits-form.tsx          # Permits management
├── contingency-form.tsx      # Contingency plans editor
├── active-journeys-view.tsx  # Active journeys dashboard
├── journey-progress-card.tsx # Progress indicator
├── post-journey-form.tsx     # Post-journey documentation
└── jmp-print-view.tsx        # Print-friendly layout
```

## Data Models

### Risk Matrix

The risk level is calculated using a 5x5 matrix:

```
                    CONSEQUENCE
                    Insignificant  Minor    Moderate   Major    Catastrophic
LIKELIHOOD          
Almost Certain      Medium         High     High       Extreme  Extreme
Likely              Medium         Medium   High       High     Extreme
Possible            Low            Medium   Medium     High     High
Unlikely            Low            Low      Medium     Medium   High
Rare                Low            Low      Low        Medium   Medium
```

### Status Transitions

```
draft ──────────────▶ pending_review ──────────────▶ approved
  │                        │                            │
  │                        │ (reject)                   │
  │                        ▼                            │
  │◀───────────────────────┘                            │
  │                                                     │
  │                                                     ▼
  │                                                  active
  │                                                     │
  │                                                     ├──▶ completed
  │                                                     │
  ▼                                                     ▼
cancelled ◀─────────────────────────────────────────────┘
```

### Checkpoint Status Flow

```
pending ──▶ arrived ──▶ departed
    │
    └──▶ skipped
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*



### Property 1: JMP Number Format Validation

*For any* newly created JMP, the generated jmp_number SHALL match the format `JMP-YYYY-NNNN` where YYYY is the current year and NNNN is a zero-padded sequential number.

**Validates: Requirements 1.1, 4.1**

### Property 2: Survey Data Pre-population

*For any* JMP created from a route survey, the cargo description, dimensions, weight, origin location, destination location, and route distance SHALL be copied from the linked survey.

**Validates: Requirements 4.2**

### Property 3: Initial Status is Draft

*For any* newly created JMP, the initial status SHALL be 'draft'.

**Validates: Requirements 4.9**

### Property 4: Convoy Commander Required for Approval

*For any* JMP, approval SHALL fail if convoy_commander_id is null or undefined.

**Validates: Requirements 6.4**

### Property 5: Stop Duration Calculation

*For any* checkpoint with both planned_arrival and planned_departure times, the stop_duration_minutes SHALL equal the difference in minutes between departure and arrival.

**Validates: Requirements 7.3**

### Property 6: Checkpoint Ordering by Distance

*For any* list of checkpoints returned for a JMP, they SHALL be sorted in ascending order by km_from_start.

**Validates: Requirements 7.6**

### Property 7: Checkpoint Sequence Validation

*For any* valid JMP checkpoint sequence, there SHALL exist exactly one checkpoint with location_type 'departure' at km_from_start 0, and exactly one checkpoint with location_type 'arrival' at the route end.

**Validates: Requirements 7.7, 7.8**

### Property 8: Risk Level Matrix Calculation

*For any* risk assessment with a given likelihood and consequence, the calculated risk_level SHALL match the standard 5x5 risk matrix (e.g., 'likely' + 'major' = 'high').

**Validates: Requirements 8.4**

### Property 9: Permit Validity Determination

*For any* permit and journey date, the permit status SHALL be:
- 'expired' if validTo < journeyDate
- 'expiring_soon' if validTo is within 7 days of journeyDate
- 'valid' otherwise

**Validates: Requirements 10.2, 10.3**

### Property 10: Status Transition Validity

*For any* JMP status transition:
- 'draft' can only transition to 'pending_review' or 'cancelled'
- 'pending_review' can only transition to 'approved' or 'draft' (rejection)
- 'approved' can only transition to 'active' or 'cancelled'
- 'active' can only transition to 'completed' or 'cancelled'

**Validates: Requirements 11.1, 11.6, 12.1, 12.5**

### Property 11: Checkpoint Tracking Updates

*For any* checkpoint arrival marking, the actual_arrival SHALL be set and status SHALL change to 'arrived'. *For any* checkpoint departure marking, the actual_departure SHALL be set and status SHALL change to 'departed'.

**Validates: Requirements 12.2, 12.3**

### Property 12: Incident Summary Conditional Requirement

*For any* journey completion where incidents_occurred is true, the incident_summary field SHALL be non-empty.

**Validates: Requirements 13.3**

### Property 13: Time Variance Calculation

*For any* pair of planned and actual timestamps, the calculated variance SHALL equal (actual - planned) in minutes, with positive values indicating delay and negative values indicating early arrival.

**Validates: Requirements 13.5**

### Property 14: Schedule Comparison

*For any* checkpoint with both planned_arrival and actual_arrival, the checkpoint SHALL be flagged as behind schedule if actual_arrival > planned_arrival.

**Validates: Requirements 15.4**

## Error Handling

### Validation Errors

| Error Code | Description | User Message |
|------------|-------------|--------------|
| JMP_TITLE_REQUIRED | Journey title is empty | "Journey title is required" |
| JMP_CARGO_REQUIRED | Cargo description is empty | "Cargo description is required" |
| JMP_ORIGIN_REQUIRED | Origin location is empty | "Origin location is required" |
| JMP_DESTINATION_REQUIRED | Destination location is empty | "Destination location is required" |
| JMP_COMMANDER_REQUIRED | Convoy commander not assigned for approval | "Convoy commander must be assigned before approval" |
| JMP_INVALID_STATUS_TRANSITION | Invalid status change attempted | "Cannot change status from {current} to {target}" |
| JMP_NOT_APPROVED | Attempting to start non-approved JMP | "Journey can only be started when JMP is approved" |
| JMP_ALREADY_ACTIVE | Attempting to start already active journey | "Journey is already in progress" |
| CHECKPOINT_MISSING_DEPARTURE | No departure checkpoint at km 0 | "A departure checkpoint at km 0 is required" |
| CHECKPOINT_MISSING_ARRIVAL | No arrival checkpoint at route end | "An arrival checkpoint at the destination is required" |
| CHECKPOINT_INVALID_ORDER | Checkpoint times not sequential | "Checkpoint times must be in sequential order" |
| RISK_MISSING_CONTROLS | Risk without control measures | "Control measures are required for each risk" |
| PERMIT_EXPIRED | Permit expired before journey date | "Permit {type} expires before the planned journey date" |
| INCIDENT_SUMMARY_REQUIRED | Incidents marked but no summary | "Incident summary is required when incidents occurred" |

### Database Errors

| Error | Handling |
|-------|----------|
| Foreign key violation | Display "Referenced record not found" |
| Unique constraint violation | Display "JMP number already exists" |
| Connection error | Display "Unable to connect to database. Please try again." |

## Testing Strategy

### Unit Tests

Unit tests will cover:
- Form validation functions
- Risk level calculation
- Permit validity checking
- Time variance calculation
- Checkpoint sorting and validation
- Status transition validation
- Data mapping functions (row to object, object to row)

### Property-Based Tests

Property-based tests will use `fast-check` library with minimum 100 iterations per property:

1. **JMP Number Format** - Generate random JMPs and verify number format
2. **Survey Pre-population** - Generate random surveys and verify data copying
3. **Initial Status** - Generate random JMP form data and verify draft status
4. **Commander Validation** - Generate JMPs with/without commander and verify approval behavior
5. **Duration Calculation** - Generate random arrival/departure times and verify duration
6. **Checkpoint Ordering** - Generate random checkpoint lists and verify sorting
7. **Checkpoint Sequence** - Generate checkpoint sequences and verify validation
8. **Risk Matrix** - Generate all likelihood/consequence combinations and verify levels
9. **Permit Validity** - Generate random permits and dates and verify status
10. **Status Transitions** - Generate random status transitions and verify validity
11. **Checkpoint Tracking** - Generate checkpoint updates and verify state changes
12. **Incident Summary** - Generate completion data and verify conditional requirement
13. **Time Variance** - Generate random timestamp pairs and verify calculation
14. **Schedule Comparison** - Generate checkpoints with times and verify behind-schedule detection

### Integration Tests

- Create JMP from survey and verify data population
- Full approval workflow (draft → pending_review → approved)
- Journey execution flow (start → checkpoint updates → complete)
- Risk assessment CRUD operations
- Checkpoint CRUD operations

### Test Configuration

```typescript
// vitest.config.ts additions
export default defineConfig({
  test: {
    // Property tests may take longer
    testTimeout: 30000,
  }
});
```
