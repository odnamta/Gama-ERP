export type TrainingRequestStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export interface TrainingRequest {
  id: string;
  request_number: string;
  employee_id: string;
  course_id: string | null;
  custom_course_name: string | null;
  custom_course_description: string | null;
  training_provider: string | null;
  estimated_cost: number | null;
  training_date_start: string;
  training_date_end: string | null;
  justification: string;
  status: TrainingRequestStatus;
  approved_by: string | null;
  approved_at: string | null;
  rejection_reason: string | null;
  notes: string | null;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // Relations
  employee?: { id: string; full_name: string; employee_code: string };
  course?: { id: string; course_name: string } | null;
  approver?: { id: string; full_name: string } | null;
}

export interface CreateTrainingRequestInput {
  employee_id: string;
  course_id?: string;
  custom_course_name?: string;
  custom_course_description?: string;
  training_provider?: string;
  estimated_cost?: number;
  training_date_start: string;
  training_date_end?: string;
  justification: string;
  notes?: string;
}

export interface TrainingRequestFilters {
  search?: string;
  status?: TrainingRequestStatus | 'all';
}
