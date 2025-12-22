// =====================================================
// v0.56: ROUTE SURVEY UTILITY FUNCTIONS
// =====================================================

import {
  RouteSurvey,
  RouteWaypoint,
  SurveyChecklistItem,
  SurveyStatus,
  SurveyStatusCounts,
  SurveyFilters,
  TransportDimensions,
  PassabilityResult,
  Feasibility,
  ChecklistStatus,
  WaypointType,
  RouteSurveyRow,
  RouteWaypointRow,
  SurveyChecklistItemRow,
  SurveyFormData,
  WaypointFormData,
  FeasibilityAssessment,
  ChecklistCategory,
} from '@/types/survey';

// Constants
export const VERTICAL_CLEARANCE_MARGIN = 0.3; // meters
export const HORIZONTAL_CLEARANCE_MARGIN = 0.5; // meters

export const SURVEY_STATUS_LABELS: Record<SurveyStatus, string> = {
  requested: 'Requested',
  scheduled: 'Scheduled',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export const FEASIBILITY_LABELS: Record<Feasibility, string> = {
  feasible: 'Feasible',
  feasible_with_conditions: 'Feasible with Conditions',
  not_feasible: 'Not Feasible',
};

export const CHECKLIST_STATUS_LABELS: Record<ChecklistStatus, string> = {
  pending: 'Pending',
  ok: 'OK',
  warning: 'Warning',
  fail: 'Fail',
};

export const WAYPOINT_TYPE_LABELS: Record<WaypointType, string> = {
  start: 'Start',
  checkpoint: 'Checkpoint',
  obstacle: 'Obstacle',
  bridge: 'Bridge',
  intersection: 'Intersection',
  underpass: 'Underpass',
  overhead: 'Overhead',
  turn: 'Turn',
  rest_point: 'Rest Point',
  destination: 'Destination',
};

export const CHECKLIST_CATEGORY_LABELS: Record<ChecklistCategory, string> = {
  road_condition: 'Road Condition',
  clearances: 'Clearances',
  bridges: 'Bridges',
  utilities: 'Utilities',
  traffic: 'Traffic',
  permits: 'Permits',
  access: 'Access',
};

// Survey Number Functions
export const SURVEY_NUMBER_REGEX = /^RSV-\d{4}-\d{4}$/;

export function isValidSurveyNumber(surveyNumber: string): boolean {
  return SURVEY_NUMBER_REGEX.test(surveyNumber);
}

export function parseSurveyNumber(surveyNumber: string): { year: number; sequence: number } | null {
  if (!isValidSurveyNumber(surveyNumber)) return null;
  const parts = surveyNumber.split('-');
  return {
    year: parseInt(parts[1], 10),
    sequence: parseInt(parts[2], 10),
  };
}

export function formatSurveyNumber(year: number, sequence: number): string {
  return `RSV-${year}-${sequence.toString().padStart(4, '0')}`;
}

// Status Count Functions
export function calculateStatusCounts(surveys: RouteSurvey[]): SurveyStatusCounts {
  return surveys.reduce(
    (counts, survey) => {
      if (survey.status in counts) {
        counts[survey.status as keyof SurveyStatusCounts]++;
      }
      return counts;
    },
    { requested: 0, scheduled: 0, in_progress: 0, completed: 0 }
  );
}

// Filter Functions
export function filterSurveys(
  surveys: RouteSurvey[],
  filters: SurveyFilters
): RouteSurvey[] {
  return surveys.filter((survey) => {
    // Status filter
    if (filters.status !== 'all' && survey.status !== filters.status) {
      return false;
    }
    // Surveyor filter
    if (filters.surveyorId !== 'all' && survey.surveyorId !== filters.surveyorId) {
      return false;
    }
    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const matchesSurveyNumber = survey.surveyNumber.toLowerCase().includes(searchLower);
      const matchesCargoDescription = survey.cargoDescription.toLowerCase().includes(searchLower);
      const matchesOrigin = survey.originLocation.toLowerCase().includes(searchLower);
      const matchesDestination = survey.destinationLocation.toLowerCase().includes(searchLower);
      if (!matchesSurveyNumber && !matchesCargoDescription && !matchesOrigin && !matchesDestination) {
        return false;
      }
    }
    return true;
  });
}

export function searchSurveys(surveys: RouteSurvey[], query: string): RouteSurvey[] {
  if (!query.trim()) return surveys;
  const searchLower = query.toLowerCase();
  return surveys.filter((survey) => {
    return (
      survey.surveyNumber.toLowerCase().includes(searchLower) ||
      survey.cargoDescription.toLowerCase().includes(searchLower) ||
      survey.originLocation.toLowerCase().includes(searchLower) ||
      survey.destinationLocation.toLowerCase().includes(searchLower)
    );
  });
}

// Waypoint Functions
export function getNextWaypointOrder(waypoints: RouteWaypoint[]): number {
  if (waypoints.length === 0) return 1;
  return Math.max(...waypoints.map((w) => w.waypointOrder)) + 1;
}

export function sortWaypointsByOrder(waypoints: RouteWaypoint[]): RouteWaypoint[] {
  return [...waypoints].sort((a, b) => a.waypointOrder - b.waypointOrder);
}

export function reorderWaypoints(
  waypoints: RouteWaypoint[],
  fromIndex: number,
  toIndex: number
): RouteWaypoint[] {
  const sorted = sortWaypointsByOrder(waypoints);
  const [removed] = sorted.splice(fromIndex, 1);
  sorted.splice(toIndex, 0, removed);
  return sorted.map((w, index) => ({ ...w, waypointOrder: index + 1 }));
}

// Passability Assessment
export function assessWaypointPassability(
  waypoint: RouteWaypoint,
  transportDimensions: TransportDimensions
): PassabilityResult {
  const issues: string[] = [];

  // Check vertical clearance
  if (
    waypoint.verticalClearanceM !== undefined &&
    waypoint.verticalClearanceM !== null &&
    waypoint.verticalClearanceM < transportDimensions.height + VERTICAL_CLEARANCE_MARGIN
  ) {
    issues.push(
      `Insufficient vertical clearance: ${waypoint.verticalClearanceM}m available, ${(transportDimensions.height + VERTICAL_CLEARANCE_MARGIN).toFixed(2)}m required`
    );
  }

  // Check horizontal clearance
  if (
    waypoint.horizontalClearanceM !== undefined &&
    waypoint.horizontalClearanceM !== null &&
    waypoint.horizontalClearanceM < transportDimensions.width + HORIZONTAL_CLEARANCE_MARGIN
  ) {
    issues.push(
      `Insufficient horizontal clearance: ${waypoint.horizontalClearanceM}m available, ${(transportDimensions.width + HORIZONTAL_CLEARANCE_MARGIN).toFixed(2)}m required`
    );
  }

  // Check bridge capacity
  if (
    waypoint.bridgeCapacityTons !== undefined &&
    waypoint.bridgeCapacityTons !== null &&
    waypoint.bridgeCapacityTons < transportDimensions.weight
  ) {
    issues.push(
      `Bridge capacity exceeded: ${waypoint.bridgeCapacityTons}t capacity, ${transportDimensions.weight}t required`
    );
  }

  // Check turn radius
  if (
    waypoint.turnRadiusAvailableM !== undefined &&
    waypoint.turnRadiusAvailableM !== null &&
    waypoint.turnRadiusAvailableM < transportDimensions.turnRadius
  ) {
    issues.push(
      `Insufficient turn radius: ${waypoint.turnRadiusAvailableM}m available, ${transportDimensions.turnRadius}m required`
    );
  }

  return {
    passable: issues.length === 0,
    issues,
  };
}

// Validation Functions
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateSurveyData(data: Partial<SurveyFormData>): ValidationResult {
  const errors: string[] = [];

  // Required fields
  if (!data.cargoDescription?.trim()) {
    errors.push('Cargo description is required');
  }
  if (!data.originLocation?.trim()) {
    errors.push('Origin location is required');
  }
  if (!data.destinationLocation?.trim()) {
    errors.push('Destination location is required');
  }

  // Positive number validation
  const numericFields: (keyof SurveyFormData)[] = [
    'cargoLengthM',
    'cargoWidthM',
    'cargoHeightM',
    'cargoWeightTons',
    'totalLengthM',
    'totalWidthM',
    'totalHeightM',
    'totalWeightTons',
    'groundClearanceM',
    'turningRadiusM',
  ];

  for (const field of numericFields) {
    const value = data[field];
    if (value !== undefined && value !== null && typeof value === 'number' && value < 0) {
      errors.push(`${field} must be a positive value`);
    }
  }

  return { valid: errors.length === 0, errors };
}

export function validateWaypointData(data: Partial<WaypointFormData>): ValidationResult {
  const errors: string[] = [];

  if (!data.waypointType) {
    errors.push('Waypoint type is required');
  }
  if (!data.locationName?.trim()) {
    errors.push('Location name is required');
  }

  // Positive number validation
  const numericFields: (keyof WaypointFormData)[] = [
    'kmFromStart',
    'roadWidthM',
    'verticalClearanceM',
    'horizontalClearanceM',
    'bridgeCapacityTons',
    'bridgeWidthM',
    'bridgeLengthM',
    'turnRadiusAvailableM',
    'actionCostEstimate',
  ];

  for (const field of numericFields) {
    const value = data[field];
    if (value !== undefined && value !== null && typeof value === 'number' && value < 0) {
      errors.push(`${field} must be a positive value`);
    }
  }

  return { valid: errors.length === 0, errors };
}

export function validateChecklistStatus(status: string): status is ChecklistStatus {
  return ['pending', 'ok', 'warning', 'fail'].includes(status);
}

export function validateFeasibilityData(data: Partial<FeasibilityAssessment>): ValidationResult {
  const errors: string[] = [];

  if (!data.feasibility) {
    errors.push('Feasibility assessment is required');
  } else if (!['feasible', 'feasible_with_conditions', 'not_feasible'].includes(data.feasibility)) {
    errors.push('Invalid feasibility value');
  }

  if (data.routeDistanceKm !== undefined && data.routeDistanceKm < 0) {
    errors.push('Route distance must be a positive value');
  }

  if (data.estimatedTravelTimeHours !== undefined && data.estimatedTravelTimeHours < 0) {
    errors.push('Estimated travel time must be a positive value');
  }

  if (data.totalRouteCostEstimate !== undefined && data.totalRouteCostEstimate < 0) {
    errors.push('Total route cost estimate must be a positive value');
  }

  return { valid: errors.length === 0, errors };
}

// Row to Model Conversion
export function rowToSurvey(row: RouteSurveyRow): RouteSurvey {
  return {
    id: row.id,
    surveyNumber: row.survey_number,
    quotationId: row.quotation_id ?? undefined,
    projectId: row.project_id ?? undefined,
    jobOrderId: row.job_order_id ?? undefined,
    customerId: row.customer_id ?? undefined,
    cargoDescription: row.cargo_description,
    cargoLengthM: row.cargo_length_m ?? undefined,
    cargoWidthM: row.cargo_width_m ?? undefined,
    cargoHeightM: row.cargo_height_m ?? undefined,
    cargoWeightTons: row.cargo_weight_tons ?? undefined,
    transportConfig: row.transport_config ?? undefined,
    totalLengthM: row.total_length_m ?? undefined,
    totalWidthM: row.total_width_m ?? undefined,
    totalHeightM: row.total_height_m ?? undefined,
    totalWeightTons: row.total_weight_tons ?? undefined,
    axleConfiguration: row.axle_configuration ?? undefined,
    groundClearanceM: row.ground_clearance_m ?? undefined,
    turningRadiusM: row.turning_radius_m ?? undefined,
    originLocation: row.origin_location,
    originAddress: row.origin_address ?? undefined,
    originCoordinates: row.origin_coordinates ?? undefined,
    destinationLocation: row.destination_location,
    destinationAddress: row.destination_address ?? undefined,
    destinationCoordinates: row.destination_coordinates ?? undefined,
    surveyDate: row.survey_date ?? undefined,
    surveyorId: row.surveyor_id ?? undefined,
    surveyorName: row.surveyor_name ?? undefined,
    primaryRoute: row.primary_route ?? undefined,
    alternativeRoutes: row.alternative_routes ?? undefined,
    routeDistanceKm: row.route_distance_km ?? undefined,
    estimatedTravelTimeHours: row.estimated_travel_time_hours ?? undefined,
    feasibility: row.feasibility ?? undefined,
    feasibilityNotes: row.feasibility_notes ?? undefined,
    permitsRequired: row.permits_required ?? undefined,
    escortRequired: row.escort_required,
    escortType: row.escort_type ?? undefined,
    escortVehiclesCount: row.escort_vehicles_count ?? undefined,
    travelTimeRestrictions: row.travel_time_restrictions ?? undefined,
    surveyCost: row.survey_cost ?? undefined,
    permitCostEstimate: row.permit_cost_estimate ?? undefined,
    escortCostEstimate: row.escort_cost_estimate ?? undefined,
    roadRepairCostEstimate: row.road_repair_cost_estimate ?? undefined,
    totalRouteCostEstimate: row.total_route_cost_estimate ?? undefined,
    status: row.status,
    requestedBy: row.requested_by ?? undefined,
    requestedAt: row.requested_at,
    completedAt: row.completed_at ?? undefined,
    documents: row.documents ?? undefined,
    photos: row.photos ?? undefined,
    notes: row.notes ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function rowToWaypoint(row: RouteWaypointRow): RouteWaypoint {
  return {
    id: row.id,
    surveyId: row.survey_id,
    waypointOrder: row.waypoint_order,
    waypointType: row.waypoint_type,
    locationName: row.location_name,
    coordinates: row.coordinates ?? undefined,
    kmFromStart: row.km_from_start ?? undefined,
    roadCondition: row.road_condition ?? undefined,
    roadWidthM: row.road_width_m ?? undefined,
    roadSurface: row.road_surface ?? undefined,
    obstacleType: row.obstacle_type ?? undefined,
    obstacleDescription: row.obstacle_description ?? undefined,
    verticalClearanceM: row.vertical_clearance_m ?? undefined,
    horizontalClearanceM: row.horizontal_clearance_m ?? undefined,
    bridgeName: row.bridge_name ?? undefined,
    bridgeCapacityTons: row.bridge_capacity_tons ?? undefined,
    bridgeWidthM: row.bridge_width_m ?? undefined,
    bridgeLengthM: row.bridge_length_m ?? undefined,
    turnRadiusAvailableM: row.turn_radius_available_m ?? undefined,
    turnFeasible: row.turn_feasible ?? undefined,
    actionRequired: row.action_required ?? undefined,
    actionCostEstimate: row.action_cost_estimate ?? undefined,
    actionResponsible: row.action_responsible ?? undefined,
    isPassable: row.is_passable,
    passableNotes: row.passable_notes ?? undefined,
    photos: row.photos ?? undefined,
    createdAt: row.created_at,
  };
}

export function rowToChecklistItem(row: SurveyChecklistItemRow): SurveyChecklistItem {
  return {
    id: row.id,
    surveyId: row.survey_id,
    category: row.category,
    checkItem: row.check_item,
    status: row.status,
    notes: row.notes ?? undefined,
    checkedBy: row.checked_by ?? undefined,
    checkedAt: row.checked_at ?? undefined,
    createdAt: row.created_at,
  };
}

// Formatting Functions
export function formatDimensions(
  length?: number,
  width?: number,
  height?: number
): string {
  const parts: string[] = [];
  if (length !== undefined) parts.push(`${length}m`);
  if (width !== undefined) parts.push(`${width}m`);
  if (height !== undefined) parts.push(`${height}m`);
  return parts.join(' × ') || '-';
}

export function formatWeight(tons?: number): string {
  if (tons === undefined) return '-';
  return `${tons} tons`;
}

export function formatDistance(km?: number): string {
  if (km === undefined) return '-';
  return `${km} km`;
}

export function formatTravelTime(hours?: number): string {
  if (hours === undefined) return '-';
  if (hours < 1) return `${Math.round(hours * 60)} min`;
  return `${hours} hours`;
}

export function formatCurrency(amount?: number): string {
  if (amount === undefined || amount === null) return '-';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Checklist Grouping
export function groupChecklistByCategory(
  checklist: SurveyChecklistItem[]
): Record<ChecklistCategory, SurveyChecklistItem[]> {
  const grouped: Record<ChecklistCategory, SurveyChecklistItem[]> = {
    road_condition: [],
    clearances: [],
    bridges: [],
    utilities: [],
    traffic: [],
    permits: [],
    access: [],
  };

  for (const item of checklist) {
    if (item.category in grouped) {
      grouped[item.category].push(item);
    }
  }

  return grouped;
}

// Status Badge Helpers
export function getSurveyStatusColor(status: SurveyStatus): string {
  switch (status) {
    case 'requested':
      return 'bg-blue-100 text-blue-800';
    case 'scheduled':
      return 'bg-purple-100 text-purple-800';
    case 'in_progress':
      return 'bg-yellow-100 text-yellow-800';
    case 'completed':
      return 'bg-green-100 text-green-800';
    case 'cancelled':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

export function getFeasibilityColor(feasibility?: Feasibility): string {
  switch (feasibility) {
    case 'feasible':
      return 'bg-green-100 text-green-800';
    case 'feasible_with_conditions':
      return 'bg-yellow-100 text-yellow-800';
    case 'not_feasible':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

export function getChecklistStatusColor(status: ChecklistStatus): string {
  switch (status) {
    case 'ok':
      return 'bg-green-100 text-green-800';
    case 'warning':
      return 'bg-yellow-100 text-yellow-800';
    case 'fail':
      return 'bg-red-100 text-red-800';
    case 'pending':
    default:
      return 'bg-gray-100 text-gray-800';
  }
}
