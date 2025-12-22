// =====================================================
// v0.57: JOURNEY MANAGEMENT PLAN (JMP) TYPES
// =====================================================

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

export interface ConvoyVehicle {
  type: string;
  plateNumber?: string;
  driver?: string;
}

export interface ConvoyConfiguration {
  leadVehicle?: ConvoyVehicle;
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
  chaseVehicle?: ConvoyVehicle;
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
  radioFrequencies?: RadioFrequency[];
  emergencyContacts?: EmergencyContact[];
  contingencyPlans?: ContingencyPlan[];
  emergencyProcedures?: string;
  nearestHospitals?: NearbyFacility[];
  nearestWorkshops?: NearbyFacility[];
  permits?: JmpPermit[];
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

export interface PostJourneyData {
  journeyLog?: string;
  incidentsOccurred: boolean;
  incidentSummary?: string;
  lessonsLearned?: string;
}


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

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}
