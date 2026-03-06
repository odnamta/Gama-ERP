export type SPKStatus = 'draft' | 'issued' | 'in_progress' | 'completed' | 'cancelled';

export interface VendorWorkOrder {
  id: string;
  spk_number: string;
  vendor_id: string;
  jo_id: string | null;
  pjo_id: string | null;
  work_description: string;
  location: string | null;
  scheduled_start: string;
  scheduled_end: string;
  agreed_amount: number;
  status: SPKStatus;
  issued_by: string | null;
  issued_at: string | null;
  notes: string | null;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // Relations
  vendor?: { id: string; vendor_name: string; vendor_code: string } | null;
  job_order?: { id: string; jo_number: string } | null;
  issuer?: { id: string; full_name: string } | null;
}

export interface CreateSPKInput {
  vendor_id: string;
  jo_id?: string;
  pjo_id?: string;
  work_description: string;
  location?: string;
  scheduled_start: string;
  scheduled_end: string;
  agreed_amount?: number;
  notes?: string;
}

export interface SPKFilters {
  status?: SPKStatus | 'all';
  search?: string;
}
