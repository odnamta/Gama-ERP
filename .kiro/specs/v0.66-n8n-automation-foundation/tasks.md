# Implementation Plan: n8n Automation - Workflow Foundation

## Overview

This implementation plan establishes the foundational n8n integration for Gama ERP. Tasks are organized to build incrementally: database schema first, then core types, utility functions, server actions, and finally UI components.

## Tasks

- [x] 1. Database Schema Setup
  - [x] 1.1 Create webhook_endpoints table with all columns and constraints
    - Include endpoint_code, endpoint_name, webhook_url, webhook_secret
    - Include trigger_type, trigger_table, trigger_event, cron_expression
    - Include is_active, last_triggered_at, trigger_count
    - _Requirements: 1.1, 1.4, 1.5, 1.6_
  - [x] 1.2 Create automation_logs table
    - Include endpoint_id, execution_id, n8n_execution_id, timestamps
    - Include trigger_type, trigger_data, status, result_data, error_message
    - Include execution_time_ms
    - _Requirements: 5.1, 5.2, 5.3_
  - [x] 1.3 Create automation_templates table
    - Include template_code, template_name, description, category
    - Include workflow_json, required_credentials, config_schema
    - _Requirements: 6.1, 6.3, 6.4, 6.5_
  - [x] 1.4 Create event_queue table
    - Include event_type, event_source, payload, status
    - Include retry_count, max_retries, scheduled_for, processed_at
    - _Requirements: 3.1, 3.8_
  - [x] 1.5 Create database trigger function and triggers
    - Create trigger_webhook() function
    - Create triggers on job_orders, invoices, incidents tables
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_
  - [x] 1.6 Insert default webhook endpoints
    - JO_CREATED, JO_STATUS_CHANGE, INVOICE_CREATED
    - INVOICE_OVERDUE, INCIDENT_REPORTED, DOCUMENT_EXPIRING, MAINTENANCE_DUE
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7_
  - [x] 1.7 Create indexes for performance
    - Index on webhook_endpoints(trigger_table, trigger_event)
    - Index on automation_logs(endpoint_id, status)
    - Index on event_queue(status, scheduled_for)
    - _Requirements: 1.7, 5.6_

- [x] 2. TypeScript Types and Interfaces
  - [x] 2.1 Create types/automation.ts with all interfaces
    - WebhookEndpoint, AutomationLog, AutomationTemplate, EventQueueItem
    - WebhookPayload, TriggerConfig, AutomationStatsResponse
    - _Requirements: 1.1, 3.1, 5.1, 6.1_

- [x] 3. Core Utility Functions
  - [x] 3.1 Create lib/automation-utils.ts with helper functions
    - generateExecutionId(), generateWebhookSecret()
    - buildWebhookUrl(), calculateRetryDelay()
    - _Requirements: 1.2, 3.6, 4.2_
  - [x] 3.2 Write property test for execution ID uniqueness
    - **Property 9: Execution ID Uniqueness**
    - **Validates: Requirements 4.2**
  - [x] 3.3 Write property test for exponential backoff calculation
    - **Property 8: Exponential Backoff Retry**
    - **Validates: Requirements 3.6, 3.7**

- [x] 4. Webhook Endpoint Management
  - [x] 4.1 Create lib/webhook-actions.ts with server actions
    - registerWebhookEndpoint(), getWebhookEndpoint()
    - listWebhookEndpoints(), updateWebhookEndpoint()
    - toggleWebhookEndpoint()
    - _Requirements: 1.1, 1.2, 1.3, 1.7_
  - [x] 4.2 Write property test for webhook endpoint data integrity
    - **Property 1: Webhook Endpoint Data Integrity**
    - **Validates: Requirements 1.1, 1.4, 1.5, 1.6**
  - [x] 4.3 Write property test for trigger type validation
    - **Property 3: Trigger Type Validation**
    - **Validates: Requirements 1.3**
  - [x] 4.4 Write property test for URL/secret uniqueness
    - **Property 2: Webhook URL and Secret Uniqueness**
    - **Validates: Requirements 1.2**

- [x] 5. Checkpoint - Core Infrastructure
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Event Queue Processing
  - [x] 6.1 Create lib/event-queue-actions.ts with queue functions
    - queueEvent(), processEventQueue()
    - getQueueStats(), retryFailedEvents()
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_
  - [x] 6.2 Write property test for event queue initial state
    - **Property 5: Event Queue Initial State**
    - **Validates: Requirements 3.1, 3.2**
  - [x] 6.3 Write property test for queue processing selection
    - **Property 6: Queue Processing Selection**
    - **Validates: Requirements 3.3, 3.4**
  - [x] 6.4 Write property test for queue success handling
    - **Property 7: Queue Success Handling**
    - **Validates: Requirements 3.5**

- [x] 7. Webhook Execution
  - [x] 7.1 Create lib/webhook-executor.ts with execution logic
    - triggerWebhook(), validateEndpoint()
    - sendWebhookRequest(), handleWebhookResponse()
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_
  - [x] 7.2 Write property test for endpoint validation
    - **Property 10: Endpoint Validation on Trigger**
    - **Validates: Requirements 4.1**
  - [x] 7.3 Write property test for execution logging
    - **Property 11: Execution Logging with Status**
    - **Validates: Requirements 4.5, 4.6, 5.3, 5.4**
  - [x] 7.4 Write property test for execution time tracking
    - **Property 12: Execution Time Tracking**
    - **Validates: Requirements 4.7, 5.5**

- [x] 8. Automation Logging
  - [x] 8.1 Create lib/automation-log-actions.ts with logging functions
    - createAutomationLog(), updateAutomationLog()
    - getAutomationLogs() with filtering
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_
  - [x] 8.2 Write property test for filtering correctness
    - **Property 15: Filtering Correctness**
    - **Validates: Requirements 1.7, 5.6, 6.6**

- [x] 9. Checkpoint - Event Processing Complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Automation Templates
  - [x] 10.1 Create lib/template-management-actions.ts
    - listAutomationTemplates(), getAutomationTemplate()
    - createAutomationTemplate()
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_
  - [x] 10.2 Write property test for template data integrity
    - **Property 13: Template Data Integrity**
    - **Validates: Requirements 6.1, 6.3, 6.4, 6.5**
  - [x] 10.3 Write property test for category validation
    - **Property 14: Template Category Validation**
    - **Validates: Requirements 6.2**

- [x] 11. Statistics and Monitoring
  - [x] 11.1 Create lib/automation-stats-actions.ts
    - getAutomationStats(), getEndpointMetrics()
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_
  - [x] 11.2 Write property test for statistics calculation
    - **Property 16: Statistics Calculation Accuracy**
    - **Validates: Requirements 7.1, 7.2, 7.3, 7.4**

- [x] 12. Final Checkpoint
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- All tasks including property tests are required for comprehensive validation
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- Database triggers are created in task 1.5 to capture events automatically
- UI components for managing webhooks/templates can be added in a future spec
