// HR Employee Master Data Types

// Employment types
export type EmploymentType = 'permanent' | 'contract' | 'probation' | 'intern' | 'outsource';

// Employee status
export type EmployeeStatus = 'active' | 'on_leave' | 'suspended' | 'resigned' | 'terminated';

// Gender
export type Gender = 'male' | 'female';

// Marital status
export type MaritalStatus = 'single' | 'married' | 'divorced' | 'widowed';

// Position level (1=Staff, 2=Senior, 3=Lead, 4=Manager, 5=Director)
export type PositionLevel = 1 | 2 | 3 | 4 | 5;

// Department interface
export interface Department {
  id: string;
  department_code: string;
  department_name: string;
  parent_department_id: string | null;
  manager_id: string | null;
  is_active: boolean;
  created_at: string;
}

// Position interface
export interface Position {
  id: string;
  position_code: string;
  position_name: string;
  department_id: string | null;
  salary_min: number | null;
  salary_max: number | null;
  level: PositionLevel;
  is_active: boolean;
  created_at: string;
}

// Employee document
export interface EmployeeDocument {
  type: string;
  url: string;
  expiry: string | null;
}

// Employee interface
export interface Employee {
  id: string;
  employee_code: string;
  user_id: string | null;
  full_name: string;
  nickname: string | null;
  id_number: string | null;
  tax_id: string | null;
  date_of_birth: string | null;
  place_of_birth: string | null;
  gender: Gender | null;
  religion: string | null;
  marital_status: MaritalStatus | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  emergency_contact_relation: string | null;
  department_id: string | null;
  position_id: string | null;
  employment_type: EmploymentType;
  join_date: string;
  end_date: string | null;
  reporting_to: string | null;
  base_salary: number | null;
  salary_currency: string;
  bank_name: string | null;
  bank_account: string | null;
  bank_account_name: string | null;
  status: EmployeeStatus;
  resignation_date: string | null;
  resignation_reason: string | null;
  photo_url: string | null;
  documents: EmployeeDocument[];
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}


// Employee with relations for display
export interface EmployeeWithRelations extends Employee {
  department: Department | null;
  position: Position | null;
  reporting_manager: { full_name: string; employee_code: string } | null;
}

// Employee summary stats
export interface EmployeeSummaryStats {
  total: number;
  active: number;
  onLeave: number;
  newThisMonth: number;
}

// Employee filters
export interface EmployeeFilters {
  departmentId?: string;
  status?: EmployeeStatus;
  search?: string;
}

// Employee form data for create/update
export interface EmployeeFormData {
  full_name: string;
  nickname?: string;
  id_number?: string;
  tax_id?: string;
  date_of_birth?: string;
  place_of_birth?: string;
  gender?: Gender;
  religion?: string;
  marital_status?: MaritalStatus;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relation?: string;
  department_id?: string;
  position_id?: string;
  employment_type: EmploymentType;
  join_date: string;
  end_date?: string;
  reporting_to?: string;
  base_salary?: number;
  bank_name?: string;
  bank_account?: string;
  bank_account_name?: string;
  photo_url?: string;
  notes?: string;
  create_user_account?: boolean;
  user_role?: string;
}

// Position with department for display
export interface PositionWithDepartment extends Position {
  department: Department | null;
}

// Department count stats
export interface DepartmentEmployeeCount {
  department_id: string;
  department_name: string;
  count: number;
}
