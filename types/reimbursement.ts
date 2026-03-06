export type ReimbursementStatus = 'pending' | 'checked' | 'approved' | 'rejected' | 'paid' | 'cancelled';

export type ReimbursementCategory =
  | 'transport'
  | 'meals'
  | 'accommodation'
  | 'medical'
  | 'communication'
  | 'training'
  | 'office_supplies'
  | 'other';

export const REIMBURSEMENT_CATEGORIES: { value: ReimbursementCategory; label: string }[] = [
  { value: 'transport', label: 'Transportasi' },
  { value: 'meals', label: 'Makan & Minum' },
  { value: 'accommodation', label: 'Akomodasi' },
  { value: 'medical', label: 'Medis' },
  { value: 'communication', label: 'Komunikasi' },
  { value: 'training', label: 'Pelatihan' },
  { value: 'office_supplies', label: 'Perlengkapan Kantor' },
  { value: 'other', label: 'Lainnya' },
];

export interface ReimbursementRequest {
  id: string;
  request_number: string;
  employee_id: string;
  category: ReimbursementCategory;
  amount: number;
  description: string;
  receipt_date: string;
  receipt_url: string | null;
  status: ReimbursementStatus;
  checked_by: string | null;
  checked_at: string | null;
  approved_by: string | null;
  approved_at: string | null;
  rejection_reason: string | null;
  paid_at: string | null;
  paid_by: string | null;
  payment_reference: string | null;
  notes: string | null;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // Relations
  employee?: { id: string; full_name: string; employee_code: string };
  checker?: { id: string; full_name: string } | null;
  approver?: { id: string; full_name: string } | null;
}

export interface CreateReimbursementInput {
  employee_id: string;
  category: ReimbursementCategory;
  amount: number;
  description: string;
  receipt_date: string;
  receipt_url?: string;
  notes?: string;
}

export interface ReimbursementFilters {
  search?: string;
  status?: ReimbursementStatus | 'all';
  category?: ReimbursementCategory | 'all';
}
