export type EquipmentRequestStatus = 'pending' | 'checked' | 'approved' | 'rejected' | 'cancelled';
export type RequestPriority = 'low' | 'normal' | 'high' | 'urgent';

export const PRIORITY_LABELS: Record<RequestPriority, string> = {
  low: 'Rendah',
  normal: 'Normal',
  high: 'Tinggi',
  urgent: 'Mendesak',
};

export interface EquipmentRequest {
  id: string;
  request_number: string;
  requester_id: string;
  asset_id: string | null;
  equipment_name: string | null;
  usage_start_date: string;
  usage_end_date: string;
  job_order_id: string | null;
  business_justification: string;
  priority: RequestPriority;
  status: EquipmentRequestStatus;
  checked_by: string | null;
  checked_at: string | null;
  approved_by: string | null;
  approved_at: string | null;
  rejection_reason: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Relations
  requester?: { id: string; full_name: string } | null;
  asset?: { id: string; asset_code: string; asset_name: string } | null;
  job_order?: { id: string; jo_number: string } | null;
  checker?: { id: string; full_name: string } | null;
  approver?: { id: string; full_name: string } | null;
}

export interface CreateEquipmentRequestInput {
  asset_id?: string;
  equipment_name?: string;
  usage_start_date: string;
  usage_end_date: string;
  job_order_id?: string;
  business_justification: string;
  priority?: RequestPriority;
  notes?: string;
}

export interface EquipmentRequestFilters {
  status?: EquipmentRequestStatus | 'all';
  search?: string;
}
