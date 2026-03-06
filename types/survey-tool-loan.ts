export type LoanStatus = 'borrowed' | 'returned' | 'overdue' | 'lost';

export interface SurveyToolLoan {
  id: string;
  loan_number: string;
  tool_name: string;
  tool_serial_number: string | null;
  borrower_id: string;
  jo_id: string | null;
  loan_date: string;
  expected_return_date: string | null;
  actual_return_date: string | null;
  loan_condition: string | null;
  return_condition: string | null;
  status: LoanStatus;
  notes: string | null;
  issued_by: string | null;
  returned_to: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Relations
  borrower?: { id: string; full_name: string } | null;
  job_order?: { id: string; jo_number: string } | null;
  issuer?: { id: string; full_name: string } | null;
  receiver?: { id: string; full_name: string } | null;
}

export interface CreateLoanInput {
  tool_name: string;
  tool_serial_number?: string;
  borrower_id: string;
  jo_id?: string;
  loan_date: string;
  expected_return_date?: string;
  loan_condition?: string;
  notes?: string;
}

export interface LoanFilters {
  status?: LoanStatus | 'all';
  search?: string;
}
