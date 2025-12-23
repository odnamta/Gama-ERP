# Requirements Document

## Introduction

This feature implements automated notification workflows for the Gama ERP system using n8n integration. The system will support multi-channel notifications (email, WhatsApp, in-app, push) triggered by various business events such as job order assignments, invoice status changes, safety incidents, document expirations, and maintenance reminders. Users can configure their notification preferences per event type and channel.

## Glossary

- **Notification_Template**: A reusable template defining the content structure for notifications across different channels
- **Notification_Preference**: User-specific settings controlling which channels and events trigger notifications
- **Notification_Log**: A record of all sent notifications with delivery status tracking
- **Event_Type**: A categorized business event that can trigger notifications (e.g., job_order.assigned, invoice.overdue)
- **Channel**: A delivery method for notifications (email, whatsapp, in_app, push)
- **Placeholder**: A variable token in templates (e.g., {{jo_number}}) replaced with actual values at send time
- **Quiet_Hours**: Time periods during which notifications are suppressed for a user
- **Digest_Frequency**: How often batched notifications are delivered (immediate, hourly, daily)

## Requirements

### Requirement 1: Notification Template Management

**User Story:** As an administrator, I want to manage notification templates, so that I can customize the content and format of automated notifications.

#### Acceptance Criteria

1. THE Notification_Template_System SHALL store templates with unique template_code identifiers
2. WHEN a template is created, THE Notification_Template_System SHALL support email (subject, HTML body, text body), WhatsApp (template_id, body), in-app (title, body, action_url), and push (title, body) content
3. THE Notification_Template_System SHALL support placeholder definitions with key, description, and default_value
4. WHEN a template is retrieved, THE Notification_Template_System SHALL return only active templates unless explicitly requested
5. THE Notification_Template_System SHALL provide default templates for: JO_ASSIGNED, JO_STATUS_UPDATE, INVOICE_SENT, INVOICE_OVERDUE, INCIDENT_REPORTED, DOCUMENT_EXPIRING, MAINTENANCE_DUE, APPROVAL_REQUIRED

### Requirement 2: Placeholder Replacement

**User Story:** As a system, I want to replace placeholders in templates with actual data, so that notifications contain relevant context-specific information.

#### Acceptance Criteria

1. WHEN rendering a template, THE Placeholder_Engine SHALL replace all {{key}} patterns with corresponding data values
2. WHEN a placeholder key is missing from data, THE Placeholder_Engine SHALL use the default_value if defined
3. WHEN a placeholder has no default and no data value, THE Placeholder_Engine SHALL leave the placeholder unchanged
4. THE Placeholder_Engine SHALL handle nested placeholders in all template fields (subject, body, title, action_url)
5. FOR ALL valid template and data combinations, rendering then extracting placeholders SHALL identify all original placeholder keys (round-trip property)

### Requirement 3: User Notification Preferences

**User Story:** As a user, I want to configure my notification preferences, so that I receive notifications through my preferred channels at appropriate times.

#### Acceptance Criteria

1. THE Notification_Preference_System SHALL allow users to enable/disable each channel (email, whatsapp, in_app, push) per event_type
2. WHEN a user sets quiet hours, THE Notification_Preference_System SHALL store start and end times
3. THE Notification_Preference_System SHALL support digest_frequency options: immediate, hourly, daily
4. WHEN no preference exists for a user/event combination, THE Notification_Preference_System SHALL use default settings (email and in_app enabled, immediate delivery)
5. THE Notification_Preference_System SHALL enforce unique constraint on user_id and event_type combination

### Requirement 4: Notification Sending

**User Story:** As a system, I want to send notifications through multiple channels, so that users receive timely information about business events.

#### Acceptance Criteria

1. WHEN a notification is triggered, THE Notification_Sender SHALL check user preferences for enabled channels
2. WHEN email is enabled, THE Notification_Sender SHALL send email with rendered subject and HTML body
3. WHEN WhatsApp is enabled, THE Notification_Sender SHALL send message using Meta API with template_id
4. WHEN in_app is enabled, THE Notification_Sender SHALL create a notification record in the notifications table
5. IF quiet hours are active for a user, THEN THE Notification_Sender SHALL queue the notification for later delivery
6. IF digest_frequency is not immediate, THEN THE Notification_Sender SHALL batch notifications according to frequency

### Requirement 5: Notification Logging

**User Story:** As an administrator, I want to track all sent notifications, so that I can monitor delivery status and troubleshoot issues.

#### Acceptance Criteria

1. WHEN a notification is sent, THE Notification_Log_System SHALL record template_id, recipient, channel, content, and timestamp
2. THE Notification_Log_System SHALL track status transitions: pending → sent → delivered → failed/bounced
3. WHEN delivery fails, THE Notification_Log_System SHALL store the error_message
4. THE Notification_Log_System SHALL store external_id for tracking (email message ID, WhatsApp message ID)
5. THE Notification_Log_System SHALL associate notifications with entity_type and entity_id for context

### Requirement 6: Event-Triggered Notifications

**User Story:** As a system, I want to automatically trigger notifications for business events, so that stakeholders are informed without manual intervention.

#### Acceptance Criteria

1. WHEN a job order is assigned, THE Event_Trigger_System SHALL send JO_ASSIGNED notification to the assigned user
2. WHEN a job order status changes, THE Event_Trigger_System SHALL send JO_STATUS_UPDATE to relevant stakeholders
3. WHEN an invoice is sent, THE Event_Trigger_System SHALL send INVOICE_SENT to the customer contact
4. WHEN an invoice becomes overdue, THE Event_Trigger_System SHALL send INVOICE_OVERDUE reminder
5. WHEN a safety incident is reported, THE Event_Trigger_System SHALL send INCIDENT_REPORTED to HSE managers
6. WHEN a document is expiring within threshold days, THE Event_Trigger_System SHALL send DOCUMENT_EXPIRING notification
7. WHEN maintenance is due, THE Event_Trigger_System SHALL send MAINTENANCE_DUE to equipment managers
8. WHEN approval is required, THE Event_Trigger_System SHALL send APPROVAL_REQUIRED to approvers

### Requirement 7: Phone Number Validation

**User Story:** As a system, I want to validate phone numbers before sending WhatsApp messages, so that delivery attempts are made only to valid numbers.

#### Acceptance Criteria

1. WHEN validating a phone number, THE Phone_Validator SHALL check for Indonesian format (+62 or 08 prefix)
2. THE Phone_Validator SHALL normalize numbers to international format (+62...)
3. IF a phone number is invalid, THEN THE Phone_Validator SHALL return an error and skip WhatsApp delivery
4. THE Phone_Validator SHALL accept numbers with or without country code prefix

### Requirement 8: Notification Statistics

**User Story:** As an administrator, I want to view notification statistics, so that I can monitor system health and delivery rates.

#### Acceptance Criteria

1. THE Notification_Stats_System SHALL calculate total notifications sent per channel
2. THE Notification_Stats_System SHALL calculate delivery success rate per channel
3. THE Notification_Stats_System SHALL calculate failure rate and common error types
4. THE Notification_Stats_System SHALL provide statistics filtered by date range and event_type
5. FOR ALL notification logs, the sum of sent, delivered, failed, and bounced counts SHALL equal total notifications
