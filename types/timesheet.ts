export type TimesheetStatus = 'draft' | 'submitted' | 'approved' | 'rejected';

export interface Timesheet {
  id: string;
  timesheet_number: string;
  jo_id: string | null;
  equipment_name: string;
  operator_name: string | null;
  work_date: string;
  start_time: string | null;
  end_time: string | null;
  hours_worked: number;
  work_description: string | null;
  location: string | null;
  status: TimesheetStatus;
  submitted_by: string | null;
  approved_by: string | null;
  approved_at: string | null;
  notes: string | null;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // Relations
  job_order?: { id: string; jo_number: string } | null;
  submitter?: { id: string; full_name: string } | null;
  approver?: { id: string; full_name: string } | null;
}

export interface CreateTimesheetInput {
  jo_id?: string;
  equipment_name: string;
  operator_name?: string;
  work_date: string;
  start_time?: string;
  end_time?: string;
  hours_worked?: number;
  work_description?: string;
  location?: string;
  notes?: string;
}

export interface TimesheetFilters {
  status?: TimesheetStatus | 'all';
  search?: string;
}
