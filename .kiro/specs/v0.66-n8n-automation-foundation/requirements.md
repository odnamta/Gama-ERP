# Requirements Document

## Introduction

This document defines the requirements for v0.66: n8n Automation - Workflow Foundation. This feature establishes the foundational n8n integration for ERP automation including webhook endpoints, database triggers, event queue processing, and core workflow patterns. Automation reduces manual work, ensures consistency, and enables real-time responses to business events.

## Glossary

- **Webhook_Endpoint**: A registered URL that receives HTTP POST requests when specific events occur in the system
- **Event_Queue**: A database table that stores events for asynchronous processing with retry capabilities
- **Automation_Log**: A record of webhook execution including status, timing, and results
- **Automation_Template**: A reusable n8n workflow configuration that can be deployed for common automation patterns
- **Database_Trigger**: A PostgreSQL function that automatically fires when data changes occur
- **n8n**: An open-source workflow automation tool that provides visual workflow building
- **Execution_ID**: A unique identifier for tracking a single automation run through the system

## Requirements

### Requirement 1: Webhook Endpoint Registry

**User Story:** As a system administrator, I want to register and manage webhook endpoints, so that I can configure which events trigger automation workflows.

#### Acceptance Criteria

1. THE Webhook_Endpoint_Registry SHALL store endpoint configurations including code, name, URL, and secret
2. WHEN a webhook endpoint is registered, THE System SHALL generate a unique webhook URL and secure secret token
3. THE Webhook_Endpoint_Registry SHALL support trigger types: database_event, scheduled, manual, and external
4. WHEN a database_event trigger is configured, THE System SHALL store the target table and event type (INSERT, UPDATE, DELETE)
5. WHEN a scheduled trigger is configured, THE System SHALL store the cron expression for timing
6. THE Webhook_Endpoint_Registry SHALL track activation status, last triggered timestamp, and total trigger count
7. WHEN retrieving endpoints, THE System SHALL filter by active status and trigger type

### Requirement 2: Database Event Triggers

**User Story:** As a system administrator, I want database changes to automatically trigger webhooks, so that automation workflows respond to real-time business events.

#### Acceptance Criteria

1. WHEN a row is inserted into job_orders, THE Database_Trigger SHALL queue a JO_CREATED event
2. WHEN a row is updated in job_orders, THE Database_Trigger SHALL queue a JO_STATUS_CHANGE event
3. WHEN a row is inserted into invoices, THE Database_Trigger SHALL queue an INVOICE_CREATED event
4. WHEN a row is inserted into incidents, THE Database_Trigger SHALL queue an INCIDENT_REPORTED event
5. THE Database_Trigger SHALL build a payload containing event_type, table_name, timestamp, new data, and old data (for updates)
6. WHEN an event is triggered, THE System SHALL update the endpoint's last_triggered_at and increment trigger_count

### Requirement 3: Event Queue Processing

**User Story:** As a system administrator, I want events to be queued and processed asynchronously, so that the system can handle failures gracefully with retry logic.

#### Acceptance Criteria

1. THE Event_Queue SHALL store events with type, source, payload, status, and scheduling information
2. WHEN an event is queued, THE System SHALL set status to 'pending' and scheduled_for to current timestamp
3. WHEN processing the queue, THE System SHALL select pending events where scheduled_for is in the past
4. WHEN an event is being processed, THE System SHALL update status to 'processing'
5. WHEN an event succeeds, THE System SHALL update status to 'completed' and set processed_at timestamp
6. WHEN an event fails, THE System SHALL increment retry_count and apply exponential backoff (2^n minutes)
7. WHEN retry_count reaches max_retries, THE System SHALL update status to 'failed' with error message
8. THE Event_Queue SHALL support a default max_retries of 3

### Requirement 4: Webhook Execution

**User Story:** As a system administrator, I want to trigger webhooks manually or automatically, so that I can execute automation workflows on demand or in response to events.

#### Acceptance Criteria

1. WHEN triggering a webhook, THE System SHALL validate the endpoint exists and is active
2. WHEN triggering a webhook, THE System SHALL generate a unique execution_id for tracking
3. THE System SHALL send HTTP POST to the webhook URL with event_type, execution_id, timestamp, and data payload
4. THE System SHALL include the webhook_secret in the X-Webhook-Secret header for authentication
5. WHEN the webhook returns success (2xx), THE System SHALL log status as 'success' with result data
6. WHEN the webhook returns error, THE System SHALL log status as 'failed' with error message
7. THE System SHALL calculate and store execution_time_ms for performance monitoring

### Requirement 5: Automation Logging

**User Story:** As a system administrator, I want comprehensive logs of all automation executions, so that I can monitor, debug, and audit workflow runs.

#### Acceptance Criteria

1. THE Automation_Log SHALL record endpoint_id, execution_id, n8n_execution_id, and timestamps
2. THE Automation_Log SHALL store trigger_type and trigger_data for debugging
3. THE Automation_Log SHALL track status: running, success, failed, or timeout
4. WHEN an execution completes, THE System SHALL store result_data or error_message
5. THE Automation_Log SHALL calculate and store execution_time_ms
6. WHEN querying logs, THE System SHALL support filtering by endpoint, status, and date range

### Requirement 6: Automation Templates

**User Story:** As a system administrator, I want reusable automation templates, so that I can quickly deploy common workflow patterns without building from scratch.

#### Acceptance Criteria

1. THE Automation_Template SHALL store template_code, name, description, and category
2. THE System SHALL support categories: notification, document, integration, data_sync, and reporting
3. THE Automation_Template SHALL store the n8n workflow_json for export/import
4. THE Automation_Template SHALL define required_credentials (e.g., supabase, smtp, whatsapp)
5. THE Automation_Template SHALL include a config_schema for customization options
6. WHEN listing templates, THE System SHALL filter by category and active status

### Requirement 7: Automation Statistics

**User Story:** As a system administrator, I want to view automation performance statistics, so that I can monitor system health and identify issues.

#### Acceptance Criteria

1. WHEN requesting statistics, THE System SHALL calculate total executions for the specified period
2. THE System SHALL calculate overall success rate as percentage of successful executions
3. THE System SHALL calculate average execution time in milliseconds
4. THE System SHALL group statistics by endpoint showing count and success rate per endpoint
5. THE System SHALL support configurable time periods (default 30 days)

### Requirement 8: Default Webhook Endpoints

**User Story:** As a system administrator, I want pre-configured webhook endpoints for common ERP events, so that I can quickly enable automation for standard workflows.

#### Acceptance Criteria

1. THE System SHALL provide default endpoint JO_CREATED for job order creation events
2. THE System SHALL provide default endpoint JO_STATUS_CHANGE for job order status updates
3. THE System SHALL provide default endpoint INVOICE_CREATED for invoice creation events
4. THE System SHALL provide default endpoint INVOICE_OVERDUE as scheduled daily check
5. THE System SHALL provide default endpoint INCIDENT_REPORTED for safety incident events
6. THE System SHALL provide default endpoint DOCUMENT_EXPIRING as scheduled daily check
7. THE System SHALL provide default endpoint MAINTENANCE_DUE as scheduled daily check
