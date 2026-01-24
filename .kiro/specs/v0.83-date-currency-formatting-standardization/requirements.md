# Requirements Document

## Introduction

This feature standardizes date and currency formatting across the entire GAMA ERP application. Currently, the codebase has inconsistent formatting patterns with multiple utility functions (`lib/utils/format.ts`, `lib/pjo-utils.ts`, and inline formatting) using different locales and formats. This creates a confusing user experience and maintenance burden.

The goal is to create a single source of truth for all formatting functions that:
- Display dates in a user-friendly, unambiguous format (e.g., "15 Jan 2026")
- Display currencies consistently in Indonesian Rupiah format
- Support Indonesian locale for relative dates and formal documents
- Handle edge cases gracefully (null, undefined, invalid dates)

## Glossary

- **Format_Utility**: The centralized module at `lib/utils/format.ts` containing all formatting functions
- **Display_Date**: A human-readable date format for UI display (e.g., "15 Jan 2026")
- **Document_Date**: A formal date format for PDFs and official documents (e.g., "15 Januari 2026")
- **Input_Date**: ISO format date string for HTML form inputs (e.g., "2026-01-15")
- **File_Date**: A sortable date format for file naming (e.g., "20260115")
- **Relative_Date**: A human-friendly relative time (e.g., "2 hari yang lalu")
- **IDR_Currency**: Indonesian Rupiah currency format (e.g., "Rp 1.500.000")
- **Compact_Currency**: Abbreviated currency for dashboards (e.g., "Rp 1,5 jt")

## Requirements

### Requirement 1: Date Display Formatting

**User Story:** As a user, I want to see dates in a consistent, unambiguous format, so that I can quickly understand when events occurred without confusion.

#### Acceptance Criteria

1. WHEN a date is displayed in tables, cards, or general UI, THE Format_Utility SHALL format it as "DD MMM YYYY" (e.g., "15 Jan 2026")
2. WHEN a date with time is displayed, THE Format_Utility SHALL format it as "DD MMM YYYY, HH:mm" (e.g., "15 Jan 2026, 14:30")
3. WHEN only time is needed, THE Format_Utility SHALL format it as "HH:mm" (e.g., "14:30")
4. WHEN a null or undefined date is provided, THE Format_Utility SHALL return "-" as a fallback
5. WHEN an invalid date string is provided, THE Format_Utility SHALL return "-" as a fallback

### Requirement 2: Relative Date Formatting

**User Story:** As a user, I want to see recent activity in relative terms, so that I can quickly understand how recent an event was.

#### Acceptance Criteria

1. WHEN a date is within the last 24 hours, THE Format_Utility SHALL display relative time in Indonesian (e.g., "2 jam yang lalu")
2. WHEN a date is within the last 7 days, THE Format_Utility SHALL display relative days in Indonesian (e.g., "3 hari yang lalu")
3. WHEN a date is older than 7 days, THE Format_Utility SHALL display the full date format
4. WHEN a null or undefined date is provided, THE Format_Utility SHALL return "-" as a fallback

### Requirement 3: Document Date Formatting

**User Story:** As a user generating official documents, I want dates formatted formally in Indonesian, so that documents appear professional and comply with local standards.

#### Acceptance Criteria

1. WHEN a date is formatted for PDFs or formal documents, THE Format_Utility SHALL format it as "DD MMMM YYYY" with full Indonesian month names (e.g., "15 Januari 2026")
2. WHEN a null or undefined date is provided, THE Format_Utility SHALL return "-" as a fallback

### Requirement 4: Input and File Date Formatting

**User Story:** As a developer, I want utility functions for form inputs and file naming, so that I can maintain consistency in data handling.

#### Acceptance Criteria

1. WHEN a date is needed for HTML form inputs, THE Format_Utility SHALL format it as "YYYY-MM-DD" (e.g., "2026-01-15")
2. WHEN a date is needed for file naming, THE Format_Utility SHALL format it as "YYYYMMDD" (e.g., "20260115")
3. WHEN a date with time is needed for file naming, THE Format_Utility SHALL format it as "YYYYMMDD_HHmmss" (e.g., "20260115_143022")
4. WHEN a null or undefined date is provided to toInputDate, THE Format_Utility SHALL return an empty string

### Requirement 5: Currency Formatting

**User Story:** As a user, I want to see monetary values in a consistent Indonesian Rupiah format, so that I can quickly understand financial information.

#### Acceptance Criteria

1. WHEN a currency amount is displayed, THE Format_Utility SHALL format it as "Rp X.XXX.XXX" with Indonesian thousand separators (e.g., "Rp 1.500.000")
2. WHEN a negative currency amount is displayed, THE Format_Utility SHALL format it as "-Rp X.XXX.XXX" (e.g., "-Rp 500.000")
3. WHEN a null, undefined, or zero amount is provided, THE Format_Utility SHALL return "Rp 0"
4. WHEN a currency amount is displayed in compact form for dashboards, THE Format_Utility SHALL abbreviate large numbers (e.g., "Rp 1,5 jt" for millions, "Rp 2,3 M" for billions)

### Requirement 6: Number Formatting

**User Story:** As a user, I want to see numbers with proper thousand separators, so that large numbers are easy to read.

#### Acceptance Criteria

1. WHEN a number is formatted for display, THE Format_Utility SHALL use Indonesian thousand separators (e.g., "1.500.000")
2. WHEN a percentage is formatted, THE Format_Utility SHALL display it with comma as decimal separator (e.g., "75,5%")
3. WHEN a null or undefined number is provided, THE Format_Utility SHALL return "0"

### Requirement 7: Migration of Existing Code

**User Story:** As a developer, I want all existing date and currency formatting to use the centralized utility, so that the codebase is consistent and maintainable.

#### Acceptance Criteria

1. WHEN the migration is complete, THE codebase SHALL have no direct calls to `toLocaleDateString()` for date display
2. WHEN the migration is complete, THE codebase SHALL have no direct calls to `toLocaleString()` for currency formatting
3. WHEN the migration is complete, THE codebase SHALL import formatting functions only from `lib/utils/format.ts`
4. WHEN the migration is complete, THE application SHALL build without TypeScript errors
5. WHEN the migration is complete, THE application SHALL display dates and currencies consistently across all pages

### Requirement 8: Backward Compatibility

**User Story:** As a developer, I want the new formatting functions to be backward compatible, so that existing code continues to work during migration.

#### Acceptance Criteria

1. WHEN existing code uses `formatDate` from `lib/pjo-utils.ts`, THE Format_Utility SHALL provide an equivalent function
2. WHEN existing code uses `formatIDR` from `lib/pjo-utils.ts`, THE Format_Utility SHALL provide an equivalent function
3. WHEN existing code uses `formatCurrencyIDR` from `lib/utils/format.ts`, THE Format_Utility SHALL maintain this function
