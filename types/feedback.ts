/**
 * Feedback System Types
 * v0.81 Bug Report & Improvement Request System
 */

// Enums
export type FeedbackType = 'bug' | 'improvement' | 'question' | 'other';
export type Severity = 'critical' | 'high' | 'medium' | 'low';
export type Priority = 'urgent' | 'high' | 'medium' | 'low';
export type FeedbackStatus = 
  | 'new' 
  | 'reviewing' 
  | 'confirmed' 
  | 'in_progress' 
  | 'resolved' 
  | 'closed' 
  | 'wont_fix' 
  | 'duplicate';

// Browser context captured automatically
export interface BrowserInfo {
  name: string;
  version: string;
  platform: string;
  userAgent: string;
  screenResolution: string;
}

// Screenshot stored in Supabase storage
export interface Screenshot {
  url: string;
  filename: string;
  uploaded_at: string;
}

// Main feedback submission record
export interface FeedbackSubmission {
  id: string;
  ticket_number: string;
  feedback_type: FeedbackType;
  
  // Submitter info
  submitted_by: string | null;
  submitted_by_name: string | null;
  submitted_by_email: string | null;
  submitted_by_role: string | null;
  submitted_by_department: string | null;
  
  // Bug-specific fields
  severity: Severity | null;
  title: string;
  description: string;
  steps_to_reproduce: string | null;
  expected_behavior: string | null;
  actual_behavior: string | null;
  
  // Improvement-specific fields
  current_behavior: string | null;
  desired_behavior: string | null;
  business_justification: string | null;
  
  // Auto-captured context
  page_url: string | null;
  page_title: string | null;
  module: string | null;
  browser_info: BrowserInfo | null;
  screen_resolution: string | null;
  
  // Screenshots
  screenshots: Screenshot[];
  
  // Additional context
  error_message: string | null;
  console_logs: string | null;
  
  // Categorization
  affected_module: string | null;
  priority_suggested: Priority | null;
  tags: string[] | null;
  
  // Status & tracking
  status: FeedbackStatus;
  
  // Assignment
  assigned_to: string | null;
  assigned_at: string | null;
  
  // Resolution
  resolution_notes: string | null;
  resolved_at: string | null;
  resolved_by: string | null;
  resolved_in_version: string | null;
  
  // Related
  duplicate_of: string | null;
  related_tickets: string[] | null;
  
  // Timestamps
  created_at: string;
  updated_at: string;
}

// Feedback with additional computed fields from view
export interface FeedbackListItem extends FeedbackSubmission {
  comment_count: number;
  assigned_to_name: string | null;
}

// Comment on a feedback submission
export interface FeedbackComment {
  id: string;
  feedback_id: string;
  comment_by: string | null;
  comment_by_name: string | null;
  comment_text: string;
  is_internal: boolean;
  created_at: string;
}

// Status change history record
export interface FeedbackStatusHistory {
  id: string;
  feedback_id: string;
  old_status: FeedbackStatus | null;
  new_status: FeedbackStatus;
  changed_by: string | null;
  changed_by_name: string | null;
  changed_at: string;
  notes: string | null;
}

// Dashboard summary statistics
export interface FeedbackSummary {
  newCount: number;
  criticalCount: number;
  openBugsCount: number;
  openRequestsCount: number;
  resolvedThisWeekCount: number;
}

// Form data for submitting feedback
export interface FeedbackFormData {
  feedbackType: FeedbackType;
  severity?: Severity;
  prioritySuggested?: Priority;
  title: string;
  description: string;
  stepsToReproduce?: string;
  expectedBehavior?: string;
  actualBehavior?: string;
  currentBehavior?: string;
  desiredBehavior?: string;
  businessJustification?: string;
  affectedModule?: string;
  screenshots: ScreenshotData[];
}

// Screenshot data before upload
export interface ScreenshotData {
  dataUrl: string;
  filename?: string;
}

// Filter options for admin dashboard
export interface FeedbackFilters {
  type?: FeedbackType;
  status?: FeedbackStatus;
  severity?: Severity;
  module?: string;
  search?: string;
  assignedTo?: string;
  dateFrom?: string;
  dateTo?: string;
}

// Pagination params
export interface FeedbackPagination {
  page: number;
  pageSize: number;
}

// Paginated response
export interface PaginatedFeedback {
  items: FeedbackListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

// Form validation result
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

// Action result for server actions
export interface FeedbackActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}
