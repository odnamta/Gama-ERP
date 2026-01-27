/**
 * Feedback System Utilities
 * v0.81 Bug Report & Improvement Request System
 */

import type {
  FeedbackType,
  Severity,
  Priority,
  FeedbackStatus,
  BrowserInfo,
  FeedbackFormData,
  ValidationResult,
  FeedbackListItem,
} from '@/types/feedback';

/**
 * Module mapping from URL paths to module names
 */
const MODULE_MAP: Record<string, string> = {
  '/operations': 'Operations',
  '/finance': 'Finance',
  '/hr': 'HR',
  '/hse': 'HSE',
  '/equipment': 'Equipment',
  '/customs': 'Customs',
  '/engineering': 'Engineering',
  '/procurement': 'Procurement',
  '/agency': 'Agency',
  '/admin': 'Admin',
  '/dashboard': 'Dashboard',
  '/customers': 'Customers',
  '/projects': 'Projects',
  '/quotations': 'Quotations',
  '/pjo': 'PJO',
  '/job-orders': 'Job Orders',
  '/invoices': 'Invoices',
  '/vendors': 'Vendors',
  '/employees': 'Employees',
  '/reports': 'Reports',
  '/settings': 'Settings',
};

/**
 * Captures browser context information
 */
export function captureBrowserContext(): BrowserInfo {
  if (typeof window === 'undefined') {
    return {
      name: 'Unknown',
      version: 'Unknown',
      platform: 'Unknown',
      userAgent: 'Unknown',
      screenResolution: 'Unknown',
    };
  }

  const ua = navigator.userAgent;
  let browserName = 'Unknown';
  let browserVersion = 'Unknown';

  // Detect browser name and version
  if (ua.includes('Firefox/')) {
    browserName = 'Firefox';
    const match = ua.match(/Firefox\/(\d+)/);
    browserVersion = match?.[1] || 'Unknown';
  } else if (ua.includes('Edg/')) {
    browserName = 'Edge';
    const match = ua.match(/Edg\/(\d+)/);
    browserVersion = match?.[1] || 'Unknown';
  } else if (ua.includes('Chrome/')) {
    browserName = 'Chrome';
    const match = ua.match(/Chrome\/(\d+)/);
    browserVersion = match?.[1] || 'Unknown';
  } else if (ua.includes('Safari/') && !ua.includes('Chrome')) {
    browserName = 'Safari';
    const match = ua.match(/Version\/(\d+)/);
    browserVersion = match?.[1] || 'Unknown';
  } else if (ua.includes('Opera') || ua.includes('OPR/')) {
    browserName = 'Opera';
    const match = ua.match(/(?:Opera|OPR)\/(\d+)/);
    browserVersion = match?.[1] || 'Unknown';
  }

  return {
    name: browserName,
    version: browserVersion,
    platform: navigator.platform || 'Unknown',
    userAgent: ua,
    screenResolution: `${window.innerWidth}x${window.innerHeight}`,
  };
}

/**
 * Detects the current module from URL path
 */
export function detectModuleFromUrl(pathname: string): string {
  if (!pathname) return 'General';
  
  // Check each module path prefix
  for (const [path, module] of Object.entries(MODULE_MAP)) {
    if (pathname.startsWith(path)) {
      return module;
    }
  }
  
  return 'General';
}

/**
 * Generates ticket number prefix based on feedback type
 */
export function getTicketPrefix(feedbackType: FeedbackType): string {
  return feedbackType === 'bug' ? 'BUG' : 'REQ';
}

/**
 * Gets severity color class for UI display
 */
export function getSeverityColor(severity: Severity | null | undefined): string {
  if (!severity) return 'bg-gray-500';
  
  const colors: Record<Severity, string> = {
    critical: 'bg-red-500',
    high: 'bg-orange-500',
    medium: 'bg-yellow-500',
    low: 'bg-green-500',
  };
  
  return colors[severity] || 'bg-gray-500';
}

/**
 * Gets severity text color class
 */
export function getSeverityTextColor(severity: Severity | null | undefined): string {
  if (!severity) return 'text-gray-600';
  
  const colors: Record<Severity, string> = {
    critical: 'text-red-600',
    high: 'text-orange-600',
    medium: 'text-yellow-600',
    low: 'text-green-600',
  };
  
  return colors[severity] || 'text-gray-600';
}

/**
 * Gets status badge variant for shadcn Badge component
 */
export function getStatusVariant(
  status: FeedbackStatus
): 'default' | 'secondary' | 'destructive' | 'outline' {
  const variants: Record<FeedbackStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    new: 'default',
    reviewing: 'secondary',
    confirmed: 'secondary',
    in_progress: 'default',
    resolved: 'outline',
    closed: 'outline',
    wont_fix: 'destructive',
    duplicate: 'outline',
  };
  
  return variants[status] || 'default';
}

/**
 * Gets human-readable status label
 */
export function getStatusLabel(status: FeedbackStatus): string {
  const labels: Record<FeedbackStatus, string> = {
    new: 'New',
    reviewing: 'Reviewing',
    confirmed: 'Confirmed',
    in_progress: 'In Progress',
    resolved: 'Resolved',
    closed: 'Closed',
    wont_fix: "Won't Fix",
    duplicate: 'Duplicate',
  };
  
  return labels[status] || status;
}

/**
 * Gets human-readable feedback type label
 */
export function getFeedbackTypeLabel(type: FeedbackType): string {
  const labels: Record<FeedbackType, string> = {
    bug: 'Bug Report',
    improvement: 'Improvement Request',
    question: 'Question',
    other: 'Other',
  };
  
  return labels[type] || type;
}

/**
 * Gets feedback type icon name (for Lucide icons)
 */
export function getFeedbackTypeIcon(type: FeedbackType): string {
  const icons: Record<FeedbackType, string> = {
    bug: 'Bug',
    improvement: 'Lightbulb',
    question: 'HelpCircle',
    other: 'MessageSquare',
  };
  
  return icons[type] || 'MessageSquare';
}

/**
 * Validates feedback form data
 */
export function validateFeedbackForm(data: Partial<FeedbackFormData>): ValidationResult {
  const errors: string[] = [];
  
  // Title validation
  if (!data.title?.trim()) {
    errors.push('Title is required');
  } else if (data.title.length > 200) {
    errors.push('Title must be 200 characters or less');
  }
  
  // Description validation
  if (!data.description?.trim()) {
    errors.push('Description is required');
  }
  
  // Bug-specific validation
  if (data.feedbackType === 'bug' && !data.severity) {
    errors.push('Severity is required for bug reports');
  }
  
  // Improvement-specific validation
  if (data.feedbackType === 'improvement' && !data.desiredBehavior?.trim()) {
    errors.push('Desired behavior is required for improvement requests');
  }
  
  return { valid: errors.length === 0, errors };
}

/**
 * Gets available modules for dropdown selection
 */
export function getModuleOptions(): { value: string; label: string }[] {
  return [
    { value: 'Dashboard', label: 'Dashboard' },
    { value: 'Customers', label: 'Customers' },
    { value: 'Projects', label: 'Projects' },
    { value: 'Quotations', label: 'Quotations' },
    { value: 'PJO', label: 'Proforma Job Orders' },
    { value: 'Job Orders', label: 'Job Orders' },
    { value: 'Invoices', label: 'Invoices' },
    { value: 'Operations', label: 'Operations' },
    { value: 'Finance', label: 'Finance' },
    { value: 'HR', label: 'Human Resources' },
    { value: 'HSE', label: 'Health, Safety & Environment' },
    { value: 'Equipment', label: 'Equipment' },
    { value: 'Customs', label: 'Customs' },
    { value: 'Engineering', label: 'Engineering' },
    { value: 'Agency', label: 'Agency' },
    { value: 'Admin', label: 'Administration' },
    { value: 'Vendors', label: 'Vendors' },
    { value: 'Employees', label: 'Employees' },
    { value: 'Reports', label: 'Reports' },
    { value: 'Settings', label: 'Settings' },
    { value: 'General', label: 'General / Other' },
  ];
}

/**
 * Gets severity options for dropdown
 */
export function getSeverityOptions(): { value: Severity; label: string }[] {
  return [
    { value: 'critical', label: 'Critical - System unusable' },
    { value: 'high', label: 'High - Major feature broken' },
    { value: 'medium', label: 'Medium - Feature impaired' },
    { value: 'low', label: 'Low - Minor issue' },
  ];
}

/**
 * Gets priority options for dropdown
 */
export function getPriorityOptions(): { value: Priority; label: string }[] {
  return [
    { value: 'urgent', label: 'Urgent - Needed immediately' },
    { value: 'high', label: 'High - Important' },
    { value: 'medium', label: 'Medium - Nice to have soon' },
    { value: 'low', label: 'Low - When possible' },
  ];
}

/**
 * Gets status options for dropdown
 */
export function getStatusOptions(): { value: FeedbackStatus; label: string }[] {
  return [
    { value: 'new', label: 'New' },
    { value: 'reviewing', label: 'Reviewing' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'resolved', label: 'Resolved' },
    { value: 'closed', label: 'Closed' },
    { value: 'wont_fix', label: "Won't Fix" },
    { value: 'duplicate', label: 'Duplicate' },
  ];
}

/**
 * Sorts feedback by severity (critical first) then by date (newest first)
 */
export function sortFeedbackBySeverityAndDate(
  items: FeedbackListItem[]
): FeedbackListItem[] {
  const severityOrder: Record<string, number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
  };
  
  return [...items].sort((a, b) => {
    // First sort by severity
    const severityA = a.severity ? severityOrder[a.severity] : 4;
    const severityB = b.severity ? severityOrder[b.severity] : 4;
    
    if (severityA !== severityB) {
      return severityA - severityB;
    }
    
    // Then sort by date (newest first)
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}

/**
 * Filters feedback based on criteria
 */
export function filterFeedback(
  items: FeedbackListItem[],
  filters: {
    type?: FeedbackType;
    status?: FeedbackStatus;
    severity?: Severity;
    module?: string;
    search?: string;
  }
): FeedbackListItem[] {
  return items.filter((item) => {
    // Type filter
    if (filters.type && item.feedback_type !== filters.type) {
      return false;
    }
    
    // Status filter
    if (filters.status && item.status !== filters.status) {
      return false;
    }
    
    // Severity filter
    if (filters.severity && item.severity !== filters.severity) {
      return false;
    }
    
    // Module filter
    if (filters.module && item.module !== filters.module && item.affected_module !== filters.module) {
      return false;
    }
    
    // Search filter (case-insensitive)
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const titleMatch = item.title.toLowerCase().includes(searchLower);
      const descMatch = item.description.toLowerCase().includes(searchLower);
      const ticketMatch = item.ticket_number.toLowerCase().includes(searchLower);
      
      if (!titleMatch && !descMatch && !ticketMatch) {
        return false;
      }
    }
    
    return true;
  });
}

/**
 * Calculates pagination metadata
 */
export function calculatePagination(
  totalItems: number,
  page: number,
  pageSize: number
): {
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
  startIndex: number;
  endIndex: number;
} {
  const totalPages = Math.ceil(totalItems / pageSize);
  const currentPage = Math.max(1, Math.min(page, totalPages || 1));
  
  return {
    totalPages,
    hasNext: currentPage < totalPages,
    hasPrevious: currentPage > 1,
    startIndex: (currentPage - 1) * pageSize,
    endIndex: Math.min(currentPage * pageSize, totalItems),
  };
}

/**
 * Paginates an array of items
 */
export function paginateItems<T>(
  items: T[],
  page: number,
  pageSize: number
): T[] {
  const { startIndex, endIndex } = calculatePagination(items.length, page, pageSize);
  return items.slice(startIndex, endIndex);
}

/**
 * Checks if a status is considered "open" (not resolved/closed)
 */
export function isOpenStatus(status: FeedbackStatus): boolean {
  return !['resolved', 'closed', 'wont_fix'].includes(status);
}

/**
 * Formats a date for display
 */
export function formatFeedbackDate(dateString: string): string {
  if (!dateString) return '-';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

/**
 * Formats a date with time for display
 */
export function formatFeedbackDateTime(dateString: string): string {
  if (!dateString) return '-';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
