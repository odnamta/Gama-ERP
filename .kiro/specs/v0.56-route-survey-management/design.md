# Design Document: Route Survey Management

## Overview

The Route Survey Management system provides engineering teams with tools to assess, document, and report on transportation routes for heavy-haul logistics. The system captures cargo and transport dimensions, documents waypoints along routes, assesses passability based on clearances and capacities, manages standardized checklists, and generates comprehensive feasibility reports.

The architecture follows the existing Gama ERP patterns using Next.js App Router, Supabase for data persistence, and shadcn/ui components for the interface.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend Layer                            │
├─────────────────────────────────────────────────────────────────┤
│  /engineering/surveys          - Survey list page               │
│  /engineering/surveys/new      - Create survey form             │
│  /engineering/surveys/[id]     - Survey detail view             │
│  /engineering/surveys/[id]/edit - Edit survey form              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Component Layer                             │
├─────────────────────────────────────────────────────────────────┤
│  SurveyList          - List with filters and status cards       │
│  SurveyForm          - Create/edit survey form                  │
│  SurveyDetailView    - Tabbed detail view                       │
│  WaypointTable       - Waypoint list with inline editing        │
│  WaypointForm        - Add/edit waypoint dialog                 │
│  ChecklistSection    - Checklist with status toggles            │
│  FeasibilityForm     - Completion assessment form               │
│  RouteOverview       - Visual route summary                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Utility Layer                               │
├─────────────────────────────────────────────────────────────────┤
│  lib/survey-utils.ts    - Survey calculations and formatting    │
│  lib/survey-actions.ts  - Server actions for CRUD operations    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Database Layer                              │
├─────────────────────────────────────────────────────────────────┤
│  route_surveys                - Main survey records             │
│  route_waypoints              - Waypoint assessments            │
│  route_survey_checklist       - Survey checklist items          │
│  route_survey_checklist_template - Checklist template           │
└─────────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### Survey List Component

```typescript
interface SurveyListProps {
  initialSurveys: RouteSurvey[];
  surveyors: Employee[];
}

interface SurveyFilters {
  status: SurveyStatus | 'all';
  surveyorId: string | 'all';
  search: string;
}

interface SurveyStatusCounts {
  requested: number;
  scheduled: number;
  in_progress: number;
  completed: number;
}
```

### Survey Form Component

```typescript
interface SurveyFormProps {
  survey?: RouteSurvey;
  customers: Customer[];
  quotations: Quotation[];
  projects: Project[];
  employees: Employee[];
  onSubmit: (data: SurveyFormData) => Promise<void>;
}

interface SurveyFormData {
  quotationId?: string;
  projectId?: string;
  customerId?: string;
  cargoDescription: string;
  cargoLengthM: number;
  cargoWidthM: number;
  cargoHeightM: number;
  cargoWeightTons: number;
  transportConfig?: string;
  totalLengthM: number;
  totalWidthM: number;
  totalHeightM: number;
  totalWeightTons: number;
  axleConfiguration?: string;
  groundClearanceM?: number;
  turningRadiusM?: number;
  originLocation: string;
  originAddress?: string;
  originCoordinates?: string;
  destinationLocation: string;
  destinationAddress?: string;
  destinationCoordinates?: string;
  surveyorId?: string;
  surveyDate?: string;
}
```

### Survey Detail View Component

```typescript
interface SurveyDetailViewProps {
  survey: RouteSurveyWithRelations;
  waypoints: RouteWaypoint[];
  checklist: SurveyChecklistItem[];
}

type DetailTab = 'details' | 'route' | 'waypoints' | 'checklist' | 'report';
```

### Waypoint Components

```typescript
interface WaypointTableProps {
  surveyId: string;
  waypoints: RouteWaypoint[];
  transportDimensions: TransportDimensions;
  onWaypointUpdate: () => void;
}

interface WaypointFormProps {
  surveyId: string;
  waypoint?: RouteWaypoint;
  onSubmit: (data: WaypointFormData) => Promise<void>;
  onCancel: () => void;
}

interface WaypointFormData {
  waypointType: WaypointType;
  locationName: string;
  coordinates?: string;
  kmFromStart: number;
  roadCondition?: RoadCondition;
  roadWidthM?: number;
  roadSurface?: RoadSurface;
  verticalClearanceM?: number;
  horizontalClearanceM?: number;
  bridgeName?: string;
  bridgeCapacityTons?: number;
  bridgeWidthM?: number;
  bridgeLengthM?: number;
  turnRadiusAvailableM?: number;
  turnFeasible?: boolean;
  obstacleType?: string;
  obstacleDescription?: string;
  actionRequired?: string;
  actionCostEstimate?: number;
  actionResponsible?: string;
  isPassable: boolean;
  passableNotes?: string;
}

interface TransportDimensions {
  height: number;
  width: number;
  weight: number;
  turnRadius: number;
}
```

### Checklist Component

```typescript
interface ChecklistSectionProps {
  surveyId: string;
  checklist: SurveyChecklistItem[];
  onUpdate: () => void;
}

interface SurveyChecklistItem {
  id: string;
  surveyId: string;
  category: ChecklistCategory;
  checkItem: string;
  status: ChecklistStatus;
  notes?: string;
  checkedBy?: string;
  checkedAt?: string;
}

type ChecklistCategory = 
  | 'road_condition' 
  | 'clearances' 
  | 'bridges' 
  | 'utilities' 
  | 'traffic' 
  | 'permits' 
  | 'access';

type ChecklistStatus = 'pending' | 'ok' | 'warning' | 'fail';
```

### Feasibility Form Component

```typescript
interface FeasibilityFormProps {
  survey: RouteSurvey;
  onSubmit: (data: FeasibilityAssessment) => Promise<void>;
}

interface FeasibilityAssessment {
  feasibility: Feasibility;
  feasibilityNotes: string;
  routeDistanceKm: number;
  estimatedTravelTimeHours: number;
  permitsRequired: PermitRequirement[];
  escortRequired: boolean;
  escortType?: EscortType;
  escortVehiclesCount?: number;
  travelTimeRestrictions?: string;
  surveyCost?: number;
  permitCostEstimate?: number;
  escortCostEstimate?: number;
  roadRepairCostEstimate?: number;
  totalRouteCostEstimate: number;
}

interface PermitRequirement {
  type: string;
  authority: string;
  estimatedDays: number;
  estimatedCost: number;
}

type Feasibility = 'feasible' | 'feasible_with_conditions' | 'not_feasible';
type EscortType = 'police' | 'private' | 'both';
```

## Data Models

### Route Survey

```typescript
interface RouteSurvey {
  id: string;
  surveyNumber: string;
  quotationId?: string;
  projectId?: string;
  jobOrderId?: string;
  customerId?: string;
  
  // Cargo details
  cargoDescription: string;
  cargoLengthM?: number;
  cargoWidthM?: number;
  cargoHeightM?: number;
  cargoWeightTons?: number;
  
  // Transport configuration
  transportConfig?: string;
  totalLengthM?: number;
  totalWidthM?: number;
  totalHeightM?: number;
  totalWeightTons?: number;
  axleConfiguration?: string;
  groundClearanceM?: number;
  turningRadiusM?: number;
  
  // Route
  originLocation: string;
  originAddress?: string;
  originCoordinates?: string;
  destinationLocation: string;
  destinationAddress?: string;
  destinationCoordinates?: string;
  
  // Survey details
  surveyDate?: string;
  surveyorId?: string;
  surveyorName?: string;
  
  // Route options
  primaryRoute?: string;
  alternativeRoutes?: string[];
  
  // Assessment
  routeDistanceKm?: number;
  estimatedTravelTimeHours?: number;
  feasibility?: Feasibility;
  feasibilityNotes?: string;
  
  // Permits
  permitsRequired?: PermitRequirement[];
  
  // Escort
  escortRequired: boolean;
  escortType?: EscortType;
  escortVehiclesCount?: number;
  
  // Time restrictions
  travelTimeRestrictions?: string;
  
  // Cost estimates
  surveyCost?: number;
  permitCostEstimate?: number;
  escortCostEstimate?: number;
  roadRepairCostEstimate?: number;
  totalRouteCostEstimate?: number;
  
  // Status
  status: SurveyStatus;
  requestedBy?: string;
  requestedAt: string;
  completedAt?: string;
  
  // Documents
  documents?: SurveyDocument[];
  photos?: string[];
  notes?: string;
  
  createdAt: string;
  updatedAt: string;
}

type SurveyStatus = 'requested' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

interface SurveyDocument {
  type: string;
  url: string;
  name?: string;
  uploadedAt?: string;
}
```

### Route Waypoint

```typescript
interface RouteWaypoint {
  id: string;
  surveyId: string;
  waypointOrder: number;
  waypointType: WaypointType;
  locationName: string;
  coordinates?: string;
  kmFromStart?: number;
  
  // Road assessment
  roadCondition?: RoadCondition;
  roadWidthM?: number;
  roadSurface?: RoadSurface;
  
  // Obstacle details
  obstacleType?: string;
  obstacleDescription?: string;
  
  // Clearances
  verticalClearanceM?: number;
  horizontalClearanceM?: number;
  
  // Bridge details
  bridgeName?: string;
  bridgeCapacityTons?: number;
  bridgeWidthM?: number;
  bridgeLengthM?: number;
  
  // Turn details
  turnRadiusAvailableM?: number;
  turnFeasible?: boolean;
  
  // Action required
  actionRequired?: string;
  actionCostEstimate?: number;
  actionResponsible?: string;
  
  // Pass/fail
  isPassable: boolean;
  passableNotes?: string;
  
  // Photos
  photos?: string[];
  
  createdAt: string;
}

type WaypointType = 
  | 'start' 
  | 'checkpoint' 
  | 'obstacle' 
  | 'bridge' 
  | 'intersection' 
  | 'underpass' 
  | 'overhead' 
  | 'turn' 
  | 'rest_point' 
  | 'destination';

type RoadCondition = 'good' | 'fair' | 'poor' | 'impassable';
type RoadSurface = 'asphalt' | 'concrete' | 'gravel' | 'dirt';
```

### Checklist Template

```typescript
interface ChecklistTemplate {
  id: string;
  category: ChecklistCategory;
  checkItem: string;
  isMandatory: boolean;
  displayOrder: number;
  isActive: boolean;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Survey Number Format Validity

*For any* route survey created, the generated survey number SHALL match the format RSV-YYYY-NNNN where YYYY is the current year and NNNN is a zero-padded sequential number.

**Validates: Requirements 1.1**

### Property 2: Survey Data Round-Trip Consistency

*For any* valid survey form data containing cargo dimensions, transport configuration, and route information, creating a survey and then retrieving it SHALL return equivalent data for all fields.

**Validates: Requirements 1.2, 1.3, 1.4**

### Property 3: Initial Survey Status Invariant

*For any* newly created route survey, the initial status SHALL always be 'requested'.

**Validates: Requirements 1.6**

### Property 4: Checklist Initialization Completeness

*For any* newly created route survey, the survey checklist SHALL contain all active items from the checklist template with status 'pending'.

**Validates: Requirements 1.7, 5.1**

### Property 5: Waypoint Order Sequentiality

*For any* survey with multiple waypoints, the waypoint order numbers SHALL be sequential starting from 1 with no gaps, and adding a new waypoint SHALL assign the next sequential order number.

**Validates: Requirements 3.9**

### Property 6: Passability Assessment Correctness

*For any* waypoint with clearance measurements and any transport dimensions:
- If vertical clearance < transport height + 0.3m, the waypoint SHALL be flagged as not passable with a vertical clearance issue
- If horizontal clearance < transport width + 0.5m, the waypoint SHALL be flagged as not passable with a horizontal clearance issue
- If bridge capacity < transport weight, the waypoint SHALL be flagged as not passable with a weight capacity issue
- If turn radius available < required turn radius, the waypoint SHALL be flagged as not passable with a turn radius issue
- If all clearances are adequate, the waypoint SHALL be marked as passable with no issues

**Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5, 4.6**

### Property 7: Checklist Status Validity

*For any* checklist item update, the status SHALL be one of 'pending', 'ok', 'warning', or 'fail', and updating an item SHALL record the checker ID and timestamp.

**Validates: Requirements 5.3, 5.4, 5.5**

### Property 8: Survey Completion Validation

*For any* survey being completed, the completion SHALL require a valid feasibility value ('feasible', 'feasible_with_conditions', 'not_feasible'), and upon completion the status SHALL be 'completed' with a completion timestamp recorded.

**Validates: Requirements 6.1, 6.8**

### Property 9: Survey Status Count Accuracy

*For any* list of surveys, the status counts SHALL equal the actual count of surveys in each status category.

**Validates: Requirements 7.1**

### Property 10: Survey Filtering Correctness

*For any* filter criteria (status, surveyor) applied to a survey list, all returned surveys SHALL match the filter criteria, and no matching surveys SHALL be excluded.

**Validates: Requirements 7.3, 7.4**

### Property 11: Survey Search Correctness

*For any* search query, all returned surveys SHALL contain the search term in survey number, customer name, or cargo description.

**Validates: Requirements 7.5**

### Property 12: Survey Validation Completeness

*For any* survey creation attempt, the system SHALL reject surveys missing cargo description, origin location, or destination location, and SHALL reject surveys with negative numeric measurements.

**Validates: Requirements 10.1, 10.2**

### Property 13: Waypoint Type-Specific Validation

*For any* waypoint of type 'bridge', the waypoint data SHALL include bridge-specific fields (name, capacity, width, length), and for type 'turn' or 'intersection', the waypoint data SHALL include turn radius fields.

**Validates: Requirements 3.5, 3.6**



## Error Handling

### Validation Errors

| Error Condition | Error Message | Recovery Action |
|-----------------|---------------|-----------------|
| Missing cargo description | "Cargo description is required" | Prompt user to enter description |
| Missing origin location | "Origin location is required" | Prompt user to enter origin |
| Missing destination location | "Destination location is required" | Prompt user to enter destination |
| Negative dimension value | "Dimensions must be positive values" | Highlight invalid field |
| Invalid surveyor ID | "Selected surveyor not found" | Refresh employee list |
| Invalid status transition | "Cannot transition from {current} to {target}" | Show valid transitions |
| Missing feasibility on completion | "Feasibility assessment is required to complete survey" | Show feasibility form |

### Database Errors

| Error Condition | Error Message | Recovery Action |
|-----------------|---------------|-----------------|
| Survey not found | "Survey not found" | Redirect to survey list |
| Waypoint not found | "Waypoint not found" | Refresh waypoint list |
| Duplicate survey number | "Survey number already exists" | Retry with new sequence |
| Foreign key violation | "Referenced record not found" | Validate references |
| Concurrent modification | "Survey was modified by another user" | Refresh and retry |

### Business Logic Errors

| Error Condition | Error Message | Recovery Action |
|-----------------|---------------|-----------------|
| Complete without waypoints | "At least one waypoint is required" | Add waypoints first |
| Invalid waypoint order | "Waypoint order must be sequential" | Reorder waypoints |
| Checklist incomplete | "All mandatory checklist items must be checked" | Complete checklist |

## Testing Strategy

### Unit Tests

Unit tests will verify specific examples and edge cases:

1. **Survey Number Generation**
   - Test format matches RSV-YYYY-NNNN
   - Test sequential numbering
   - Test year rollover handling

2. **Passability Assessment**
   - Test vertical clearance with exact margin (0.3m)
   - Test horizontal clearance with exact margin (0.5m)
   - Test bridge capacity comparison
   - Test turn radius comparison
   - Test multiple simultaneous issues

3. **Status Transitions**
   - Test valid transitions (requested → scheduled → in_progress → completed)
   - Test invalid transitions are rejected
   - Test cancelled status from any state

4. **Validation**
   - Test required field validation
   - Test numeric field validation
   - Test enum value validation

### Property-Based Tests

Property-based tests will use **fast-check** library with minimum 100 iterations per test.

Each property test must be tagged with:
- **Feature: route-survey-management, Property {number}: {property_text}**

Property tests will cover:

1. **Survey Data Round-Trip** (Property 2)
   - Generate random valid survey data
   - Create survey and retrieve
   - Verify all fields match

2. **Passability Assessment** (Property 6)
   - Generate random waypoint clearances
   - Generate random transport dimensions
   - Verify assessment logic correctness

3. **Waypoint Order Sequentiality** (Property 5)
   - Generate random sequence of waypoint additions
   - Verify orders are always sequential

4. **Filtering Correctness** (Property 10)
   - Generate random survey list
   - Apply random filters
   - Verify all results match criteria

5. **Search Correctness** (Property 11)
   - Generate random surveys with various text fields
   - Apply search queries
   - Verify results contain search term

6. **Validation Completeness** (Property 12)
   - Generate surveys with missing required fields
   - Verify rejection
   - Generate surveys with negative values
   - Verify rejection

### Integration Tests

Integration tests will verify:

1. **Database Operations**
   - Survey CRUD operations
   - Waypoint CRUD with cascade delete
   - Checklist initialization from template

2. **Notification Triggers**
   - Survey completion notification to requestor

3. **Report Generation**
   - PDF report generation with all survey data

## File Structure

```
app/
  (main)/
    engineering/
      surveys/
        page.tsx                    # Survey list page
        new/
          page.tsx                  # Create survey page
        [id]/
          page.tsx                  # Survey detail page
          edit/
            page.tsx                # Edit survey page

components/
  surveys/
    survey-list.tsx                 # Survey list with filters
    survey-form.tsx                 # Create/edit form
    survey-detail-view.tsx          # Tabbed detail view
    survey-status-cards.tsx         # Status summary cards
    waypoint-table.tsx              # Waypoint list table
    waypoint-form.tsx               # Add/edit waypoint dialog
    waypoint-assessment.tsx         # Passability assessment display
    checklist-section.tsx           # Checklist with status toggles
    feasibility-form.tsx            # Completion assessment form
    route-overview.tsx              # Visual route summary
    permit-requirements-form.tsx    # Permit entry form

lib/
  survey-utils.ts                   # Utility functions
  survey-actions.ts                 # Server actions

types/
  survey.ts                         # TypeScript types
```

## Database Schema

```sql
-- Route survey requests
CREATE TABLE route_surveys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_number VARCHAR(30) UNIQUE NOT NULL,
  quotation_id UUID REFERENCES quotations(id),
  project_id UUID REFERENCES projects(id),
  job_order_id UUID REFERENCES job_orders(id),
  customer_id UUID REFERENCES customers(id),
  
  -- Cargo details
  cargo_description TEXT NOT NULL,
  cargo_length_m DECIMAL(8,2),
  cargo_width_m DECIMAL(8,2),
  cargo_height_m DECIMAL(8,2),
  cargo_weight_tons DECIMAL(10,2),
  
  -- Transport configuration
  transport_config TEXT,
  total_length_m DECIMAL(8,2),
  total_width_m DECIMAL(8,2),
  total_height_m DECIMAL(8,2),
  total_weight_tons DECIMAL(10,2),
  axle_configuration TEXT,
  ground_clearance_m DECIMAL(6,2),
  turning_radius_m DECIMAL(6,2),
  
  -- Route
  origin_location VARCHAR(200) NOT NULL,
  origin_address TEXT,
  origin_coordinates VARCHAR(100),
  destination_location VARCHAR(200) NOT NULL,
  destination_address TEXT,
  destination_coordinates VARCHAR(100),
  
  -- Survey details
  survey_date DATE,
  surveyor_id UUID REFERENCES employees(id),
  surveyor_name VARCHAR(200),
  
  -- Route options
  primary_route TEXT,
  alternative_routes JSONB DEFAULT '[]',
  
  -- Assessment
  route_distance_km DECIMAL(10,2),
  estimated_travel_time_hours DECIMAL(6,2),
  feasibility VARCHAR(20),
  feasibility_notes TEXT,
  
  -- Permits
  permits_required JSONB DEFAULT '[]',
  
  -- Escort
  escort_required BOOLEAN DEFAULT FALSE,
  escort_type VARCHAR(50),
  escort_vehicles_count INTEGER,
  
  -- Time restrictions
  travel_time_restrictions TEXT,
  
  -- Cost estimates
  survey_cost DECIMAL(15,2),
  permit_cost_estimate DECIMAL(15,2),
  escort_cost_estimate DECIMAL(15,2),
  road_repair_cost_estimate DECIMAL(15,2),
  total_route_cost_estimate DECIMAL(15,2),
  
  -- Status
  status VARCHAR(30) DEFAULT 'requested',
  requested_by UUID REFERENCES user_profiles(id),
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  
  -- Documents
  documents JSONB DEFAULT '[]',
  photos JSONB DEFAULT '[]',
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Route waypoints
CREATE TABLE route_waypoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID NOT NULL REFERENCES route_surveys(id) ON DELETE CASCADE,
  waypoint_order INTEGER NOT NULL,
  waypoint_type VARCHAR(30) NOT NULL,
  location_name VARCHAR(200),
  coordinates VARCHAR(100),
  km_from_start DECIMAL(10,2),
  
  -- Road assessment
  road_condition VARCHAR(20),
  road_width_m DECIMAL(6,2),
  road_surface VARCHAR(50),
  
  -- Obstacle details
  obstacle_type VARCHAR(50),
  obstacle_description TEXT,
  
  -- Clearances
  vertical_clearance_m DECIMAL(6,2),
  horizontal_clearance_m DECIMAL(6,2),
  
  -- Bridge details
  bridge_name VARCHAR(200),
  bridge_capacity_tons DECIMAL(10,2),
  bridge_width_m DECIMAL(6,2),
  bridge_length_m DECIMAL(6,2),
  
  -- Turn details
  turn_radius_available_m DECIMAL(6,2),
  turn_feasible BOOLEAN,
  
  -- Action required
  action_required TEXT,
  action_cost_estimate DECIMAL(15,2),
  action_responsible VARCHAR(200),
  
  -- Pass/fail
  is_passable BOOLEAN DEFAULT TRUE,
  passable_notes TEXT,
  
  -- Photos
  photos JSONB DEFAULT '[]',
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Survey checklist
CREATE TABLE route_survey_checklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID NOT NULL REFERENCES route_surveys(id) ON DELETE CASCADE,
  category VARCHAR(50) NOT NULL,
  check_item VARCHAR(200) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  notes TEXT,
  checked_by UUID REFERENCES user_profiles(id),
  checked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Checklist template
CREATE TABLE route_survey_checklist_template (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category VARCHAR(50) NOT NULL,
  check_item VARCHAR(200) NOT NULL,
  is_mandatory BOOLEAN DEFAULT TRUE,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE
);

-- Indexes
CREATE INDEX idx_route_surveys_quotation ON route_surveys(quotation_id);
CREATE INDEX idx_route_surveys_project ON route_surveys(project_id);
CREATE INDEX idx_route_surveys_status ON route_surveys(status);
CREATE INDEX idx_route_surveys_surveyor ON route_surveys(surveyor_id);
CREATE INDEX idx_route_waypoints_survey ON route_waypoints(survey_id);
CREATE INDEX idx_route_survey_checklist_survey ON route_survey_checklist(survey_id);
```
