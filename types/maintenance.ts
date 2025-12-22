// =====================================================
// v0.42: EQUIPMENT - MAINTENANCE TRACKING TYPES
// =====================================================

import { Asset } from './assets';

// Enums and type aliases
export type MaintenanceTriggerType = 'km' | 'hours' | 'days' | 'date';
export type MaintenancePerformedAt = 'internal' | 'external' | 'field';
export type MaintenanceRecordStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
export type MaintenanceUrgency = 'overdue' | 'due_soon' | 'ok';

// Maintenance Type (reference data)
export interface MaintenanceType {
  id: string;
  typeCode: string;
  typeName: string;
  description?: string;
  isScheduled: boolean;
  defaultIntervalKm?: number;
  defaultIntervalHours?: number;
  defaultIntervalDays?: number;
  applicableCategories: string[];
  isActive: boolean;
  displayOrder: number;
  createdAt: string;
}

// Database row format for MaintenanceType
export interface MaintenanceTypeRow {
  id: string;
  type_code: string;
  type_name: string;
  description: string | null;
  is_scheduled: boolean;
  default_interval_km: number | null;
  default_interval_hours: number | null;
  default_interval_days: number | null;
  applicable_categories: string[];
  is_active: boolean;
  display_order: number;
  created_at: string;
}

// Maintenance Schedule
export interface MaintenanceSchedule {
  id: string;
  assetId: string;
  maintenanceTypeId: string;
  triggerType: MaintenanceTriggerType;
  triggerValue?: number;
  triggerDate?: string;
  nextDueKm?: number;
  nextDueHours?: number;
  nextDueDate?: string;
  warningKm: number;
  warningDays: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  // Joined fields
  asset?: Asset;
  maintenanceType?: MaintenanceType;
}

// Database row format for MaintenanceSchedule
export interface MaintenanceScheduleRow {
  id: string;
  asset_id: string;
  maintenance_type_id: string;
  trigger_type: MaintenanceTriggerType;
  trigger_value: number | null;
  trigger_date: string | null;
  next_due_km: number | null;
  next_due_hours: number | null;
  next_due_date: string | null;
  warning_km: number;
  warning_days: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}


// Maintenance Record
export interface MaintenanceRecord {
  id: string;
  recordNumber: string;
  assetId: string;
  maintenanceTypeId: string;
  scheduleId?: string;
  maintenanceDate: string;
  startedAt?: string;
  completedAt?: string;
  odometerKm?: number;
  hourMeter?: number;
  performedAt: MaintenancePerformedAt;
  workshopName?: string;
  workshopAddress?: string;
  description: string;
  findings?: string;
  recommendations?: string;
  technicianName?: string;
  technicianEmployeeId?: string;
  laborCost: number;
  partsCost: number;
  externalCost: number;
  totalCost: number;
  bkkId?: string;
  status: MaintenanceRecordStatus;
  documents: string[];
  photos: string[];
  notes?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
  // Joined fields
  asset?: Asset;
  maintenanceType?: MaintenanceType;
  parts?: MaintenancePart[];
}

// Database row format for MaintenanceRecord
export interface MaintenanceRecordRow {
  id: string;
  record_number: string;
  asset_id: string;
  maintenance_type_id: string;
  schedule_id: string | null;
  maintenance_date: string;
  started_at: string | null;
  completed_at: string | null;
  odometer_km: number | null;
  hour_meter: number | null;
  performed_at: MaintenancePerformedAt;
  workshop_name: string | null;
  workshop_address: string | null;
  description: string;
  findings: string | null;
  recommendations: string | null;
  technician_name: string | null;
  technician_employee_id: string | null;
  labor_cost: number;
  parts_cost: number;
  external_cost: number;
  total_cost: number;
  bkk_id: string | null;
  status: MaintenanceRecordStatus;
  documents: string[];
  photos: string[];
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// Maintenance Part
export interface MaintenancePart {
  id: string;
  maintenanceRecordId: string;
  partNumber?: string;
  partName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  supplier?: string;
  warrantyMonths?: number;
  createdAt: string;
}

// Database row format for MaintenancePart
export interface MaintenancePartRow {
  id: string;
  maintenance_record_id: string;
  part_number: string | null;
  part_name: string;
  quantity: number;
  unit: string;
  unit_price: number;
  total_price: number;
  supplier: string | null;
  warranty_months: number | null;
  created_at: string;
}

// Upcoming Maintenance (from view)
export interface UpcomingMaintenance {
  scheduleId: string;
  assetId: string;
  assetCode: string;
  assetName: string;
  registrationNumber?: string;
  maintenanceTypeId: string;
  maintenanceType: string;
  triggerType: MaintenanceTriggerType;
  nextDueDate?: string;
  nextDueKm?: number;
  warningDays: number;
  warningKm: number;
  currentKm?: number;
  remaining: number;
  status: MaintenanceUrgency;
}

// Database row format for UpcomingMaintenance view
export interface UpcomingMaintenanceRow {
  schedule_id: string;
  asset_id: string;
  asset_code: string;
  asset_name: string;
  registration_number: string | null;
  maintenance_type_id: string;
  maintenance_type: string;
  trigger_type: MaintenanceTriggerType;
  next_due_date: string | null;
  next_due_km: number | null;
  warning_days: number;
  warning_km: number;
  current_km: number | null;
  remaining: number | null;
  status: MaintenanceUrgency;
}

// Maintenance Cost Summary (from view)
export interface MaintenanceCostSummary {
  assetId: string;
  assetCode: string;
  assetName: string;
  month: string;
  maintenanceCount: number;
  totalLabor: number;
  totalParts: number;
  totalExternal: number;
  totalCost: number;
}

// Database row format for MaintenanceCostSummary view
export interface MaintenanceCostSummaryRow {
  asset_id: string;
  asset_code: string;
  asset_name: string;
  month: string;
  maintenance_count: number;
  total_labor: number;
  total_parts: number;
  total_external: number;
  total_cost: number;
}


// Input types for forms
export interface MaintenanceRecordInput {
  assetId: string;
  maintenanceTypeId: string;
  scheduleId?: string;
  maintenanceDate: string;
  odometerKm?: number;
  hourMeter?: number;
  performedAt: MaintenancePerformedAt;
  workshopName?: string;
  workshopAddress?: string;
  description: string;
  findings?: string;
  recommendations?: string;
  technicianName?: string;
  technicianEmployeeId?: string;
  laborCost: number;
  externalCost: number;
  bkkId?: string;
  photos?: string[];
  documents?: string[];
  notes?: string;
  parts: MaintenancePartInput[];
}

export interface MaintenancePartInput {
  partNumber?: string;
  partName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  supplier?: string;
  warrantyMonths?: number;
}

export interface MaintenanceScheduleInput {
  assetId: string;
  maintenanceTypeId: string;
  triggerType: MaintenanceTriggerType;
  triggerValue?: number;
  triggerDate?: string;
  nextDueKm?: number;
  nextDueDate?: string;
  warningKm?: number;
  warningDays?: number;
}

export interface MaintenanceHistoryFilters {
  assetId?: string;
  maintenanceTypeId?: string;
  dateFrom?: string;
  dateTo?: string;
  status?: MaintenanceRecordStatus;
}

export interface MaintenanceDashboardStats {
  overdueCount: number;
  dueSoonCount: number;
  inProgressCount: number;
  costMTD: number;
}

// Validation result type
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

// Transform functions: Row to Interface
export function transformMaintenanceTypeRow(row: MaintenanceTypeRow): MaintenanceType {
  return {
    id: row.id,
    typeCode: row.type_code,
    typeName: row.type_name,
    description: row.description ?? undefined,
    isScheduled: row.is_scheduled,
    defaultIntervalKm: row.default_interval_km ?? undefined,
    defaultIntervalHours: row.default_interval_hours ?? undefined,
    defaultIntervalDays: row.default_interval_days ?? undefined,
    applicableCategories: row.applicable_categories,
    isActive: row.is_active,
    displayOrder: row.display_order,
    createdAt: row.created_at,
  };
}

export function transformMaintenanceScheduleRow(row: MaintenanceScheduleRow): MaintenanceSchedule {
  return {
    id: row.id,
    assetId: row.asset_id,
    maintenanceTypeId: row.maintenance_type_id,
    triggerType: row.trigger_type,
    triggerValue: row.trigger_value ?? undefined,
    triggerDate: row.trigger_date ?? undefined,
    nextDueKm: row.next_due_km ?? undefined,
    nextDueHours: row.next_due_hours ?? undefined,
    nextDueDate: row.next_due_date ?? undefined,
    warningKm: row.warning_km,
    warningDays: row.warning_days,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function transformMaintenanceRecordRow(row: MaintenanceRecordRow): MaintenanceRecord {
  return {
    id: row.id,
    recordNumber: row.record_number,
    assetId: row.asset_id,
    maintenanceTypeId: row.maintenance_type_id,
    scheduleId: row.schedule_id ?? undefined,
    maintenanceDate: row.maintenance_date,
    startedAt: row.started_at ?? undefined,
    completedAt: row.completed_at ?? undefined,
    odometerKm: row.odometer_km ?? undefined,
    hourMeter: row.hour_meter ?? undefined,
    performedAt: row.performed_at,
    workshopName: row.workshop_name ?? undefined,
    workshopAddress: row.workshop_address ?? undefined,
    description: row.description,
    findings: row.findings ?? undefined,
    recommendations: row.recommendations ?? undefined,
    technicianName: row.technician_name ?? undefined,
    technicianEmployeeId: row.technician_employee_id ?? undefined,
    laborCost: row.labor_cost,
    partsCost: row.parts_cost,
    externalCost: row.external_cost,
    totalCost: row.total_cost,
    bkkId: row.bkk_id ?? undefined,
    status: row.status,
    documents: row.documents,
    photos: row.photos,
    notes: row.notes ?? undefined,
    createdBy: row.created_by ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function transformMaintenancePartRow(row: MaintenancePartRow): MaintenancePart {
  return {
    id: row.id,
    maintenanceRecordId: row.maintenance_record_id,
    partNumber: row.part_number ?? undefined,
    partName: row.part_name,
    quantity: row.quantity,
    unit: row.unit,
    unitPrice: row.unit_price,
    totalPrice: row.total_price,
    supplier: row.supplier ?? undefined,
    warrantyMonths: row.warranty_months ?? undefined,
    createdAt: row.created_at,
  };
}

export function transformUpcomingMaintenanceRow(row: UpcomingMaintenanceRow): UpcomingMaintenance {
  return {
    scheduleId: row.schedule_id,
    assetId: row.asset_id,
    assetCode: row.asset_code,
    assetName: row.asset_name,
    registrationNumber: row.registration_number ?? undefined,
    maintenanceTypeId: row.maintenance_type_id,
    maintenanceType: row.maintenance_type,
    triggerType: row.trigger_type,
    nextDueDate: row.next_due_date ?? undefined,
    nextDueKm: row.next_due_km ?? undefined,
    warningDays: row.warning_days,
    warningKm: row.warning_km,
    currentKm: row.current_km ?? undefined,
    remaining: row.remaining ?? 0,
    status: row.status,
  };
}

export function transformMaintenanceCostSummaryRow(row: MaintenanceCostSummaryRow): MaintenanceCostSummary {
  return {
    assetId: row.asset_id,
    assetCode: row.asset_code,
    assetName: row.asset_name,
    month: row.month,
    maintenanceCount: row.maintenance_count,
    totalLabor: row.total_labor,
    totalParts: row.total_parts,
    totalExternal: row.total_external,
    totalCost: row.total_cost,
  };
}
