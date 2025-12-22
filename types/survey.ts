// =====================================================
// v0.56: ROUTE SURVEY MANAGEMENT TYPES
// =====================================================

// Enums
export type SurveyStatus = 'requested' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

export type WaypointType = 
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

export type RoadCondition = 'good' | 'fair' | 'poor' | 'impassable';

export type RoadSurface = 'asphalt' | 'concrete' | 'gravel' | 'dirt';

export type Feasibility = 'feasible' | 'feasible_with_conditions' | 'not_feasible';

export type EscortType = 'police' | 'private' | 'both';

export type ChecklistCategory = 
  | 'road_condition' 
  | 'clearances' 
  | 'bridges' 
  | 'utilities' 
  | 'traffic' 
  | 'permits' 
  | 'access';

export type ChecklistStatus = 'pending' | 'ok' | 'warning' | 'fail';

// Interfaces
export interface PermitRequirement {
  type: string;
  authority: string;
  estimatedDays: number;
  estimatedCost: number;
}

export interface SurveyDocument {
  type: string;
  url: string;
  name?: string;
  uploadedAt?: string;
}

export interface RouteSurvey {
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

export interface RouteWaypoint {
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

export interface SurveyChecklistItem {
  id: string;
  surveyId: string;
  category: ChecklistCategory;
  checkItem: string;
  status: ChecklistStatus;
  notes?: string;
  checkedBy?: string;
  checkedAt?: string;
  createdAt: string;
}

export interface ChecklistTemplate {
  id: string;
  category: ChecklistCategory;
  checkItem: string;
  isMandatory: boolean;
  displayOrder: number;
  isActive: boolean;
}

// Form Data Interfaces
export interface SurveyFormData {
  quotationId?: string;
  projectId?: string;
  customerId?: string;
  cargoDescription: string;
  cargoLengthM?: number;
  cargoWidthM?: number;
  cargoHeightM?: number;
  cargoWeightTons?: number;
  transportConfig?: string;
  totalLengthM?: number;
  totalWidthM?: number;
  totalHeightM?: number;
  totalWeightTons?: number;
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
  notes?: string;
}

export interface WaypointFormData {
  waypointType: WaypointType;
  locationName: string;
  coordinates?: string;
  kmFromStart?: number;
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
  isPassable?: boolean;
  passableNotes?: string;
}

export interface FeasibilityAssessment {
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

export interface TransportDimensions {
  height: number;
  width: number;
  weight: number;
  turnRadius: number;
}

export interface PassabilityResult {
  passable: boolean;
  issues: string[];
}

export interface SurveyStatusCounts {
  requested: number;
  scheduled: number;
  in_progress: number;
  completed: number;
}

export interface SurveyFilters {
  status: SurveyStatus | 'all';
  surveyorId: string | 'all';
  search: string;
}

// Database row types (snake_case)
export interface RouteSurveyRow {
  id: string;
  survey_number: string;
  quotation_id: string | null;
  project_id: string | null;
  job_order_id: string | null;
  customer_id: string | null;
  cargo_description: string;
  cargo_length_m: number | null;
  cargo_width_m: number | null;
  cargo_height_m: number | null;
  cargo_weight_tons: number | null;
  transport_config: string | null;
  total_length_m: number | null;
  total_width_m: number | null;
  total_height_m: number | null;
  total_weight_tons: number | null;
  axle_configuration: string | null;
  ground_clearance_m: number | null;
  turning_radius_m: number | null;
  origin_location: string;
  origin_address: string | null;
  origin_coordinates: string | null;
  destination_location: string;
  destination_address: string | null;
  destination_coordinates: string | null;
  survey_date: string | null;
  surveyor_id: string | null;
  surveyor_name: string | null;
  primary_route: string | null;
  alternative_routes: string[] | null;
  route_distance_km: number | null;
  estimated_travel_time_hours: number | null;
  feasibility: Feasibility | null;
  feasibility_notes: string | null;
  permits_required: PermitRequirement[] | null;
  escort_required: boolean;
  escort_type: EscortType | null;
  escort_vehicles_count: number | null;
  travel_time_restrictions: string | null;
  survey_cost: number | null;
  permit_cost_estimate: number | null;
  escort_cost_estimate: number | null;
  road_repair_cost_estimate: number | null;
  total_route_cost_estimate: number | null;
  status: SurveyStatus;
  requested_by: string | null;
  requested_at: string;
  completed_at: string | null;
  documents: SurveyDocument[] | null;
  photos: string[] | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface RouteWaypointRow {
  id: string;
  survey_id: string;
  waypoint_order: number;
  waypoint_type: WaypointType;
  location_name: string;
  coordinates: string | null;
  km_from_start: number | null;
  road_condition: RoadCondition | null;
  road_width_m: number | null;
  road_surface: RoadSurface | null;
  obstacle_type: string | null;
  obstacle_description: string | null;
  vertical_clearance_m: number | null;
  horizontal_clearance_m: number | null;
  bridge_name: string | null;
  bridge_capacity_tons: number | null;
  bridge_width_m: number | null;
  bridge_length_m: number | null;
  turn_radius_available_m: number | null;
  turn_feasible: boolean | null;
  action_required: string | null;
  action_cost_estimate: number | null;
  action_responsible: string | null;
  is_passable: boolean;
  passable_notes: string | null;
  photos: string[] | null;
  created_at: string;
}

export interface SurveyChecklistItemRow {
  id: string;
  survey_id: string;
  category: ChecklistCategory;
  check_item: string;
  status: ChecklistStatus;
  notes: string | null;
  checked_by: string | null;
  checked_at: string | null;
  created_at: string;
}

// Extended types with relations
export interface RouteSurveyWithRelations extends RouteSurvey {
  customer?: { id: string; name: string };
  quotation?: { id: string; quotation_number: string };
  project?: { id: string; name: string };
  surveyor?: { id: string; full_name: string };
  waypoints?: RouteWaypoint[];
  checklist?: SurveyChecklistItem[];
}
