# Implementation Plan: System Audit & Logging

## Overview

This implementation plan covers the v0.76 System Audit & Logging module, providing comprehensive audit logging, system activity tracking, login history, and data access logging for Gama ERP. The implementation follows an incremental approach, starting with database schema, then core utilities, server actions, and finally UI components.

## Tasks

- [x] 1. Database Schema Setup
  - [x] 1.1 Create audit_log table with all columns and indexes
    - Create table with id, timestamp, user fields, action, entity fields, values, metadata
    - Add indexes on timestamp, user_id, entity_type/entity_id
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_
  - [x] 1.2 Create system_logs table with indexes
    - Create table with id, timestamp, level, source, message, error fields, data
    - Add indexes on timestamp, level, source
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_
  - [x] 1.3 Create login_history table with indexes
    - Create table with id, user_id, login/logout times, device info, status
    - Add indexes on user_id, login_at
    - _Requirements: 3.1, 3.2, 3.3, 3.4_
  - [x] 1.4 Create data_access_log table with indexes
    - Create table with id, timestamp, user_id, data_type, access_type, details
    - Add indexes on timestamp, user_id
    - _Requirements: 4.1, 4.2, 4.3, 4.4_
  - [x] 1.5 Create audit trigger function ✅
    - Create audit_trigger_function() that captures old/new values and changed fields
    - Handle INSERT, UPDATE, DELETE operations
    - _Requirements: 1.1, 1.2, 1.3_
  - [x] 1.6 Apply audit triggers to critical tables
    - Create triggers on job_orders, invoices, quotations
    - _Requirements: 1.6_
  - [x] 1.7 Create RLS policies for audit tables
    - Allow read access for admin/manager roles
    - Allow insert for authenticated users
    - _Requirements: Security_

- [x] 2. Core Type Definitions
  - [x] 2.1 Create audit logging types in types/audit.ts ✅
    - Define AuditLogEntry, SystemLogEntry, LoginHistoryEntry, DataAccessLogEntry
    - Define filter interfaces for each log type
    - Define RetentionConfig interface
    - _Requirements: 1.1, 2.1, 3.1, 4.1_

- [x] 3. Audit Log Utilities
  - [x] 3.1 Create lib/audit-utils.ts with core functions
    - Implement createAuditLog function
    - Implement queryAuditLogs with filter support
    - Implement getEntityAuditHistory
    - Implement calculateChangedFields
    - Implement formatAuditLogDescription
    - _Requirements: 1.1, 1.2, 1.3, 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_
  - [x] 3.2 Write property test for calculateChangedFields
    - **Property 2: Changed Fields Calculation Correctness**
    - **Validates: Requirements 1.3**
  - [x] 3.3 Write property test for audit log filtering
    - **Property 10: Audit Log Filter Correctness**
    - **Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5**

- [x] 4. System Log Utilities
  - [x] 4.1 Create lib/system-log-utils.ts with logging functions
    - Implement logError with stack trace capture
    - Implement logWarn, logInfo, logDebug
    - Implement querySystemLogs with filter support
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 7.1, 7.2, 7.3, 7.4, 7.5_
  - [x] 4.2 Write property test for system log level support
    - **Property 5: System Log Level Support**
    - **Validates: Requirements 2.1**
  - [x] 4.3 Write property test for error capture
    - **Property 4: System Log Error Capture**
    - **Validates: Requirements 2.2, 2.3**

- [x] 5. Login History Utilities
  - [x] 5.1 Create lib/login-history-utils.ts with tracking functions
    - Implement recordLogin function
    - Implement recordLogout with duration calculation
    - Implement recordFailedLogin
    - Implement queryLoginHistory with filter support
    - Implement getSessionStatistics
    - Implement parseUserAgent
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 6.1, 6.2, 6.3, 6.4, 6.5_
  - [x] 5.2 Write property test for session duration calculation
    - **Property 6: Login Session Lifecycle**
    - **Validates: Requirements 3.1, 3.2**
  - [x] 5.3 Write property test for user agent parsing
    - **Property 7: User Agent Parsing**
    - **Validates: Requirements 3.3**
  - [x] 5.4 Write property test for session statistics
    - **Property 14: Session Statistics Calculation**
    - **Validates: Requirements 6.5**

- [x] 6. Data Access Log Utilities
  - [x] 6.1 Create lib/data-access-utils.ts with logging functions
    - Implement logDataExport
    - Implement logDataAccess
    - Implement queryDataAccessLogs
    - _Requirements: 4.1, 4.2, 4.3, 4.4_
  - [x] 6.2 Write property test for data export logging
    - **Property 9: Data Export Logging**
    - **Validates: Requirements 4.1**

- [x] 7. Checkpoint - Core Utilities Complete
  - Ensure all utility functions are implemented
  - Ensure all property tests pass
  - Ask the user if questions arise

- [x] 8. Server Actions for Audit Logs
  - [x] 8.1 Create app/actions/audit-actions.ts
    - Implement getAuditLogs action with pagination
    - Implement getEntityHistory action
    - Implement createManualAuditEntry action
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

- [x] 9. Server Actions for System Logs
  - [x] 9.1 Create app/actions/system-log-actions.ts
    - Implement getSystemLogs action with pagination
    - Implement getLogStatistics action
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 10. Server Actions for Login History
  - [x] 10.1 Create app/actions/login-history-actions.ts
    - Implement getLoginHistory action with pagination
    - Implement getUserSessionStats action
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 11. Server Actions for Data Access Logs
  - [x] 11.1 Create app/actions/data-access-actions.ts
    - Implement getDataAccessLogs action with pagination
    - _Requirements: 4.1, 4.2_

- [x] 12. Retention and Archival Actions
  - [x] 12.1 Create app/actions/retention-actions.ts
    - Implement getStorageStats action
    - Implement archiveLogs action
    - Implement getRetentionConfig action
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [x] 13. Checkpoint - Server Actions Complete
  - Ensure all server actions are implemented
  - Ensure actions handle errors gracefully
  - Ask the user if questions arise

- [x] 14. UI Components - Filters and Tables
  - [x] 14.1 Create components/audit/audit-log-filters.tsx
    - User filter (dropdown)
    - Entity type filter
    - Action type filter
    - Date range picker
    - Module filter
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_
  - [x] 14.2 Create components/audit/audit-log-table.tsx
    - Display audit entries with timestamp, user, action, entity
    - Expandable rows for old/new values
    - Changed fields highlighting
    - Pagination
    - _Requirements: 1.1, 1.2, 1.3_
  - [x] 14.3 Create components/audit/system-log-table.tsx
    - Display logs with level badges, source, message
    - Expandable rows for stack trace and data
    - Level-based color coding
    - _Requirements: 2.1, 2.2_
  - [x] 14.4 Create components/audit/login-history-table.tsx
    - Display login events with user, time, device, status
    - Status badges (success/failed)
    - Session duration display
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 15. UI Components - Detail Views
  - [x] 15.1 Create components/audit/audit-entry-detail.tsx
    - Full audit entry display
    - JSON diff view for old/new values
    - Changed fields list
    - _Requirements: 1.2, 1.3_
  - [x] 15.2 Create components/audit/entity-audit-history.tsx
    - Timeline view of entity changes
    - Collapsible change details
    - _Requirements: 1.1_

- [x] 16. Audit Log Page
  - [x] 16.1 Create app/(main)/settings/audit-logs/page.tsx
    - Server component for initial data fetch
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_
  - [x] 16.2 Create app/(main)/settings/audit-logs/audit-logs-client.tsx
    - Client component with filters and table
    - Real-time filter updates
    - Export functionality
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

- [x] 17. System Logs Page
  - [x] 17.1 Create app/(main)/settings/system-logs/page.tsx
    - Server component for initial data fetch
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_
  - [x] 17.2 Create app/(main)/settings/system-logs/system-logs-client.tsx
    - Client component with filters and table
    - Log level filtering
    - Text search
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 18. Login History Page
  - [x] 18.1 Create app/(main)/admin/login-history/page.tsx
    - Server component for initial data fetch
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_
  - [x] 18.2 Create app/(main)/admin/login-history/login-history-client.tsx
    - Client component with filters and table
    - Session statistics summary
    - Failed login alerts
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 19. Storage and Retention Page
  - [x] 19.1 Create app/(main)/admin/audit-logs/retention/page.tsx
    - Storage statistics display
    - Retention configuration
    - Archive controls
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [x] 20. Navigation Integration
  - [x] 20.1 Add audit menu items to admin navigation
    - Add "Audit Logs" link under Admin section
    - Add "System Logs" link
    - Add "Login History" link
    - Update lib/navigation.ts
    - _Requirements: Navigation_

- [x] 21. Auth Integration
  - [x] 21.1 Integrate login history with auth flow
    - Call recordLogin on successful authentication
    - Call recordLogout on sign out
    - Call recordFailedLogin on auth failure
    - Update auth callback and middleware
    - _Requirements: 3.1, 3.2, 3.4_

- [x] 22. Final Checkpoint
  - Ensure all pages render correctly
  - Ensure all filters work as expected
  - Ensure audit triggers are firing
  - Ensure login history is being recorded
  - Ask the user if questions arise

## Notes

- All property-based tests are required for comprehensive coverage
- All audit tables use RLS for security
- Audit logging should not block primary operations on failure
- Login history integration requires auth middleware updates
- Property tests use Vitest with fast-check library
