// =====================================================
// v0.57: JOURNEY MANAGEMENT PLAN UTILITIES
// =====================================================

import {
  JmpStatus,
  Likelihood,
  Consequence,
  RiskLevel,
  JmpFormData,
  CheckpointFormData,
  JmpPermit,
  JmpCheckpoint,
  JourneyManagementPlan,
  JmpRow,
  JmpCheckpointRow,
  ValidationResult,
  ActiveJourneyProgress,
  CheckpointLocationType,
} from '@/types/jmp';

// Risk Matrix - 5x5 matrix for calculating risk level
const RISK_MATRIX: Record<Likelihood, Record<Consequence, RiskLevel>> = {
  almost_certain: {
    insignificant: 'medium',
    minor: 'high',
    moderate: 'high',
    major: 'extreme',
    catastrophic: 'extreme',
  },
  likely: {
    insignificant: 'medium',
    minor: 'medium',
    moderate: 'high',
    major: 'high',
    catastrophic: 'extreme',
  },
  possible: {
    insignificant: 'low',
    minor: 'medium',
    moderate: 'medium',
    major: 'high',
    catastrophic: 'high',
  },
  unlikely: {
    insignificant: 'low',
    minor: 'low',
    moderate: 'medium',
    major: 'medium',
    catastrophic: 'high',
  },
  rare: {
    insignificant: 'low',
    minor: 'low',
    moderate: 'low',
    major: 'medium',
    catastrophic: 'medium',
  },
};

/**
 * Calculate risk level from likelihood and consequence using standard 5x5 matrix
 */
export function calculateRiskLevel(likelihood: Likelihood, consequence: Consequence): RiskLevel {
  return RISK_MATRIX[likelihood][consequence];
}

/**
 * Validate JMP form data
 */
export function validateJmpForm(data: JmpFormData): ValidationResult {
  const errors: string[] = [];

  if (!data.journeyTitle?.trim()) {
    errors.push('Journey title is required');
  }

  if (!data.cargoDescription?.trim()) {
    errors.push('Cargo description is required');
  }

  if (!data.originLocation?.trim()) {
    errors.push('Origin location is required');
  }

  if (!data.destinationLocation?.trim()) {
    errors.push('Destination location is required');
  }

  if (data.plannedDeparture && data.plannedArrival) {
    const departure = new Date(data.plannedDeparture);
    const arrival = new Date(data.plannedArrival);
    if (arrival <= departure) {
      errors.push('Planned arrival must be after planned departure');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}


/**
 * Validate checkpoint data
 */
export function validateCheckpoint(data: CheckpointFormData): ValidationResult {
  const errors: string[] = [];

  if (!data.locationName?.trim()) {
    errors.push('Location name is required');
  }

  if (!data.locationType) {
    errors.push('Location type is required');
  }

  if (data.kmFromStart !== undefined && data.kmFromStart < 0) {
    errors.push('KM from start cannot be negative');
  }

  if (data.plannedArrival && data.plannedDeparture) {
    const arrival = new Date(data.plannedArrival);
    const departure = new Date(data.plannedDeparture);
    if (departure < arrival) {
      errors.push('Planned departure cannot be before planned arrival');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Check if permit is valid for journey date
 */
export function isPermitValid(permit: JmpPermit, journeyDate: string): boolean {
  const journey = new Date(journeyDate);
  const validFrom = new Date(permit.validFrom);
  const validTo = new Date(permit.validTo);
  
  return journey >= validFrom && journey <= validTo;
}

/**
 * Get permit validity status
 */
export function getPermitStatus(permit: JmpPermit, journeyDate: string): 'valid' | 'expiring_soon' | 'expired' {
  const journey = new Date(journeyDate);
  const validTo = new Date(permit.validTo);
  const validFrom = new Date(permit.validFrom);
  
  // Check if expired
  if (validTo < journey) {
    return 'expired';
  }
  
  // Check if not yet valid
  if (validFrom > journey) {
    return 'expired'; // Treat not-yet-valid as expired for simplicity
  }
  
  // Check if expiring within 7 days
  const sevenDaysFromJourney = new Date(journey);
  sevenDaysFromJourney.setDate(sevenDaysFromJourney.getDate() + 7);
  
  if (validTo <= sevenDaysFromJourney) {
    return 'expiring_soon';
  }
  
  return 'valid';
}

/**
 * Calculate stop duration from arrival and departure times
 */
export function calculateStopDuration(plannedArrival: string, plannedDeparture: string): number {
  const arrival = new Date(plannedArrival);
  const departure = new Date(plannedDeparture);
  const diffMs = departure.getTime() - arrival.getTime();
  return Math.round(diffMs / (1000 * 60)); // Convert to minutes
}

/**
 * Calculate journey progress from checkpoints
 */
export function calculateJourneyProgress(checkpoints: JmpCheckpoint[]): ActiveJourneyProgress {
  const total = checkpoints.length;
  const completed = checkpoints.filter(cp => cp.status === 'departed').length;
  const progressPercent = total > 0 ? Math.round((completed / total) * 100) : 0;
  
  // Find current checkpoint (first one that's not departed)
  const currentCheckpoint = checkpoints.find(cp => cp.status !== 'departed' && cp.status !== 'skipped');
  
  // Check if on schedule
  let isOnSchedule = true;
  if (currentCheckpoint?.plannedArrival && currentCheckpoint?.actualArrival) {
    isOnSchedule = !isCheckpointBehindSchedule(currentCheckpoint);
  }
  
  return {
    jmpId: checkpoints[0]?.jmpId || '',
    checkpointsCompleted: completed,
    totalCheckpoints: total,
    progressPercent,
    isOnSchedule,
    currentCheckpoint: currentCheckpoint?.locationName,
  };
}


/**
 * Check if a checkpoint is behind schedule
 */
export function isCheckpointBehindSchedule(checkpoint: JmpCheckpoint): boolean {
  if (!checkpoint.plannedArrival || !checkpoint.actualArrival) {
    return false;
  }
  const planned = new Date(checkpoint.plannedArrival);
  const actual = new Date(checkpoint.actualArrival);
  return actual > planned;
}

/**
 * Check if journey is on schedule based on checkpoint
 */
export function isOnSchedule(checkpoint: JmpCheckpoint): boolean {
  return !isCheckpointBehindSchedule(checkpoint);
}

/**
 * Calculate time variance between planned and actual (in minutes)
 * Positive = delay, Negative = early
 */
export function calculateTimeVariance(planned: string, actual: string): number {
  const plannedDate = new Date(planned);
  const actualDate = new Date(actual);
  const diffMs = actualDate.getTime() - plannedDate.getTime();
  return Math.round(diffMs / (1000 * 60)); // Convert to minutes
}

/**
 * Sort checkpoints by km from start
 */
export function sortCheckpointsByDistance(checkpoints: JmpCheckpoint[]): JmpCheckpoint[] {
  return [...checkpoints].sort((a, b) => {
    const kmA = a.kmFromStart ?? 0;
    const kmB = b.kmFromStart ?? 0;
    return kmA - kmB;
  });
}

/**
 * Validate checkpoint sequence (must have departure at 0 and arrival at end)
 */
export function validateCheckpointSequence(
  checkpoints: JmpCheckpoint[],
  routeDistanceKm: number
): ValidationResult {
  const errors: string[] = [];
  
  if (checkpoints.length === 0) {
    errors.push('At least one checkpoint is required');
    return { valid: false, errors };
  }
  
  const sorted = sortCheckpointsByDistance(checkpoints);
  
  // Check for departure checkpoint at km 0
  const departureCheckpoint = sorted.find(
    cp => cp.locationType === 'departure' && (cp.kmFromStart === 0 || cp.kmFromStart === undefined)
  );
  if (!departureCheckpoint) {
    errors.push('A departure checkpoint at km 0 is required');
  }
  
  // Check for arrival checkpoint at route end
  const arrivalCheckpoint = sorted.find(cp => cp.locationType === 'arrival');
  if (!arrivalCheckpoint) {
    errors.push('An arrival checkpoint at the destination is required');
  } else if (routeDistanceKm > 0 && arrivalCheckpoint.kmFromStart !== undefined) {
    // Allow some tolerance (within 5km of route distance)
    const tolerance = 5;
    if (Math.abs((arrivalCheckpoint.kmFromStart || 0) - routeDistanceKm) > tolerance) {
      errors.push('Arrival checkpoint should be at or near the route end');
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}


/**
 * Convert database row to JMP object
 */
export function mapRowToJmp(row: JmpRow): JourneyManagementPlan {
  return {
    id: row.id,
    jmpNumber: row.jmp_number,
    routeSurveyId: row.route_survey_id || undefined,
    jobOrderId: row.job_order_id || undefined,
    projectId: row.project_id || undefined,
    customerId: row.customer_id || undefined,
    journeyTitle: row.journey_title,
    journeyDescription: row.journey_description || undefined,
    cargoDescription: row.cargo_description,
    totalLengthM: row.total_length_m || undefined,
    totalWidthM: row.total_width_m || undefined,
    totalHeightM: row.total_height_m || undefined,
    totalWeightTons: row.total_weight_tons || undefined,
    originLocation: row.origin_location,
    destinationLocation: row.destination_location,
    routeDistanceKm: row.route_distance_km || undefined,
    plannedDeparture: row.planned_departure || undefined,
    plannedArrival: row.planned_arrival || undefined,
    journeyDurationHours: row.journey_duration_hours || undefined,
    movementWindows: row.movement_windows || [],
    convoyConfiguration: row.convoy_configuration || undefined,
    convoyCommanderId: row.convoy_commander_id || undefined,
    drivers: row.drivers || [],
    escortDetails: row.escort_details || undefined,
    radioFrequencies: row.radio_frequencies || [],
    emergencyContacts: row.emergency_contacts || [],
    reportingSchedule: row.reporting_schedule || [],
    contingencyPlans: row.contingency_plans || [],
    emergencyProcedures: row.emergency_procedures || undefined,
    nearestHospitals: row.nearest_hospitals || [],
    nearestWorkshops: row.nearest_workshops || [],
    permits: row.permits || [],
    weatherRestrictions: row.weather_restrictions || undefined,
    goNoGoCriteria: row.go_no_go_criteria || undefined,
    preparedBy: row.prepared_by || undefined,
    preparedAt: row.prepared_at || undefined,
    reviewedBy: row.reviewed_by || undefined,
    reviewedAt: row.reviewed_at || undefined,
    approvedBy: row.approved_by || undefined,
    approvedAt: row.approved_at || undefined,
    status: row.status,
    actualDeparture: row.actual_departure || undefined,
    actualArrival: row.actual_arrival || undefined,
    journeyLog: row.journey_log || undefined,
    incidentsOccurred: row.incidents_occurred,
    incidentSummary: row.incident_summary || undefined,
    lessonsLearned: row.lessons_learned || undefined,
    documents: row.documents || [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Convert JMP object to database row format
 */
export function mapJmpToRow(jmp: Partial<JourneyManagementPlan>): Partial<JmpRow> {
  const row: Partial<JmpRow> = {};
  
  if (jmp.routeSurveyId !== undefined) row.route_survey_id = jmp.routeSurveyId || null;
  if (jmp.jobOrderId !== undefined) row.job_order_id = jmp.jobOrderId || null;
  if (jmp.projectId !== undefined) row.project_id = jmp.projectId || null;
  if (jmp.customerId !== undefined) row.customer_id = jmp.customerId || null;
  if (jmp.journeyTitle !== undefined) row.journey_title = jmp.journeyTitle;
  if (jmp.journeyDescription !== undefined) row.journey_description = jmp.journeyDescription || null;
  if (jmp.cargoDescription !== undefined) row.cargo_description = jmp.cargoDescription;
  if (jmp.totalLengthM !== undefined) row.total_length_m = jmp.totalLengthM || null;
  if (jmp.totalWidthM !== undefined) row.total_width_m = jmp.totalWidthM || null;
  if (jmp.totalHeightM !== undefined) row.total_height_m = jmp.totalHeightM || null;
  if (jmp.totalWeightTons !== undefined) row.total_weight_tons = jmp.totalWeightTons || null;
  if (jmp.originLocation !== undefined) row.origin_location = jmp.originLocation;
  if (jmp.destinationLocation !== undefined) row.destination_location = jmp.destinationLocation;
  if (jmp.routeDistanceKm !== undefined) row.route_distance_km = jmp.routeDistanceKm || null;
  if (jmp.plannedDeparture !== undefined) row.planned_departure = jmp.plannedDeparture || null;
  if (jmp.plannedArrival !== undefined) row.planned_arrival = jmp.plannedArrival || null;
  if (jmp.journeyDurationHours !== undefined) row.journey_duration_hours = jmp.journeyDurationHours || null;
  if (jmp.movementWindows !== undefined) row.movement_windows = jmp.movementWindows;
  if (jmp.convoyConfiguration !== undefined) row.convoy_configuration = jmp.convoyConfiguration || null;
  if (jmp.convoyCommanderId !== undefined) row.convoy_commander_id = jmp.convoyCommanderId || null;
  if (jmp.drivers !== undefined) row.drivers = jmp.drivers;
  if (jmp.escortDetails !== undefined) row.escort_details = jmp.escortDetails || null;
  if (jmp.radioFrequencies !== undefined) row.radio_frequencies = jmp.radioFrequencies;
  if (jmp.emergencyContacts !== undefined) row.emergency_contacts = jmp.emergencyContacts;
  if (jmp.reportingSchedule !== undefined) row.reporting_schedule = jmp.reportingSchedule;
  if (jmp.contingencyPlans !== undefined) row.contingency_plans = jmp.contingencyPlans;
  if (jmp.emergencyProcedures !== undefined) row.emergency_procedures = jmp.emergencyProcedures || null;
  if (jmp.nearestHospitals !== undefined) row.nearest_hospitals = jmp.nearestHospitals;
  if (jmp.nearestWorkshops !== undefined) row.nearest_workshops = jmp.nearestWorkshops;
  if (jmp.permits !== undefined) row.permits = jmp.permits;
  if (jmp.weatherRestrictions !== undefined) row.weather_restrictions = jmp.weatherRestrictions || null;
  if (jmp.goNoGoCriteria !== undefined) row.go_no_go_criteria = jmp.goNoGoCriteria || null;
  if (jmp.preparedBy !== undefined) row.prepared_by = jmp.preparedBy || null;
  if (jmp.preparedAt !== undefined) row.prepared_at = jmp.preparedAt || null;
  if (jmp.reviewedBy !== undefined) row.reviewed_by = jmp.reviewedBy || null;
  if (jmp.reviewedAt !== undefined) row.reviewed_at = jmp.reviewedAt || null;
  if (jmp.approvedBy !== undefined) row.approved_by = jmp.approvedBy || null;
  if (jmp.approvedAt !== undefined) row.approved_at = jmp.approvedAt || null;
  if (jmp.status !== undefined) row.status = jmp.status;
  if (jmp.actualDeparture !== undefined) row.actual_departure = jmp.actualDeparture || null;
  if (jmp.actualArrival !== undefined) row.actual_arrival = jmp.actualArrival || null;
  if (jmp.journeyLog !== undefined) row.journey_log = jmp.journeyLog || null;
  if (jmp.incidentsOccurred !== undefined) row.incidents_occurred = jmp.incidentsOccurred;
  if (jmp.incidentSummary !== undefined) row.incident_summary = jmp.incidentSummary || null;
  if (jmp.lessonsLearned !== undefined) row.lessons_learned = jmp.lessonsLearned || null;
  if (jmp.documents !== undefined) row.documents = jmp.documents;
  
  return row;
}


/**
 * Convert checkpoint row to checkpoint object
 */
export function mapRowToCheckpoint(row: JmpCheckpointRow): JmpCheckpoint {
  return {
    id: row.id,
    jmpId: row.jmp_id,
    checkpointOrder: row.checkpoint_order,
    locationName: row.location_name,
    locationType: row.location_type,
    kmFromStart: row.km_from_start || undefined,
    coordinates: row.coordinates || undefined,
    plannedArrival: row.planned_arrival || undefined,
    plannedDeparture: row.planned_departure || undefined,
    stopDurationMinutes: row.stop_duration_minutes || undefined,
    actualArrival: row.actual_arrival || undefined,
    actualDeparture: row.actual_departure || undefined,
    activities: row.activities || undefined,
    reportRequired: row.report_required,
    reportTo: row.report_to || undefined,
    status: row.status,
    notes: row.notes || undefined,
    createdAt: row.created_at,
  };
}

/**
 * Format JMP status for display
 */
export function formatJmpStatus(status: JmpStatus): string {
  const statusMap: Record<JmpStatus, string> = {
    draft: 'Draft',
    pending_review: 'Pending Review',
    approved: 'Approved',
    active: 'Active',
    completed: 'Completed',
    cancelled: 'Cancelled',
  };
  return statusMap[status] || status;
}

/**
 * Get status badge color
 */
export function getJmpStatusColor(status: JmpStatus): string {
  const colorMap: Record<JmpStatus, string> = {
    draft: 'bg-gray-100 text-gray-800',
    pending_review: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    active: 'bg-blue-100 text-blue-800',
    completed: 'bg-purple-100 text-purple-800',
    cancelled: 'bg-red-100 text-red-800',
  };
  return colorMap[status] || 'bg-gray-100 text-gray-800';
}

/**
 * Format risk level for display
 */
export function formatRiskLevel(level: RiskLevel): string {
  const levelMap: Record<RiskLevel, string> = {
    low: 'Low',
    medium: 'Medium',
    high: 'High',
    extreme: 'Extreme',
  };
  return levelMap[level] || level;
}

/**
 * Get risk level badge color
 */
export function getRiskLevelColor(level: RiskLevel): string {
  const colorMap: Record<RiskLevel, string> = {
    low: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-orange-100 text-orange-800',
    extreme: 'bg-red-100 text-red-800',
  };
  return colorMap[level] || 'bg-gray-100 text-gray-800';
}

/**
 * Format checkpoint location type for display
 */
export function formatLocationType(type: CheckpointLocationType): string {
  const typeMap: Record<CheckpointLocationType, string> = {
    departure: 'Departure',
    waypoint: 'Waypoint',
    rest_stop: 'Rest Stop',
    checkpoint: 'Checkpoint',
    fuel_stop: 'Fuel Stop',
    arrival: 'Arrival',
  };
  return typeMap[type] || type;
}

/**
 * Get location type icon
 */
export function getLocationTypeIcon(type: CheckpointLocationType): string {
  const iconMap: Record<CheckpointLocationType, string> = {
    departure: '📍',
    waypoint: '📌',
    rest_stop: '🛏️',
    checkpoint: '🚔',
    fuel_stop: '⛽',
    arrival: '🏁',
  };
  return iconMap[type] || '📍';
}

/**
 * Validate status transition
 */
export function isValidStatusTransition(from: JmpStatus, to: JmpStatus): boolean {
  const validTransitions: Record<JmpStatus, JmpStatus[]> = {
    draft: ['pending_review', 'cancelled'],
    pending_review: ['approved', 'draft'],
    approved: ['active', 'cancelled'],
    active: ['completed', 'cancelled'],
    completed: [],
    cancelled: [],
  };
  
  return validTransitions[from]?.includes(to) || false;
}

/**
 * Format duration in minutes to human readable string
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${mins}m`;
}

/**
 * Format time variance for display
 */
export function formatTimeVariance(minutes: number): string {
  const absMinutes = Math.abs(minutes);
  const formatted = formatDuration(absMinutes);
  if (minutes > 0) {
    return `+${formatted} (delayed)`;
  } else if (minutes < 0) {
    return `-${formatted} (early)`;
  }
  return 'On time';
}
